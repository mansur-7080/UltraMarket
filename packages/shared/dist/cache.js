"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = exports.CacheService = void 0;
const tslib_1 = require("tslib");
const ioredis_1 = tslib_1.__importDefault(require("ioredis"));
const logger_1 = require("./logging/logger");
// Default cache configuration
const defaultConfig = {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB ?? '0', 10),
    keyPrefix: process.env.REDIS_KEY_PREFIX ?? 'ultramarket:',
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
    connectTimeout: 10000,
    commandTimeout: 5000,
};
class CacheService {
    redis;
    config;
    stats;
    isConnected = false;
    connectionPromise = null;
    constructor(config = {}) {
        this.config = { ...defaultConfig, ...config };
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0,
            hitRate: 0,
            totalOperations: 0,
            uptime: Date.now(),
        };
        this.redis = new ioredis_1.default({
            host: this.config.host,
            port: this.config.port,
            password: this.config.password,
            db: this.config.db,
            keyPrefix: this.config.keyPrefix,
            maxRetriesPerRequest: this.config.maxRetriesPerRequest,
            lazyConnect: this.config.lazyConnect,
            connectTimeout: this.config.connectTimeout,
        });
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.redis.on('connect', () => {
            this.isConnected = true;
            logger_1.logger.info('Redis connected successfully', {
                host: this.config.host,
                port: this.config.port,
                db: this.config.db,
            });
        });
        this.redis.on('error', (error) => {
            this.isConnected = false;
            this.stats.errors++;
            logger_1.logger.error('Redis connection error', {
                error: error.message,
                stack: error.stack,
                host: this.config.host,
                port: this.config.port,
            });
        });
        this.redis.on('close', () => {
            this.isConnected = false;
            logger_1.logger.warn('Redis connection closed', {
                host: this.config.host,
                port: this.config.port,
            });
        });
        this.redis.on('reconnecting', () => {
            logger_1.logger.info('Redis reconnecting...', {
                host: this.config.host,
                port: this.config.port,
            });
        });
    }
    async connect() {
        if (this.isConnected) {
            return;
        }
        if (this.connectionPromise) {
            return this.connectionPromise;
        }
        this.connectionPromise = this.redis.connect();
        await this.connectionPromise;
        this.connectionPromise = null;
    }
    async disconnect() {
        if (!this.isConnected) {
            return;
        }
        await this.redis.quit();
        this.isConnected = false;
        logger_1.logger.info('Redis disconnected successfully');
    }
    async get(key) {
        try {
            await this.connect();
            const value = await this.redis.get(key);
            if (value === null) {
                this.stats.misses++;
                this.updateStats();
                return null;
            }
            this.stats.hits++;
            this.updateStats();
            try {
                const parsed = JSON.parse(value);
                return parsed.value;
            }
            catch {
                // If parsing fails, return raw value
                return value;
            }
        }
        catch (error) {
            this.stats.errors++;
            this.updateStats();
            logger_1.logger.error('Cache get error', {
                key,
                error: error instanceof Error ? error.message : String(error),
            });
            return null;
        }
    }
    async set(key, value, options = {}) {
        try {
            await this.connect();
            const entry = {
                value,
                timestamp: Date.now(),
                ttl: options.ttl ?? 3600, // Default 1 hour
                tags: options.tags,
                compressed: options.compress ?? false,
            };
            const serialized = JSON.stringify(entry);
            let result;
            if (options.ttl) {
                result = await this.redis.setex(key, options.ttl, serialized);
            }
            else {
                result = await this.redis.set(key, serialized);
            }
            this.stats.sets++;
            this.updateStats();
            return result === 'OK';
        }
        catch (error) {
            this.stats.errors++;
            this.updateStats();
            logger_1.logger.error('Cache set error', {
                key,
                error: error instanceof Error ? error.message : String(error),
            });
            return false;
        }
    }
    async delete(key) {
        try {
            await this.connect();
            const result = await this.redis.del(key);
            this.stats.deletes++;
            this.updateStats();
            return result > 0;
        }
        catch (error) {
            this.stats.errors++;
            this.updateStats();
            logger_1.logger.error('Cache delete error', {
                key,
                error: error instanceof Error ? error.message : String(error),
            });
            return false;
        }
    }
    async exists(key) {
        try {
            await this.connect();
            const result = await this.redis.exists(key);
            return result === 1;
        }
        catch (error) {
            this.stats.errors++;
            logger_1.logger.error('Cache exists error', {
                key,
                error: error instanceof Error ? error.message : String(error),
            });
            return false;
        }
    }
    async expire(key, ttl) {
        try {
            await this.connect();
            const result = await this.redis.expire(key, ttl);
            return result === 1;
        }
        catch (error) {
            this.stats.errors++;
            logger_1.logger.error('Cache expire error', {
                key,
                ttl,
                error: error instanceof Error ? error.message : String(error),
            });
            return false;
        }
    }
    async ttl(key) {
        try {
            await this.connect();
            return await this.redis.ttl(key);
        }
        catch (error) {
            this.stats.errors++;
            logger_1.logger.error('Cache TTL error', {
                key,
                error: error instanceof Error ? error.message : String(error),
            });
            return -1;
        }
    }
    async clear() {
        try {
            await this.connect();
            await this.redis.flushdb();
            logger_1.logger.info('Cache cleared successfully');
            return true;
        }
        catch (error) {
            this.stats.errors++;
            logger_1.logger.error('Cache clear error', {
                error: error instanceof Error ? error.message : String(error),
            });
            return false;
        }
    }
    async mget(keys) {
        try {
            await this.connect();
            const values = await this.redis.mget(...keys);
            return values.map((value) => {
                if (value === null) {
                    this.stats.misses++;
                    return null;
                }
                this.stats.hits++;
                try {
                    const parsed = JSON.parse(value);
                    return parsed.value;
                }
                catch {
                    return value;
                }
            });
        }
        catch (error) {
            this.stats.errors++;
            logger_1.logger.error('Cache mget error', {
                keys,
                error: error instanceof Error ? error.message : String(error),
            });
            return keys.map(() => null);
        }
        finally {
            this.updateStats();
        }
    }
    async mset(entries) {
        try {
            await this.connect();
            const pipeline = this.redis.pipeline();
            for (const entry of entries) {
                const cacheEntry = {
                    value: entry.value,
                    timestamp: Date.now(),
                    ttl: entry.options?.ttl ?? 3600,
                    tags: entry.options?.tags,
                    compressed: entry.options?.compress ?? false,
                };
                const serialized = JSON.stringify(cacheEntry);
                if (entry.options?.ttl) {
                    pipeline.setex(entry.key, entry.options.ttl, serialized);
                }
                else {
                    pipeline.set(entry.key, serialized);
                }
            }
            const results = await pipeline.exec();
            this.stats.sets += entries.length;
            this.updateStats();
            return results?.every((result) => result[1] === 'OK') ?? false;
        }
        catch (error) {
            this.stats.errors++;
            this.updateStats();
            logger_1.logger.error('Cache mset error', {
                entriesCount: entries.length,
                error: error instanceof Error ? error.message : String(error),
            });
            return false;
        }
    }
    async keys(pattern) {
        try {
            await this.connect();
            return await this.redis.keys(pattern);
        }
        catch (error) {
            this.stats.errors++;
            logger_1.logger.error('Cache keys error', {
                pattern,
                error: error instanceof Error ? error.message : String(error),
            });
            return [];
        }
    }
    async deleteByPattern(pattern) {
        try {
            await this.connect();
            const keys = await this.redis.keys(pattern);
            if (keys.length === 0) {
                return 0;
            }
            const result = await this.redis.del(...keys);
            this.stats.deletes += result;
            this.updateStats();
            return result;
        }
        catch (error) {
            this.stats.errors++;
            this.updateStats();
            logger_1.logger.error('Cache deleteByPattern error', {
                pattern,
                error: error instanceof Error ? error.message : String(error),
            });
            return 0;
        }
    }
    async increment(key, amount = 1) {
        try {
            await this.connect();
            return await this.redis.incrby(key, amount);
        }
        catch (error) {
            this.stats.errors++;
            logger_1.logger.error('Cache increment error', {
                key,
                amount,
                error: error instanceof Error ? error.message : String(error),
            });
            return 0;
        }
    }
    async decrement(key, amount = 1) {
        try {
            await this.connect();
            return await this.redis.decrby(key, amount);
        }
        catch (error) {
            this.stats.errors++;
            logger_1.logger.error('Cache decrement error', {
                key,
                amount,
                error: error instanceof Error ? error.message : String(error),
            });
            return 0;
        }
    }
    getStats() {
        return { ...this.stats };
    }
    updateStats() {
        this.stats.totalOperations = this.stats.hits + this.stats.misses;
        this.stats.hitRate =
            this.stats.totalOperations > 0 ? (this.stats.hits / this.stats.totalOperations) * 100 : 0;
    }
    async healthCheck() {
        try {
            await this.connect();
            const start = Date.now();
            await this.redis.ping();
            const responseTime = Date.now() - start;
            return {
                status: 'healthy',
                details: {
                    connected: this.isConnected,
                    responseTime: `${responseTime}ms`,
                    stats: this.getStats(),
                    config: {
                        host: this.config.host,
                        port: this.config.port,
                        db: this.config.db,
                    },
                },
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                details: {
                    connected: this.isConnected,
                    error: error instanceof Error ? error.message : String(error),
                    stats: this.getStats(),
                },
            };
        }
    }
}
exports.CacheService = CacheService;
// Export default instance
exports.cacheService = new CacheService();
// Graceful shutdown
if (typeof process !== 'undefined') {
    process.on('SIGINT', async () => {
        logger_1.logger.info('Shutting down cache service...');
        await exports.cacheService.disconnect();
    });
    process.on('SIGTERM', async () => {
        logger_1.logger.info('Shutting down cache service...');
        await exports.cacheService.disconnect();
    });
}
exports.default = {
    CacheService,
    cacheService: exports.cacheService,
};
//# sourceMappingURL=cache.js.map