"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRateLimitInfo = exports.apiKeyRateLimiter = exports.burstRateLimiter = exports.userRateLimiter = exports.ipRateLimiter = exports.rateLimiter = void 0;
const logger = console;
class RedisService {
    async checkRateLimit(key, limit, window) {
        return {
            allowed: true,
            remaining: limit,
            reset: Date.now() + window * 1000,
        };
    }
    getClient() {
        return {
            get: async (key) => null,
            set: async (key, value) => 'OK',
            del: async (key) => 1,
            ttl: async (key) => -1,
        };
    }
}
class ApiError extends Error {
    statusCode;
    message;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
    }
}
const redisService = new RedisService();
const rateLimiter = (key, limit, window) => {
    return async (req, res, next) => {
        try {
            const rateLimitKey = `rate_limit:${key}:${req.ip}`;
            const rateLimit = await redisService.checkRateLimit(rateLimitKey, limit, window);
            res.set({
                'X-RateLimit-Limit': limit.toString(),
                'X-RateLimit-Remaining': rateLimit.remaining.toString(),
                'X-RateLimit-Reset': rateLimit.reset.toString(),
            });
            if (!rateLimit.allowed) {
                logger.warn('Rate limit exceeded', {
                    key,
                    ip: req.ip,
                    limit,
                    window,
                });
                return res.status(429).json({
                    success: false,
                    message: 'Too many requests. Please try again later.',
                    retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000),
                });
            }
            return next();
        }
        catch (error) {
            logger.error('Rate limiter error', {
                error: error instanceof Error ? error.message : 'Unknown error',
                key,
                ip: req.ip,
            });
            return next();
        }
    };
};
exports.rateLimiter = rateLimiter;
const ipRateLimiter = (limit, window) => {
    return async (req, res, next) => {
        try {
            const rateLimitKey = `rate_limit:ip:${req.ip}`;
            const rateLimit = await redisService.checkRateLimit(rateLimitKey, limit, window);
            res.set({
                'X-RateLimit-Limit': limit.toString(),
                'X-RateLimit-Remaining': rateLimit.remaining.toString(),
                'X-RateLimit-Reset': rateLimit.reset.toString(),
            });
            if (!rateLimit.allowed) {
                logger.warn('IP rate limit exceeded', {
                    ip: req.ip,
                    limit,
                    window,
                });
                return res.status(429).json({
                    success: false,
                    message: 'Too many requests from this IP. Please try again later.',
                    retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000),
                });
            }
            return next();
        }
        catch (error) {
            logger.error('IP rate limiter error', {
                error: error instanceof Error ? error.message : 'Unknown error',
                ip: req.ip,
            });
            return next();
        }
    };
};
exports.ipRateLimiter = ipRateLimiter;
const userRateLimiter = (limit, window) => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required for rate limiting',
                });
            }
            const rateLimitKey = `rate_limit:user:${user.userId}`;
            const rateLimit = await redisService.checkRateLimit(rateLimitKey, limit, window);
            res.set({
                'X-RateLimit-Limit': limit.toString(),
                'X-RateLimit-Remaining': rateLimit.remaining.toString(),
                'X-RateLimit-Reset': rateLimit.reset.toString(),
            });
            if (!rateLimit.allowed) {
                logger.warn('User rate limit exceeded', {
                    userId: user.userId,
                    limit,
                    window,
                });
                return res.status(429).json({
                    success: false,
                    message: 'Too many requests. Please try again later.',
                    retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000),
                });
            }
            return next();
        }
        catch (error) {
            logger.error('User rate limiter error', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId: req.user?.userId,
            });
            return next();
        }
    };
};
exports.userRateLimiter = userRateLimiter;
const burstRateLimiter = (limit, window) => {
    return async (req, res, next) => {
        try {
            const rateLimitKey = `rate_limit:burst:${req.ip}`;
            const rateLimit = await redisService.checkRateLimit(rateLimitKey, limit, window);
            res.set({
                'X-RateLimit-Limit': limit.toString(),
                'X-RateLimit-Remaining': rateLimit.remaining.toString(),
                'X-RateLimit-Reset': rateLimit.reset.toString(),
            });
            if (!rateLimit.allowed) {
                logger.warn('Burst rate limit exceeded', {
                    ip: req.ip,
                    limit,
                    window,
                });
                return res.status(429).json({
                    success: false,
                    message: 'Too many requests in a short time. Please slow down.',
                    retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000),
                });
            }
            return next();
        }
        catch (error) {
            logger.error('Burst rate limiter error', {
                error: error instanceof Error ? error.message : 'Unknown error',
                ip: req.ip,
            });
            return next();
        }
    };
};
exports.burstRateLimiter = burstRateLimiter;
const apiKeyRateLimiter = (limit, window) => {
    return async (req, res, next) => {
        try {
            const apiKey = req.headers['x-api-key'];
            if (!apiKey) {
                return res.status(401).json({
                    success: false,
                    message: 'API key required',
                });
            }
            const rateLimitKey = `rate_limit:api:${apiKey}`;
            const rateLimit = await redisService.checkRateLimit(rateLimitKey, limit, window);
            res.set({
                'X-RateLimit-Limit': limit.toString(),
                'X-RateLimit-Remaining': rateLimit.remaining.toString(),
                'X-RateLimit-Reset': rateLimit.reset.toString(),
            });
            if (!rateLimit.allowed) {
                logger.warn('API key rate limit exceeded', {
                    apiKey: apiKey.substring(0, 8) + '...',
                    limit,
                    window,
                });
                return res.status(429).json({
                    success: false,
                    message: 'API rate limit exceeded. Please try again later.',
                    retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000),
                });
            }
            return next();
        }
        catch (error) {
            logger.error('API key rate limiter error', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return next();
        }
    };
};
exports.apiKeyRateLimiter = apiKeyRateLimiter;
const getRateLimitInfo = async (key, identifier) => {
    try {
        const rateLimitKey = `rate_limit:${key}:${identifier}`;
        const current = await redisService.getClient().get(rateLimitKey);
        const ttl = await redisService.getClient().ttl(rateLimitKey);
        return {
            current: current ? parseInt(current) : 0,
            ttl,
            key: rateLimitKey,
        };
    }
    catch (error) {
        logger.error('Failed to get rate limit info', {
            error: error instanceof Error ? error.message : 'Unknown error',
            key,
            identifier,
        });
        return null;
    }
};
exports.getRateLimitInfo = getRateLimitInfo;
//# sourceMappingURL=rateLimiter.js.map