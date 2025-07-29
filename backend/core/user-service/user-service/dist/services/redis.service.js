"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
class RedisService {
    client;
    constructor() {
        this.client = new ioredis_1.default({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || '0'),
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3,
        });
        this.client.on('error', (error) => {
            logger_1.logger.error('Redis connection error:', error);
        });
        this.client.on('connect', () => {
            logger_1.logger.info('Connected to Redis');
        });
    }
    async setRefreshToken(userId, token) {
        try {
            const key = `refresh_token:${userId}`;
            await this.client.setex(key, 7 * 24 * 60 * 60, token);
            logger_1.logger.debug(`Refresh token stored for user: ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Error setting refresh token:', error);
            throw error;
        }
    }
    async getRefreshToken(userId) {
        try {
            const key = `refresh_token:${userId}`;
            const token = await this.client.get(key);
            return token;
        }
        catch (error) {
            logger_1.logger.error('Error getting refresh token:', error);
            throw error;
        }
    }
    async removeRefreshToken(userId) {
        try {
            const key = `refresh_token:${userId}`;
            await this.client.del(key);
            logger_1.logger.debug(`Refresh token removed for user: ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Error removing refresh token:', error);
            throw error;
        }
    }
    async invalidateUserTokens(userId) {
        try {
            const pattern = `refresh_token:${userId}`;
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
                logger_1.logger.debug(`All tokens invalidated for user: ${userId}`);
            }
        }
        catch (error) {
            logger_1.logger.error('Error invalidating user tokens:', error);
            throw error;
        }
    }
    async setUserSession(sessionId, userData) {
        try {
            const key = `session:${sessionId}`;
            await this.client.setex(key, 24 * 60 * 60, JSON.stringify(userData));
            logger_1.logger.debug(`User session stored: ${sessionId}`);
        }
        catch (error) {
            logger_1.logger.error('Error setting user session:', error);
            throw error;
        }
    }
    async getUserSession(sessionId) {
        try {
            const key = `session:${sessionId}`;
            const sessionData = await this.client.get(key);
            return sessionData ? JSON.parse(sessionData) : null;
        }
        catch (error) {
            logger_1.logger.error('Error getting user session:', error);
            throw error;
        }
    }
    async removeUserSession(sessionId) {
        try {
            const key = `session:${sessionId}`;
            await this.client.del(key);
            logger_1.logger.debug(`User session removed: ${sessionId}`);
        }
        catch (error) {
            logger_1.logger.error('Error removing user session:', error);
            throw error;
        }
    }
    async setRateLimit(key, limit, window) {
        try {
            await this.client.setex(key, window, limit.toString());
            logger_1.logger.debug(`Rate limit set: ${key}`);
        }
        catch (error) {
            logger_1.logger.error('Error setting rate limit:', error);
            throw error;
        }
    }
    async getRateLimit(key) {
        try {
            const value = await this.client.get(key);
            return value ? parseInt(value) : 0;
        }
        catch (error) {
            logger_1.logger.error('Error getting rate limit:', error);
            throw error;
        }
    }
    async decrementRateLimit(key) {
        try {
            const result = await this.client.decr(key);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error decrementing rate limit:', error);
            throw error;
        }
    }
    async setCache(key, data, ttl = 3600) {
        try {
            await this.client.setex(key, ttl, JSON.stringify(data));
            logger_1.logger.debug(`Cache set: ${key}`);
        }
        catch (error) {
            logger_1.logger.error('Error setting cache:', error);
            throw error;
        }
    }
    async getCache(key) {
        try {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            logger_1.logger.error('Error getting cache:', error);
            throw error;
        }
    }
    async removeCache(key) {
        try {
            await this.client.del(key);
            logger_1.logger.debug(`Cache removed: ${key}`);
        }
        catch (error) {
            logger_1.logger.error('Error removing cache:', error);
            throw error;
        }
    }
    async clearCacheByPattern(pattern) {
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
                logger_1.logger.debug(`Cache cleared for pattern: ${pattern}`);
            }
        }
        catch (error) {
            logger_1.logger.error('Error clearing cache by pattern:', error);
            throw error;
        }
    }
    async setUserPreferences(userId, preferences) {
        try {
            const key = `user_preferences:${userId}`;
            await this.client.setex(key, 30 * 24 * 60 * 60, JSON.stringify(preferences));
            logger_1.logger.debug(`User preferences stored: ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Error setting user preferences:', error);
            throw error;
        }
    }
    async getUserPreferences(userId) {
        try {
            const key = `user_preferences:${userId}`;
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            logger_1.logger.error('Error getting user preferences:', error);
            throw error;
        }
    }
    async setTempData(key, data, ttl = 300) {
        try {
            await this.client.setex(key, ttl, JSON.stringify(data));
            logger_1.logger.debug(`Temporary data stored: ${key}`);
        }
        catch (error) {
            logger_1.logger.error('Error setting temporary data:', error);
            throw error;
        }
    }
    async getTempData(key) {
        try {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            logger_1.logger.error('Error getting temporary data:', error);
            throw error;
        }
    }
    async getStats() {
        try {
            const info = await this.client.info();
            const stats = {};
            info.split('\r\n').forEach((line) => {
                const [key, value] = line.split(':');
                if (key && value) {
                    stats[key] = value;
                }
            });
            return stats;
        }
        catch (error) {
            logger_1.logger.error('Error getting Redis stats:', error);
            throw error;
        }
    }
    async healthCheck() {
        try {
            await this.client.ping();
            return true;
        }
        catch (error) {
            logger_1.logger.error('Redis health check failed:', error);
            return false;
        }
    }
    async disconnect() {
        try {
            await this.client.quit();
            logger_1.logger.info('Redis connection closed');
        }
        catch (error) {
            logger_1.logger.error('Error closing Redis connection:', error);
            throw error;
        }
    }
}
exports.RedisService = RedisService;
//# sourceMappingURL=redis.service.js.map