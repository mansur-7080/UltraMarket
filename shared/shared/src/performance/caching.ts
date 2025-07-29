import Redis from 'ioredis';
import { logger } from '../logger';

// Cache configuration interface
export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
}

// Cache strategy types
export enum CacheStrategy {
  CACHE_ASIDE = 'cache-aside',
  WRITE_THROUGH = 'write-through',
  WRITE_BEHIND = 'write-behind',
  REFRESH_AHEAD = 'refresh-ahead',
}

// Cache TTL presets (in seconds)
export const CacheTTL = {
  VERY_SHORT: 60, // 1 minute
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
  PERMANENT: -1, // No expiration
} as const;

// Cache key patterns
export const CacheKeys = {
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  USER_SESSIONS: (userId: string) => `user:sessions:${userId}`,
  PRODUCT_DETAILS: (productId: string) => `product:details:${productId}`,
  PRODUCT_LIST: (page: number, limit: number, filters?: string) =>
    `product:list:${page}:${limit}${filters ? `:${filters}` : ''}`,
  CATEGORY_TREE: () => 'category:tree',
  CART: (userId: string) => `cart:${userId}`,
  SEARCH_RESULTS: (query: string, filters?: string) =>
    `search:${query}${filters ? `:${filters}` : ''}`,
  API_RATE_LIMIT: (ip: string, endpoint: string) => `rate:${ip}:${endpoint}`,
  SESSION_TOKEN: (tokenId: string) => `session:${tokenId}`,
  POPULAR_PRODUCTS: () => 'products:popular',
  FEATURED_PRODUCTS: () => 'products:featured',
} as const;

// Performance monitoring interface
interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  totalRequests: number;
  averageResponseTime: number;
}

// Advanced caching class
export class AdvancedCache {
  private redis: Redis;
  private metrics: CacheMetrics;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
    this.redis = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      keyPrefix: config.keyPrefix,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 10000,
    });

    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      totalRequests: 0,
      averageResponseTime: 0,
    };

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      logger.info('Redis connected successfully', {
        host: this.config.host,
        port: this.config.port,
      });
    });

    this.redis.on('error', (error) => {
      logger.error('Redis connection error', {
        error: error.message,
        host: this.config.host,
        port: this.config.port,
      });
      this.metrics.errors++;
    });

    this.redis.on('reconnecting', () => {
      logger.warn('Redis reconnecting...', {
        host: this.config.host,
        port: this.config.port,
      });
    });
  }

  // Get value from cache with performance tracking
  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      const value = await this.redis.get(key);
      const responseTime = Date.now() - startTime;
      this.updateAverageResponseTime(responseTime);

      if (value === null) {
        this.metrics.misses++;
        logger.debug('Cache miss', { key, responseTime });
        return null;
      }

      this.metrics.hits++;
      logger.debug('Cache hit', { key, responseTime });
      return JSON.parse(value);
    } catch (error) {
      this.metrics.errors++;
      logger.error('Cache get error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  // Set value in cache with TTL
  async set<T>(key: string, value: T, ttl: number = CacheTTL.MEDIUM): Promise<boolean> {
    const startTime = Date.now();

    try {
      const serializedValue = JSON.stringify(value);

      if (ttl === CacheTTL.PERMANENT) {
        await this.redis.set(key, serializedValue);
      } else {
        await this.redis.setex(key, ttl, serializedValue);
      }

      this.metrics.sets++;
      const responseTime = Date.now() - startTime;
      logger.debug('Cache set', { key, ttl, responseTime });
      return true;
    } catch (error) {
      this.metrics.errors++;
      logger.error('Cache set error', {
        key,
        ttl,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  // Delete key from cache
  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(key);
      this.metrics.deletes++;
      logger.debug('Cache delete', { key, deleted: result > 0 });
      return result > 0;
    } catch (error) {
      this.metrics.errors++;
      logger.error('Cache delete error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  // Delete multiple keys by pattern
  async deleteByPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      const result = await this.redis.del(...keys);
      this.metrics.deletes += result;
      logger.debug('Cache delete by pattern', { pattern, deleted: result });
      return result;
    } catch (error) {
      this.metrics.errors++;
      logger.error('Cache delete by pattern error', {
        pattern,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  // Cache-aside pattern implementation
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl: number = CacheTTL.MEDIUM
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch from source
    try {
      const value = await fetchFunction();
      // Set in cache for future requests
      await this.set(key, value, ttl);
      return value;
    } catch (error) {
      logger.error('Cache getOrSet fetch error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  // Get cache metrics
  getMetrics(): CacheMetrics & { hitRate: number } {
    const hitRate =
      this.metrics.totalRequests > 0 ? (this.metrics.hits / this.metrics.totalRequests) * 100 : 0;

    return {
      ...this.metrics,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  // Update average response time
  private updateAverageResponseTime(responseTime: number): void {
    const totalTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1);
    this.metrics.averageResponseTime = (totalTime + responseTime) / this.metrics.totalRequests;
  }

  // Health check
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency: number }> {
    const startTime = Date.now();

    try {
      await this.redis.ping();
      const latency = Date.now() - startTime;

      return {
        status: 'healthy',
        latency,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
      };
    }
  }

  // Close connection
  async close(): Promise<void> {
    try {
      await this.redis.quit();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

// Query caching decorator
export function CacheQuery(ttl: number = CacheTTL.MEDIUM) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cache = (this as any).cache || globalCache;
      if (!cache) {
        return method.apply(this, args);
      }

      // Generate cache key from method name and arguments
      const cacheKey = `query:${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;

      return cache.getOrSet(cacheKey, () => method.apply(this, args), ttl);
    };
  };
}

// Global cache instance
let globalCache: AdvancedCache;

// Initialize global cache
export function initializeCache(config: CacheConfig): AdvancedCache {
  globalCache = new AdvancedCache(config);
  return globalCache;
}

// Get global cache instance
export function getCache(): AdvancedCache {
  if (!globalCache) {
    throw new Error('Cache not initialized. Call initializeCache() first.');
  }
  return globalCache;
}

// Cache middleware for Express
export function cacheMiddleware(ttl: number = CacheTTL.SHORT) {
  return (req: any, res: any, next: any) => {
    const cache = getCache();
    const cacheKey = `api:${req.method}:${req.originalUrl}`;

    cache
      .get(cacheKey)
      .then((cachedResponse) => {
        if (cachedResponse) {
          logger.debug('API cache hit', { cacheKey });
          return res.json(cachedResponse);
        }

        // Store original res.json
        const originalJson = res.json;
        res.json = function (data: any) {
          // Cache the response
          cache.set(cacheKey, data, ttl);
          logger.debug('API response cached', { cacheKey, ttl });

          // Call original res.json
          return originalJson.call(this, data);
        };

        next();
      })
      .catch((error) => {
        logger.error('Cache middleware error', { error: error.message });
        next();
      });
  };
}
