"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitMiddleware = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const keyGenerator = (req) => {
    const userId = req.user?.id;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return userId || ip;
};
const onLimitReached = (req, res) => {
    res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.round(60000 / 1000),
    });
};
exports.rateLimitMiddleware = {
    search: (0, express_rate_limit_1.default)({
        windowMs: 1 * 60 * 1000,
        max: 100,
        keyGenerator,
        handler: onLimitReached,
        standardHeaders: true,
        legacyHeaders: false,
        message: 'Too many search requests',
    }),
    suggestions: (0, express_rate_limit_1.default)({
        windowMs: 1 * 60 * 1000,
        max: 200,
        keyGenerator,
        handler: onLimitReached,
        standardHeaders: true,
        legacyHeaders: false,
        message: 'Too many suggestion requests',
    }),
    analytics: (0, express_rate_limit_1.default)({
        windowMs: 5 * 60 * 1000,
        max: 20,
        keyGenerator,
        handler: onLimitReached,
        standardHeaders: true,
        legacyHeaders: false,
        message: 'Too many analytics requests',
    }),
    filters: (0, express_rate_limit_1.default)({
        windowMs: 1 * 60 * 1000,
        max: 50,
        keyGenerator,
        handler: onLimitReached,
        standardHeaders: true,
        legacyHeaders: false,
        message: 'Too many filter requests',
    }),
    tracking: (0, express_rate_limit_1.default)({
        windowMs: 1 * 60 * 1000,
        max: 500,
        keyGenerator,
        handler: onLimitReached,
        standardHeaders: true,
        legacyHeaders: false,
        message: 'Too many tracking requests',
    }),
    indexing: (0, express_rate_limit_1.default)({
        windowMs: 10 * 60 * 1000,
        max: 5,
        keyGenerator,
        handler: onLimitReached,
        standardHeaders: true,
        legacyHeaders: false,
        message: 'Too many indexing requests',
    }),
    admin: (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: 10,
        keyGenerator,
        handler: onLimitReached,
        standardHeaders: true,
        legacyHeaders: false,
        message: 'Too many admin requests',
    }),
    global: (0, express_rate_limit_1.default)({
        windowMs: 1 * 60 * 1000,
        max: 1000,
        keyGenerator,
        handler: onLimitReached,
        standardHeaders: true,
        legacyHeaders: false,
        message: 'Too many requests',
    }),
};
//# sourceMappingURL=rate-limit.middleware.js.map