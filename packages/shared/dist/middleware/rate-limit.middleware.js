"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTrustedIPBypass = exports.createDynamicRateLimit = exports.rateLimitMiddlewares = exports.rateLimitConfigs = exports.createRateLimit = exports.MemoryRateLimitStore = exports.RedisRateLimitStore = void 0;
const tslib_1 = require("tslib");
const ioredis_1 = tslib_1.__importDefault(require("ioredis"));
const AppError_1 = require("../errors/AppError");
const logger_1 = require("../logging/logger");
// Redis-based rate limit store
class RedisRateLimitStore {
    redis;
    prefix;
    constructor(redisInstance, prefix = 'rl:') {
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
    async increment(key, windowMs) {
        const redisKey = `${this.prefix}${key}`;
        const multi = this.redis.multi();
        multi.incr(redisKey);
        multi.expire(redisKey, Math.ceil(windowMs / 1000));
        multi.ttl(redisKey);
        const results = await multi.exec();
        if (!results) {
            throw new Error('Redis transaction failed');
        }
        const totalHits = results[0][1];
        const timeToExpire = results[2][1] * 1000; // Convert to milliseconds
        return { totalHits, timeToExpire };
    }
    async decrement(key) {
        const redisKey = `${this.prefix}${key}`;
        await this.redis.decr(redisKey);
    }
    async resetKey(key) {
        const redisKey = `${this.prefix}${key}`;
        await this.redis.del(redisKey);
    }
}
exports.RedisRateLimitStore = RedisRateLimitStore;
// Memory-based rate limit store (for development/testing)
class MemoryRateLimitStore {
    store = new Map();
    async increment(key, windowMs) {
        const now = Date.now();
        const record = this.store.get(key);
        if (!record || now > record.resetTime) {
            const newRecord = { count: 1, resetTime: now + windowMs };
            this.store.set(key, newRecord);
            return { totalHits: 1, timeToExpire: windowMs };
        }
        record.count++;
        this.store.set(key, record);
        return {
            totalHits: record.count,
            timeToExpire: record.resetTime - now,
        };
    }
    async decrement(key) {
        const record = this.store.get(key);
        if (record && record.count > 0) {
            record.count--;
            this.store.set(key, record);
        }
    }
    async resetKey(key) {
        this.store.delete(key);
    }
    // Cleanup expired entries
    cleanup() {
        const now = Date.now();
        for (const [key, record] of this.store.entries()) {
            if (now > record.resetTime) {
                this.store.delete(key);
            }
        }
    }
}
exports.MemoryRateLimitStore = MemoryRateLimitStore;
// Default key generator
const defaultKeyGenerator = (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
};
// Rate limit middleware factory
const createRateLimit = (config) => {
    const { windowMs, maxRequests, keyGenerator = defaultKeyGenerator, skipSuccessfulRequests = false, skipFailedRequests = false, message = 'Too many requests, please try again later', headers = true, standardHeaders = true, legacyHeaders = false, store = new RedisRateLimitStore(), } = config;
    return async (req, res, next) => {
        try {
            const key = keyGenerator(req);
            // Check if we should skip this request
            if (skipSuccessfulRequests && res.statusCode < 400) {
                return next();
            }
            if (skipFailedRequests && res.statusCode >= 400) {
                return next();
            }
            const { totalHits, timeToExpire } = await store.increment(key, windowMs);
            // Add headers if enabled
            if (headers) {
                if (standardHeaders) {
                    res.set('RateLimit-Limit', maxRequests.toString());
                    res.set('RateLimit-Remaining', Math.max(0, maxRequests - totalHits).toString());
                    res.set('RateLimit-Reset', new Date(Date.now() + timeToExpire).toISOString());
                }
                if (legacyHeaders) {
                    res.set('X-RateLimit-Limit', maxRequests.toString());
                    res.set('X-RateLimit-Remaining', Math.max(0, maxRequests - totalHits).toString());
                    res.set('X-RateLimit-Reset', Math.ceil((Date.now() + timeToExpire) / 1000).toString());
                }
            }
            // Check if limit exceeded
            if (totalHits > maxRequests) {
                logger_1.logger.warn('Rate limit exceeded', {
                    key,
                    totalHits,
                    maxRequests,
                    windowMs,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    url: req.url,
                    method: req.method,
                    userId: req.user?.userId,
                });
                // Add retry-after header
                res.set('Retry-After', Math.ceil(timeToExpire / 1000).toString());
                throw new AppError_1.RateLimitError(message, {
                    limit: maxRequests,
                    current: totalHits,
                    retryAfter: Math.ceil(timeToExpire / 1000),
                });
            }
            logger_1.logger.debug('Rate limit check passed', {
                key,
                totalHits,
                maxRequests,
                remaining: maxRequests - totalHits,
            });
            next();
        }
        catch (error) {
            if (error instanceof AppError_1.RateLimitError) {
                return res.status(error.statusCode).json(error.toJSON());
            }
            logger_1.logger.error('Rate limit middleware error', error);
            // If rate limiting fails, we should not block the request
            // unless it's a critical error
            next();
        }
    };
};
exports.createRateLimit = createRateLimit;
// Predefined rate limit configurations
exports.rateLimitConfigs = {
    // General API rate limit
    general: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100,
        message: 'Too many requests from this IP, please try again later',
    },
    // Strict rate limit for authentication endpoints
    auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5,
        message: 'Too many authentication attempts, please try again later',
        keyGenerator: (req) => `auth:${req.ip}:${req.body?.email || 'unknown'}`,
    },
    // Password reset rate limit
    passwordReset: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 3,
        message: 'Too many password reset attempts, please try again later',
        keyGenerator: (req) => `pwd-reset:${req.ip}:${req.body?.email || 'unknown'}`,
    },
    // Registration rate limit
    registration: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 3,
        message: 'Too many registration attempts, please try again later',
        keyGenerator: (req) => `register:${req.ip}`,
    },
    // API key rate limit (higher limit for authenticated users)
    apiKey: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 1000,
        message: 'API rate limit exceeded',
        keyGenerator: (req) => `api:${req.user?.userId || req.ip}`,
    },
    // File upload rate limit
    fileUpload: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 20,
        message: 'Too many file uploads, please try again later',
        keyGenerator: (req) => `upload:${req.user?.userId || req.ip}`,
    },
    // Search rate limit
    search: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 30,
        message: 'Too many search requests, please slow down',
        keyGenerator: (req) => `search:${req.user?.userId || req.ip}`,
    },
    // Payment rate limit
    payment: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 10,
        message: 'Too many payment attempts, please try again later',
        keyGenerator: (req) => `payment:${req.user?.userId || req.ip}`,
    },
    // Admin endpoints rate limit
    admin: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 200,
        message: 'Admin rate limit exceeded',
        keyGenerator: (req) => `admin:${req.user?.userId || req.ip}`,
    },
};
// Pre-configured rate limit middlewares
exports.rateLimitMiddlewares = {
    general: (0, exports.createRateLimit)(exports.rateLimitConfigs.general),
    auth: (0, exports.createRateLimit)(exports.rateLimitConfigs.auth),
    passwordReset: (0, exports.createRateLimit)(exports.rateLimitConfigs.passwordReset),
    registration: (0, exports.createRateLimit)(exports.rateLimitConfigs.registration),
    apiKey: (0, exports.createRateLimit)(exports.rateLimitConfigs.apiKey),
    fileUpload: (0, exports.createRateLimit)(exports.rateLimitConfigs.fileUpload),
    search: (0, exports.createRateLimit)(exports.rateLimitConfigs.search),
    payment: (0, exports.createRateLimit)(exports.rateLimitConfigs.payment),
    admin: (0, exports.createRateLimit)(exports.rateLimitConfigs.admin),
};
// Dynamic rate limit based on user role
const createDynamicRateLimit = (configs) => {
    const middlewares = Object.entries(configs).reduce((acc, [role, config]) => {
        acc[role] = (0, exports.createRateLimit)(config);
        return acc;
    }, {});
    return (req, res, next) => {
        const userRole = req.user?.role || 'guest';
        const middleware = middlewares[userRole] || middlewares.guest;
        if (!middleware) {
            logger_1.logger.warn('No rate limit configuration for role', { role: userRole });
            return next();
        }
        return middleware(req, res, next);
    };
};
exports.createDynamicRateLimit = createDynamicRateLimit;
// Rate limit bypass for trusted IPs
const createTrustedIPBypass = (trustedIPs) => {
    return (req, res, next) => {
        const clientIP = req.ip || req.connection.remoteAddress;
        if (clientIP && trustedIPs.includes(clientIP)) {
            logger_1.logger.debug('Rate limit bypassed for trusted IP', { ip: clientIP });
            return next();
        }
        next();
    };
};
exports.createTrustedIPBypass = createTrustedIPBypass;
// Export default rate limit middleware
exports.default = exports.createRateLimit;
//# sourceMappingURL=rate-limit.middleware.js.map