"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisUtils = exports.getRedisClient = exports.redisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
const redisConfig = {
    host: process.env['REDIS_HOST'] || 'localhost',
    port: parseInt(process.env['REDIS_PORT'] || '6379'),
    password: process.env['REDIS_PASSWORD'],
    db: parseInt(process.env['REDIS_DB'] || '0'),
    connectTimeout: 10000,
    lazyConnect: true,
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
    retryDelayOnClusterDown: 300,
    enableOfflineQueue: false,
    family: 4,
};
exports.redisClient = new ioredis_1.default(redisConfig);
const getRedisClient = () => exports.redisClient;
exports.getRedisClient = getRedisClient;
exports.redisClient.on('connect', () => {
    logger_1.logger.info('✅ Redis connection established', {
        service: 'cart-service',
        component: 'redis',
        status: 'connected',
        host: redisConfig.host,
        port: redisConfig.port,
        db: redisConfig.db,
    });
});
exports.redisClient.on('error', (error) => {
    logger_1.logger.error('❌ Redis connection error', {
        service: 'cart-service',
        component: 'redis',
        error: error.message,
        stack: error.stack,
    });
});
exports.redisClient.on('ready', () => {
    logger_1.logger.info('🔴 Redis ready for operations', {
        service: 'cart-service',
        component: 'redis',
        status: 'ready',
    });
});
exports.redisClient.on('reconnecting', () => {
    logger_1.logger.warn('🔄 Redis reconnecting', {
        service: 'cart-service',
        component: 'redis',
        status: 'reconnecting',
    });
});
exports.redisClient.on('end', () => {
    logger_1.logger.info('🔴 Redis connection ended', {
        service: 'cart-service',
        component: 'redis',
        status: 'disconnected',
    });
});
exports.redisUtils = {
    async ping() {
        try {
            const result = await exports.redisClient.ping();
            return result === 'PONG';
        }
        catch (error) {
            logger_1.logger.error('Redis ping failed:', error);
            return false;
        }
    },
    async getInfo() {
        try {
            const info = await exports.redisClient.info();
            return info;
        }
        catch (error) {
            logger_1.logger.error('Failed to get Redis info:', error);
            return null;
        }
    },
    async getMemoryUsage() {
        try {
            const memory = await exports.redisClient.info('memory');
            return memory;
        }
        catch (error) {
            logger_1.logger.error('Failed to get Redis memory usage:', error);
            return null;
        }
    },
    async flushDb() {
        try {
            await exports.redisClient.flushdb();
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to flush Redis database:', error);
            return false;
        }
    },
    getStatus() {
        return exports.redisClient.status;
    },
    async close() {
        await exports.redisClient.quit();
    },
};
exports.default = exports.redisClient;
//# sourceMappingURL=redis.js.map