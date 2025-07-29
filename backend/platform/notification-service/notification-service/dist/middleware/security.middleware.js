"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preventDuplicateRequests = exports.validateContentType = exports.sanitizeInput = exports.securityMiddleware = void 0;
const logger_1 = require("../utils/logger");
const securityMiddleware = (req, res, next) => {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    // Remove powered-by header
    res.removeHeader('X-Powered-By');
    next();
};
exports.securityMiddleware = securityMiddleware;
const sanitizeInput = (req, res, next) => {
    // Basic input sanitization
    const sanitizeString = (str) => {
        if (typeof str !== 'string')
            return str;
        // Remove potentially dangerous characters
        return str
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim();
    };
    const sanitizeObject = (obj) => {
        if (typeof obj !== 'object' || obj === null)
            return obj;
        if (Array.isArray(obj)) {
            return obj.map(sanitizeObject);
        }
        const sanitized = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === 'string') {
                    sanitized[key] = sanitizeString(obj[key]);
                }
                else if (typeof obj[key] === 'object') {
                    sanitized[key] = sanitizeObject(obj[key]);
                }
                else {
                    sanitized[key] = obj[key];
                }
            }
        }
        return sanitized;
    };
    // Sanitize request body
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    // Sanitize query parameters
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    next();
};
exports.sanitizeInput = sanitizeInput;
const validateContentType = (req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        const contentType = req.get('Content-Type');
        if (!contentType || !contentType.includes('application/json')) {
            logger_1.logger.warn('Invalid content type', {
                contentType,
                method: req.method,
                url: req.url,
                ip: req.ip,
            });
            return res.status(400).json({
                success: false,
                error: 'Content-Type must be application/json',
            });
        }
    }
    next();
};
exports.validateContentType = validateContentType;
const preventDuplicateRequests = (req, res, next) => {
    const requestId = req.get('X-Request-ID');
    if (requestId) {
        // In a real implementation, you would check against a cache/database
        // For now, we'll just add the request ID to the request object
        req.requestId = requestId;
    }
    next();
};
exports.preventDuplicateRequests = preventDuplicateRequests;
//# sourceMappingURL=security.middleware.js.map