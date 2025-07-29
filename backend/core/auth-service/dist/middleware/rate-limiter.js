"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = exports.RateLimiter = void 0;
exports.rateLimitMiddleware = rateLimitMiddleware;
exports.authRateLimit = authRateLimit;
exports.registrationRateLimit = registrationRateLimit;
exports.passwordResetRateLimit = passwordResetRateLimit;
exports.loginRateLimit = loginRateLimit;
const logger = console;
const rateLimitStore = {};
class RateLimiter {
    config;
    constructor(config) {
        this.config = {
            keyGenerator: (req) => req.ip || 'unknown',
            skipSuccessfulRequests: false,
            skipFailedRequests: false,
            ...config,
        };
    }
    async checkLimit(req, key, maxRequests, windowMs) {
        const clientKey = this.config.keyGenerator ? this.config.keyGenerator(req) : (req.ip || 'unknown');
        const rateLimitKey = `${key}:${clientKey}`;
        const now = Date.now();
        const windowStart = now - windowMs;
        const currentData = rateLimitStore[rateLimitKey];
        if (!currentData || currentData.resetTime < now) {
            rateLimitStore[rateLimitKey] = {
                count: 1,
                resetTime: now + windowMs,
            };
            return;
        }
        if (currentData.count >= maxRequests) {
            logger.warn('Rate limit exceeded', {
                ip: req.ip,
                key,
                count: currentData.count,
                maxRequests,
                windowMs,
            });
            throw new Error('Rate limit exceeded');
        }
        currentData.count++;
    }
    getRateLimitInfo(req, key) {
        const clientKey = this.config.keyGenerator ? this.config.keyGenerator(req) : (req.ip || 'unknown');
        const rateLimitKey = `${key}:${clientKey}`;
        const currentData = rateLimitStore[rateLimitKey];
        const now = Date.now();
        if (!currentData || currentData.resetTime < now) {
            return {
                remaining: this.config.maxRequests,
                reset: now + this.config.windowMs,
                total: this.config.maxRequests,
            };
        }
        return {
            remaining: Math.max(0, this.config.maxRequests - currentData.count),
            reset: currentData.resetTime,
            total: this.config.maxRequests,
        };
    }
    resetLimit(req, key) {
        const clientKey = this.config.keyGenerator ? this.config.keyGenerator(req) : (req.ip || 'unknown');
        const rateLimitKey = `${key}:${clientKey}`;
        delete rateLimitStore[rateLimitKey];
    }
    cleanup() {
        const now = Date.now();
        for (const [key, data] of Object.entries(rateLimitStore)) {
            if (data.resetTime < now) {
                delete rateLimitStore[key];
            }
        }
    }
}
exports.RateLimiter = RateLimiter;
exports.rateLimiter = new RateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
    keyGenerator: (req) => req.ip || 'unknown',
});
function rateLimitMiddleware(config = {}) {
    const limiter = new RateLimiter({
        windowMs: 15 * 60 * 1000,
        maxRequests: 100,
        keyGenerator: (req) => req.ip || 'unknown',
        ...config,
    });
    return async (req, res, next) => {
        try {
            await limiter.checkLimit(req, 'general', config.maxRequests || 100, config.windowMs || 15 * 60 * 1000);
            const info = limiter.getRateLimitInfo(req, 'general');
            res.set({
                'X-RateLimit-Limit': info.total.toString(),
                'X-RateLimit-Remaining': info.remaining.toString(),
                'X-RateLimit-Reset': new Date(info.reset).toISOString(),
            });
            next();
        }
        catch (error) {
            logger.warn('Rate limit exceeded', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                path: req.path,
            });
            res.status(429).json({
                success: false,
                message: 'Too many requests, please try again later',
                retryAfter: Math.ceil((config.windowMs || 15 * 60 * 1000) / 1000),
            });
        }
    };
}
function authRateLimit() {
    return rateLimitMiddleware({
        windowMs: 15 * 60 * 1000,
        maxRequests: 5,
        keyGenerator: (req) => `${req.ip}:auth`,
    });
}
function registrationRateLimit() {
    return rateLimitMiddleware({
        windowMs: 60 * 60 * 1000,
        maxRequests: 3,
        keyGenerator: (req) => `${req.ip}:registration`,
    });
}
function passwordResetRateLimit() {
    return rateLimitMiddleware({
        windowMs: 60 * 60 * 1000,
        maxRequests: 3,
        keyGenerator: (req) => `${req.ip}:password-reset`,
    });
}
function loginRateLimit() {
    return rateLimitMiddleware({
        windowMs: 15 * 60 * 1000,
        maxRequests: 10,
        keyGenerator: (req) => `${req.ip}:login`,
    });
}
setInterval(() => {
    exports.rateLimiter.cleanup();
}, 5 * 60 * 1000);
//# sourceMappingURL=rate-limiter.js.map