"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = exports.notFoundHandler = exports.errorHandler = exports.requestLogger = exports.sanitizeInput = exports.helmetConfig = exports.corsOptions = exports.apiRateLimiter = exports.passwordResetRateLimiter = exports.authRateLimiter = exports.createRateLimiter = void 0;
const tslib_1 = require("tslib");
const express_rate_limit_1 = tslib_1.__importDefault(require("express-rate-limit"));
const helmet_1 = tslib_1.__importDefault(require("helmet"));
const logger_1 = require("./logger");
// Rate limiting configurations
const createRateLimiter = (options) => {
    const { windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // requests per windowMs
    message = 'Too many requests from this IP, please try again later.', skipSuccessfulRequests = false, } = options;
    return (0, express_rate_limit_1.default)({
        windowMs,
        max,
        message: {
            error: 'Rate limit exceeded',
            message,
            retryAfter: Math.ceil(windowMs / 1000),
        },
        skipSuccessfulRequests,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logger_1.logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                endpoint: req.originalUrl,
            });
            res.status(429).json({
                error: 'Rate limit exceeded',
                message,
                retryAfter: Math.ceil(windowMs / 1000),
            });
        },
    });
};
exports.createRateLimiter = createRateLimiter;
// Strict rate limiters for sensitive endpoints
exports.authRateLimiter = (0, exports.createRateLimiter)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later.',
});
exports.passwordResetRateLimiter = (0, exports.createRateLimiter)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: 'Too many password reset requests, please try again later.',
});
exports.apiRateLimiter = (0, exports.createRateLimiter)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes for authenticated users
    message: 'API rate limit exceeded, please try again later.',
});
// CORS configuration
exports.corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:8000',
            'https://ultramarket.com',
            'https://admin.ultramarket.com',
            'https://api.ultramarket.com',
        ];
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            logger_1.logger.warn(`CORS blocked request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-API-Key',
        'X-Request-ID',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
};
// Helmet security configuration
exports.helmetConfig = (0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'https:'],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'", 'https://api.ultramarket.com'],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});
// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
    const sanitizeValue = (value) => {
        if (typeof value === 'string') {
            // Remove potentially dangerous characters
            return value
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/<.*?>/g, '')
                .trim();
        }
        if (typeof value === 'object' && value !== null) {
            const sanitized = {};
            for (const key in value) {
                if (value.hasOwnProperty(key)) {
                    sanitized[key] = sanitizeValue(value[key]);
                }
            }
            return sanitized;
        }
        return value;
    };
    if (req.body) {
        req.body = sanitizeValue(req.body);
    }
    if (req.query) {
        req.query = sanitizeValue(req.query);
    }
    if (req.params) {
        req.params = sanitizeValue(req.params);
    }
    next();
};
exports.sanitizeInput = sanitizeInput;
// Request logging middleware
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // Add request ID to response headers
    res.setHeader('X-Request-ID', requestId);
    // Log request
    logger_1.logger.info('Incoming request', {
        requestId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        contentLength: req.get('Content-Length'),
    });
    // Log response
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logLevel = res.statusCode >= 400 ? 'error' : 'info';
        logger_1.logger[logLevel]('Request completed', {
            requestId,
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration,
            contentLength: res.get('Content-Length'),
        });
    });
    next();
};
exports.requestLogger = requestLogger;
// Error handling middleware
const errorHandler = (error, req, res, next) => {
    const requestId = res.getHeader('X-Request-ID');
    logger_1.logger.error('Request error', {
        requestId,
        error: error.message,
        stack: error.stack,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
    });
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            message: error.message,
            ...(isDevelopment && { stack: error.stack }),
        });
    }
    if (error.name === 'UnauthorizedError') {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or missing authentication token',
        });
    }
    if (error.name === 'ForbiddenError') {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Insufficient permissions',
        });
    }
    if (error.status === 404) {
        return res.status(404).json({
            error: 'Not Found',
            message: 'The requested resource was not found',
        });
    }
    // Default server error
    res.status(500).json({
        error: 'Internal Server Error',
        message: isDevelopment ? error.message : 'Something went wrong',
        ...(isDevelopment && { stack: error.stack }),
    });
};
exports.errorHandler = errorHandler;
// 404 handler
const notFoundHandler = (req, res) => {
    const requestId = res.getHeader('X-Request-ID');
    logger_1.logger.warn('Route not found', {
        requestId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
    });
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
    });
};
exports.notFoundHandler = notFoundHandler;
// Health check middleware
const healthCheck = (serviceName) => {
    return (req, res) => {
        const healthData = {
            service: serviceName,
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.env.npm_package_version || '1.0.0',
        };
        res.status(200).json(healthData);
    };
};
exports.healthCheck = healthCheck;
//# sourceMappingURL=middleware.js.map