"use strict";
/**
 * 🛡️ Ultra Professional CORS & Security Configuration
 * UltraMarket E-commerce Platform
 *
 * Bu fayl comprehensive CORS policy va security headers ni
 * professional tarzda manage qiladi
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ultraSecurityManager = exports.securityUtils = exports.securitySetup = exports.UltraProfessionalSecurityManager = void 0;
exports.createSecurityManager = createSecurityManager;
const tslib_1 = require("tslib");
const cors_1 = tslib_1.__importDefault(require("cors"));
const helmet_1 = tslib_1.__importDefault(require("helmet"));
/**
 * 🌟 Ultra Professional CORS & Security Manager
 */
class UltraProfessionalSecurityManager {
    environment;
    corsConfig;
    securityConfig;
    constructor(environment = 'development') {
        this.environment = environment;
        this.corsConfig = this.getDefaultCorsConfig();
        this.securityConfig = this.getDefaultSecurityConfig();
    }
    /**
     * 🔧 Get default CORS configuration
     */
    getDefaultCorsConfig() {
        const baseConfig = {
            allowedOrigins: ['http://localhost:3000'], // Default value
            allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
            allowedHeaders: [
                'Origin',
                'X-Requested-With',
                'Content-Type',
                'Accept',
                'Authorization',
                'X-API-Key',
                'X-Session-ID',
                'X-Request-ID',
                'X-Client-Version',
                'X-Device-ID',
                'Cache-Control',
                'Pragma'
            ],
            exposedHeaders: [
                'X-Total-Count',
                'X-Page-Count',
                'X-Current-Page',
                'X-Request-ID',
                'X-Response-Time',
                'X-Rate-Limit-Limit',
                'X-Rate-Limit-Remaining',
                'X-Rate-Limit-Reset'
            ],
            credentials: true,
            maxAge: 86400, // 24 hours
            optionsSuccessStatus: 200,
            preflightContinue: false
        };
        // Environment-specific origins
        switch (this.environment) {
            case 'development':
                baseConfig.allowedOrigins = [
                    'http://localhost:3000',
                    'http://localhost:3001',
                    'http://localhost:3002',
                    'http://127.0.0.1:3000',
                    'http://127.0.0.1:3001',
                    'http://127.0.0.1:3002',
                    'https://localhost:3000',
                    'https://localhost:3001',
                    'https://localhost:3002'
                ];
                break;
            case 'staging':
                baseConfig.allowedOrigins = [
                    'https://staging.ultramarket.uz',
                    'https://staging-admin.ultramarket.uz',
                    'https://staging-api.ultramarket.uz'
                ];
                break;
            case 'production':
                baseConfig.allowedOrigins = [
                    'https://ultramarket.uz',
                    'https://www.ultramarket.uz',
                    'https://admin.ultramarket.uz',
                    'https://api.ultramarket.uz',
                    'https://mobile.ultramarket.uz'
                ];
                break;
            case 'test':
                baseConfig.allowedOrigins = ['*'];
                break;
            default:
                baseConfig.allowedOrigins = ['http://localhost:3000'];
        }
        return baseConfig;
    }
    /**
     * 🛡️ Get default security configuration
     */
    getDefaultSecurityConfig() {
        const isDevelopment = this.environment === 'development';
        const isProduction = this.environment === 'production';
        return {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: isDevelopment
                        ? ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:"]
                        : ["'self'", "https://cdn.ultramarket.uz"],
                    styleSrc: isDevelopment
                        ? ["'self'", "'unsafe-inline'", "https:"]
                        : ["'self'", "https://cdn.ultramarket.uz"],
                    imgSrc: ["'self'", "data:", "https:", "blob:"],
                    fontSrc: ["'self'", "https:", "data:"],
                    connectSrc: isDevelopment
                        ? ["'self'", "ws:", "wss:", "http:", "https:"]
                        : ["'self'", "https://api.ultramarket.uz", "wss://ws.ultramarket.uz"],
                    mediaSrc: ["'self'", "https:", "blob:"],
                    objectSrc: ["'none'"],
                    childSrc: ["'self'"],
                    workerSrc: ["'self'", "blob:"],
                    frameAncestors: ["'none'"],
                    formAction: ["'self'"],
                    upgradeInsecureRequests: isProduction ? [] : undefined
                },
                reportOnly: isDevelopment,
                reportUri: isProduction ? 'https://api.ultramarket.uz/security/csp-report' : undefined
            },
            frameOptions: 'DENY',
            xssProtection: true,
            contentTypeOptions: true,
            referrerPolicy: 'strict-origin-when-cross-origin',
            permissionsPolicy: {
                geolocation: ["'none'"],
                microphone: ["'none'"],
                camera: ["'none'"],
                magnetometer: ["'none'"],
                gyroscope: ["'none'"],
                fullscreen: ["'self'"],
                payment: isProduction ? ["'self'", "https://click.uz", "https://payme.uz"] : ["'self'"]
            },
            strictTransportSecurity: {
                maxAge: 31536000, // 1 year
                includeSubDomains: true,
                preload: true
            },
            expectCertificateTransparency: isProduction,
            crossOriginEmbedderPolicy: isProduction,
            crossOriginOpenerPolicy: isProduction,
            crossOriginResourcePolicy: 'same-origin'
        };
    }
    /**
     * 🎯 Create CORS middleware
     */
    createCorsMiddleware() {
        const corsOptions = {
            origin: (origin, callback) => {
                // Allow requests with no origin (mobile apps, Postman, etc.)
                if (!origin) {
                    return callback(null, true);
                }
                // Check if origin is allowed
                if (this.corsConfig.allowedOrigins.includes('*') ||
                    this.corsConfig.allowedOrigins.includes(origin)) {
                    return callback(null, true);
                }
                // Dynamic origin checking for subdomains in production
                if (this.environment === 'production') {
                    const allowedDomains = ['ultramarket.uz'];
                    const originUrl = new URL(origin);
                    const isSubdomain = allowedDomains.some(domain => originUrl.hostname === domain || originUrl.hostname.endsWith(`.${domain}`));
                    if (isSubdomain && originUrl.protocol === 'https:') {
                        return callback(null, true);
                    }
                }
                // Log blocked origin for security monitoring
                console.warn(`🚫 CORS blocked origin: ${origin}`, {
                    environment: this.environment,
                    allowedOrigins: this.corsConfig.allowedOrigins,
                    timestamp: new Date().toISOString()
                });
                return callback(new Error(`Origin ${origin} not allowed by CORS policy`), false);
            },
            methods: this.corsConfig.allowedMethods,
            allowedHeaders: this.corsConfig.allowedHeaders,
            exposedHeaders: this.corsConfig.exposedHeaders,
            credentials: this.corsConfig.credentials,
            maxAge: this.corsConfig.maxAge,
            optionsSuccessStatus: this.corsConfig.optionsSuccessStatus,
            preflightContinue: this.corsConfig.preflightContinue
        };
        return (0, cors_1.default)(corsOptions);
    }
    /**
     * 🛡️ Create security headers middleware
     */
    createSecurityMiddleware() {
        const helmetOptions = {
            contentSecurityPolicy: {
                directives: this.securityConfig.contentSecurityPolicy.directives,
                reportOnly: this.securityConfig.contentSecurityPolicy.reportOnly,
                ...(this.securityConfig.contentSecurityPolicy.reportUri && {
                    reportUri: this.securityConfig.contentSecurityPolicy.reportUri
                })
            },
            frameguard: {
                action: this.securityConfig.frameOptions === 'DENY' ? 'deny' :
                    this.securityConfig.frameOptions === 'SAMEORIGIN' ? 'sameorigin' :
                        'deny'
            },
            xssFilter: this.securityConfig.xssProtection,
            noSniff: this.securityConfig.contentTypeOptions,
            referrerPolicy: {
                policy: this.securityConfig.referrerPolicy
            },
            permissionsPolicy: {
                features: this.securityConfig.permissionsPolicy
            },
            hsts: this.environment === 'production' ? {
                maxAge: this.securityConfig.strictTransportSecurity.maxAge,
                includeSubDomains: this.securityConfig.strictTransportSecurity.includeSubDomains,
                preload: this.securityConfig.strictTransportSecurity.preload
            } : false,
            expectCt: this.securityConfig.expectCertificateTransparency ? {
                enforce: true,
                maxAge: 86400
            } : false,
            crossOriginEmbedderPolicy: this.securityConfig.crossOriginEmbedderPolicy,
            crossOriginOpenerPolicy: this.securityConfig.crossOriginOpenerPolicy ? { policy: 'same-origin' } : false,
            crossOriginResourcePolicy: { policy: this.securityConfig.crossOriginResourcePolicy }
        };
        return (0, helmet_1.default)(helmetOptions);
    }
    /**
     * 🚨 Security monitoring middleware
     */
    createSecurityMonitoringMiddleware() {
        return (req, res, next) => {
            // Add security headers
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            res.setHeader('X-Powered-By', 'UltraMarket Security Engine');
            // Rate limiting headers
            if (req.rateLimit) {
                res.setHeader('X-RateLimit-Limit', req.rateLimit.limit);
                res.setHeader('X-RateLimit-Remaining', req.rateLimit.remaining);
                res.setHeader('X-RateLimit-Reset', req.rateLimit.resetTime.toString());
            }
            // Request ID for tracing
            const requestId = req.headers['x-request-id'] ||
                req.headers['x-correlation-id'] ||
                generateRequestId();
            res.setHeader('X-Request-ID', requestId);
            // Response time tracking
            const startTime = Date.now();
            res.on('finish', () => {
                const responseTime = Date.now() - startTime;
                res.setHeader('X-Response-Time', `${responseTime}ms`);
                // Log security events
                if (res.statusCode >= 400) {
                    console.warn('🚨 Security Event:', {
                        method: req.method,
                        url: req.originalUrl,
                        statusCode: res.statusCode,
                        ip: req.ip,
                        userAgent: req.get('User-Agent'),
                        responseTime,
                        requestId,
                        timestamp: new Date().toISOString()
                    });
                }
            });
            next();
        };
    }
    /**
     * 🌐 Create API-specific CORS middleware
     */
    createApiCorsMiddleware() {
        const apiCorsOptions = {
            ...this.createCorsMiddleware(),
            exposedHeaders: [
                ...this.corsConfig.exposedHeaders,
                'X-API-Version',
                'X-Deprecated',
                'X-Feature-Flags'
            ]
        };
        return (0, cors_1.default)(apiCorsOptions);
    }
    /**
     * 📱 Create mobile app CORS middleware
     */
    createMobileCorsMiddleware() {
        const mobileCorsOptions = {
            origin: true, // Allow all origins for mobile apps
            methods: this.corsConfig.allowedMethods,
            allowedHeaders: [
                ...this.corsConfig.allowedHeaders,
                'X-Mobile-Version',
                'X-App-Version',
                'X-Platform',
                'X-Device-Model'
            ],
            credentials: true,
            maxAge: this.corsConfig.maxAge
        };
        return (0, cors_1.default)(mobileCorsOptions);
    }
    /**
     * 🔧 Update CORS configuration
     */
    updateCorsConfig(config) {
        this.corsConfig = { ...this.corsConfig, ...config };
    }
    /**
     * 🛡️ Update security configuration
     */
    updateSecurityConfig(config) {
        this.securityConfig = { ...this.securityConfig, ...config };
    }
    /**
     * 📊 Get current configuration
     */
    getConfiguration() {
        return {
            environment: this.environment,
            cors: this.corsConfig,
            security: this.securityConfig
        };
    }
    /**
     * 🚨 CSP Violation Report Handler
     */
    createCSPReportHandler() {
        return (req, res) => {
            const report = req.body;
            console.error('🚨 CSP Violation Report:', {
                report,
                userAgent: req.get('User-Agent'),
                ip: req.ip,
                timestamp: new Date().toISOString()
            });
            // In production, you might want to send this to a monitoring service
            if (this.environment === 'production') {
                // Send to monitoring service
                // await sendToMonitoringService(report);
            }
            res.status(204).send();
        };
    }
}
exports.UltraProfessionalSecurityManager = UltraProfessionalSecurityManager;
/**
 * 🎲 Generate unique request ID
 */
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
/**
 * 🌟 Create environment-specific security manager
 */
function createSecurityManager(environment) {
    const env = environment || process.env.NODE_ENV || 'development';
    return new UltraProfessionalSecurityManager(env);
}
/**
 * 🚀 Quick setup functions
 */
exports.securitySetup = {
    development: () => createSecurityManager('development'),
    staging: () => createSecurityManager('staging'),
    production: () => createSecurityManager('production'),
    test: () => createSecurityManager('test')
};
/**
 * 📊 Security utilities
 */
exports.securityUtils = {
    validateOrigin: (origin, allowedOrigins) => {
        if (allowedOrigins.includes('*'))
            return true;
        if (allowedOrigins.includes(origin))
            return true;
        // Check for subdomain patterns
        try {
            const originUrl = new URL(origin);
            return allowedOrigins.some(allowed => {
                if (allowed.startsWith('*.')) {
                    const domain = allowed.substring(2);
                    return originUrl.hostname === domain || originUrl.hostname.endsWith(`.${domain}`);
                }
                return false;
            });
        }
        catch {
            return false;
        }
    },
    isSecureContext: (req) => {
        return req.secure ||
            req.headers['x-forwarded-proto'] === 'https' ||
            req.hostname === 'localhost';
    },
    extractClientInfo: (req) => ({
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        origin: req.get('Origin'),
        referer: req.get('Referer'),
        forwardedFor: req.get('X-Forwarded-For'),
        realIp: req.get('X-Real-IP')
    })
};
/**
 * 🌟 Global security manager instance
 */
exports.ultraSecurityManager = createSecurityManager();
exports.default = {
    UltraProfessionalSecurityManager,
    createSecurityManager,
    securitySetup: exports.securitySetup,
    securityUtils: exports.securityUtils,
    ultraSecurityManager: exports.ultraSecurityManager
};
//# sourceMappingURL=ultra-professional-cors-security.js.map