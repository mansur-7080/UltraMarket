"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheManager = exports.createCacheManager = exports.CacheTTL = exports.CacheKeyGenerator = exports.CacheManager = exports.MemoryCacheStore = exports.RedisCacheStore = void 0;
const tslib_1 = require("tslib");
const ioredis_1 = tslib_1.__importDefault(require("ioredis"));
const logger_1 = require("../logging/logger");
const AppError_1 = require("../errors/AppError");
// Redis cache store implementation
class RedisCacheStore {
    redis;
    prefix;
    constructor(redisInstance, prefix = 'cache:') {
        this.redis =
            redisInstance ||
                new ioredis_1.default({
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379'),
                    password: process.env.REDIS_PASSWORD,
                    maxRetriesPerRequest: 3,
                    lazyConnect: true,
                });
        this.prefix = prefix;
    }
    getKey(key) {
        return `${this.prefix}${key}`;
    }
    async get(key) {
        try {
            const redisKey = this.getKey(key);
            const value = await this.redis.get(redisKey);
            if (value === null) {
                return null;
            }
            return JSON.parse(value);
        }
        catch (error) {
            logger_1.logger.error('Redis cache get error', {
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return null;
        }
    }
    async set(key, value, ttl) {
        try {
            const redisKey = this.getKey(key);
            const serializedValue = JSON.stringify(value);
            if (ttl && ttl > 0) {
                await this.redis.setex(redisKey, ttl, serializedValue);
            }
            else {
                await this.redis.set(redisKey, serializedValue);
            }
        }
        catch (error) {
            logger_1.logger.error('Redis cache set error', {
                key,
                ttl,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw new AppError_1.AppError('Cache set operation failed', 500, true, 'CACHE_SET_ERROR');
        }
    }
    async del(key) {
        try {
            const redisKey = this.getKey(key);
            await this.redis.del(redisKey);
        }
        catch (error) {
            logger_1.logger.error('Redis cache delete error', {
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async clear(pattern) {
        try {
            const searchPattern = pattern ? this.getKey(pattern) : `${this.prefix}*`;
            const keys = await this.redis.keys(searchPattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        }
        catch (error) {
            logger_1.logger.error('Redis cache clear error', {
                pattern,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async exists(key) {
        try {
            const redisKey = this.getKey(key);
            const result = await this.redis.exists(redisKey);
            return result === 1;
        }
        catch (error) {
            logger_1.logger.error('Redis cache exists error', {
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }
    async ttl(key) {
        try {
            const redisKey = this.getKey(key);
            return await this.redis.ttl(redisKey);
        }
        catch (error) {
            logger_1.logger.error('Redis cache TTL error', {
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return -1;
        }
    }
}
exports.RedisCacheStore = RedisCacheStore;
// Memory cache store implementation
class MemoryCacheStore {
    cache = new Map();
    prefix;
    cleanupInterval;
    constructor(prefix = 'cache:', cleanupIntervalMs = 60000) {
        this.prefix = prefix;
        // Cleanup expired entries every minute
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, cleanupIntervalMs);
    }
    getKey(key) {
        return `${this.prefix}${key}`;
    }
    cleanup() {
        const now = Date.now();
        let cleanedCount = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (entry.expires > 0 && entry.expires < now) {
                this.cache.delete(key);
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            logger_1.logger.debug('Memory cache cleanup completed', {
                cleanedEntries: cleanedCount,
                remainingEntries: this.cache.size,
            });
        }
    }
    async get(key) {
        const cacheKey = this.getKey(key);
        const entry = this.cache.get(cacheKey);
        if (!entry) {
            return null;
        }
        // Check if expired
        if (entry.expires > 0 && entry.expires < Date.now()) {
            this.cache.delete(cacheKey);
            return null;
        }
        return entry.value;
    }
    async set(key, value, ttl) {
        const cacheKey = this.getKey(key);
        const expires = ttl && ttl > 0 ? Date.now() + ttl * 1000 : 0;
        this.cache.set(cacheKey, { value, expires });
    }
    async del(key) {
        const cacheKey = this.getKey(key);
        this.cache.delete(cacheKey);
    }
    async clear(pattern) {
        if (!pattern) {
            this.cache.clear();
            return;
        }
        const searchPattern = this.getKey(pattern);
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (key.includes(searchPattern)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach((key) => this.cache.delete(key));
    }
    async exists(key) {
        const cacheKey = this.getKey(key);
        const entry = this.cache.get(cacheKey);
        if (!entry) {
            return false;
        }
        // Check if expired
        if (entry.expires > 0 && entry.expires < Date.now()) {
            this.cache.delete(cacheKey);
            return false;
        }
        return true;
    }
    async ttl(key) {
        const cacheKey = this.getKey(key);
        const entry = this.cache.get(cacheKey);
        if (!entry) {
            return -2; // Key does not exist
        }
        if (entry.expires === 0) {
            return -1; // Key exists but has no expiration
        }
        const remaining = Math.floor((entry.expires - Date.now()) / 1000);
        return remaining > 0 ? remaining : -2;
    }
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.cache.clear();
    }
}
exports.MemoryCacheStore = MemoryCacheStore;
// Cache manager with multiple layers
class CacheManager {
    stores = new Map();
    defaultStore;
    hitCount = 0;
    missCount = 0;
    constructor(defaultStore = 'redis') {
        this.defaultStore = defaultStore;
    }
    /**
     * Add cache store
     */
    addStore(name, store) {
        this.stores.set(name, store);
    }
    /**
     * Get cache store
     */
    getStore(name) {
        const storeName = name || this.defaultStore;
        const store = this.stores.get(storeName);
        if (!store) {
            throw new AppError_1.AppError(`Cache store '${storeName}' not found`, 500, true, 'CACHE_STORE_NOT_FOUND');
        }
        return store;
    }
    /**
     * Get value from cache with fallback
     */
    async get(key, fallbackFn, options) {
        const store = this.getStore(options?.store);
        try {
            const cachedValue = await store.get(key);
            if (cachedValue !== null) {
                this.hitCount++;
                logger_1.logger.debug('Cache hit', { key, store: options?.store || this.defaultStore });
                return cachedValue;
            }
            this.missCount++;
            logger_1.logger.debug('Cache miss', { key, store: options?.store || this.defaultStore });
            // If fallback function provided, execute it and cache the result
            if (fallbackFn) {
                const value = await fallbackFn();
                if (value !== null && value !== undefined) {
                    await this.set(key, value, options?.ttl, options?.store);
                }
                return value;
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Cache get operation failed', {
                key,
                store: options?.store || this.defaultStore,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            // If cache fails, try fallback
            if (fallbackFn) {
                return await fallbackFn();
            }
            return null;
        }
    }
    /**
     * Set value in cache
     */
    async set(key, value, ttl, storeName) {
        const store = this.getStore(storeName);
        await store.set(key, value, ttl);
        logger_1.logger.debug('Cache set', {
            key,
            ttl,
            store: storeName || this.defaultStore,
        });
    }
    /**
     * Delete value from cache
     */
    async del(key, storeName) {
        const store = this.getStore(storeName);
        await store.del(key);
        logger_1.logger.debug('Cache delete', {
            key,
            store: storeName || this.defaultStore,
        });
    }
    /**
     * Clear cache
     */
    async clear(pattern, storeName) {
        const store = this.getStore(storeName);
        await store.clear(pattern);
        logger_1.logger.info('Cache cleared', {
            pattern,
            store: storeName || this.defaultStore,
        });
    }
    /**
     * Check if key exists
     */
    async exists(key, storeName) {
        const store = this.getStore(storeName);
        return await store.exists(key);
    }
    /**
     * Get TTL for key
     */
    async ttl(key, storeName) {
        const store = this.getStore(storeName);
        return await store.ttl(key);
    }
    /**
     * Wrap function with caching
     */
    wrap(key, fn, options) {
        return this.get(key, fn, options);
    }
    /**
     * Get cache statistics
     */
    getStats() {
        const totalRequests = this.hitCount + this.missCount;
        return {
            hitRate: totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0,
            missRate: totalRequests > 0 ? (this.missCount / totalRequests) * 100 : 0,
            totalRequests,
            hitCount: this.hitCount,
            missCount: this.missCount,
        };
    }
    /**
     * Reset statistics
     */
    resetStats() {
        this.hitCount = 0;
        this.missCount = 0;
    }
}
exports.CacheManager = CacheManager;
// Cache key generators
class CacheKeyGenerator {
    /**
     * Generate user-specific cache key
     */
    static user(userId, suffix) {
        return suffix ? `user:${userId}:${suffix}` : `user:${userId}`;
    }
    /**
     * Generate product cache key
     */
    static product(productId, suffix) {
        return suffix ? `product:${productId}:${suffix}` : `product:${productId}`;
    }
    /**
     * Generate category cache key
     */
    static category(categoryId, suffix) {
        return suffix ? `category:${categoryId}:${suffix}` : `category:${categoryId}`;
    }
    /**
     * Generate search cache key
     */
    static search(query, filters) {
        const crypto = require('crypto');
        const searchData = { query, filters };
        const hash = crypto.createHash('md5').update(JSON.stringify(searchData)).digest('hex');
        return `search:${hash}`;
    }
    /**
     * Generate cart cache key
     */
    static cart(userId) {
        return `cart:${userId}`;
    }
    /**
     * Generate session cache key
     */
    static session(sessionId) {
        return `session:${sessionId}`;
    }
    /**
     * Generate API response cache key
     */
    static apiResponse(endpoint, params) {
        const crypto = require('crypto');
        const cacheData = { endpoint, params };
        const hash = crypto.createHash('md5').update(JSON.stringify(cacheData)).digest('hex');
        return `api:${hash}`;
    }
}
exports.CacheKeyGenerator = CacheKeyGenerator;
// Cache TTL constants
exports.CacheTTL = {
    // Very short (1 minute)
    VERY_SHORT: 60,
    // Short (5 minutes)
    SHORT: 5 * 60,
    // Medium (1 hour)
    MEDIUM: 60 * 60,
    // Long (6 hours)
    LONG: 6 * 60 * 60,
    // Very long (24 hours)
    VERY_LONG: 24 * 60 * 60,
    // Specific use cases
    USER_SESSION: 30 * 60, // 30 minutes
    CART_ITEMS: 24 * 60 * 60, // 24 hours
    PRODUCT_DETAILS: 60 * 60, // 1 hour
    CATEGORY_LIST: 6 * 60 * 60, // 6 hours
    SEARCH_RESULTS: 15 * 60, // 15 minutes
    API_RESPONSE: 5 * 60, // 5 minutes
    STATIC_CONTENT: 7 * 24 * 60 * 60, // 7 days
};
// Create default cache manager instance
const createCacheManager = () => {
    const cacheManager = new CacheManager('redis');
    // Add Redis store
    const redisStore = new RedisCacheStore(undefined, 'ultramarket:');
    cacheManager.addStore('redis', redisStore);
    // Add Memory store as fallback
    const memoryStore = new MemoryCacheStore('ultramarket:', 60000);
    cacheManager.addStore('memory', memoryStore);
    return cacheManager;
};
exports.createCacheManager = createCacheManager;
// Export default cache manager instance
exports.cacheManager = (0, exports.createCacheManager)();
exports.default = exports.cacheManager;
//# sourceMappingURL=cache-manager.js.map