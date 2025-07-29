"use strict";
/**
 * Professional Cache Management System
 * High-performance caching with Redis, in-memory, and distributed caching
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheStrategies = exports.CacheManager = void 0;
exports.Cacheable = Cacheable;
exports.createCacheManager = createCacheManager;
exports.generateCacheKey = generateCacheKey;
exports.warmCache = warmCache;
const events_1 = require("events");
const perf_hooks_1 = require("perf_hooks");
// =================== SIMPLE LOGGER ===================
const logger = {
    info: (message, meta) => {
        console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : '');
    },
    error: (message, meta) => {
        console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta) : '');
    },
    warn: (message, meta) => {
        console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : '');
    },
};
// =================== CACHE MANAGER ===================
class CacheManager extends events_1.EventEmitter {
    config;
    cache = new Map();
    redisClient;
    metrics = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        evictions: 0,
        totalSize: 0,
        hitRate: 0,
        averageResponseTime: 0,
    };
    responseTimes = [];
    cleanupInterval = null;
    constructor(config, redisClient) {
        super();
        this.config = config;
        this.redisClient = redisClient;
        this.startCleanupInterval();
    }
    /**
     * Get value from cache
     */
    async get(key) {
        const startTime = perf_hooks_1.performance.now();
        const fullKey = this.getFullKey(key);
        try {
            // Try in-memory cache first
            const memoryItem = this.cache.get(fullKey);
            if (memoryItem && !this.isExpired(memoryItem)) {
                memoryItem.hits++;
                this.recordHit(perf_hooks_1.performance.now() - startTime);
                return memoryItem.value;
            }
            // Try Redis cache
            if (this.redisClient && typeof this.redisClient === 'object' && this.redisClient !== null) {
                const redisGet = this.redisClient.get;
                if (typeof redisGet === 'function') {
                    const redisValue = await redisGet(fullKey);
                    if (redisValue) {
                        const parsedValue = this.deserialize(redisValue);
                        // Store in memory for faster access
                        await this.setMemory(fullKey, parsedValue, this.config.defaultTTL);
                        this.recordHit(perf_hooks_1.performance.now() - startTime);
                        return parsedValue;
                    }
                }
            }
            this.recordMiss(perf_hooks_1.performance.now() - startTime);
            return null;
        }
        catch (error) {
            logger.error('Cache get error', { key, error });
            this.recordMiss(perf_hooks_1.performance.now() - startTime);
            return null;
        }
    }
    /**
     * Set value in cache
     */
    async set(key, value, ttl) {
        const startTime = perf_hooks_1.performance.now();
        const fullKey = this.getFullKey(key);
        const cacheTTL = ttl || this.config.defaultTTL;
        try {
            // Set in memory cache
            await this.setMemory(fullKey, value, cacheTTL);
            // Set in Redis cache
            if (this.redisClient && typeof this.redisClient === 'object' && this.redisClient !== null) {
                const redisSetex = this.redisClient.setex;
                if (typeof redisSetex === 'function') {
                    const serializedValue = this.serialize(value);
                    await redisSetex(fullKey, cacheTTL, serializedValue);
                }
            }
            this.metrics.sets++;
            this.recordResponseTime(perf_hooks_1.performance.now() - startTime);
            this.emit('set', { key, value, ttl: cacheTTL });
        }
        catch (error) {
            logger.error('Cache set error', { key, error });
            throw error;
        }
    }
    /**
     * Delete value from cache
     */
    async delete(key) {
        const startTime = perf_hooks_1.performance.now();
        const fullKey = this.getFullKey(key);
        try {
            // Delete from memory cache
            const memoryDeleted = this.cache.delete(fullKey);
            // Delete from Redis cache
            let redisDeleted = false;
            if (this.redisClient && typeof this.redisClient === 'object' && this.redisClient !== null) {
                const redisDel = this.redisClient.del;
                if (typeof redisDel === 'function') {
                    const result = await redisDel(fullKey);
                    redisDeleted = result > 0;
                }
            }
            const deleted = memoryDeleted || redisDeleted;
            if (deleted) {
                this.metrics.deletes++;
                this.recordResponseTime(perf_hooks_1.performance.now() - startTime);
                this.emit('delete', { key });
            }
            return deleted;
        }
        catch (error) {
            logger.error('Cache delete error', { key, error });
            return false;
        }
    }
    /**
     * Clear all cache
     */
    async clear() {
        try {
            // Clear memory cache
            this.cache.clear();
            // Clear Redis cache with namespace
            if (this.redisClient && typeof this.redisClient === 'object' && this.redisClient !== null) {
                const redisKeys = this.redisClient
                    .keys;
                if (typeof redisKeys === 'function') {
                    const pattern = `${this.config.namespace}:*`;
                    const keys = await redisKeys(pattern);
                    if (keys.length > 0) {
                        const redisDel = this.redisClient.del;
                        if (typeof redisDel === 'function') {
                            await redisDel(keys);
                        }
                    }
                }
            }
            this.resetMetrics();
            this.emit('clear');
        }
        catch (error) {
            logger.error('Cache clear error', { error });
            throw error;
        }
    }
    /**
     * Get or set with function
     */
    async getOrSet(key, fn, ttl) {
        const cached = await this.get(key);
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
    async getMany(keys) {
        const promises = keys.map((key) => this.get(key));
        return Promise.all(promises);
    }
    /**
     * Set multiple key-value pairs
     */
    async setMany(items) {
        const promises = items.map((item) => this.set(item.key, item.value, item.ttl));
        await Promise.all(promises);
    }
    /**
     * Delete multiple keys
     */
    async deleteMany(keys) {
        const promises = keys.map((key) => this.delete(key));
        const results = await Promise.all(promises);
        return results.filter(Boolean).length;
    }
    /**
     * Get keys by pattern
     */
    async getKeys(pattern) {
        try {
            const fullPattern = this.getFullKey(pattern);
            // Get from memory cache
            const memoryKeys = Array.from(this.cache.keys())
                .filter((key) => this.matchPattern(key, fullPattern))
                .map((key) => key.replace(`${this.config.namespace}:`, ''));
            // Get from Redis cache
            let redisKeys = [];
            if (this.redisClient && typeof this.redisClient === 'object' && this.redisClient !== null) {
                const redisKeysMethod = this.redisClient.keys;
                if (typeof redisKeysMethod === 'function') {
                    const keys = await redisKeysMethod(fullPattern);
                    redisKeys = keys.map((key) => key.replace(`${this.config.namespace}:`, ''));
                }
            }
            // Combine and deduplicate
            const allKeys = [...new Set([...memoryKeys, ...redisKeys])];
            return allKeys;
        }
        catch (error) {
            logger.error('Cache getKeys error', { pattern, error });
            return [];
        }
    }
    /**
     * Delete keys by pattern
     */
    async deleteByPattern(pattern) {
        const keys = await this.getKeys(pattern);
        return this.deleteMany(keys);
    }
    /**
     * Get cache statistics
     */
    getMetrics() {
        const totalRequests = this.metrics.hits + this.metrics.misses;
        const hitRate = totalRequests > 0 ? (this.metrics.hits / totalRequests) * 100 : 0;
        const averageResponseTime = this.responseTimes.length > 0
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
    async warmUp(data) {
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
    async invalidateByTags(tags) {
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
    async setMemory(key, value, ttl) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + ttl * 1000);
        const serializedValue = this.serialize(value);
        const size = this.getSize(serializedValue);
        // Check if we need to evict items
        if (this.cache.size >= this.config.maxSize) {
            this.evictLRU();
        }
        const item = {
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
    evictLRU() {
        // Find least recently used item (lowest hits)
        let lruKey = null;
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
    isExpired(item) {
        return new Date() > item.expiresAt;
    }
    getFullKey(key) {
        return `${this.config.namespace}:${key}`;
    }
    serialize(value) {
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
    deserialize(value) {
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
    getSize(value) {
        return Buffer.byteLength(value, 'utf8');
    }
    getTotalSize() {
        let total = 0;
        for (const item of this.cache.values()) {
            total += item.size;
        }
        return total;
    }
    recordHit(responseTime) {
        this.metrics.hits++;
        this.recordResponseTime(responseTime);
    }
    recordMiss(responseTime) {
        this.metrics.misses++;
        this.recordResponseTime(responseTime);
    }
    recordResponseTime(responseTime) {
        this.responseTimes.push(responseTime);
        if (this.responseTimes.length > 1000) {
            this.responseTimes = this.responseTimes.slice(-500); // Keep last 500
        }
    }
    resetMetrics() {
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
    matchPattern(key, pattern) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(key);
    }
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
    startCleanupInterval() {
        // Clean up expired items every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpired();
        }, 5 * 60 * 1000);
    }
    cleanupExpired() {
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
    shutdown() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.cache.clear();
        this.emit('shutdown');
    }
}
exports.CacheManager = CacheManager;
// =================== CACHE STRATEGIES ===================
exports.cacheStrategies = {
    /**
     * Cache everything strategy
     */
    cacheAll: {
        name: 'cache-all',
        shouldCache: () => true,
        getTTL: (_key, _value) => 3600, // 1 hour
        getKey: (originalKey) => originalKey,
    },
    /**
     * Cache only successful results
     */
    cacheSuccess: {
        name: 'cache-success',
        shouldCache: (_key, value) => {
            return value !== null && value !== undefined && value.error === undefined;
        },
        getTTL: (_key, _value) => 1800, // 30 minutes
        getKey: (originalKey) => originalKey,
    },
    /**
     * Cache with user context
     */
    cacheByUser: {
        name: 'cache-by-user',
        shouldCache: () => true,
        getTTL: (_key, _value) => 900, // 15 minutes
        getKey: (originalKey, context) => {
            const userId = context?.userId || 'anonymous';
            return `user:${userId}:${originalKey}`;
        },
    },
    /**
     * Cache expensive operations longer
     */
    cacheExpensive: {
        name: 'cache-expensive',
        shouldCache: (_key, value) => {
            // Cache if value is complex or large
            return typeof value === 'object' && JSON.stringify(value).length > 1000;
        },
        getTTL: (_key, _value) => 7200, // 2 hours
        getKey: (originalKey) => `expensive:${originalKey}`,
    },
};
// =================== CACHE DECORATORS ===================
/**
 * Cache method decorator
 */
function Cacheable(options) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        const cacheManager = new CacheManager({
            defaultTTL: options.ttl || 3600,
            maxSize: 1000,
            enableMetrics: true,
            compression: false,
            serialization: 'json',
            namespace: 'method-cache',
        });
        descriptor.value = async function (...args) {
            const cacheKey = options.key || `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;
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
function createCacheManager(config, redisClient) {
    const defaultConfig = {
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
function generateCacheKey(parts) {
    return parts.join(':');
}
/**
 * Cache warming utility
 */
async function warmCache(cacheManager, dataLoader) {
    const data = await dataLoader();
    await cacheManager.warmUp(data);
}
exports.default = {
    CacheManager,
    createCacheManager,
    cacheStrategies: exports.cacheStrategies,
    Cacheable,
    generateCacheKey,
    warmCache,
};
//# sourceMappingURL=cache-manager.js.map