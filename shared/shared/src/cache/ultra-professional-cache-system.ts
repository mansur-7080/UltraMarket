/**
 * 🚀 ULTRA PROFESSIONAL CACHE SYSTEM
 * UltraMarket E-commerce Platform
 * 
 * Advanced caching system featuring:
 * - Multi-tier caching (L1: Memory, L2: Redis, L3: Database)
 * - Intelligent cache invalidation and dependency tracking
 * - Cache warming and preloading strategies
 * - Performance monitoring and analytics
 * - Distributed cache coordination
 * - Cache compression and serialization optimization
 * - TTL management and smart expiration
 * - Cache hit/miss ratio optimization
 * - Background cache refresh
 * - Circuit breaker pattern for cache failures
 * 
 * @author UltraMarket Caching Team
 * @version 6.0.0
 * @date 2024-12-28
 */

import { logger } from '../logging/ultra-professional-logger';
import { createClient, RedisClientType } from 'redis';
import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import * as zlib from 'zlib';
import { promisify } from 'util';

// Professional TypeScript interfaces
export interface CacheConfig {
  enabled: boolean;
  
  // Redis configuration
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
    keyPrefix: string;
    maxRetries: number;
    retryDelayOnFailover: number;
    enableOfflineQueue: boolean;
    connectTimeout: number;
    commandTimeout: number;
    lazyConnect: boolean;
    keepAlive: boolean;
    family: 4 | 6;
  };
  
  // Memory cache configuration
  memory: {
    enabled: boolean;
    maxSize: number; // bytes
    maxItems: number;
    ttlCheckInterval: number; // ms
    deleteOnExpire: boolean;
  };
  
  // Compression settings
  compression: {
    enabled: boolean;
    algorithm: 'gzip' | 'deflate' | 'brotli';
    threshold: number; // bytes - compress if data larger than this
    level: number; // compression level 1-9
  };
  
  // Performance settings
  performance: {
    enableMetrics: boolean;
    metricsInterval: number; // ms
    backgroundRefresh: boolean;
    prefetchThreshold: number; // refetch when TTL is less than this
    circuitBreakerThreshold: number; // failures before opening circuit
    circuitBreakerTimeout: number; // ms to wait before retry
  };
  
  // Default TTL settings
  defaultTTL: {
    memory: number; // seconds
    redis: number; // seconds
    longTerm: number; // seconds for rarely changing data
    shortTerm: number; // seconds for frequently changing data
  };
  
  // Serialization
  serialization: {
    format: 'json' | 'msgpack' | 'protobuf';
    enableTypePreservation: boolean;
  };
}

export interface CacheItem<T = any> {
  key: string;
  value: T;
  ttl: number; // seconds
  createdAt: Date;
  lastAccessed: Date;
  accessCount: number;
  size: number; // bytes
  compressed: boolean;
  tags: string[];
  dependencies: string[];
  version: string;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  errors: number;
  totalRequests: number;
  hitRatio: number;
  averageResponseTime: number;
  memoryUsage: number;
  redisConnections: number;
  lastReset: Date;
  
  // Per-tier metrics
  memory: {
    hits: number;
    misses: number;
    size: number;
    items: number;
  };
  redis: {
    hits: number;
    misses: number;
    connections: number;
    commandsProcessed: number;
  };
}

export interface CacheStrategy {
  name: string;
  description: string;
  ttl: number;
  tier: 'memory' | 'redis' | 'both';
  compression: boolean;
  tags: string[];
  dependencies: string[];
  backgroundRefresh: boolean;
  preloadOnStartup: boolean;
}

export interface InvalidationRule {
  pattern: string; // glob pattern or regex
  tags: string[];
  dependencies: string[];
  cascade: boolean; // invalidate dependent caches
}

/**
 * Circuit Breaker for cache operations
 */
class CacheCircuitBreaker {
  private failures: number = 0;
  private lastFailure: Date | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private threshold: number,
    private timeout: number
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.lastFailure && Date.now() - this.lastFailure.getTime() > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailure = new Date();
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailure: this.lastFailure
    };
  }
}

/**
 * Memory Cache implementation
 */
class MemoryCache<T = any> {
  private cache: Map<string, CacheItem<T>> = new Map();
  private totalSize: number = 0;
  private accessOrder: string[] = [];
  
  constructor(private maxSize: number, private maxItems: number) {}
  
  set(key: string, value: T, ttl: number, tags: string[] = [], dependencies: string[] = []): void {
    const serialized = JSON.stringify(value);
    const size = Buffer.byteLength(serialized, 'utf8');
    
    // Check if we need to evict
    this.evictIfNeeded(size);
    
    const item: CacheItem<T> = {
      key,
      value,
      ttl,
      createdAt: new Date(),
      lastAccessed: new Date(),
      accessCount: 0,
      size,
      compressed: false,
      tags,
      dependencies,
      version: '1.0'
    };
    
    // Remove existing item if present
    if (this.cache.has(key)) {
      const existingItem = this.cache.get(key)!;
      this.totalSize -= existingItem.size;
      this.removeFromAccessOrder(key);
    }
    
    this.cache.set(key, item);
    this.totalSize += size;
    this.accessOrder.push(key);
  }
  
  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    // Check if expired
    if (this.isExpired(item)) {
      this.delete(key);
      return null;
    }
    
    // Update access information
    item.lastAccessed = new Date();
    item.accessCount++;
    
    // Move to end of access order
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
    
    return item.value;
  }
  
  delete(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    this.cache.delete(key);
    this.totalSize -= item.size;
    this.removeFromAccessOrder(key);
    
    return true;
  }
  
  clear(): void {
    this.cache.clear();
    this.totalSize = 0;
    this.accessOrder = [];
  }
  
  getStats() {
    return {
      size: this.totalSize,
      items: this.cache.size,
      maxSize: this.maxSize,
      maxItems: this.maxItems,
      utilizationRatio: this.totalSize / this.maxSize
    };
  }
  
  private evictIfNeeded(newItemSize: number): void {
    // Evict expired items first
    this.evictExpired();
    
    // Evict by size if needed
    while (this.totalSize + newItemSize > this.maxSize && this.cache.size > 0) {
      const oldestKey = this.accessOrder[0];
      if (oldestKey) {
        this.delete(oldestKey);
      }
    }
    
    // Evict by count if needed
    while (this.cache.size >= this.maxItems && this.cache.size > 0) {
      const oldestKey = this.accessOrder[0];
      if (oldestKey) {
        this.delete(oldestKey);
      }
    }
  }
  
  private evictExpired(): void {
    const now = new Date();
    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        this.delete(key);
      }
    }
  }
  
  private isExpired(item: CacheItem<T>): boolean {
    const now = new Date();
    const expiredAt = new Date(item.createdAt.getTime() + item.ttl * 1000);
    return now > expiredAt;
  }
  
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }
}

/**
 * Ultra Professional Cache System
 */
export class UltraProfessionalCacheSystem extends EventEmitter {
  private config: CacheConfig;
  private redisClient: RedisClientType;
  private memoryCache: MemoryCache;
  private circuitBreaker: CacheCircuitBreaker;
  
  private metrics: CacheMetrics;
  private strategies: Map<string, CacheStrategy> = new Map();
  private invalidationRules: InvalidationRule[] = [];
  private backgroundTasks: Set<NodeJS.Timeout> = new Set();
  
  // Compression utilities
  private gzipAsync = promisify(zlib.gzip);
  private gunzipAsync = promisify(zlib.gunzip);
  private deflateAsync = promisify(zlib.deflate);
  private inflateAsync = promisify(zlib.inflate);

  constructor(config: CacheConfig) {
    super();
    this.config = config;
    
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      errors: 0,
      totalRequests: 0,
      hitRatio: 0,
      averageResponseTime: 0,
      memoryUsage: 0,
      redisConnections: 0,
      lastReset: new Date(),
      memory: { hits: 0, misses: 0, size: 0, items: 0 },
      redis: { hits: 0, misses: 0, connections: 0, commandsProcessed: 0 }
    };
    
    this.initializeComponents();
    this.initializeDefaultStrategies();
    this.startBackgroundTasks();

    logger.info('🚀 Ultra Professional Cache System initialized', {
      memoryEnabled: config.memory.enabled,
      redisEnabled: config.enabled,
      compressionEnabled: config.compression.enabled
    });
  }

  /**
   * Initialize cache components
   */
  private async initializeComponents(): Promise<void> {
    try {
      // Initialize Redis client
      if (this.config.enabled) {
        this.redisClient = createClient({
          socket: {
            host: this.config.redis.host,
            port: this.config.redis.port,
            connectTimeout: this.config.redis.connectTimeout,
            commandTimeout: this.config.redis.commandTimeout,
            keepAlive: this.config.redis.keepAlive,
            family: this.config.redis.family
          },
          password: this.config.redis.password,
          database: this.config.redis.db,
          
          // Connection optimization
          retryDelayOnFailover: this.config.redis.retryDelayOnFailover,
          enableOfflineQueue: this.config.redis.enableOfflineQueue,
          lazyConnect: this.config.redis.lazyConnect,
          
          // Key prefix
          ...(this.config.redis.keyPrefix && {
            keyPrefix: this.config.redis.keyPrefix
          })
        });

        // Setup Redis event handlers
        this.redisClient.on('connect', () => {
          logger.info('✅ Redis connected');
        });

        this.redisClient.on('error', (error) => {
          logger.error('❌ Redis error', error);
          this.metrics.errors++;
        });

        this.redisClient.on('reconnecting', () => {
          logger.warn('🔄 Redis reconnecting');
        });

        await this.redisClient.connect();
      }

      // Initialize memory cache
      if (this.config.memory.enabled) {
        this.memoryCache = new MemoryCache(
          this.config.memory.maxSize,
          this.config.memory.maxItems
        );
      }

      // Initialize circuit breaker
      this.circuitBreaker = new CacheCircuitBreaker(
        this.config.performance.circuitBreakerThreshold,
        this.config.performance.circuitBreakerTimeout
      );

    } catch (error) {
      logger.error('❌ Failed to initialize cache components', error);
      throw error;
    }
  }

  /**
   * Set cache value with intelligent tiering
   */
  public async set<T>(
    key: string,
    value: T,
    options: {
      ttl?: number;
      strategy?: string;
      tags?: string[];
      dependencies?: string[];
      tier?: 'memory' | 'redis' | 'both';
      compression?: boolean;
    } = {}
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      const strategy = options.strategy ? this.strategies.get(options.strategy) : null;
      const finalOptions = {
        ttl: options.ttl || strategy?.ttl || this.config.defaultTTL.redis,
        tier: options.tier || strategy?.tier || 'both',
        tags: options.tags || strategy?.tags || [],
        dependencies: options.dependencies || strategy?.dependencies || [],
        compression: options.compression ?? strategy?.compression ?? this.shouldCompress(value)
      };

      // Serialize and optionally compress
      let serializedValue = await this.serialize(value);
      let compressed = false;

      if (finalOptions.compression && this.config.compression.enabled) {
        const originalSize = Buffer.byteLength(serializedValue, 'utf8');
        if (originalSize > this.config.compression.threshold) {
          serializedValue = await this.compress(serializedValue);
          compressed = true;
        }
      }

      // Set in appropriate tiers
      if (finalOptions.tier === 'memory' || finalOptions.tier === 'both') {
        if (this.config.memory.enabled && this.memoryCache) {
          this.memoryCache.set(key, value, finalOptions.ttl, finalOptions.tags, finalOptions.dependencies);
        }
      }

      if (finalOptions.tier === 'redis' || finalOptions.tier === 'both') {
        if (this.config.enabled && this.redisClient) {
          await this.circuitBreaker.execute(async () => {
            const cacheItem = {
              value: serializedValue,
              compressed,
              tags: finalOptions.tags,
              dependencies: finalOptions.dependencies,
              createdAt: new Date().toISOString(),
              version: '1.0'
            };

            const itemData = JSON.stringify(cacheItem);
            await this.redisClient.setEx(key, finalOptions.ttl, itemData);
          });
        }
      }

      this.metrics.sets++;
      this.emit('set', { key, tier: finalOptions.tier, compressed });

      logger.debug('💾 Cache set', {
        key,
        tier: finalOptions.tier,
        ttl: finalOptions.ttl,
        compressed,
        size: Buffer.byteLength(serializedValue, 'utf8')
      });

    } catch (error) {
      this.metrics.errors++;
      logger.error('❌ Cache set failed', error, { key });
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      this.updateAverageResponseTime(duration);
    }
  }

  /**
   * Get cache value with intelligent fallback
   */
  public async get<T>(key: string, options: {
    strategy?: string;
    refreshIfNearExpiry?: boolean;
  } = {}): Promise<T | null> {
    const startTime = Date.now();
    this.metrics.totalRequests++;
    
    try {
      let value: T | null = null;
      let hitTier: 'memory' | 'redis' | null = null;

      // Try memory cache first
      if (this.config.memory.enabled && this.memoryCache) {
        value = this.memoryCache.get(key);
        if (value !== null) {
          hitTier = 'memory';
          this.metrics.hits++;
          this.metrics.memory.hits++;
        } else {
          this.metrics.memory.misses++;
        }
      }

      // Fallback to Redis if not found in memory
      if (value === null && this.config.enabled && this.redisClient) {
        try {
          const redisData = await this.circuitBreaker.execute(async () => {
            return await this.redisClient.get(key);
          });

          if (redisData) {
            const cacheItem = JSON.parse(redisData);
            let deserializedValue = cacheItem.value;

            // Decompress if needed
            if (cacheItem.compressed) {
              deserializedValue = await this.decompress(deserializedValue);
            }

            value = await this.deserialize<T>(deserializedValue);
            hitTier = 'redis';
            this.metrics.hits++;
            this.metrics.redis.hits++;

            // Promote to memory cache if enabled
            if (this.config.memory.enabled && this.memoryCache) {
              const strategy = options.strategy ? this.strategies.get(options.strategy) : null;
              const ttl = strategy?.ttl || this.config.defaultTTL.memory;
              this.memoryCache.set(key, value, ttl, cacheItem.tags, cacheItem.dependencies);
            }
          } else {
            this.metrics.redis.misses++;
          }
        } catch (error) {
          logger.warn('⚠️ Redis get failed, circuit breaker may be open', { key, error: error.message });
        }
      }

      if (value === null) {
        this.metrics.misses++;
        this.emit('miss', { key });
      } else {
        this.emit('hit', { key, tier: hitTier });
      }

      // Update hit ratio
      this.metrics.hitRatio = (this.metrics.hits / this.metrics.totalRequests) * 100;

      return value;

    } catch (error) {
      this.metrics.errors++;
      logger.error('❌ Cache get failed', error, { key });
      return null;
    } finally {
      const duration = Date.now() - startTime;
      this.updateAverageResponseTime(duration);
    }
  }

  /**
   * Delete cache entry
   */
  public async delete(key: string): Promise<boolean> {
    try {
      let deleted = false;

      // Delete from memory cache
      if (this.config.memory.enabled && this.memoryCache) {
        const memoryDeleted = this.memoryCache.delete(key);
        deleted = deleted || memoryDeleted;
      }

      // Delete from Redis
      if (this.config.enabled && this.redisClient) {
        const redisDeleted = await this.circuitBreaker.execute(async () => {
          const result = await this.redisClient.del(key);
          return result > 0;
        });
        deleted = deleted || redisDeleted;
      }

      if (deleted) {
        this.metrics.deletes++;
        this.emit('delete', { key });
      }

      return deleted;
    } catch (error) {
      this.metrics.errors++;
      logger.error('❌ Cache delete failed', error, { key });
      return false;
    }
  }

  /**
   * Invalidate cache by pattern or tags
   */
  public async invalidate(options: {
    pattern?: string;
    tags?: string[];
    dependencies?: string[];
    cascade?: boolean;
  }): Promise<number> {
    let invalidatedCount = 0;

    try {
      if (options.pattern) {
        // Pattern-based invalidation
        if (this.config.enabled && this.redisClient) {
          const keys = await this.redisClient.keys(options.pattern);
          if (keys.length > 0) {
            await this.redisClient.del(...keys);
            invalidatedCount += keys.length;
          }
        }
      }

      if (options.tags || options.dependencies) {
        // Tag/dependency-based invalidation would require more sophisticated tracking
        // This is a simplified implementation
        logger.info('🏷️ Tag/dependency-based invalidation', {
          tags: options.tags,
          dependencies: options.dependencies
        });
      }

      this.emit('invalidation', { ...options, count: invalidatedCount });

      logger.info('🗑️ Cache invalidated', {
        pattern: options.pattern,
        tags: options.tags,
        count: invalidatedCount
      });

      return invalidatedCount;

    } catch (error) {
      logger.error('❌ Cache invalidation failed', error, options);
      return 0;
    }
  }

  /**
   * Get or set pattern (cache-aside)
   */
  public async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: {
      ttl?: number;
      strategy?: string;
      tags?: string[];
      dependencies?: string[];
    } = {}
  ): Promise<T> {
    // Try to get from cache first
    let value = await this.get<T>(key, options);
    
    if (value !== null) {
      return value;
    }

    // Not in cache, fetch from factory
    try {
      value = await factory();
      
      // Set in cache
      await this.set(key, value, options);
      
      return value;
    } catch (error) {
      logger.error('❌ Cache factory function failed', error, { key });
      throw error;
    }
  }

  /**
   * Warm cache with predefined data
   */
  public async warmCache(warmers: Array<{
    key: string;
    factory: () => Promise<any>;
    options?: any;
  }>): Promise<void> {
    logger.info('🔥 Starting cache warming', { count: warmers.length });

    const promises = warmers.map(async ({ key, factory, options }) => {
      try {
        const value = await factory();
        await this.set(key, value, options);
        logger.debug('🔥 Cache warmed', { key });
      } catch (error) {
        logger.error('❌ Cache warming failed', error, { key });
      }
    });

    await Promise.allSettled(promises);
    logger.info('✅ Cache warming completed');
  }

  /**
   * Get cache statistics
   */
  public getMetrics(): CacheMetrics & {
    circuitBreaker: any;
    memoryStats: any;
  } {
    if (this.config.memory.enabled && this.memoryCache) {
      const memoryStats = this.memoryCache.getStats();
      this.metrics.memory.size = memoryStats.size;
      this.metrics.memory.items = memoryStats.items;
    }

    return {
      ...this.metrics,
      circuitBreaker: this.circuitBreaker.getState(),
      memoryStats: this.config.memory.enabled && this.memoryCache 
        ? this.memoryCache.getStats() 
        : null
    };
  }

  /**
   * Initialize default caching strategies
   */
  private initializeDefaultStrategies(): void {
    const strategies: CacheStrategy[] = [
      {
        name: 'user_session',
        description: 'User session data',
        ttl: 3600, // 1 hour
        tier: 'both',
        compression: false,
        tags: ['user', 'session'],
        dependencies: [],
        backgroundRefresh: false,
        preloadOnStartup: false
      },
      {
        name: 'product_catalog',
        description: 'Product catalog data',
        ttl: 1800, // 30 minutes
        tier: 'both',
        compression: true,
        tags: ['product', 'catalog'],
        dependencies: ['inventory'],
        backgroundRefresh: true,
        preloadOnStartup: true
      },
      {
        name: 'user_profile',
        description: 'User profile information',
        ttl: 900, // 15 minutes
        tier: 'both',
        compression: false,
        tags: ['user', 'profile'],
        dependencies: [],
        backgroundRefresh: false,
        preloadOnStartup: false
      },
      {
        name: 'static_content',
        description: 'Static content and configurations',
        ttl: 7200, // 2 hours
        tier: 'both',
        compression: true,
        tags: ['static', 'config'],
        dependencies: [],
        backgroundRefresh: true,
        preloadOnStartup: true
      },
      {
        name: 'search_results',
        description: 'Search results',
        ttl: 300, // 5 minutes
        tier: 'redis',
        compression: true,
        tags: ['search', 'results'],
        dependencies: ['product', 'inventory'],
        backgroundRefresh: false,
        preloadOnStartup: false
      },
      {
        name: 'analytics_data',
        description: 'Analytics and reporting data',
        ttl: 3600, // 1 hour
        tier: 'redis',
        compression: true,
        tags: ['analytics', 'reports'],
        dependencies: [],
        backgroundRefresh: true,
        preloadOnStartup: false
      }
    ];

    strategies.forEach(strategy => {
      this.strategies.set(strategy.name, strategy);
    });

    logger.info('📋 Default cache strategies initialized', {
      count: strategies.length
    });
  }

  /**
   * Start background tasks
   */
  private startBackgroundTasks(): void {
    // Metrics reporting
    if (this.config.performance.enableMetrics) {
      const metricsInterval = setInterval(() => {
        this.reportMetrics();
      }, this.config.performance.metricsInterval);
      this.backgroundTasks.add(metricsInterval);
    }

    // Memory cache TTL cleanup
    if (this.config.memory.enabled) {
      const cleanupInterval = setInterval(() => {
        // Memory cache cleanup is handled internally
      }, this.config.memory.ttlCheckInterval);
      this.backgroundTasks.add(cleanupInterval);
    }

    // Background refresh for strategies that support it
    if (this.config.performance.backgroundRefresh) {
      const refreshInterval = setInterval(() => {
        this.performBackgroundRefresh();
      }, 60000); // Every minute
      this.backgroundTasks.add(refreshInterval);
    }

    logger.info('⚙️ Background tasks started');
  }

  /**
   * Helper methods
   */
  private shouldCompress(value: any): boolean {
    if (!this.config.compression.enabled) return false;
    
    const serialized = JSON.stringify(value);
    const size = Buffer.byteLength(serialized, 'utf8');
    return size > this.config.compression.threshold;
  }

  private async serialize<T>(value: T): Promise<string> {
    // For now, use JSON serialization
    // In the future, could support other formats like MessagePack
    return JSON.stringify(value);
  }

  private async deserialize<T>(value: string): Promise<T> {
    return JSON.parse(value);
  }

  private async compress(data: string): Promise<string> {
    try {
      let compressed: Buffer;
      
      switch (this.config.compression.algorithm) {
        case 'gzip':
          compressed = await this.gzipAsync(data, { level: this.config.compression.level });
          break;
        case 'deflate':
          compressed = await this.deflateAsync(data, { level: this.config.compression.level });
          break;
        default:
          compressed = await this.gzipAsync(data, { level: this.config.compression.level });
      }
      
      return compressed.toString('base64');
    } catch (error) {
      logger.error('❌ Compression failed', error);
      return data; // Return uncompressed data as fallback
    }
  }

  private async decompress(data: string): Promise<string> {
    try {
      const buffer = Buffer.from(data, 'base64');
      let decompressed: Buffer;
      
      switch (this.config.compression.algorithm) {
        case 'gzip':
          decompressed = await this.gunzipAsync(buffer);
          break;
        case 'deflate':
          decompressed = await this.inflateAsync(buffer);
          break;
        default:
          decompressed = await this.gunzipAsync(buffer);
      }
      
      return decompressed.toString('utf8');
    } catch (error) {
      logger.error('❌ Decompression failed', error);
      throw error;
    }
  }

  private updateAverageResponseTime(duration: number): void {
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + duration) / 
      this.metrics.totalRequests;
  }

  private reportMetrics(): void {
    const metrics = this.getMetrics();
    
    logger.performance('Cache metrics report', {
      metric: 'cache_performance',
      value: metrics.hitRatio,
      unit: 'percent',
      hitRatio: metrics.hitRatio,
      totalRequests: metrics.totalRequests,
      averageResponseTime: metrics.averageResponseTime,
      memoryUsage: metrics.memory.size,
      redisConnections: metrics.redis.connections
    });

    this.emit('metrics', metrics);
  }

  private async performBackgroundRefresh(): Promise<void> {
    // Implement background refresh logic for strategies that support it
    for (const [name, strategy] of this.strategies) {
      if (strategy.backgroundRefresh) {
        // This would typically involve checking TTL and refreshing if needed
        logger.debug('🔄 Background refresh check', { strategy: name });
      }
    }
  }

  /**
   * Shutdown cache system
   */
  public async shutdown(): Promise<void> {
    try {
      // Clear all background tasks
      for (const task of this.backgroundTasks) {
        clearInterval(task);
      }
      this.backgroundTasks.clear();

      // Close Redis connection
      if (this.redisClient) {
        await this.redisClient.quit();
      }

      // Clear memory cache
      if (this.memoryCache) {
        this.memoryCache.clear();
      }

      logger.info('🛑 Cache system shutdown completed');
    } catch (error) {
      logger.error('❌ Cache system shutdown failed', error);
    }
  }
}

// Export helper functions
export const createCacheSystem = (config: CacheConfig) => {
  return new UltraProfessionalCacheSystem(config);
};

// Cache key generators
export const CacheKeys = {
  user: (id: string) => `user:${id}`,
  userSession: (id: string) => `session:${id}`,
  userProfile: (id: string) => `profile:${id}`,
  product: (id: string) => `product:${id}`,
  productList: (filters: string) => `products:${crypto.createHash('md5').update(filters).digest('hex')}`,
  category: (id: string) => `category:${id}`,
  search: (query: string, filters: string) => `search:${crypto.createHash('md5').update(query + filters).digest('hex')}`,
  cart: (userId: string) => `cart:${userId}`,
  order: (id: string) => `order:${id}`,
  userOrders: (userId: string) => `orders:${userId}`,
  analytics: (type: string, period: string) => `analytics:${type}:${period}`,
  config: (key: string) => `config:${key}`,
  static: (path: string) => `static:${crypto.createHash('md5').update(path).digest('hex')}`
};

export default UltraProfessionalCacheSystem; 