"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedCache = exports.CacheKeys = exports.CacheTTL = exports.CacheStrategy = void 0;
exports.CacheQuery = CacheQuery;
exports.initializeCache = initializeCache;
exports.getCache = getCache;
exports.cacheMiddleware = cacheMiddleware;
const tslib_1 = require("tslib");
const ioredis_1 = tslib_1.__importDefault(require("ioredis"));
const logger_1 = require("../logger");
// Cache strategy types
var CacheStrategy;
(function (CacheStrategy) {
    CacheStrategy["CACHE_ASIDE"] = "cache-aside";
    CacheStrategy["WRITE_THROUGH"] = "write-through";
    CacheStrategy["WRITE_BEHIND"] = "write-behind";
    CacheStrategy["REFRESH_AHEAD"] = "refresh-ahead";
})(CacheStrategy || (exports.CacheStrategy = CacheStrategy = {}));
// Cache TTL presets (in seconds)
exports.CacheTTL = {
    VERY_SHORT: 60, // 1 minute
    SHORT: 300, // 5 minutes
    MEDIUM: 1800, // 30 minutes
    LONG: 3600, // 1 hour
    VERY_LONG: 86400, // 24 hours
    PERMANENT: -1, // No expiration
};
// Cache key patterns
exports.CacheKeys = {
    USER_PROFILE: (userId) => `user:profile:${userId}`,
    USER_SESSIONS: (userId) => `user:sessions:${userId}`,
    PRODUCT_DETAILS: (productId) => `product:details:${productId}`,
    PRODUCT_LIST: (page, limit, filters) => `product:list:${page}:${limit}${filters ? `:${filters}` : ''}`,
    CATEGORY_TREE: () => 'category:tree',
    CART: (userId) => `cart:${userId}`,
    SEARCH_RESULTS: (query, filters) => `search:${query}${filters ? `:${filters}` : ''}`,
    API_RATE_LIMIT: (ip, endpoint) => `rate:${ip}:${endpoint}`,
    SESSION_TOKEN: (tokenId) => `session:${tokenId}`,
    POPULAR_PRODUCTS: () => 'products:popular',
    FEATURED_PRODUCTS: () => 'products:featured',
};
// Advanced caching class
class AdvancedCache {
    redis;
    metrics;
    config;
    constructor(config) {
        this.config = config;
        this.redis = new ioredis_1.default({
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
    setupEventHandlers() {
        this.redis.on('connect', () => {
            logger_1.logger.info('Redis connected successfully', {
                host: this.config.host,
                port: this.config.port,
            });
        });
        this.redis.on('error', (error) => {
            logger_1.logger.error('Redis connection error', {
                error: error.message,
                host: this.config.host,
                port: this.config.port,
            });
            this.metrics.errors++;
        });
        this.redis.on('reconnecting', () => {
            logger_1.logger.warn('Redis reconnecting...', {
                host: this.config.host,
                port: this.config.port,
            });
        });
    }
    // Get value from cache with performance tracking
    async get(key) {
        const startTime = Date.now();
        this.metrics.totalRequests++;
        try {
            const value = await this.redis.get(key);
            const responseTime = Date.now() - startTime;
            this.updateAverageResponseTime(responseTime);
            if (value === null) {
                this.metrics.misses++;
                logger_1.logger.debug('Cache miss', { key, responseTime });
                return null;
            }
            this.metrics.hits++;
            logger_1.logger.debug('Cache hit', { key, responseTime });
            return JSON.parse(value);
        }
        catch (error) {
            this.metrics.errors++;
            logger_1.logger.error('Cache get error', {
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return null;
        }
    }
    // Set value in cache with TTL
    async set(key, value, ttl = exports.CacheTTL.MEDIUM) {
        const startTime = Date.now();
        try {
            const serializedValue = JSON.stringify(value);
            if (ttl === exports.CacheTTL.PERMANENT) {
                await this.redis.set(key, serializedValue);
            }
            else {
                await this.redis.setex(key, ttl, serializedValue);
            }
            this.metrics.sets++;
            const responseTime = Date.now() - startTime;
            logger_1.logger.debug('Cache set', { key, ttl, responseTime });
            return true;
        }
        catch (error) {
            this.metrics.errors++;
            logger_1.logger.error('Cache set error', {
                key,
                ttl,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }
    // Delete key from cache
    async delete(key) {
        try {
            const result = await this.redis.del(key);
            this.metrics.deletes++;
            logger_1.logger.debug('Cache delete', { key, deleted: result > 0 });
            return result > 0;
        }
        catch (error) {
            this.metrics.errors++;
            logger_1.logger.error('Cache delete error', {
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }
    // Delete multiple keys by pattern
    async deleteByPattern(pattern) {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length === 0) {
                return 0;
            }
            const result = await this.redis.del(...keys);
            this.metrics.deletes += result;
            logger_1.logger.debug('Cache delete by pattern', { pattern, deleted: result });
            return result;
        }
        catch (error) {
            this.metrics.errors++;
            logger_1.logger.error('Cache delete by pattern error', {
                pattern,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return 0;
        }
    }
    // Cache-aside pattern implementation
    async getOrSet(key, fetchFunction, ttl = exports.CacheTTL.MEDIUM) {
        // Try to get from cache first
        const cached = await this.get(key);
        if (cached !== null) {
            return cached;
        }
        // Fetch from source
        try {
            const value = await fetchFunction();
            // Set in cache for future requests
            await this.set(key, value, ttl);
            return value;
        }
        catch (error) {
            logger_1.logger.error('Cache getOrSet fetch error', {
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    // Get cache metrics
    getMetrics() {
        const hitRate = this.metrics.totalRequests > 0 ? (this.metrics.hits / this.metrics.totalRequests) * 100 : 0;
        return {
            ...this.metrics,
            hitRate: Math.round(hitRate * 100) / 100,
        };
    }
    // Update average response time
    updateAverageResponseTime(responseTime) {
        const totalTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1);
        this.metrics.averageResponseTime = (totalTime + responseTime) / this.metrics.totalRequests;
    }
    // Health check
    async healthCheck() {
        const startTime = Date.now();
        try {
            await this.redis.ping();
            const latency = Date.now() - startTime;
            return {
                status: 'healthy',
                latency,
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                latency: Date.now() - startTime,
            };
        }
    }
    // Close connection
    async close() {
        try {
            await this.redis.quit();
            logger_1.logger.info('Redis connection closed');
        }
        catch (error) {
            logger_1.logger.error('Error closing Redis connection', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
}
exports.AdvancedCache = AdvancedCache;
// Query caching decorator
function CacheQuery(ttl = exports.CacheTTL.MEDIUM) {
    return function (target, propertyName, descriptor) {
        const method = descriptor.value;
        descriptor.value = async function (...args) {
            const cache = this.cache || globalCache;
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
let globalCache;
// Initialize global cache
function initializeCache(config) {
    globalCache = new AdvancedCache(config);
    return globalCache;
}
// Get global cache instance
function getCache() {
    if (!globalCache) {
        throw new Error('Cache not initialized. Call initializeCache() first.');
    }
    return globalCache;
}
// Cache middleware for Express
function cacheMiddleware(ttl = exports.CacheTTL.SHORT) {
    return (req, res, next) => {
        const cache = getCache();
        const cacheKey = `api:${req.method}:${req.originalUrl}`;
        cache
            .get(cacheKey)
            .then((cachedResponse) => {
            if (cachedResponse) {
                logger_1.logger.debug('API cache hit', { cacheKey });
                return res.json(cachedResponse);
            }
            // Store original res.json
            const originalJson = res.json;
            res.json = function (data) {
                // Cache the response
                cache.set(cacheKey, data, ttl);
                logger_1.logger.debug('API response cached', { cacheKey, ttl });
                // Call original res.json
                return originalJson.call(this, data);
            };
            next();
        })
            .catch((error) => {
            logger_1.logger.error('Cache middleware error', { error: error.message });
            next();
        });
    };
}
//# sourceMappingURL=caching.js.map