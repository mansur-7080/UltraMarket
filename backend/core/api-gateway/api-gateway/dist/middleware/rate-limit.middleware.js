"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.burstProtection = exports.userRateLimit = exports.dynamicRateLimit = exports.uploadRateLimit = exports.adminRateLimit = exports.searchRateLimit = exports.paymentRateLimit = exports.authRateLimit = exports.generalRateLimit = exports.rateLimitConfigs = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = require("../utils/logger");
exports.rateLimitConfigs = {
    general: {
        windowMs: 15 * 60 * 1000,
        max: 1000,
        message: {
            error: 'Too many requests from this IP, please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: '15 minutes',
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
    },
    auth: {
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: {
            error: 'Too many authentication attempts from this IP, please try again later.',
            code: 'AUTH_RATE_LIMIT_EXCEEDED',
            retryAfter: '15 minutes',
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
    },
    payment: {
        windowMs: 15 * 60 * 1000,
        max: 50,
        message: {
            error: 'Too many payment requests from this IP, please try again later.',
            code: 'PAYMENT_RATE_LIMIT_EXCEEDED',
            retryAfter: '15 minutes',
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
    },
    search: {
        windowMs: 5 * 60 * 1000,
        max: 200,
        message: {
            error: 'Too many search requests from this IP, please try again later.',
            code: 'SEARCH_RATE_LIMIT_EXCEEDED',
            retryAfter: '5 minutes',
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true,
        skipFailedRequests: false,
    },
    admin: {
        windowMs: 15 * 60 * 1000,
        max: 200,
        message: {
            error: 'Too many admin requests from this IP, please try again later.',
            code: 'ADMIN_RATE_LIMIT_EXCEEDED',
            retryAfter: '15 minutes',
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
    },
    upload: {
        windowMs: 60 * 60 * 1000,
        max: 20,
        message: {
            error: 'Too many file upload requests from this IP, please try again later.',
            code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
            retryAfter: '1 hour',
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
    },
};
const createRateLimiter = (config) => {
    return (0, express_rate_limit_1.default)({
        ...config,
        handler: (req, res) => {
            (0, logger_1.logSecurity)('RATE_LIMIT_EXCEEDED', {
                ip: req.ip,
                url: req.originalUrl,
                method: req.method,
                userAgent: req.get('User-Agent'),
                userId: req.user?.id,
            });
            logger_1.logger.warn('Rate limit exceeded', {
                ip: req.ip,
                url: req.originalUrl,
                method: req.method,
                userAgent: req.get('User-Agent'),
                userId: req.user?.id,
            });
            res.status(429).json({
                success: false,
                ...config.message,
                timestamp: new Date().toISOString(),
            });
        },
        skip: (req) => {
            if (req.path === '/health' || req.path === '/api/health') {
                return true;
            }
            const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];
            if (trustedIPs.includes(req.ip)) {
                return true;
            }
            return false;
        },
    });
};
exports.generalRateLimit = createRateLimiter(exports.rateLimitConfigs.general);
exports.authRateLimit = createRateLimiter(exports.rateLimitConfigs.auth);
exports.paymentRateLimit = createRateLimiter(exports.rateLimitConfigs.payment);
exports.searchRateLimit = createRateLimiter(exports.rateLimitConfigs.search);
exports.adminRateLimit = createRateLimiter(exports.rateLimitConfigs.admin);
exports.uploadRateLimit = createRateLimiter(exports.rateLimitConfigs.upload);
const dynamicRateLimit = (req, res, next) => {
    const path = req.path.toLowerCase();
    if (path.includes('/auth/') || path.includes('/login') || path.includes('/register')) {
        return (0, exports.authRateLimit)(req, res, next);
    }
    if (path.includes('/payment') || path.includes('/checkout')) {
        return (0, exports.paymentRateLimit)(req, res, next);
    }
    if (path.includes('/search')) {
        return (0, exports.searchRateLimit)(req, res, next);
    }
    if (path.includes('/admin')) {
        return (0, exports.adminRateLimit)(req, res, next);
    }
    if (path.includes('/upload') || path.includes('/file')) {
        return (0, exports.uploadRateLimit)(req, res, next);
    }
    return (0, exports.generalRateLimit)(req, res, next);
};
exports.dynamicRateLimit = dynamicRateLimit;
exports.userRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 2000,
    message: {
        error: 'Too many requests, please try again later.',
        code: 'USER_RATE_LIMIT_EXCEEDED',
        retryAfter: '15 minutes',
    },
    keyGenerator: (req) => {
        return req.user?.id || req.ip;
    },
    handler: (req, res) => {
        (0, logger_1.logSecurity)('USER_RATE_LIMIT_EXCEEDED', {
            ip: req.ip,
            url: req.originalUrl,
            method: req.method,
            userId: req.user?.id,
        });
        res.status(429).json({
            success: false,
            error: 'Too many requests, please try again later.',
            code: 'USER_RATE_LIMIT_EXCEEDED',
            retryAfter: '15 minutes',
            timestamp: new Date().toISOString(),
        });
    },
});
exports.burstProtection = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000,
    max: 10,
    message: {
        error: 'Too many requests in a short period, please slow down.',
        code: 'BURST_LIMIT_EXCEEDED',
        retryAfter: '1 minute',
    },
    handler: (req, res) => {
        (0, logger_1.logSecurity)('BURST_LIMIT_EXCEEDED', {
            ip: req.ip,
            url: req.originalUrl,
            method: req.method,
            userId: req.user?.id,
        });
        res.status(429).json({
            success: false,
            error: 'Too many requests in a short period, please slow down.',
            code: 'BURST_LIMIT_EXCEEDED',
            retryAfter: '1 minute',
            timestamp: new Date().toISOString(),
        });
    },
});
exports.default = {
    general: exports.generalRateLimit,
    auth: exports.authRateLimit,
    payment: exports.paymentRateLimit,
    search: exports.searchRateLimit,
    admin: exports.adminRateLimit,
    upload: exports.uploadRateLimit,
    dynamic: exports.dynamicRateLimit,
    user: exports.userRateLimit,
    burst: exports.burstProtection,
};
//# sourceMappingURL=rate-limit.middleware.js.map