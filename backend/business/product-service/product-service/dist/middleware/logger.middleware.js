"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stream = exports.requestLogger = void 0;
const logger_1 = require("../utils/logger");
const crypto_1 = require("crypto");
/**
 * Professional request logging middleware with standardized structured logging
 */
const requestLogger = (req, res, next) => {
    // Generate unique request ID for tracking
    const requestId = req.header('X-Request-ID') || (0, crypto_1.randomUUID)();
    req.id = requestId;
    res.setHeader('X-Request-ID', requestId);
    const start = Date.now();
    const requestPath = req.originalUrl || req.url;
    // Security: Mask sensitive data for logging
    const maskSensitiveData = (obj) => {
        if (!obj)
            return obj;
        const result = { ...obj };
        // List of fields to mask in requests
        const sensitiveFields = [
            'password',
            'token',
            'authorization',
            'secret',
            'creditCard',
            'cardNumber',
            'cvv',
            'ssn',
            'passport',
            'apiKey',
        ];
        // Recursively mask sensitive fields
        Object.keys(result).forEach((key) => {
            if (sensitiveFields.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
                result[key] = '***REDACTED***';
            }
            else if (typeof result[key] === 'object' && result[key] !== null) {
                result[key] = maskSensitiveData(result[key]);
            }
        });
        return result;
    };
    // Create safe log objects
    const safeQuery = maskSensitiveData(req.query);
    const safeBody = req.body ? maskSensitiveData(req.body) : undefined;
    const safeHeaders = {
        ...maskSensitiveData(req.headers),
        'user-agent': req.get('User-Agent'),
        referer: req.get('Referer') || req.get('Referrer'),
    };
    // Log request start with structured data
    logger_1.logger.info(`Request started: ${req.method} ${requestPath}`, {
        request: {
            id: requestId,
            method: req.method,
            path: requestPath,
            query: safeQuery,
            headers: safeHeaders,
            body: safeBody,
            ip: req.ip,
            protocol: req.protocol,
        },
        user: req.user?.userId || 'anonymous',
        timestamp: new Date().toISOString(),
        service: process.env.SERVICE_NAME || 'product-service',
    });
    // Track response
    res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
        // Log response with structured data
        logger_1.logger[level](`Request completed: ${req.method} ${requestPath} ${res.statusCode} - ${duration}ms`, {
            request: {
                id: requestId,
                method: req.method,
                path: requestPath,
            },
            response: {
                statusCode: res.statusCode,
                duration: duration,
                contentLength: res.get('Content-Length'),
                contentType: res.get('Content-Type'),
            },
            user: req.user?.userId || 'anonymous',
            timestamp: new Date().toISOString(),
            service: process.env.SERVICE_NAME || 'product-service',
        });
    });
    // Continue with request chain
    next();
};
exports.requestLogger = requestLogger;
// Morgan-style stream for winston
exports.stream = {
    write: (message) => {
        logger_1.logger.info(message.trim());
    },
};
//# sourceMappingURL=logger.middleware.js.map