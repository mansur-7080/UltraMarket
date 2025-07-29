/**
 * Professional Cache Management System
 * High-performance caching with Redis, in-memory, and distributed caching
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';

// =================== SIMPLE LOGGER ===================

const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  error: (message: string, meta?: Record<string, unknown>) => {
    console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : '');
  },
};

// =================== TYPES ===================

export interface CacheConfig {
  defaultTTL: number; // seconds
  maxSize: number; // maximum cache size
  enableMetrics: boolean;
  compression: boolean;
  serialization: 'json' | 'msgpack' | 'none';
  namespace: string;
}

export interface CacheItem<T = unknown> {
  key: string;
  value: T;
  ttl: number;
  createdAt: Date;
  expiresAt: Date;
  hits: number;
  size: number;
  tags: string[];
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  totalSize: number;
  hitRate: number;
  averageResponseTime: number;
}

export interface CacheStrategy {
  name: string;
  shouldCache: (key: string, value: unknown) => boolean;
  getTTL: (key: string, value: unknown) => number;
  getKey: (originalKey: string, context?: unknown) => string;
}

// =================== CACHE MANAGER ===================

export class CacheManager extends EventEmitter {
  private config: CacheConfig;
  private cache: Map<string, CacheItem> = new Map();
  private redisClient: unknown;
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    totalSize: 0,
    hitRate: 0,
    averageResponseTime: 0,
  };
  private responseTimes: number[] = [];
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: CacheConfig, redisClient?: unknown) {
    super();
    this.config = config;
    this.redisClient = redisClient;
    this.startCleanupInterval();
  }

  /**
   * Get value from cache
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    const startTime = performance.now();
    const fullKey = this.getFullKey(key);

    try {
      // Try in-memory cache first
      const memoryItem = this.cache.get(fullKey);
      if (memoryItem && !this.isExpired(memoryItem)) {
        memoryItem.hits++;
        this.recordHit(performance.now() - startTime);
        return memoryItem.value as T;
      }

      // Try Redis cache
      if (this.redisClient && typeof this.redisClient === 'object' && this.redisClient !== null) {
        const redisGet = (this.redisClient as { get: (key: string) => Promise<string | null> }).get;
        if (typeof redisGet === 'function') {
          const redisValue = await redisGet(fullKey);
          if (redisValue) {
            const parsedValue = this.deserialize(redisValue);
            // Store in memory for faster access
            await this.setMemory(fullKey, parsedValue, this.config.defaultTTL);
            this.recordHit(performance.now() - startTime);
            return parsedValue as T;
          }
        }
      }

      this.recordMiss(performance.now() - startTime);
      return null;
    } catch (error) {
      logger.error('Cache get error', { key, error });
      this.recordMiss(performance.now() - startTime);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T = unknown>(key: string, value: T, ttl?: number): Promise<void> {
    const startTime = performance.now();
    const fullKey = this.getFullKey(key);
    const cacheTTL = ttl || this.config.defaultTTL;

    try {
      // Set in memory cache
      await this.setMemory(fullKey, value, cacheTTL);

      // Set in Redis cache
      if (this.redisClient && typeof this.redisClient === 'object' && this.redisClient !== null) {
        const redisSetex = (
          this.redisClient as { setex: (key: string, ttl: number, value: string) => Promise<void> }
        ).setex;
        if (typeof redisSetex === 'function') {
          const serializedValue = this.serialize(value);
          await redisSetex(fullKey, cacheTTL, serializedValue);
        }
      }

      this.metrics.sets++;
      this.recordResponseTime(performance.now() - startTime);
      this.emit('set', { key, value, ttl: cacheTTL });
    } catch (error) {
      logger.error('Cache set error', { key, error });
      throw error;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    const startTime = performance.now();
    const fullKey = this.getFullKey(key);

    try {
      // Delete from memory cache
      const memoryDeleted = this.cache.delete(fullKey);

      // Delete from Redis cache
      let redisDeleted = false;
      if (this.redisClient && typeof this.redisClient === 'object' && this.redisClient !== null) {
        const redisDel = (this.redisClient as { del: (key: string) => Promise<number> }).del;
        if (typeof redisDel === 'function') {
          const result = await redisDel(fullKey);
          redisDeleted = result > 0;
        }
      }

      const deleted = memoryDeleted || redisDeleted;
      if (deleted) {
        this.metrics.deletes++;
        this.recordResponseTime(performance.now() - startTime);
        this.emit('delete', { key });
      }

      return deleted;
    } catch (error) {
      logger.error('Cache delete error', { key, error });
      return false;
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      // Clear memory cache
      this.cache.clear();

      // Clear Redis cache with namespace
      if (this.redisClient && typeof this.redisClient === 'object' && this.redisClient !== null) {
        const redisKeys = (this.redisClient as { keys: (pattern: string) => Promise<string[]> })
          .keys;
        if (typeof redisKeys === 'function') {
          const pattern = `${this.config.namespace}:*`;
          const keys = await redisKeys(pattern);
          if (keys.length > 0) {
            const redisDel = (this.redisClient as { del: (keys: string[]) => Promise<number> }).del;
            if (typeof redisDel === 'function') {
              await redisDel(keys);
            }
          }
        }
      }

      this.resetMetrics();
      this.emit('clear');
    } catch (error) {
      logger.error('Cache clear error', { error });
      throw error;
    }
  }

  /**
   * Get or set with function
   */
  async getOrSet<T = unknown>(key: string, fn: () => Promise<T> | T, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fn();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Get multiple keys
   */
  async getMany<T = unknown>(keys: string[]): Promise<(T | null)[]> {
    const promises = keys.map((key) => this.get<T>(key));
    return Promise.all(promises);
  }

  /**
   * Set multiple key-value pairs
   */
  async setMany<T = unknown>(items: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    const promises = items.map((item) => this.set(item.key, item.value, item.ttl));
    await Promise.all(promises);
  }

  /**
   * Delete multiple keys
   */
  async deleteMany(keys: string[]): Promise<number> {
    const promises = keys.map((key) => this.delete(key));
    const results = await Promise.all(promises);
    return results.filter(Boolean).length;
  }

  /**
   * Get keys by pattern
   */
  async getKeys(pattern: string): Promise<string[]> {
    try {
      const fullPattern = this.getFullKey(pattern);

      // Get from memory cache
      const memoryKeys = Array.from(this.cache.keys())
        .filter((key) => this.matchPattern(key, fullPattern))
        .map((key) => key.replace(`${this.config.namespace}:`, ''));

      // Get from Redis cache
      let redisKeys: string[] = [];
      if (this.redisClient && typeof this.redisClient === 'object' && this.redisClient !== null) {
        const redisKeysMethod = (
          this.redisClient as { keys: (pattern: string) => Promise<string[]> }
        ).keys;
        if (typeof redisKeysMethod === 'function') {
          const keys = await redisKeysMethod(fullPattern);
          redisKeys = keys.map((key: string) => key.replace(`${this.config.namespace}:`, ''));
        }
      }

      // Combine and deduplicate
      const allKeys = [...new Set([...memoryKeys, ...redisKeys])];
      return allKeys;
    } catch (error) {
      logger.error('Cache getKeys error', { pattern, error });
      return [];
    }
  }

  /**
   * Delete keys by pattern
   */
  async deleteByPattern(pattern: string): Promise<number> {
    const keys = await this.getKeys(pattern);
    return this.deleteMany(keys);
  }

  /**
   * Get cache statistics
   */
  getMetrics(): CacheMetrics {
    const totalRequests = this.metrics.hits + this.metrics.misses;
    const hitRate = totalRequests > 0 ? (this.metrics.hits / totalRequests) * 100 : 0;
    const averageResponseTime =
      this.responseTimes.length > 0
        ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
        : 0;

    return {
      ...this.metrics,
      hitRate: Math.round(hitRate * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      totalSize: this.getTotalSize(),
    };
  }

  /**
   * Warm up cache with data
   */
  async warmUp(data: Array<{ key: string; value: unknown; ttl?: number }>): Promise<void> {
    logger.info('Cache warm-up started', { count: data.length });

    const chunks = this.chunkArray(data, 100); // Process in chunks
    for (const chunk of chunks) {
      await this.setMany(chunk);
    }

    logger.info('Cache warm-up completed', { count: data.length });
    this.emit('warmup-complete', { count: data.length });
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    let deleted = 0;

    for (const [key, item] of this.cache) {
      if (item.tags.some((tag) => tags.includes(tag))) {
        await this.delete(key.replace(`${this.config.namespace}:`, ''));
        deleted++;
      }
    }

    return deleted;
  }

  // =================== PRIVATE METHODS ===================

  private async setMemory<T>(key: string, value: T, ttl: number): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl * 1000);
    const serializedValue = this.serialize(value);
    const size = this.getSize(serializedValue);

    // Check if we need to evict items
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    const item: CacheItem = {
      key,
      value,
      ttl,
      createdAt: now,
      expiresAt,
      hits: 0,
      size,
      tags: [],
    };

    this.cache.set(key, item);
    this.metrics.totalSize += size;
  }

  private evictLRU(): void {
    // Find least recently used item (lowest hits)
    let lruKey: string | null = null;
    let lruHits = Infinity;

    for (const [key, item] of this.cache) {
      if (item.hits < lruHits) {
        lruHits = item.hits;
        lruKey = key;
      }
    }

    if (lruKey) {
      const item = this.cache.get(lruKey);
      this.cache.delete(lruKey);
      if (item) {
        this.metrics.totalSize -= item.size;
        this.metrics.evictions++;
      }
    }
  }

  private isExpired(item: CacheItem): boolean {
    return new Date() > item.expiresAt;
  }

  private getFullKey(key: string): string {
    return `${this.config.namespace}:${key}`;
  }

  private serialize(value: unknown): string {
    switch (this.config.serialization) {
      case 'json':
        return JSON.stringify(value);
      case 'msgpack':
        // Would use msgpack library here
        return JSON.stringify(value);
      case 'none':
        return String(value);
      default:
        return JSON.stringify(value);
    }
  }

  private deserialize(value: string): unknown {
    switch (this.config.serialization) {
      case 'json':
        return JSON.parse(value);
      case 'msgpack':
        // Would use msgpack library here
        return JSON.parse(value);
      case 'none':
        return value;
      default:
        return JSON.parse(value);
    }
  }

  private getSize(value: string): number {
    return Buffer.byteLength(value, 'utf8');
  }

  private getTotalSize(): number {
    let total = 0;
    for (const item of this.cache.values()) {
      total += item.size;
    }
    return total;
  }

  private recordHit(responseTime: number): void {
    this.metrics.hits++;
    this.recordResponseTime(responseTime);
  }

  private recordMiss(responseTime: number): void {
    this.metrics.misses++;
    this.recordResponseTime(responseTime);
  }

  private recordResponseTime(responseTime: number): void {
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-500); // Keep last 500
    }
  }

  private resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      totalSize: 0,
      hitRate: 0,
      averageResponseTime: 0,
    };
    this.responseTimes = [];
  }

  private matchPattern(key: string, pattern: string): boolean {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(key);
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private startCleanupInterval(): void {
    // Clean up expired items every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupExpired();
      },
      5 * 60 * 1000
    );
  }

  private cleanupExpired(): void {
    let cleaned = 0;
    const now = new Date();

    for (const [key, item] of this.cache) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        this.metrics.totalSize -= item.size;
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info('Cache cleanup completed', { cleaned });
      this.emit('cleanup', { cleaned });
    }
  }

  /**
   * Shutdown cache manager
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
    this.emit('shutdown');
  }
}

// =================== CACHE STRATEGIES ===================

export const cacheStrategies = {
  /**
   * Cache everything strategy
   */
  cacheAll: {
    name: 'cache-all',
    shouldCache: () => true,
    getTTL: (key: string, value: unknown) => 3600, // 1 hour
    getKey: (originalKey: string) => originalKey,
  },

  /**
   * Cache only successful results
   */
  cacheSuccess: {
    name: 'cache-success',
    shouldCache: (key: string, value: unknown) => {
      return value !== null && value !== undefined && (value as any).error === undefined;
    },
    getTTL: (key: string, value: unknown) => 1800, // 30 minutes
    getKey: (originalKey: string) => originalKey,
  },

  /**
   * Cache with user context
   */
  cacheByUser: {
    name: 'cache-by-user',
    shouldCache: () => true,
    getTTL: (key: string, value: unknown) => 900, // 15 minutes
    getKey: (originalKey: string, context?: unknown) => {
      const userId = (context as any)?.userId || 'anonymous';
      return `user:${userId}:${originalKey}`;
    },
  },

  /**
   * Cache expensive operations longer
   */
  cacheExpensive: {
    name: 'cache-expensive',
    shouldCache: (key: string, value: unknown) => {
      // Cache if value is complex or large
      return typeof value === 'object' && JSON.stringify(value).length > 1000;
    },
    getTTL: (key: string, value: unknown) => 7200, // 2 hours
    getKey: (originalKey: string) => `expensive:${originalKey}`,
  },
};

// =================== CACHE DECORATORS ===================

/**
 * Cache method decorator
 */
export function Cacheable(options: {
  key?: string;
  ttl?: number;
  strategy?: CacheStrategy;
  tags?: string[];
}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const cacheManager = new CacheManager({
      defaultTTL: options.ttl || 3600,
      maxSize: 1000,
      enableMetrics: true,
      compression: false,
      serialization: 'json',
      namespace: 'method-cache',
    });

    descriptor.value = async function (...args: any[]) {
      const cacheKey =
        options.key || `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;

      // Try to get from cache
      const cached = await cacheManager.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Cache the result
      if (!options.strategy || options.strategy.shouldCache(cacheKey, result)) {
        const ttl = options.strategy
          ? options.strategy.getTTL(cacheKey, result)
          : options.ttl || 3600;
        await cacheManager.set(cacheKey, result, ttl);
      }

      return result;
    };

    return descriptor;
  };
}

// =================== UTILITY FUNCTIONS ===================

/**
 * Create cache manager instance
 */
export function createCacheManager(
  config: Partial<CacheConfig>,
  redisClient?: unknown
): CacheManager {
  const defaultConfig: CacheConfig = {
    defaultTTL: 3600,
    maxSize: 10000,
    enableMetrics: true,
    compression: false,
    serialization: 'json',
    namespace: 'ultramarket',
  };

  return new CacheManager({ ...defaultConfig, ...config }, redisClient);
}

/**
 * Cache key generator
 */
export function generateCacheKey(parts: (string | number)[]): string {
  return parts.join(':');
}

/**
 * Cache warming utility
 */
export async function warmCache(
  cacheManager: CacheManager,
  dataLoader: () => Promise<Array<{ key: string; value: unknown; ttl?: number }>>
): Promise<void> {
  const data = await dataLoader();
  await cacheManager.warmUp(data);
}

export default {
  CacheManager,
  createCacheManager,
  cacheStrategies,
  Cacheable,
  generateCacheKey,
  warmCache,
};
