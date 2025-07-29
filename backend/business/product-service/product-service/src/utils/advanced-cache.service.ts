import { createClient, RedisClientType } from 'redis';
import LRUCache from 'lru-cache';
import { promisify } from 'util';
import { logger } from './logger';
import * as zlib from 'zlib';

/**
 * Options for the advanced cache service
 */
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Tags for invalidation
  compress?: boolean; // Whether to compress the data
  encrypt?: boolean; // Whether to encrypt the data (not implemented yet)
}

/**
 * Advanced cache service with Redis and in-memory LRU cache
 * Provides features like:
 * - Multi-level caching (Memory -> Redis)
 * - Tag-based invalidation
 * - Pattern-based invalidation
 * - Compression
 * - Health monitoring
 * - Circuit breaker for Redis failures
 */
export class AdvancedCacheService {
  private memoryCache: LRUCache<string, any>;
  private redis: RedisClientType;
  private isRedisConnected: boolean = false;
  private compressionThreshold: number = 1024; // 1KB
  private redisHealthy: boolean = true;
  private failureCount: number = 0;
  private readonly MAX_FAILURES = 5;
  private readonly CIRCUIT_RESET_TIMEOUT = 30000; // 30 seconds

  constructor(
    redisUrl: string,
    memoryOptions: { max: number; ttl: number } = { max: 500, ttl: 60 * 1000 }
  ) {
    // Initialize in-memory LRU cache
    this.memoryCache = new LRUCache({
      max: memoryOptions.max,
      ttl: memoryOptions.ttl,
      updateAgeOnGet: true,
      allowStale: true,
    });

    // Initialize Redis client
    this.redis = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            this.redisHealthy = false;
            logger.error('Redis reconnection failed multiple times, marking as unhealthy');
            return new Error('Redis connection aborted');
          }
          const delay = Math.min(retries * 100, 3000);
          logger.warn(`Redis reconnecting in ${delay}ms, attempt ${retries}`);
          return delay;
        },
      },
    });

    // Set up Redis event listeners
    this.redis.on('connect', () => {
      logger.info('Redis connected');
      this.isRedisConnected = true;
      this.redisHealthy = true;
      this.failureCount = 0;
    });

    this.redis.on('error', (err) => {
      logger.error('Redis error', { error: err.message });
      this.failureCount++;

      if (this.failureCount >= this.MAX_FAILURES) {
        this.redisHealthy = false;
        logger.warn('Redis circuit breaker opened due to multiple failures');
        // Schedule circuit breaker reset
        setTimeout(() => this.resetCircuitBreaker(), this.CIRCUIT_RESET_TIMEOUT);
      }
    });

    this.redis.on('disconnect', () => {
      logger.warn('Redis disconnected');
      this.isRedisConnected = false;
    });

    // Connect to Redis
    this.redis.connect().catch((err) => {
      logger.error('Failed to connect to Redis', { error: err.message });
      this.isRedisConnected = false;
    });
  }

  /**
   * Reset the circuit breaker and try to reconnect
   */
  private async resetCircuitBreaker(): Promise<void> {
    logger.info('Attempting to reset Redis circuit breaker');
    this.failureCount = 0;

    if (!this.isRedisConnected) {
      try {
        await this.redis.connect();
        this.redisHealthy = true;
        logger.info('Redis circuit breaker reset successfully');
      } catch (err) {
        logger.error('Failed to reset Redis circuit breaker', { error: err.message });
        // Schedule another reset attempt
        setTimeout(() => this.resetCircuitBreaker(), this.CIRCUIT_RESET_TIMEOUT);
      }
    } else {
      this.redisHealthy = true;
      logger.info('Redis circuit breaker reset successfully');
    }
  }

  /**
   * Get the health status of the cache service
   */
  public getHealth(): { memory: boolean; redis: boolean; redisConnected: boolean } {
    return {
      memory: true, // Memory cache is always available
      redis: this.redisHealthy,
      redisConnected: this.isRedisConnected,
    };
  }

  /**
   * Get metrics for monitoring
   */
  public getMetrics(): {
    memorySize: number;
    memoryItemCount: number;
    redisConnected: boolean;
    redisHealthy: boolean;
  } {
    return {
      memorySize: this.memoryCache.size,
      memoryItemCount: this.memoryCache.size,
      redisConnected: this.isRedisConnected,
      redisHealthy: this.redisHealthy,
    };
  }

  /**
   * Get value from cache (first memory, then Redis)
   */
  public async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    let source = 'none';

    try {
      // Try memory cache first
      const memoryValue = this.memoryCache.get(key) as T;
      if (memoryValue !== undefined) {
        source = 'memory';
        logger.debug(`Cache hit (memory): ${key} in ${Date.now() - startTime}ms`);
        return memoryValue;
      }

      // If Redis is healthy, try to get from Redis
      if (this.isRedisConnected && this.redisHealthy) {
        const redisValue = await this.redis.get(key);
        if (redisValue) {
          // Parse and decompress if needed
          const parsed = await this.parseValue<T>(redisValue);

          // Store in memory cache for faster access next time
          this.memoryCache.set(key, parsed);
          source = 'redis';
          logger.debug(`Cache hit (redis): ${key} in ${Date.now() - startTime}ms`);
          return parsed;
        }
      }

      // Not found in any cache
      return null;
    } catch (error) {
      logger.error('Error getting from cache', { key, error: error.message, source });

      if (source === 'redis') {
        this.failureCount++;
        if (this.failureCount >= this.MAX_FAILURES) {
          this.redisHealthy = false;
          logger.warn('Redis circuit breaker opened due to multiple failures');
          setTimeout(() => this.resetCircuitBreaker(), this.CIRCUIT_RESET_TIMEOUT);
        }
      }

      // Fallback to memory if redis fails
      if (source === 'redis') {
        const memoryValue = this.memoryCache.get(key) as T;
        if (memoryValue !== undefined) {
          logger.debug(`Cache fallback to memory: ${key}`);
          return memoryValue;
        }
      }

      return null;
    }
  }

  /**
   * Set value in both memory and Redis caches
   */
  public async set(
    key: string,
    value: any,
    ttl = 3600,
    tags: string[] = [],
    options: CacheOptions = {}
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Store in memory cache
      this.memoryCache.set(key, value, { ttl: ttl * 1000 });

      // If Redis is healthy, also store there
      if (this.isRedisConnected && this.redisHealthy) {
        // Prepare value for storage (possibly compress)
        const preparedValue = await this.prepareValue(value, options);

        // Store value in Redis
        await this.redis.set(key, preparedValue, { EX: ttl }); // Store tag mappings
        if (tags.length > 0) {
          // For each tag, add this key to its set
          for (const tag of tags) {
            await this.redis.sAdd(`tag:${tag}`, key);
          }

          // Store all tags associated with this key
          for (const tag of tags) {
            await this.redis.sAdd(`key-tags:${key}`, tag);
          }
        }

        logger.debug(`Cache set: ${key} in ${Date.now() - startTime}ms (${tags.length} tags)`);
      } else {
        logger.debug(`Cache set (memory only): ${key} in ${Date.now() - startTime}ms`);
      }
    } catch (error) {
      logger.error('Error setting cache', { key, error: error.message });

      this.failureCount++;
      if (this.failureCount >= this.MAX_FAILURES) {
        this.redisHealthy = false;
        logger.warn('Redis circuit breaker opened due to multiple failures');
        setTimeout(() => this.resetCircuitBreaker(), this.CIRCUIT_RESET_TIMEOUT);
      }
    }
  }

  /**
   * Delete a key from both memory and Redis caches
   */
  public async del(key: string): Promise<void> {
    try {
      // Delete from memory cache
      this.memoryCache.delete(key);

      // Delete from Redis if connected
      if (this.isRedisConnected && this.redisHealthy) {
        // Get the tags associated with this key
        const tags = await this.redis.sMembers(`key-tags:${key}`);

        // For each tag, remove this key from its set
        for (const tag of tags) {
          await this.redis.sRem(`tag:${tag}`, key);
        }

        // Delete the key-tags set
        if (tags.length > 0) {
          await this.redis.del(`key-tags:${key}`);
        }

        // Delete the key itself
        await this.redis.del(key);

        logger.debug(`Cache delete: ${key}`);
      }
    } catch (error) {
      logger.error('Error deleting from cache', { key, error: error.message });
    }
  }

  /**
   * Invalidate all keys associated with the given tags
   */
  public async invalidateByTags(tags: string[]): Promise<void> {
    try {
      if (this.isRedisConnected && this.redisHealthy && tags.length > 0) {
        // For each tag, get all keys associated with it
        for (const tag of tags) {
          const keys = await this.redis.sMembers(`tag:${tag}`);

          // Delete each key
          for (const key of keys) {
            await this.del(key);
          }

          logger.debug(`Cache tag invalidation: ${tag} (${keys.length} keys)`);
        }
      }
    } catch (error) {
      logger.error('Error invalidating cache by tags', { tags, error: error.message });
    }
  }

  /**
   * Delete keys matching a pattern using SCAN for large datasets
   */
  public async delByPattern(pattern: string): Promise<void> {
    try {
      if (this.isRedisConnected && this.redisHealthy) {
        // Use SCAN to find keys matching the pattern
        let cursor = 0;
        let keys: string[] = [];

        do {
          const result = await this.redis.scan(cursor, { MATCH: pattern, COUNT: 100 });
          cursor = result.cursor;

          // Delete matching keys from both caches
          for (const key of result.keys) {
            this.memoryCache.delete(key);
            await this.redis.del(key);
            keys.push(key);
          }
        } while (cursor !== 0);

        logger.debug(`Cache pattern deletion: ${pattern} (${keys.length} keys)`);
      }
    } catch (error) {
      logger.error('Error deleting from cache by pattern', { pattern, error: error.message });
    }
  }

  /**
   * Clear all cache entries
   */
  public async clear(): Promise<void> {
    try {
      // Clear memory cache
      this.memoryCache.clear();

      // Clear Redis if connected
      if (this.isRedisConnected && this.redisHealthy) {
        await this.redis.flushDb();
      }

      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Error clearing cache', { error: error.message });
    }
  }

  /**
   * Close connections and clean up resources
   */
  public async close(): Promise<void> {
    try {
      if (this.isRedisConnected) {
        await this.redis.quit();
        this.isRedisConnected = false;
      }

      this.memoryCache.clear();
      logger.info('Cache connections closed');
    } catch (error) {
      logger.error('Error closing cache connections', { error: error.message });
    }
  }

  /**
   * Prepare a value for storage (JSON stringify + possible compression)
   */
  private async prepareValue(value: any, options: CacheOptions = {}): Promise<string> {
    const stringValue = JSON.stringify(value);

    // Apply compression if enabled and value is larger than threshold
    if (options.compress || stringValue.length > this.compressionThreshold) {
      const compressed = await this.compressValue(stringValue);
      return `c:${compressed}`; // Prefix 'c:' to indicate compressed content
    }

    return stringValue;
  }

  /**
   * Parse a value from storage (JSON parse + possible decompression)
   */
  private async parseValue<T>(value: string): Promise<T> {
    // Check if value is compressed
    if (value.startsWith('c:')) {
      const compressedValue = value.substring(2);
      const decompressed = await this.decompressValue(compressedValue);
      return JSON.parse(decompressed);
    }

    return JSON.parse(value);
  }

  /**
   * Compress a string value
   */
  private async compressValue(value: string): Promise<string> {
    const gzip = promisify(zlib.gzip);
    const buffer = await gzip(Buffer.from(value));
    return buffer.toString('base64');
  }

  /**
   * Decompress a string value
   */
  private async decompressValue(compressed: string): Promise<string> {
    const gunzip = promisify(zlib.gunzip);
    const buffer = await gunzip(Buffer.from(compressed, 'base64'));
    return buffer.toString();
  }
}

export default AdvancedCacheService;
