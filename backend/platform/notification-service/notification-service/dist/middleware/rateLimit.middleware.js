"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitMiddleware = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Standard rate limit: 100 requests per 15 minutes
const standardLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Too many requests from this IP, please try again later.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
        });
    },
});
// Strict rate limit: 20 requests per 15 minutes (for sensitive operations)
const strictLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests for this operation, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Too many requests for this operation, please try again later.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
        });
    },
});
// Bulk operations rate limit: 10 requests per 15 minutes
const bulkLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: {
        success: false,
        error: 'Too many bulk operations from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Too many bulk operations from this IP, please try again later.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
        });
    },
});
// SMS rate limit: 50 SMS per hour
const smsLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // limit each IP to 50 SMS per hour
    message: {
        success: false,
        error: 'Too many SMS requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Too many SMS requests from this IP, please try again later.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
        });
    },
});
// Email rate limit: 100 emails per hour
const emailLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // limit each IP to 100 emails per hour
    message: {
        success: false,
        error: 'Too many email requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Too many email requests from this IP, please try again later.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
        });
    },
});
// Push notification rate limit: 200 push notifications per hour
const pushLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 200, // limit each IP to 200 push notifications per hour
    message: {
        success: false,
        error: 'Too many push notification requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Too many push notification requests from this IP, please try again later.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
        });
    },
});
exports.rateLimitMiddleware = {
    standard: standardLimiter,
    strict: strictLimiter,
    bulk: bulkLimiter,
    sms: smsLimiter,
    email: emailLimiter,
    push: pushLimiter,
};
//# sourceMappingURL=rateLimit.middleware.js.map