"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.secureFileUpload = exports.csrfProtection = exports.handleValidationErrors = exports.validateSortOrder = exports.validatePagination = exports.validateUUID = exports.validatePassword = exports.validateEmail = exports.SecurityMiddleware = void 0;
exports.initializeSecurityMiddleware = initializeSecurityMiddleware;
exports.getSecurityMiddleware = getSecurityMiddleware;
const tslib_1 = require("tslib");
const express_rate_limit_1 = tslib_1.__importDefault(require("express-rate-limit"));
const helmet_1 = tslib_1.__importDefault(require("helmet"));
const cors_1 = tslib_1.__importDefault(require("cors"));
const compression_1 = tslib_1.__importDefault(require("compression"));
const express_validator_1 = require("express-validator");
// import DOMPurify from 'isomorphic-dompurify';
const logger_1 = require("../logger");
const caching_1 = require("../performance/caching");
// Default security configuration
const defaultSecurityConfig = {
    rateLimiting: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.',
    },
    cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    },
    helmet: {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },
        crossOriginEmbedderPolicy: false,
    },
    compression: {
        level: 6,
        threshold: 1024,
    },
};
// Security middleware class
class SecurityMiddleware {
    config;
    cache;
    suspiciousIPs = new Set();
    blockedIPs = new Set();
    constructor(config = {}) {
        this.config = { ...defaultSecurityConfig, ...config };
        this.cache = (0, caching_1.getCache)();
    }
    /**
     * Apply all security middleware
     */
    applySecurityMiddleware(app) {
        // Security headers
        app.use((0, helmet_1.default)({ crossOriginEmbedderPolicy: this.config.helmet.crossOriginEmbedderPolicy }));
        app.use(helmet_1.default.contentSecurityPolicy(this.config.helmet.contentSecurityPolicy));
        // CORS configuration
        app.use((0, cors_1.default)(this.config.cors));
        // Compression
        app.use((0, compression_1.default)(this.config.compression));
        // Rate limiting
        app.use(this.createRateLimiter());
        // IP blocking
        app.use(this.ipBlockingMiddleware.bind(this));
        // Request sanitization
        app.use(this.sanitizeInput.bind(this));
        // Security headers
        app.use(this.securityHeaders.bind(this));
        // Request logging
        app.use(this.securityLogger.bind(this));
    }
    /**
     * Create rate limiter with advanced features
     */
    createRateLimiter() {
        return (0, express_rate_limit_1.default)({
            windowMs: this.config.rateLimiting.windowMs,
            max: this.config.rateLimiting.max,
            message: {
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: this.config.rateLimiting.message,
                },
            },
            standardHeaders: true,
            legacyHeaders: false,
            keyGenerator: (req) => {
                return req.ip || req.connection.remoteAddress || 'unknown';
            },
            // onLimitReached: (req: Request) => {
            //   const clientIP = req.ip || req.connection.remoteAddress;
            //   this.suspiciousIPs.add(clientIP);
            //   logger.warn('Rate limit exceeded', {
            //     ip: clientIP,
            //     userAgent: req.get('User-Agent'),
            //     endpoint: req.path,
            //     method: req.method,
            //   });
            //   this.checkForIPBlocking(clientIP);
            // },
        });
    }
    /**
     * IP blocking middleware
     */
    ipBlockingMiddleware(req, res, next) {
        const clientIP = req.ip || req.connection.remoteAddress;
        if (clientIP && this.blockedIPs.has(clientIP)) {
            logger_1.logger.error('Blocked IP attempted access', {
                ip: clientIP,
                userAgent: req.get('User-Agent'),
                endpoint: req.path,
                method: req.method,
            });
            res.status(403).json({
                success: false,
                error: {
                    code: 'IP_BLOCKED',
                    message: 'Access denied',
                },
            });
            return;
        }
        next();
    }
    /**
     * Input sanitization middleware
     */
    sanitizeInput(req, res, next) {
        try {
            // Sanitize request body
            if (req.body && typeof req.body === 'object') {
                req.body = this.sanitizeObject(req.body);
            }
            // Sanitize query parameters
            if (req.query && typeof req.query === 'object') {
                req.query = this.sanitizeObject(req.query);
            }
            // Sanitize URL parameters
            if (req.params && typeof req.params === 'object') {
                req.params = this.sanitizeObject(req.params);
            }
            next();
        }
        catch (error) {
            logger_1.logger.error('Input sanitization failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                path: req.path,
                method: req.method,
            });
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_INPUT',
                    message: 'Invalid input data',
                },
            });
            return;
        }
    }
    /**
     * Sanitize object recursively
     */
    sanitizeObject(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return typeof obj === 'string' ? simpleSanitize(obj) : obj;
        }
        if (Array.isArray(obj)) {
            return obj.map((item) => this.sanitizeObject(item));
        }
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            const sanitizedKey = simpleSanitize(key);
            sanitized[sanitizedKey] = this.sanitizeObject(value);
        }
        return sanitized;
    }
    /**
     * Security headers middleware
     */
    securityHeaders(req, res, next) {
        // Additional security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        // Remove server information
        res.removeHeader('X-Powered-By');
        res.removeHeader('Server');
        next();
    }
    /**
     * Security logging middleware
     */
    securityLogger(req, res, next) {
        const startTime = Date.now();
        const clientIP = req.ip || req.connection.remoteAddress;
        // Log suspicious patterns
        this.detectSuspiciousPatterns(req);
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            const logData = {
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                duration,
                ip: clientIP,
                userAgent: req.get('User-Agent'),
                contentLength: res.get('content-length'),
            };
            // Log security events
            if (res.statusCode >= 400) {
                logger_1.logger.warn('Security event detected', logData);
            }
            else {
                logger_1.logger.info('Request processed', logData);
            }
        });
        next();
    }
    /**
     * Detect suspicious patterns in requests
     */
    detectSuspiciousPatterns(req) {
        const clientIP = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent') || '';
        const path = req.path;
        const query = JSON.stringify(req.query);
        const body = JSON.stringify(req.body);
        // SQL injection patterns
        const sqlInjectionPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
            /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
            /('|"|`|;|--|\|\||&&)/,
        ];
        // XSS patterns
        const xssPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<iframe[^>]*>.*?<\/iframe>/gi,
        ];
        // Path traversal patterns
        const pathTraversalPatterns = [/\.\.\//g, /\.\.\\/g, /%2e%2e%2f/gi, /%2e%2e%5c/gi];
        // Check for suspicious patterns
        const suspiciousContent = [path, query, body].join(' ');
        if (sqlInjectionPatterns.some((pattern) => pattern.test(suspiciousContent))) {
            this.logSecurityThreat(clientIP || 'unknown', 'SQL_INJECTION', req);
        }
        if (xssPatterns.some((pattern) => pattern.test(suspiciousContent))) {
            this.logSecurityThreat(clientIP || 'unknown', 'XSS_ATTEMPT', req);
        }
        if (pathTraversalPatterns.some((pattern) => pattern.test(suspiciousContent))) {
            this.logSecurityThreat(clientIP || 'unknown', 'PATH_TRAVERSAL', req);
        }
        // Check for suspicious user agents
        if (this.isSuspiciousUserAgent(userAgent)) {
            this.logSecurityThreat(clientIP || 'unknown', 'SUSPICIOUS_USER_AGENT', req);
        }
    }
    /**
     * Check if user agent is suspicious
     */
    isSuspiciousUserAgent(userAgent) {
        const suspiciousPatterns = [
            /bot|crawler|spider|scraper/i,
            /curl|wget|python|java|perl/i,
            /scanner|nikto|sqlmap|burp/i,
        ];
        return suspiciousPatterns.some((pattern) => pattern.test(userAgent));
    }
    /**
     * Log security threat
     */
    logSecurityThreat(ip, threatType, req) {
        const threat = {
            ip,
            threatType,
            timestamp: new Date().toISOString(),
            method: req.method,
            path: req.path,
            userAgent: req.get('User-Agent'),
            query: req.query,
            body: req.body,
            severity: 'HIGH',
        };
        logger_1.logger.error('Security threat detected', threat);
        // Store in cache for analysis
        const key = `security:threat:${ip}:${Date.now()}`;
        this.cache.set(key, threat, 24 * 60 * 60); // 24 hours
        // Check for IP blocking
        this.checkForIPBlocking(ip);
    }
    /**
     * Check if IP should be blocked
     */
    async checkForIPBlocking(ip) {
        const threatCount = await this.getThreatCount(ip);
        if (threatCount >= 5) {
            this.blockedIPs.add(ip);
            logger_1.logger.error('IP blocked due to multiple threats', {
                ip,
                threatCount,
                timestamp: new Date().toISOString(),
            });
            // Store blocked IP in cache
            const key = `security:blocked:${ip}`;
            await this.cache.set(key, true, 24 * 60 * 60); // 24 hours
        }
    }
    /**
     * Get threat count for IP
     */
    async getThreatCount(ip) {
        const keys = await this.cache.keys(`security:threat:${ip}:*`);
        return keys.length;
    }
    /**
     * Unblock IP address
     */
    async unblockIP(ip) {
        this.blockedIPs.delete(ip);
        this.suspiciousIPs.delete(ip);
        const key = `security:blocked:${ip}`;
        await this.cache.del(key);
        logger_1.logger.info('IP unblocked', { ip });
    }
    /**
     * Get security statistics
     */
    async getSecurityStats() {
        const blockedIPKeys = await this.cache.keys('security:blocked:*');
        const threatKeys = await this.cache.keys('security:threat:*');
        return {
            blockedIPs: blockedIPKeys.length,
            suspiciousIPs: this.suspiciousIPs.size,
            threats: threatKeys.length,
            rateLimitViolations: 0, // Would need to track this separately
        };
    }
}
exports.SecurityMiddleware = SecurityMiddleware;
// Input validation helpers
exports.validateEmail = (0, express_validator_1.body)('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required');
exports.validatePassword = (0, express_validator_1.body)('password')
    .isLength({ min: 8, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least 8 characters, including uppercase, lowercase, number, and special character');
exports.validateUUID = (0, express_validator_1.param)('id').isUUID().withMessage('Valid UUID required');
exports.validatePagination = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Page must be between 1 and 1000'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
];
exports.validateSortOrder = (0, express_validator_1.query)('sort')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc');
// Validation result handler
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        logger_1.logger.warn('Validation errors', {
            errors: errors.array(),
            path: req.path,
            method: req.method,
            ip: req.ip,
        });
        res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid input data',
                details: errors.array(),
            },
        });
        return;
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
// Export singleton instance
let securityMiddleware;
function initializeSecurityMiddleware(config) {
    securityMiddleware = new SecurityMiddleware(config);
    return securityMiddleware;
}
function getSecurityMiddleware() {
    if (!securityMiddleware) {
        securityMiddleware = new SecurityMiddleware();
    }
    return securityMiddleware;
}
// CSRF protection middleware
const csrfProtection = (req, res, next) => {
    const token = req.get('X-CSRF-Token') || req.body._csrf || req.query._csrf;
    const sessionToken = req.session?.csrfToken;
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
        if (!token || !sessionToken || token !== sessionToken) {
            res.status(403).json({
                success: false,
                error: {
                    code: 'CSRF_TOKEN_INVALID',
                    message: 'Invalid CSRF token',
                },
            });
            return;
        }
    }
    next();
};
exports.csrfProtection = csrfProtection;
// File upload security
const secureFileUpload = (allowedTypes, maxSize = 5 * 1024 * 1024) => {
    return (req, res, next) => {
        const file = req.file;
        if (!file) {
            return next();
        }
        // Check file type
        if (!allowedTypes.includes(file.mimetype)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_FILE_TYPE',
                    message: 'File type not allowed',
                },
            });
            return;
        }
        // Check file size
        if (file.size > maxSize) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'FILE_TOO_LARGE',
                    message: 'File size exceeds limit',
                },
            });
            return;
        }
        // Scan file for malware (placeholder)
        // In production, integrate with antivirus scanning service
        next();
    };
};
exports.secureFileUpload = secureFileUpload;
// Simple HTML sanitizer (removes all tags)
function simpleSanitize(str) {
    return str.replace(/<[^>]+>/g, '');
}
//# sourceMappingURL=security-middleware.js.map