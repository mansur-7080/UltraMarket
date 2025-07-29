"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitMiddleware = rateLimitMiddleware;
exports.authRateLimitMiddleware = authRateLimitMiddleware;
exports.passwordResetRateLimitMiddleware = passwordResetRateLimitMiddleware;
exports.cleanupRateLimitStore = cleanupRateLimitStore;
const logger = console;
class ApiError extends Error {
    statusCode;
    message;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
    }
}
const rateLimitStore = new Map();
function rateLimitMiddleware(req, res, next) {
    try {
        const clientId = getClientId(req);
        const now = Date.now();
        const windowMs = 15 * 60 * 1000;
        const maxRequests = 100;
        const currentData = rateLimitStore.get(clientId);
        if (!currentData || now > currentData.resetTime) {
            rateLimitStore.set(clientId, {
                count: 1,
                resetTime: now + windowMs,
            });
        }
        else {
            if (currentData.count >= maxRequests) {
                logger.warn('Rate limit exceeded', {
                    clientId,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    operation: 'rate_limit_middleware',
                });
                throw new ApiError(429, 'Too many requests. Please try again later.');
            }
            currentData.count++;
            rateLimitStore.set(clientId, currentData);
        }
        res.set({
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': Math.max(0, maxRequests - (currentData?.count || 0)).toString(),
            'X-RateLimit-Reset': new Date(now + windowMs).toISOString(),
        });
        next();
    }
    catch (error) {
        if (error instanceof ApiError) {
            next(error);
        }
        else {
            logger.error('Rate limiting error', {
                error: error instanceof Error ? error.message : 'Unknown error',
                operation: 'rate_limit_middleware',
            });
            next(new ApiError(500, 'Rate limiting error'));
        }
    }
}
function authRateLimitMiddleware(req, res, next) {
    try {
        const clientId = getClientId(req);
        const now = Date.now();
        const windowMs = 15 * 60 * 1000;
        const maxRequests = 5;
        const currentData = rateLimitStore.get(`auth_${clientId}`);
        if (!currentData || now > currentData.resetTime) {
            rateLimitStore.set(`auth_${clientId}`, {
                count: 1,
                resetTime: now + windowMs,
            });
        }
        else {
            if (currentData.count >= maxRequests) {
                logger.warn('Auth rate limit exceeded', {
                    clientId,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    operation: 'auth_rate_limit_middleware',
                });
                throw new ApiError(429, 'Too many authentication attempts. Please try again later.');
            }
            currentData.count++;
            rateLimitStore.set(`auth_${clientId}`, currentData);
        }
        res.set({
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': Math.max(0, maxRequests - (currentData?.count || 0)).toString(),
            'X-RateLimit-Reset': new Date(now + windowMs).toISOString(),
        });
        next();
    }
    catch (error) {
        if (error instanceof ApiError) {
            next(error);
        }
        else {
            logger.error('Auth rate limiting error', {
                error: error instanceof Error ? error.message : 'Unknown error',
                operation: 'auth_rate_limit_middleware',
            });
            next(new ApiError(500, 'Rate limiting error'));
        }
    }
}
function passwordResetRateLimitMiddleware(req, res, next) {
    try {
        const clientId = getClientId(req);
        const now = Date.now();
        const windowMs = 60 * 60 * 1000;
        const maxRequests = 3;
        const currentData = rateLimitStore.get(`password_reset_${clientId}`);
        if (!currentData || now > currentData.resetTime) {
            rateLimitStore.set(`password_reset_${clientId}`, {
                count: 1,
                resetTime: now + windowMs,
            });
        }
        else {
            if (currentData.count >= maxRequests) {
                logger.warn('Password reset rate limit exceeded', {
                    clientId,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    operation: 'password_reset_rate_limit_middleware',
                });
                throw new ApiError(429, 'Too many password reset attempts. Please try again later.');
            }
            currentData.count++;
            rateLimitStore.set(`password_reset_${clientId}`, currentData);
        }
        res.set({
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': Math.max(0, maxRequests - (currentData?.count || 0)).toString(),
            'X-RateLimit-Reset': new Date(now + windowMs).toISOString(),
        });
        next();
    }
    catch (error) {
        if (error instanceof ApiError) {
            next(error);
        }
        else {
            logger.error('Password reset rate limiting error', {
                error: error instanceof Error ? error.message : 'Unknown error',
                operation: 'password_reset_rate_limit_middleware',
            });
            next(new ApiError(500, 'Rate limiting error'));
        }
    }
}
function getClientId(req) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    return Buffer.from(`${ip}-${userAgent}`).toString('base64');
}
function cleanupRateLimitStore() {
    const now = Date.now();
    for (const [key, data] of rateLimitStore.entries()) {
        if (now > data.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}
setInterval(cleanupRateLimitStore, 15 * 60 * 1000);
//# sourceMappingURL=rate-limit.middleware.js.map