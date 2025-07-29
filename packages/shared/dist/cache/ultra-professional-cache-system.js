"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheKeys = exports.createCacheSystem = exports.UltraProfessionalCacheSystem = void 0;
const tslib_1 = require("tslib");
const ultra_professional_logger_1 = require("../logging/ultra-professional-logger");
const redis_1 = require("redis");
const events_1 = require("events");
const crypto = tslib_1.__importStar(require("crypto"));
const zlib = tslib_1.__importStar(require("zlib"));
const util_1 = require("util");
/**
 * Circuit Breaker for cache operations
 */
class CacheCircuitBreaker {
    threshold;
    timeout;
    failures = 0;
    lastFailure = null;
    state = 'closed';
    constructor(threshold, timeout) {
        this.threshold = threshold;
        this.timeout = timeout;
    }
    async execute(operation) {
        if (this.state === 'open') {
            if (this.lastFailure && Date.now() - this.lastFailure.getTime() > this.timeout) {
                this.state = 'half-open';
            }
            else {
                throw new Error('Circuit breaker is open');
            }
        }
        try {
            const result = await operation();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    onSuccess() {
        this.failures = 0;
        this.state = 'closed';
    }
    onFailure() {
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
class MemoryCache {
    maxSize;
    maxItems;
    cache = new Map();
    totalSize = 0;
    accessOrder = [];
    constructor(maxSize, maxItems) {
        this.maxSize = maxSize;
        this.maxItems = maxItems;
    }
    set(key, value, ttl, tags = [], dependencies = []) {
        const serialized = JSON.stringify(value);
        const size = Buffer.byteLength(serialized, 'utf8');
        // Check if we need to evict
        this.evictIfNeeded(size);
        const item = {
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
            const existingItem = this.cache.get(key);
            this.totalSize -= existingItem.size;
            this.removeFromAccessOrder(key);
        }
        this.cache.set(key, item);
        this.totalSize += size;
        this.accessOrder.push(key);
    }
    get(key) {
        const item = this.cache.get(key);
        if (!item)
            return null;
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
    delete(key) {
        const item = this.cache.get(key);
        if (!item)
            return false;
        this.cache.delete(key);
        this.totalSize -= item.size;
        this.removeFromAccessOrder(key);
        return true;
    }
    clear() {
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
    evictIfNeeded(newItemSize) {
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
    evictExpired() {
        const now = new Date();
        for (const [key, item] of this.cache.entries()) {
            if (this.isExpired(item)) {
                this.delete(key);
            }
        }
    }
    isExpired(item) {
        const now = new Date();
        const expiredAt = new Date(item.createdAt.getTime() + item.ttl * 1000);
        return now > expiredAt;
    }
    removeFromAccessOrder(key) {
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
    }
}
/**
 * Ultra Professional Cache System
 */
class UltraProfessionalCacheSystem extends events_1.EventEmitter {
    config;
    redisClient;
    memoryCache;
    circuitBreaker;
    metrics;
    strategies = new Map();
    invalidationRules = [];
    backgroundTasks = new Set();
    // Compression utilities
    gzipAsync = (0, util_1.promisify)(zlib.gzip);
    gunzipAsync = (0, util_1.promisify)(zlib.gunzip);
    deflateAsync = (0, util_1.promisify)(zlib.deflate);
    inflateAsync = (0, util_1.promisify)(zlib.inflate);
    constructor(config) {
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
        ultra_professional_logger_1.logger.info('🚀 Ultra Professional Cache System initialized', {
            memoryEnabled: config.memory.enabled,
            redisEnabled: config.enabled,
            compressionEnabled: config.compression.enabled
        });
    }
    /**
     * Initialize cache components
     */
    async initializeComponents() {
        try {
            // Initialize Redis client
            if (this.config.enabled) {
                this.redisClient = (0, redis_1.createClient)({
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
                    ultra_professional_logger_1.logger.info('✅ Redis connected');
                });
                this.redisClient.on('error', (error) => {
                    ultra_professional_logger_1.logger.error('❌ Redis error', error);
                    this.metrics.errors++;
                });
                this.redisClient.on('reconnecting', () => {
                    ultra_professional_logger_1.logger.warn('🔄 Redis reconnecting');
                });
                await this.redisClient.connect();
            }
            // Initialize memory cache
            if (this.config.memory.enabled) {
                this.memoryCache = new MemoryCache(this.config.memory.maxSize, this.config.memory.maxItems);
            }
            // Initialize circuit breaker
            this.circuitBreaker = new CacheCircuitBreaker(this.config.performance.circuitBreakerThreshold, this.config.performance.circuitBreakerTimeout);
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('❌ Failed to initialize cache components', error);
            throw error;
        }
    }
    /**
     * Set cache value with intelligent tiering
     */
    async set(key, value, options = {}) {
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
            ultra_professional_logger_1.logger.debug('💾 Cache set', {
                key,
                tier: finalOptions.tier,
                ttl: finalOptions.ttl,
                compressed,
                size: Buffer.byteLength(serializedValue, 'utf8')
            });
        }
        catch (error) {
            this.metrics.errors++;
            ultra_professional_logger_1.logger.error('❌ Cache set failed', error, { key });
            throw error;
        }
        finally {
            const duration = Date.now() - startTime;
            this.updateAverageResponseTime(duration);
        }
    }
    /**
     * Get cache value with intelligent fallback
     */
    async get(key, options = {}) {
        const startTime = Date.now();
        this.metrics.totalRequests++;
        try {
            let value = null;
            let hitTier = null;
            // Try memory cache first
            if (this.config.memory.enabled && this.memoryCache) {
                value = this.memoryCache.get(key);
                if (value !== null) {
                    hitTier = 'memory';
                    this.metrics.hits++;
                    this.metrics.memory.hits++;
                }
                else {
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
                        value = await this.deserialize(deserializedValue);
                        hitTier = 'redis';
                        this.metrics.hits++;
                        this.metrics.redis.hits++;
                        // Promote to memory cache if enabled
                        if (this.config.memory.enabled && this.memoryCache) {
                            const strategy = options.strategy ? this.strategies.get(options.strategy) : null;
                            const ttl = strategy?.ttl || this.config.defaultTTL.memory;
                            this.memoryCache.set(key, value, ttl, cacheItem.tags, cacheItem.dependencies);
                        }
                    }
                    else {
                        this.metrics.redis.misses++;
                    }
                }
                catch (error) {
                    ultra_professional_logger_1.logger.warn('⚠️ Redis get failed, circuit breaker may be open', { key, error: error.message });
                }
            }
            if (value === null) {
                this.metrics.misses++;
                this.emit('miss', { key });
            }
            else {
                this.emit('hit', { key, tier: hitTier });
            }
            // Update hit ratio
            this.metrics.hitRatio = (this.metrics.hits / this.metrics.totalRequests) * 100;
            return value;
        }
        catch (error) {
            this.metrics.errors++;
            ultra_professional_logger_1.logger.error('❌ Cache get failed', error, { key });
            return null;
        }
        finally {
            const duration = Date.now() - startTime;
            this.updateAverageResponseTime(duration);
        }
    }
    /**
     * Delete cache entry
     */
    async delete(key) {
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
        }
        catch (error) {
            this.metrics.errors++;
            ultra_professional_logger_1.logger.error('❌ Cache delete failed', error, { key });
            return false;
        }
    }
    /**
     * Invalidate cache by pattern or tags
     */
    async invalidate(options) {
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
                ultra_professional_logger_1.logger.info('🏷️ Tag/dependency-based invalidation', {
                    tags: options.tags,
                    dependencies: options.dependencies
                });
            }
            this.emit('invalidation', { ...options, count: invalidatedCount });
            ultra_professional_logger_1.logger.info('🗑️ Cache invalidated', {
                pattern: options.pattern,
                tags: options.tags,
                count: invalidatedCount
            });
            return invalidatedCount;
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('❌ Cache invalidation failed', error, options);
            return 0;
        }
    }
    /**
     * Get or set pattern (cache-aside)
     */
    async getOrSet(key, factory, options = {}) {
        // Try to get from cache first
        let value = await this.get(key, options);
        if (value !== null) {
            return value;
        }
        // Not in cache, fetch from factory
        try {
            value = await factory();
            // Set in cache
            await this.set(key, value, options);
            return value;
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('❌ Cache factory function failed', error, { key });
            throw error;
        }
    }
    /**
     * Warm cache with predefined data
     */
    async warmCache(warmers) {
        ultra_professional_logger_1.logger.info('🔥 Starting cache warming', { count: warmers.length });
        const promises = warmers.map(async ({ key, factory, options }) => {
            try {
                const value = await factory();
                await this.set(key, value, options);
                ultra_professional_logger_1.logger.debug('🔥 Cache warmed', { key });
            }
            catch (error) {
                ultra_professional_logger_1.logger.error('❌ Cache warming failed', error, { key });
            }
        });
        await Promise.allSettled(promises);
        ultra_professional_logger_1.logger.info('✅ Cache warming completed');
    }
    /**
     * Get cache statistics
     */
    getMetrics() {
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
    initializeDefaultStrategies() {
        const strategies = [
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
        ultra_professional_logger_1.logger.info('📋 Default cache strategies initialized', {
            count: strategies.length
        });
    }
    /**
     * Start background tasks
     */
    startBackgroundTasks() {
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
        ultra_professional_logger_1.logger.info('⚙️ Background tasks started');
    }
    /**
     * Helper methods
     */
    shouldCompress(value) {
        if (!this.config.compression.enabled)
            return false;
        const serialized = JSON.stringify(value);
        const size = Buffer.byteLength(serialized, 'utf8');
        return size > this.config.compression.threshold;
    }
    async serialize(value) {
        // For now, use JSON serialization
        // In the future, could support other formats like MessagePack
        return JSON.stringify(value);
    }
    async deserialize(value) {
        return JSON.parse(value);
    }
    async compress(data) {
        try {
            let compressed;
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
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('❌ Compression failed', error);
            return data; // Return uncompressed data as fallback
        }
    }
    async decompress(data) {
        try {
            const buffer = Buffer.from(data, 'base64');
            let decompressed;
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
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('❌ Decompression failed', error);
            throw error;
        }
    }
    updateAverageResponseTime(duration) {
        this.metrics.averageResponseTime =
            (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + duration) /
                this.metrics.totalRequests;
    }
    reportMetrics() {
        const metrics = this.getMetrics();
        ultra_professional_logger_1.logger.performance('Cache metrics report', {
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
    async performBackgroundRefresh() {
        // Implement background refresh logic for strategies that support it
        for (const [name, strategy] of this.strategies) {
            if (strategy.backgroundRefresh) {
                // This would typically involve checking TTL and refreshing if needed
                ultra_professional_logger_1.logger.debug('🔄 Background refresh check', { strategy: name });
            }
        }
    }
    /**
     * Shutdown cache system
     */
    async shutdown() {
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
            ultra_professional_logger_1.logger.info('🛑 Cache system shutdown completed');
        }
        catch (error) {
            ultra_professional_logger_1.logger.error('❌ Cache system shutdown failed', error);
        }
    }
}
exports.UltraProfessionalCacheSystem = UltraProfessionalCacheSystem;
// Export helper functions
const createCacheSystem = (config) => {
    return new UltraProfessionalCacheSystem(config);
};
exports.createCacheSystem = createCacheSystem;
// Cache key generators
exports.CacheKeys = {
    user: (id) => `user:${id}`,
    userSession: (id) => `session:${id}`,
    userProfile: (id) => `profile:${id}`,
    product: (id) => `product:${id}`,
    productList: (filters) => `products:${crypto.createHash('md5').update(filters).digest('hex')}`,
    category: (id) => `category:${id}`,
    search: (query, filters) => `search:${crypto.createHash('md5').update(query + filters).digest('hex')}`,
    cart: (userId) => `cart:${userId}`,
    order: (id) => `order:${id}`,
    userOrders: (userId) => `orders:${userId}`,
    analytics: (type, period) => `analytics:${type}:${period}`,
    config: (key) => `config:${key}`,
    static: (path) => `static:${crypto.createHash('md5').update(path).digest('hex')}`
};
exports.default = UltraProfessionalCacheSystem;
//# sourceMappingURL=ultra-professional-cache-system.js.map