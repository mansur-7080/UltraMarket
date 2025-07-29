"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityMiddleware = exports.xssProtection = exports.sqlInjectionProtection = exports.SecurityCrypto = exports.SecurityAudit = exports.SecurityValidator = exports.securityHeaders = exports.rateLimitConfigs = void 0;
const tslib_1 = require("tslib");
const express_rate_limit_1 = tslib_1.__importDefault(require("express-rate-limit"));
const helmet_1 = tslib_1.__importDefault(require("helmet"));
const crypto_1 = tslib_1.__importDefault(require("crypto"));
const bcryptjs_1 = tslib_1.__importDefault(require("bcryptjs"));
const logger_1 = require("../logging/logger");
// Rate limiting configurations
exports.rateLimitConfigs = {
    // General API rate limiting
    general: (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: {
            error: 'Too many requests from this IP, please try again later.',
            retryAfter: 15 * 60,
        },
        standardHeaders: true,
        legacyHeaders: false,
    }),
    // Authentication rate limiting (stricter)
    auth: (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // limit each IP to 5 login attempts per windowMs
        message: {
            error: 'Too many login attempts from this IP, please try again later.',
            retryAfter: 15 * 60,
        },
        skipSuccessfulRequests: true,
    }),
    // File upload rate limiting
    fileUpload: (0, express_rate_limit_1.default)({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 50, // 50 file uploads per hour
        message: {
            error: 'Too many file upload attempts.',
            retryAfter: 60 * 60,
        },
    }),
};
// Security headers configuration
exports.securityHeaders = (0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
});
// Input validation utilities
class SecurityValidator {
    // Validate email format
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 254;
    }
    // Validate phone number (Uzbekistan format)
    static isValidUzbekPhone(phone) {
        const uzbekPhoneRegex = /^\+998[0-9]{9}$/;
        return uzbekPhoneRegex.test(phone);
    }
    // Validate password strength
    static isStrongPassword(password) {
        return (password.length >= 8 &&
            /[A-Z]/.test(password) &&
            /[a-z]/.test(password) &&
            /[0-9]/.test(password) &&
            /[!@#$%^&*]/.test(password));
    }
    // Sanitize string input
    static sanitizeString(input) {
        if (!input || typeof input !== 'string')
            return '';
        return input.trim().replace(/[<>]/g, '').replace(/['"]/g, '').substring(0, 1000);
    }
}
exports.SecurityValidator = SecurityValidator;
// Security audit logging
class SecurityAudit {
    static logSecurityEvent(event, details) {
        logger_1.logger.warn('Security Event', {
            event,
            timestamp: new Date().toISOString(),
            ...details,
        });
    }
    static logAuthAttempt(email, ip, success) {
        this.logSecurityEvent('AUTH_ATTEMPT', {
            email,
            ip,
            success,
        });
    }
    static logSuspiciousActivity(description, ip) {
        this.logSecurityEvent('SUSPICIOUS_ACTIVITY', {
            description,
            ip,
        });
    }
}
exports.SecurityAudit = SecurityAudit;
// Encryption utilities
class SecurityCrypto {
    // Hash password
    static async hashPassword(password) {
        const saltRounds = 12;
        return bcryptjs_1.default.hash(password, saltRounds);
    }
    // Verify password
    static async verifyPassword(password, hash) {
        return bcryptjs_1.default.compare(password, hash);
    }
    // Generate secure token
    static generateSecureToken(length = 32) {
        return crypto_1.default.randomBytes(length).toString('hex');
    }
    // Generate API key
    static generateApiKey() {
        const prefix = 'uk_';
        const randomPart = crypto_1.default.randomBytes(24).toString('hex');
        return `${prefix}${randomPart}`;
    }
}
exports.SecurityCrypto = SecurityCrypto;
// SQL injection protection middleware
const sqlInjectionProtection = (req, res, next) => {
    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
        /(--|#|\/\*|\*\/)/,
        /['";\x00\x1a]/,
    ];
    const checkSqlInjection = (obj) => {
        if (typeof obj === 'string') {
            return sqlPatterns.some((pattern) => pattern.test(obj));
        }
        if (typeof obj === 'object' && obj !== null) {
            return Object.values(obj).some((value) => checkSqlInjection(value));
        }
        return false;
    };
    if (checkSqlInjection(req.body) || checkSqlInjection(req.query)) {
        SecurityAudit.logSecurityEvent('SQL_INJECTION_ATTEMPT', {
            ip: req.ip,
            endpoint: req.path,
            method: req.method,
        });
        res.status(400).json({
            success: false,
            error: 'Invalid request detected',
        });
        return;
    }
    next();
};
exports.sqlInjectionProtection = sqlInjectionProtection;
// XSS protection middleware
const xssProtection = (req, res, next) => {
    const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /javascript:/gi,
    ];
    const sanitizeObject = (obj) => {
        if (typeof obj === 'string') {
            let sanitized = obj;
            xssPatterns.forEach((pattern) => {
                sanitized = sanitized.replace(pattern, '');
            });
            return sanitized;
        }
        if (typeof obj === 'object' && obj !== null) {
            const sanitized = Array.isArray(obj) ? [] : {};
            for (const [key, value] of Object.entries(obj)) {
                sanitized[key] = sanitizeObject(value);
            }
            return sanitized;
        }
        return obj;
    };
    req.body = sanitizeObject(req.body);
    req.query = sanitizeObject(req.query);
    next();
};
exports.xssProtection = xssProtection;
// Export security middleware bundle
exports.securityMiddleware = {
    rateLimit: exports.rateLimitConfigs,
    headers: exports.securityHeaders,
    sqlInjectionProtection: exports.sqlInjectionProtection,
    xssProtection: exports.xssProtection,
};
//# sourceMappingURL=security-hardening.js.map