"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedCacheService = void 0;
const tslib_1 = require("tslib");
const redis_1 = require("redis");
const lru_cache_1 = tslib_1.__importDefault(require("lru-cache"));
const util_1 = require("util");
const logger_1 = require("./logger");
const zlib = tslib_1.__importStar(require("zlib"));
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
class AdvancedCacheService {
    memoryCache;
    redis;
    isRedisConnected = false;
    compressionThreshold = 1024; // 1KB
    redisHealthy = true;
    failureCount = 0;
    MAX_FAILURES = 5;
    CIRCUIT_RESET_TIMEOUT = 30000; // 30 seconds
    constructor(redisUrl, memoryOptions = { max: 500, ttl: 60 * 1000 }) {
        // Initialize in-memory LRU cache
        this.memoryCache = new lru_cache_1.default({
            max: memoryOptions.max,
            ttl: memoryOptions.ttl,
            updateAgeOnGet: true,
            allowStale: true,
        });
        // Initialize Redis client
        this.redis = (0, redis_1.createClient)({
            url: redisUrl,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        this.redisHealthy = false;
                        logger_1.logger.error('Redis reconnection failed multiple times, marking as unhealthy');
                        return new Error('Redis connection aborted');
                    }
                    const delay = Math.min(retries * 100, 3000);
                    logger_1.logger.warn(`Redis reconnecting in ${delay}ms, attempt ${retries}`);
                    return delay;
                },
            },
        });
        // Set up Redis event listeners
        this.redis.on('connect', () => {
            logger_1.logger.info('Redis connected');
            this.isRedisConnected = true;
            this.redisHealthy = true;
            this.failureCount = 0;
        });
        this.redis.on('error', (err) => {
            logger_1.logger.error('Redis error', { error: err.message });
            this.failureCount++;
            if (this.failureCount >= this.MAX_FAILURES) {
                this.redisHealthy = false;
                logger_1.logger.warn('Redis circuit breaker opened due to multiple failures');
                // Schedule circuit breaker reset
                setTimeout(() => this.resetCircuitBreaker(), this.CIRCUIT_RESET_TIMEOUT);
            }
        });
        this.redis.on('disconnect', () => {
            logger_1.logger.warn('Redis disconnected');
            this.isRedisConnected = false;
        });
        // Connect to Redis
        this.redis.connect().catch((err) => {
            logger_1.logger.error('Failed to connect to Redis', { error: err.message });
            this.isRedisConnected = false;
        });
    }
    /**
     * Reset the circuit breaker and try to reconnect
     */
    async resetCircuitBreaker() {
        logger_1.logger.info('Attempting to reset Redis circuit breaker');
        this.failureCount = 0;
        if (!this.isRedisConnected) {
            try {
                await this.redis.connect();
                this.redisHealthy = true;
                logger_1.logger.info('Redis circuit breaker reset successfully');
            }
            catch (err) {
                logger_1.logger.error('Failed to reset Redis circuit breaker', { error: err.message });
                // Schedule another reset attempt
                setTimeout(() => this.resetCircuitBreaker(), this.CIRCUIT_RESET_TIMEOUT);
            }
        }
        else {
            this.redisHealthy = true;
            logger_1.logger.info('Redis circuit breaker reset successfully');
        }
    }
    /**
     * Get the health status of the cache service
     */
    getHealth() {
        return {
            memory: true, // Memory cache is always available
            redis: this.redisHealthy,
            redisConnected: this.isRedisConnected,
        };
    }
    /**
     * Get metrics for monitoring
     */
    getMetrics() {
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
    async get(key) {
        const startTime = Date.now();
        let source = 'none';
        try {
            // Try memory cache first
            const memoryValue = this.memoryCache.get(key);
            if (memoryValue !== undefined) {
                source = 'memory';
                logger_1.logger.debug(`Cache hit (memory): ${key} in ${Date.now() - startTime}ms`);
                return memoryValue;
            }
            // If Redis is healthy, try to get from Redis
            if (this.isRedisConnected && this.redisHealthy) {
                const redisValue = await this.redis.get(key);
                if (redisValue) {
                    // Parse and decompress if needed
                    const parsed = await this.parseValue(redisValue);
                    // Store in memory cache for faster access next time
                    this.memoryCache.set(key, parsed);
                    source = 'redis';
                    logger_1.logger.debug(`Cache hit (redis): ${key} in ${Date.now() - startTime}ms`);
                    return parsed;
                }
            }
            // Not found in any cache
            return null;
        }
        catch (error) {
            logger_1.logger.error('Error getting from cache', { key, error: error.message, source });
            if (source === 'redis') {
                this.failureCount++;
                if (this.failureCount >= this.MAX_FAILURES) {
                    this.redisHealthy = false;
                    logger_1.logger.warn('Redis circuit breaker opened due to multiple failures');
                    setTimeout(() => this.resetCircuitBreaker(), this.CIRCUIT_RESET_TIMEOUT);
                }
            }
            // Fallback to memory if redis fails
            if (source === 'redis') {
                const memoryValue = this.memoryCache.get(key);
                if (memoryValue !== undefined) {
                    logger_1.logger.debug(`Cache fallback to memory: ${key}`);
                    return memoryValue;
                }
            }
            return null;
        }
    }
    /**
     * Set value in both memory and Redis caches
     */
    async set(key, value, ttl = 3600, tags = [], options = {}) {
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
                logger_1.logger.debug(`Cache set: ${key} in ${Date.now() - startTime}ms (${tags.length} tags)`);
            }
            else {
                logger_1.logger.debug(`Cache set (memory only): ${key} in ${Date.now() - startTime}ms`);
            }
        }
        catch (error) {
            logger_1.logger.error('Error setting cache', { key, error: error.message });
            this.failureCount++;
            if (this.failureCount >= this.MAX_FAILURES) {
                this.redisHealthy = false;
                logger_1.logger.warn('Redis circuit breaker opened due to multiple failures');
                setTimeout(() => this.resetCircuitBreaker(), this.CIRCUIT_RESET_TIMEOUT);
            }
        }
    }
    /**
     * Delete a key from both memory and Redis caches
     */
    async del(key) {
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
                logger_1.logger.debug(`Cache delete: ${key}`);
            }
        }
        catch (error) {
            logger_1.logger.error('Error deleting from cache', { key, error: error.message });
        }
    }
    /**
     * Invalidate all keys associated with the given tags
     */
    async invalidateByTags(tags) {
        try {
            if (this.isRedisConnected && this.redisHealthy && tags.length > 0) {
                // For each tag, get all keys associated with it
                for (const tag of tags) {
                    const keys = await this.redis.sMembers(`tag:${tag}`);
                    // Delete each key
                    for (const key of keys) {
                        await this.del(key);
                    }
                    logger_1.logger.debug(`Cache tag invalidation: ${tag} (${keys.length} keys)`);
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Error invalidating cache by tags', { tags, error: error.message });
        }
    }
    /**
     * Delete keys matching a pattern using SCAN for large datasets
     */
    async delByPattern(pattern) {
        try {
            if (this.isRedisConnected && this.redisHealthy) {
                // Use SCAN to find keys matching the pattern
                let cursor = 0;
                let keys = [];
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
                logger_1.logger.debug(`Cache pattern deletion: ${pattern} (${keys.length} keys)`);
            }
        }
        catch (error) {
            logger_1.logger.error('Error deleting from cache by pattern', { pattern, error: error.message });
        }
    }
    /**
     * Clear all cache entries
     */
    async clear() {
        try {
            // Clear memory cache
            this.memoryCache.clear();
            // Clear Redis if connected
            if (this.isRedisConnected && this.redisHealthy) {
                await this.redis.flushDb();
            }
            logger_1.logger.info('Cache cleared');
        }
        catch (error) {
            logger_1.logger.error('Error clearing cache', { error: error.message });
        }
    }
    /**
     * Close connections and clean up resources
     */
    async close() {
        try {
            if (this.isRedisConnected) {
                await this.redis.quit();
                this.isRedisConnected = false;
            }
            this.memoryCache.clear();
            logger_1.logger.info('Cache connections closed');
        }
        catch (error) {
            logger_1.logger.error('Error closing cache connections', { error: error.message });
        }
    }
    /**
     * Prepare a value for storage (JSON stringify + possible compression)
     */
    async prepareValue(value, options = {}) {
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
    async parseValue(value) {
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
    async compressValue(value) {
        const gzip = (0, util_1.promisify)(zlib.gzip);
        const buffer = await gzip(Buffer.from(value));
        return buffer.toString('base64');
    }
    /**
     * Decompress a string value
     */
    async decompressValue(compressed) {
        const gunzip = (0, util_1.promisify)(zlib.gunzip);
        const buffer = await gunzip(Buffer.from(compressed, 'base64'));
        return buffer.toString();
    }
}
exports.AdvancedCacheService = AdvancedCacheService;
exports.default = AdvancedCacheService;
//# sourceMappingURL=advanced-cache.service.js.map