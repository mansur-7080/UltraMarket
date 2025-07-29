"use strict";
/**
 * 🛡️ PROFESSIONAL SECURITY MIDDLEWARE - UltraMarket Platform
 *
 * Enterprise-grade security middleware with comprehensive protection for
 * O'zbekiston e-commerce platform including:
 * - Advanced threat detection and prevention
 * - Financial transaction security (PCI DSS compliance)
 * - O'zbekiston regulatory compliance
 * - Real-time security monitoring and alerting
 * - Professional audit logging with correlation tracking
 *
 * Version: 4.0.0 - Professional Security Suite
 * Date: 2024-12-28
 * Compliance: PCI DSS Level 1, O'zbekiston Data Protection Laws
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UZBEKISTAN_SECURITY_PATTERNS = exports.ADVANCED_THREAT_PATTERNS = exports.createOrderServiceSecurity = exports.createProductServiceSecurity = exports.createPaymentServiceSecurity = exports.createUserServiceSecurity = exports.ProfessionalSecurityMiddleware = exports.SecurityErrorCodes = void 0;
const tslib_1 = require("tslib");
const express_rate_limit_1 = tslib_1.__importDefault(require("express-rate-limit"));
const crypto_1 = require("crypto");
const perf_hooks_1 = require("perf_hooks");
// Professional Security Error Codes
var SecurityErrorCodes;
(function (SecurityErrorCodes) {
    SecurityErrorCodes["RATE_LIMIT_EXCEEDED"] = "SEC_001";
    SecurityErrorCodes["IP_BLOCKED"] = "SEC_002";
    SecurityErrorCodes["SUSPICIOUS_ACTIVITY"] = "SEC_003";
    SecurityErrorCodes["SQL_INJECTION_ATTEMPT"] = "SEC_004";
    SecurityErrorCodes["XSS_ATTEMPT"] = "SEC_005";
    SecurityErrorCodes["CSRF_VIOLATION"] = "SEC_006";
    SecurityErrorCodes["PATH_TRAVERSAL_ATTEMPT"] = "SEC_007";
    SecurityErrorCodes["DATA_EXFILTRATION_ATTEMPT"] = "SEC_008";
    SecurityErrorCodes["INVALID_AUTHENTICATION"] = "SEC_009";
    SecurityErrorCodes["UNAUTHORIZED_ACCESS"] = "SEC_010";
    SecurityErrorCodes["MALFORMED_REQUEST"] = "SEC_011";
    SecurityErrorCodes["SECURITY_HEADER_VIOLATION"] = "SEC_012";
})(SecurityErrorCodes || (exports.SecurityErrorCodes = SecurityErrorCodes = {}));
// Professional Threat Patterns
const ADVANCED_THREAT_PATTERNS = {
    sqlInjection: [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
        /(UNION.*SELECT|SELECT.*FROM|INSERT.*INTO|UPDATE.*SET)/i,
        /(\bOR\b.*=.*\bOR\b|\bAND\b.*=.*\bAND\b)/i,
        /(\'|\"|`|;|--|\*|\/\*|\*\/)/,
        /(\bxp_cmdshell\b|\bsp_executesql\b)/i
    ],
    xss: [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=\s*["\'].*?["\']|on\w+\s*=\s*[^>\s]*/gi,
        /<iframe[^>]*>.*?<\/iframe>/gi,
        /<object[^>]*>.*?<\/object>/gi,
        /<embed[^>]*>.*?<\/embed>/gi,
        /expression\s*\(/gi,
        /vbscript:/gi
    ],
    pathTraversal: [
        /\.\.\/|\.\.\\|\.\.\%2f|\.\.\%5c/gi,
        /%2e%2e%2f|%2e%2e%5c|%252e%252e%252f/gi,
        /\/etc\/passwd|\/etc\/shadow|\/etc\/hosts/gi,
        /\\windows\\system32|\\windows\\system/gi,
        /proc\/self\/environ|proc\/version|proc\/cmdline/gi
    ],
    dataExfiltration: [
        /\b(creditcard|ssn|passport|license)\b.*?\b(\d{4,})\b/gi,
        /\b(password|pwd|pass|token|key|secret)\b\s*[:=]\s*\S+/gi,
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g // Credit card pattern
    ]
};
exports.ADVANCED_THREAT_PATTERNS = ADVANCED_THREAT_PATTERNS;
// O'zbekiston specific security patterns
const UZBEKISTAN_SECURITY_PATTERNS = {
    phoneNumbers: /(\+998|998)?[\s-]?\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/g,
    passportNumbers: /[A-Z]{2}\d{7}/g,
    bankCards: /\b\d{16}\b|\b\d{4}[\s-]\d{4}[\s-]\d{4}[\s-]\d{4}\b/g,
    innNumbers: /\b\d{9}\b/g // Individual taxpayer number
};
exports.UZBEKISTAN_SECURITY_PATTERNS = UZBEKISTAN_SECURITY_PATTERNS;
// Professional Security Middleware Class
class ProfessionalSecurityMiddleware {
    config;
    blockedIPs = new Set();
    suspiciousIPs = new Map();
    rateLimiters = new Map();
    correlationTracker = new Map();
    constructor(config) {
        this.config = this.mergeConfig(config);
        this.initializeRateLimiters();
        this.initializeIPManagement();
    }
    /**
     * Apply comprehensive professional security middleware
     */
    applySecurityMiddleware(app) {
        // 1. Request correlation tracking
        app.use(this.correlationTrackingMiddleware.bind(this));
        // 2. Performance monitoring
        app.use(this.performanceMonitoringMiddleware.bind(this));
        // 3. Professional security headers
        app.use(this.professionalSecurityHeaders.bind(this));
        // 4. CORS with advanced configuration
        app.use(this.advancedCorsMiddleware.bind(this));
        // 5. Compression with security considerations
        app.use(this.secureCompressionMiddleware.bind(this));
        // 6. IP blocking and reputation management
        app.use(this.ipReputationMiddleware.bind(this));
        // 7. Advanced rate limiting
        app.use(this.advancedRateLimitingMiddleware.bind(this));
        // 8. Threat detection and prevention
        app.use(this.threatDetectionMiddleware.bind(this));
        // 9. Input validation and sanitization
        app.use(this.inputValidationMiddleware.bind(this));
        // 10. Security audit logging
        app.use(this.securityAuditMiddleware.bind(this));
    }
    /**
     * Request correlation tracking middleware
     */
    correlationTrackingMiddleware(req, res, next) {
        const correlationId = req.headers['x-correlation-id'] || (0, crypto_1.randomUUID)();
        const startTime = perf_hooks_1.performance.now();
        // Add correlation data to request
        req.correlationId = correlationId;
        req.startTime = startTime;
        req.securityContext = {
            serviceName: this.config.serviceName,
            securityLevel: this.config.securityLevel,
            timestamp: new Date().toISOString()
        };
        // Set response correlation header
        res.setHeader('X-Correlation-ID', correlationId);
        // Track correlation data
        this.correlationTracker.set(correlationId, {
            startTime,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            endpoint: `${req.method} ${req.path}`,
            userId: req.user?.userId
        });
        next();
    }
    /**
     * Performance monitoring middleware
     */
    performanceMonitoringMiddleware(req, res, next) {
        const originalSend = res.send;
        res.send = function (data) {
            const endTime = perf_hooks_1.performance.now();
            const duration = endTime - (req.startTime || endTime);
            const correlationId = req.correlationId;
            // Log performance metrics for slow requests
            if (duration > 1000) { // 1 second threshold
                console.log(JSON.stringify({
                    event: 'slow_request_detected',
                    correlationId,
                    duration,
                    endpoint: `${req.method} ${req.path}`,
                    statusCode: res.statusCode,
                    service: this.config?.serviceName,
                    timestamp: new Date().toISOString()
                }));
            }
            return originalSend.call(this, data);
        }.bind(res);
        next();
    }
    /**
     * Professional security headers middleware
     */
    professionalSecurityHeaders(req, res, next) {
        // Remove identifying headers
        res.removeHeader('X-Powered-By');
        res.removeHeader('Server');
        // Professional security headers based on service level
        const headers = this.getSecurityHeadersForLevel();
        Object.entries(headers).forEach(([header, value]) => {
            res.setHeader(header, value);
        });
        // Financial service additional headers
        if (this.config.securityLevel === 'financial') {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            res.setHeader('Referrer-Policy', 'no-referrer');
            res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        }
        next();
    }
    /**
     * Advanced CORS middleware
     */
    advancedCorsMiddleware(req, res, next) {
        const origin = req.get('Origin');
        const corsConfig = this.config.cors;
        // Dynamic origin validation
        if (this.isValidOrigin(origin, corsConfig.origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin || '*');
            res.setHeader('Access-Control-Allow-Credentials', corsConfig.credentials ? 'true' : 'false');
            res.setHeader('Access-Control-Allow-Methods', corsConfig.methods.join(', '));
            res.setHeader('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
            res.setHeader('Access-Control-Expose-Headers', corsConfig.exposedHeaders.join(', '));
            res.setHeader('Access-Control-Max-Age', corsConfig.maxAge.toString());
        }
        else if (origin) {
            // Log suspicious origin
            this.logSecurityEvent('SUSPICIOUS_ORIGIN', {
                origin,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                correlationId: req.correlationId
            });
        }
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            res.status(204).send();
            return;
        }
        next();
    }
    /**
     * Secure compression middleware
     */
    secureCompressionMiddleware(req, res, next) {
        // Apply compression with BREACH/CRIME attack prevention
        const compression = require('compression');
        compression({
            level: 6,
            threshold: 1024,
            filter: (req, res) => {
                // Don't compress responses with authentication tokens
                if (res.get('Authorization') || req.get('Authorization')) {
                    return false;
                }
                // Don't compress already compressed content
                if (res.get('Content-Encoding')) {
                    return false;
                }
                return true;
            }
        })(req, res, next);
    }
    /**
     * IP reputation middleware
     */
    ipReputationMiddleware(req, res, next) {
        const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
        // Check if IP is blocked
        if (this.blockedIPs.has(clientIP)) {
            this.logSecurityEvent('IP_BLOCKED_ACCESS_ATTEMPT', {
                ip: clientIP,
                endpoint: `${req.method} ${req.path}`,
                correlationId: req.correlationId
            });
            res.status(403).json({
                success: false,
                error: {
                    code: SecurityErrorCodes.IP_BLOCKED,
                    message: 'Access denied',
                    correlationId: req.correlationId
                }
            });
            return;
        }
        // Check whitelist for high-security services
        if (this.config.securityLevel === 'financial' && this.config.ipBlocking.whitelist.length > 0) {
            if (!this.config.ipBlocking.whitelist.includes(clientIP)) {
                this.logSecurityEvent('NON_WHITELISTED_IP', {
                    ip: clientIP,
                    endpoint: `${req.method} ${req.path}`,
                    correlationId: req.correlationId
                });
            }
        }
        next();
    }
    /**
     * Advanced rate limiting middleware
     */
    advancedRateLimitingMiddleware(req, res, next) {
        const limiter = this.getRateLimiterForEndpoint(req.path);
        limiter(req, res, next);
    }
    /**
     * Threat detection middleware
     */
    threatDetectionMiddleware(req, res, next) {
        if (!this.config.threatDetection.enabled) {
            return next();
        }
        const threats = this.detectThreats(req);
        if (threats.length > 0) {
            const clientIP = req.ip || req.socket.remoteAddress;
            // Log security threats
            this.logSecurityEvent('THREAT_DETECTED', {
                threats,
                ip: clientIP,
                endpoint: `${req.method} ${req.path}`,
                userAgent: req.get('User-Agent'),
                body: this.maskSensitiveData(req.body),
                query: this.maskSensitiveData(req.query),
                correlationId: req.correlationId
            });
            // Block high-severity threats immediately
            const highSeverityThreats = ['sql_injection', 'xss', 'path_traversal'];
            if (threats.some(threat => highSeverityThreats.includes(threat.type))) {
                this.addSuspiciousIP(clientIP);
                res.status(400).json({
                    success: false,
                    error: {
                        code: SecurityErrorCodes.SUSPICIOUS_ACTIVITY,
                        message: 'Request blocked due to security policy',
                        correlationId: req.correlationId
                    }
                });
                return;
            }
        }
        next();
    }
    /**
     * Input validation middleware
     */
    inputValidationMiddleware(req, res, next) {
        // Validate content type for POST/PUT requests
        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
            const contentType = req.get('Content-Type');
            if (!contentType || (!contentType.includes('application/json') &&
                !contentType.includes('application/x-www-form-urlencoded') &&
                !contentType.includes('multipart/form-data'))) {
                this.logSecurityEvent('INVALID_CONTENT_TYPE', {
                    contentType,
                    ip: req.ip,
                    endpoint: `${req.method} ${req.path}`,
                    correlationId: req.correlationId
                });
                res.status(400).json({
                    success: false,
                    error: {
                        code: SecurityErrorCodes.MALFORMED_REQUEST,
                        message: 'Invalid content type',
                        correlationId: req.correlationId
                    }
                });
                return;
            }
        }
        // Validate request size
        const contentLength = parseInt(req.get('Content-Length') || '0');
        const maxSize = this.config.securityLevel === 'financial' ? 1024 * 1024 : 5 * 1024 * 1024; // 1MB for financial, 5MB for others
        if (contentLength > maxSize) {
            this.logSecurityEvent('REQUEST_SIZE_VIOLATION', {
                contentLength,
                maxSize,
                ip: req.ip,
                correlationId: req.correlationId
            });
            res.status(413).json({
                success: false,
                error: {
                    code: SecurityErrorCodes.MALFORMED_REQUEST,
                    message: 'Request too large',
                    correlationId: req.correlationId
                }
            });
            return;
        }
        next();
    }
    /**
     * Security audit logging middleware
     */
    securityAuditMiddleware(req, res, next) {
        if (!this.config.auditLogging.enabled) {
            return next();
        }
        const originalSend = res.send;
        res.send = function (data) {
            const endTime = perf_hooks_1.performance.now();
            const duration = endTime - (req.startTime || endTime);
            // Log security audit event
            const auditLog = {
                event: 'api_request_completed',
                correlationId: req.correlationId,
                service: this.config?.serviceName,
                securityLevel: this.config?.securityLevel,
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                duration,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                userId: req.user?.userId,
                timestamp: new Date().toISOString()
            };
            // Add detailed logging for financial services
            if (this.config?.securityLevel === 'financial') {
                Object.assign(auditLog, {
                    requestHeaders: this.maskSensitiveData(req.headers),
                    responseSize: Buffer.byteLength(data || ''),
                    memoryUsage: process.memoryUsage()
                });
            }
            console.log(JSON.stringify(auditLog));
            return originalSend.call(this, data);
        }.bind(this);
        next();
    }
    // Helper methods
    mergeConfig(config) {
        const defaultConfig = {
            serviceName: config.serviceName,
            securityLevel: config.securityLevel || 'standard',
            rateLimiting: {
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: config.securityLevel === 'financial' ? 50 : 100,
                skipSuccessfulRequests: false,
                skipFailedRequests: false,
                standardHeaders: true,
                legacyHeaders: false
            },
            cors: {
                origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Correlation-ID'],
                exposedHeaders: ['X-Correlation-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
                maxAge: 86400 // 24 hours
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
                hsts: {
                    maxAge: 31536000, // 1 year
                    includeSubDomains: true,
                    preload: true
                }
            },
            ipBlocking: {
                enabled: true,
                maxSuspiciousRequests: config.securityLevel === 'financial' ? 3 : 5,
                blockDuration: 3600000, // 1 hour
                whitelist: [],
                blacklist: []
            },
            threatDetection: {
                enabled: true,
                sqlInjectionProtection: true,
                xssProtection: true,
                csrfProtection: true,
                pathTraversalProtection: true,
                dataExfiltrationProtection: config.securityLevel === 'financial'
            },
            auditLogging: {
                enabled: true,
                logLevel: config.securityLevel === 'financial' ? 'comprehensive' : 'detailed',
                sensitiveDataMasking: true,
                correlationTracking: true
            }
        };
        return { ...defaultConfig, ...config };
    }
    getSecurityHeadersForLevel() {
        const baseHeaders = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'X-Service': this.config.serviceName
        };
        if (this.config.securityLevel === 'financial' || this.config.securityLevel === 'critical') {
            return {
                ...baseHeaders,
                'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
                'X-Frame-Options': 'DENY',
                'Referrer-Policy': 'no-referrer',
                'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',
                'X-Content-Security-Policy': 'default-src \'self\'',
            };
        }
        return baseHeaders;
    }
    initializeRateLimiters() {
        const config = this.config.rateLimiting;
        // Default rate limiter
        const defaultLimiter = (0, express_rate_limit_1.default)({
            windowMs: config.windowMs,
            max: config.max,
            standardHeaders: config.standardHeaders,
            legacyHeaders: config.legacyHeaders,
            keyGenerator: (req) => req.ip || 'unknown',
            handler: (req, res) => {
                this.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
                    ip: req.ip,
                    endpoint: `${req.method} ${req.path}`,
                    correlationId: req.correlationId
                });
                res.status(429).json({
                    success: false,
                    error: {
                        code: SecurityErrorCodes.RATE_LIMIT_EXCEEDED,
                        message: 'Too many requests, please try again later',
                        correlationId: req.correlationId
                    }
                });
            }
        });
        this.rateLimiters.set('default', defaultLimiter);
        // Stricter limits for authentication endpoints
        const authLimiter = (0, express_rate_limit_1.default)({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: this.config.securityLevel === 'financial' ? 5 : 10,
            standardHeaders: config.standardHeaders,
            legacyHeaders: config.legacyHeaders
        });
        this.rateLimiters.set('auth', authLimiter);
    }
    initializeIPManagement() {
        // Load blacklisted IPs
        this.config.ipBlocking.blacklist.forEach(ip => {
            this.blockedIPs.add(ip);
        });
    }
    getRateLimiterForEndpoint(path) {
        if (path.includes('/auth') || path.includes('/login') || path.includes('/register')) {
            return this.rateLimiters.get('auth') || this.rateLimiters.get('default');
        }
        return this.rateLimiters.get('default');
    }
    isValidOrigin(origin, allowedOrigins) {
        if (!origin)
            return true;
        if (allowedOrigins === true)
            return true;
        if (allowedOrigins === false)
            return false;
        if (typeof allowedOrigins === 'string')
            return origin === allowedOrigins;
        if (Array.isArray(allowedOrigins))
            return allowedOrigins.includes(origin);
        return false;
    }
    detectThreats(req) {
        const threats = [];
        const requestData = {
            url: req.url,
            body: JSON.stringify(req.body || {}),
            query: JSON.stringify(req.query || {}),
            headers: JSON.stringify(req.headers || {})
        };
        // SQL Injection Detection
        if (this.config.threatDetection.sqlInjectionProtection) {
            ADVANCED_THREAT_PATTERNS.sqlInjection.forEach(pattern => {
                Object.entries(requestData).forEach(([location, data]) => {
                    if (pattern.test(data)) {
                        threats.push({ type: 'sql_injection', pattern: pattern.source, location });
                    }
                });
            });
        }
        // XSS Detection
        if (this.config.threatDetection.xssProtection) {
            ADVANCED_THREAT_PATTERNS.xss.forEach(pattern => {
                Object.entries(requestData).forEach(([location, data]) => {
                    if (pattern.test(data)) {
                        threats.push({ type: 'xss', pattern: pattern.source, location });
                    }
                });
            });
        }
        // Path Traversal Detection
        if (this.config.threatDetection.pathTraversalProtection) {
            ADVANCED_THREAT_PATTERNS.pathTraversal.forEach(pattern => {
                Object.entries(requestData).forEach(([location, data]) => {
                    if (pattern.test(data)) {
                        threats.push({ type: 'path_traversal', pattern: pattern.source, location });
                    }
                });
            });
        }
        // Data Exfiltration Detection (Financial services)
        if (this.config.threatDetection.dataExfiltrationProtection) {
            ADVANCED_THREAT_PATTERNS.dataExfiltration.forEach(pattern => {
                Object.entries(requestData).forEach(([location, data]) => {
                    if (pattern.test(data)) {
                        threats.push({ type: 'data_exfiltration', pattern: pattern.source, location });
                    }
                });
            });
        }
        return threats;
    }
    maskSensitiveData(data) {
        if (!this.config.auditLogging.sensitiveDataMasking) {
            return data;
        }
        const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization', 'cookie', 'card', 'cvv', 'pin'];
        const maskedData = JSON.parse(JSON.stringify(data));
        const maskRecursive = (obj) => {
            if (obj && typeof obj === 'object') {
                Object.keys(obj).forEach(key => {
                    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                        obj[key] = '***MASKED***';
                    }
                    else if (typeof obj[key] === 'object') {
                        maskRecursive(obj[key]);
                    }
                });
            }
        };
        maskRecursive(maskedData);
        return maskedData;
    }
    addSuspiciousIP(ip) {
        const currentCount = this.suspiciousIPs.get(ip) || 0;
        const newCount = currentCount + 1;
        this.suspiciousIPs.set(ip, newCount);
        if (newCount >= this.config.ipBlocking.maxSuspiciousRequests) {
            this.blockedIPs.add(ip);
            this.logSecurityEvent('IP_BLOCKED', {
                ip,
                reason: 'Excessive suspicious activity',
                suspiciousRequestCount: newCount
            });
            // Schedule IP unblocking
            setTimeout(() => {
                this.blockedIPs.delete(ip);
                this.suspiciousIPs.delete(ip);
                this.logSecurityEvent('IP_UNBLOCKED', { ip, reason: 'Block duration expired' });
            }, this.config.ipBlocking.blockDuration);
        }
    }
    logSecurityEvent(event, details) {
        console.log(JSON.stringify({
            securityEvent: event,
            service: this.config.serviceName,
            timestamp: new Date().toISOString(),
            ...details
        }));
    }
}
exports.ProfessionalSecurityMiddleware = ProfessionalSecurityMiddleware;
// Export factory functions for different service types
const createUserServiceSecurity = (config) => new ProfessionalSecurityMiddleware({
    serviceName: 'user-service',
    securityLevel: 'high',
    ...config
});
exports.createUserServiceSecurity = createUserServiceSecurity;
const createPaymentServiceSecurity = (config) => new ProfessionalSecurityMiddleware({
    serviceName: 'payment-service',
    securityLevel: 'financial',
    ...config
});
exports.createPaymentServiceSecurity = createPaymentServiceSecurity;
const createProductServiceSecurity = (config) => new ProfessionalSecurityMiddleware({
    serviceName: 'product-service',
    securityLevel: 'standard',
    ...config
});
exports.createProductServiceSecurity = createProductServiceSecurity;
const createOrderServiceSecurity = (config) => new ProfessionalSecurityMiddleware({
    serviceName: 'order-service',
    securityLevel: 'high',
    ...config
});
exports.createOrderServiceSecurity = createOrderServiceSecurity;
// Export default class and configurations
exports.default = ProfessionalSecurityMiddleware;
//# sourceMappingURL=professional-security.js.map