"use strict";
/**
 * 🔐 Ultra Professional Authentication Middleware
 * UltraMarket E-commerce Platform
 *
 * Bu fayl barcha servislar uchun unified authentication middleware
 * va professional security features ni ta'minlaydi
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityHeaders = exports.createRateLimiter = exports.requirePermissions = exports.requireRole = exports.authenticateToken = exports.ultraAuthManager = exports.UltraProfessionalAuthManager = exports.RateLimitExceededError = exports.InsufficientPermissionsError = exports.TokenInvalidError = exports.TokenExpiredError = exports.UltraAuthError = void 0;
const tslib_1 = require("tslib");
const jsonwebtoken_1 = tslib_1.__importDefault(require("jsonwebtoken"));
const express_rate_limit_1 = tslib_1.__importDefault(require("express-rate-limit"));
const ultra_professional_logger_1 = require("../logging/ultra-professional-logger");
/**
 * 🚨 Authentication Errors
 */
class UltraAuthError extends Error {
    statusCode;
    code;
    details;
    constructor(message, statusCode = 401, code = 'AUTH_ERROR', details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = 'UltraAuthError';
    }
}
exports.UltraAuthError = UltraAuthError;
class TokenExpiredError extends UltraAuthError {
    constructor(message = 'Token expired') {
        super(message, 401, 'TOKEN_EXPIRED');
    }
}
exports.TokenExpiredError = TokenExpiredError;
class TokenInvalidError extends UltraAuthError {
    constructor(message = 'Invalid token') {
        super(message, 401, 'TOKEN_INVALID');
    }
}
exports.TokenInvalidError = TokenInvalidError;
class InsufficientPermissionsError extends UltraAuthError {
    constructor(message = 'Insufficient permissions') {
        super(message, 403, 'INSUFFICIENT_PERMISSIONS');
    }
}
exports.InsufficientPermissionsError = InsufficientPermissionsError;
class RateLimitExceededError extends UltraAuthError {
    constructor(message = 'Rate limit exceeded') {
        super(message, 429, 'RATE_LIMIT_EXCEEDED');
    }
}
exports.RateLimitExceededError = RateLimitExceededError;
/**
 * 🏭 Ultra Professional Auth Manager
 */
class UltraProfessionalAuthManager {
    config;
    blacklistedTokens = new Set();
    activeSessions = new Map();
    constructor(config = {}) {
        this.config = {
            jwtAccessSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || '',
            jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || '',
            issuer: process.env.JWT_ISSUER || 'UltraMarket',
            audience: process.env.JWT_AUDIENCE || 'ultramarket.uz',
            accessTokenExpiry: '15m',
            refreshTokenExpiry: '7d',
            enableRateLimit: true,
            rateLimitWindow: 15 * 60 * 1000, // 15 minutes
            rateLimitMax: 100,
            enableSessionTracking: true,
            enableDeviceTracking: true,
            maxConcurrentSessions: 5,
            securityHeaders: true,
            enableAuditLogging: true,
            ...config
        };
        this.validateConfig();
        this.startCleanupTasks();
    }
    /**
     * 🔍 Validate configuration
     */
    validateConfig() {
        if (!this.config.jwtAccessSecret) {
            throw new Error('JWT_ACCESS_SECRET is required');
        }
        if (this.config.jwtAccessSecret.length < 32) {
            ultra_professional_logger_1.log.warn('JWT secret is weak (less than 32 characters)', {
                secretLength: this.config.jwtAccessSecret.length,
                service: 'auth-manager'
            });
        }
        if (!this.config.jwtRefreshSecret) {
            this.config.jwtRefreshSecret = this.config.jwtAccessSecret;
            ultra_professional_logger_1.log.warn('JWT_REFRESH_SECRET not set, using JWT_ACCESS_SECRET', {
                service: 'auth-manager'
            });
        }
        ultra_professional_logger_1.log.info('Ultra Professional Auth Manager initialized', {
            service: 'auth-manager',
            issuer: this.config.issuer,
            audience: this.config.audience,
            rateLimitEnabled: this.config.enableRateLimit,
            sessionTrackingEnabled: this.config.enableSessionTracking
        });
    }
    /**
     * ⏰ Start cleanup tasks
     */
    startCleanupTasks() {
        // Clean up blacklisted tokens every hour
        setInterval(() => {
            this.cleanupExpiredTokens();
        }, 60 * 60 * 1000);
        // Clean up inactive sessions every 30 minutes
        setInterval(() => {
            this.cleanupInactiveSessions();
        }, 30 * 60 * 1000);
    }
    /**
     * 🧹 Clean up expired tokens
     */
    cleanupExpiredTokens() {
        const expiredTokens = [];
        this.blacklistedTokens.forEach(token => {
            try {
                jsonwebtoken_1.default.verify(token, this.config.jwtAccessSecret);
            }
            catch (error) {
                if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                    expiredTokens.push(token);
                }
            }
        });
        expiredTokens.forEach(token => {
            this.blacklistedTokens.delete(token);
        });
        if (expiredTokens.length > 0) {
            ultra_professional_logger_1.log.info(`Cleaned up ${expiredTokens.length} expired blacklisted tokens`, {
                service: 'auth-manager',
                cleanedCount: expiredTokens.length
            });
        }
    }
    /**
     * 🧹 Clean up inactive sessions
     */
    cleanupInactiveSessions() {
        // Implementation for session cleanup
        // This would typically involve checking last activity times
        ultra_professional_logger_1.log.debug('Session cleanup task executed', {
            service: 'auth-manager',
            activeSessions: this.activeSessions.size
        });
    }
    /**
     * 🔑 Generate JWT Token
     */
    generateAccessToken(payload) {
        const tokenPayload = {
            ...payload,
            tokenType: 'access',
            iss: this.config.issuer,
            aud: this.config.audience
        };
        const token = jsonwebtoken_1.default.sign(tokenPayload, this.config.jwtAccessSecret, {
            expiresIn: this.config.accessTokenExpiry,
            issuer: this.config.issuer,
            audience: this.config.audience
        });
        ultra_professional_logger_1.log.security('Access token generated', {
            securityEvent: 'AUTH_SUCCESS',
            riskLevel: 'LOW',
            userId: payload.userId,
            role: payload.role,
            sessionId: payload.sessionId,
            service: 'auth-manager'
        });
        return token;
    }
    /**
     * 🔄 Generate Refresh Token
     */
    generateRefreshToken(payload) {
        const tokenPayload = {
            ...payload,
            tokenType: 'refresh',
            iss: this.config.issuer,
            aud: this.config.audience
        };
        const token = jsonwebtoken_1.default.sign(tokenPayload, this.config.jwtRefreshSecret, {
            expiresIn: this.config.refreshTokenExpiry,
            issuer: this.config.issuer,
            audience: this.config.audience
        });
        return token;
    }
    /**
     * 🔍 Verify Access Token
     */
    verifyAccessToken(token) {
        if (this.blacklistedTokens.has(token)) {
            throw new TokenInvalidError('Token has been blacklisted');
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.config.jwtAccessSecret, {
                issuer: this.config.issuer,
                audience: this.config.audience
            });
            if (decoded.tokenType !== 'access') {
                throw new TokenInvalidError('Invalid token type');
            }
            return decoded;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                ultra_professional_logger_1.log.security('Expired token usage attempt', {
                    securityEvent: 'AUTH_FAILURE',
                    riskLevel: 'LOW',
                    error: 'Token expired',
                    service: 'auth-manager'
                });
                throw new TokenExpiredError();
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                ultra_professional_logger_1.log.security('Invalid token usage attempt', {
                    securityEvent: 'AUTH_FAILURE',
                    riskLevel: 'MEDIUM',
                    error: error.message,
                    service: 'auth-manager'
                });
                throw new TokenInvalidError(error.message);
            }
            throw error;
        }
    }
    /**
     * 🔄 Verify Refresh Token
     */
    verifyRefreshToken(token) {
        if (this.blacklistedTokens.has(token)) {
            throw new TokenInvalidError('Refresh token has been blacklisted');
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.config.jwtRefreshSecret, {
                issuer: this.config.issuer,
                audience: this.config.audience
            });
            if (decoded.tokenType !== 'refresh') {
                throw new TokenInvalidError('Invalid refresh token type');
            }
            return decoded;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new TokenExpiredError('Refresh token expired');
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new TokenInvalidError(error.message);
            }
            throw error;
        }
    }
    /**
     * 🚫 Blacklist token
     */
    blacklistToken(token) {
        this.blacklistedTokens.add(token);
        ultra_professional_logger_1.log.security('Token blacklisted', {
            securityEvent: 'AUTH_FAILURE',
            riskLevel: 'MEDIUM',
            action: 'Token blacklisted',
            service: 'auth-manager'
        });
    }
    /**
     * 👥 Track session
     */
    trackSession(userId, sessionId) {
        if (!this.config.enableSessionTracking)
            return;
        if (!this.activeSessions.has(userId)) {
            this.activeSessions.set(userId, new Set());
        }
        const userSessions = this.activeSessions.get(userId);
        userSessions.add(sessionId);
        // Enforce max concurrent sessions
        if (userSessions.size > this.config.maxConcurrentSessions) {
            const sessions = Array.from(userSessions);
            const oldestSession = sessions[0];
            userSessions.delete(oldestSession);
            ultra_professional_logger_1.log.security('Max concurrent sessions exceeded, removed oldest session', {
                securityEvent: 'ADMIN_ACTION',
                riskLevel: 'LOW',
                userId,
                removedSessionId: oldestSession,
                activeSessions: userSessions.size,
                service: 'auth-manager'
            });
        }
    }
    /**
     * 🚪 Remove session
     */
    removeSession(userId, sessionId) {
        if (!this.config.enableSessionTracking)
            return;
        const userSessions = this.activeSessions.get(userId);
        if (userSessions) {
            userSessions.delete(sessionId);
            if (userSessions.size === 0) {
                this.activeSessions.delete(userId);
            }
        }
    }
    /**
     * 🔍 Check permissions
     */
    checkPermissions(userPermissions, requiredPermissions) {
        return requiredPermissions.every(permission => userPermissions.includes(permission));
    }
    /**
     * 🔍 Check role access
     */
    checkRoleAccess(userRole, allowedRoles) {
        return allowedRoles.includes(userRole);
    }
}
exports.UltraProfessionalAuthManager = UltraProfessionalAuthManager;
/**
 * 🌟 Global Auth Manager Instance
 */
exports.ultraAuthManager = new UltraProfessionalAuthManager();
/**
 * 🛡️ Authentication Middleware
 */
const authenticateToken = (required = true) => {
    return async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                if (required) {
                    ultra_professional_logger_1.log.security('Missing or invalid authorization header', {
                        securityEvent: 'AUTH_FAILURE',
                        riskLevel: 'MEDIUM',
                        ip: req.ip,
                        userAgent: req.get('User-Agent'),
                        url: req.originalUrl,
                        service: 'auth-middleware'
                    });
                    res.status(401).json({
                        success: false,
                        error: 'Missing or invalid authorization header',
                        code: 'MISSING_TOKEN'
                    });
                    return;
                }
                else {
                    next();
                    return;
                }
            }
            const token = authHeader.substring(7);
            const decoded = exports.ultraAuthManager.verifyAccessToken(token);
            // Track session
            if (decoded.sessionId) {
                exports.ultraAuthManager.trackSession(decoded.userId, decoded.sessionId);
            }
            req.user = decoded;
            req.sessionId = decoded.sessionId;
            ultra_professional_logger_1.log.security('Authentication successful', {
                securityEvent: 'AUTH_SUCCESS',
                riskLevel: 'LOW',
                userId: decoded.userId,
                role: decoded.role,
                sessionId: decoded.sessionId,
                ip: req.ip,
                service: 'auth-middleware'
            });
            next();
        }
        catch (error) {
            if (error instanceof UltraAuthError) {
                ultra_professional_logger_1.log.security(`Authentication failed: ${error.message}`, {
                    securityEvent: 'AUTH_FAILURE',
                    riskLevel: error.code === 'TOKEN_EXPIRED' ? 'LOW' : 'MEDIUM',
                    error: error.message,
                    code: error.code,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    url: req.originalUrl,
                    service: 'auth-middleware'
                });
                res.status(error.statusCode).json({
                    success: false,
                    error: error.message,
                    code: error.code
                });
                return;
            }
            ultra_professional_logger_1.log.error('Unexpected authentication error', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                service: 'auth-middleware'
            });
            res.status(500).json({
                success: false,
                error: 'Internal authentication error',
                code: 'INTERNAL_ERROR'
            });
        }
    };
};
exports.authenticateToken = authenticateToken;
/**
 * 🔐 Role-based Access Control
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
            return;
        }
        if (!exports.ultraAuthManager.checkRoleAccess(req.user.role, allowedRoles)) {
            ultra_professional_logger_1.log.security('Role access denied', {
                securityEvent: 'PERMISSION_DENIED',
                riskLevel: 'HIGH',
                userId: req.user.userId,
                userRole: req.user.role,
                requiredRoles: allowedRoles,
                ip: req.ip,
                url: req.originalUrl,
                service: 'auth-middleware'
            });
            res.status(403).json({
                success: false,
                error: 'Insufficient role permissions',
                code: 'INSUFFICIENT_ROLE'
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
/**
 * 🔑 Permission-based Access Control
 */
const requirePermissions = (requiredPermissions) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
            return;
        }
        if (!exports.ultraAuthManager.checkPermissions(req.user.permissions, requiredPermissions)) {
            ultra_professional_logger_1.log.security('Permission access denied', {
                securityEvent: 'PERMISSION_DENIED',
                riskLevel: 'HIGH',
                userId: req.user.userId,
                userPermissions: req.user.permissions,
                requiredPermissions,
                ip: req.ip,
                url: req.originalUrl,
                service: 'auth-middleware'
            });
            res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
            return;
        }
        next();
    };
};
exports.requirePermissions = requirePermissions;
/**
 * 🚦 Rate Limiting Middleware
 */
const createRateLimiter = (options = {}) => {
    return (0, express_rate_limit_1.default)({
        windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
        max: options.max || 100,
        message: {
            success: false,
            error: options.message || 'Too many requests, please try again later',
            code: 'RATE_LIMIT_EXCEEDED'
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            ultra_professional_logger_1.log.security('Rate limit exceeded', {
                securityEvent: 'SUSPICIOUS_ACTIVITY',
                riskLevel: 'MEDIUM',
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                url: req.originalUrl,
                service: 'rate-limiter'
            });
            res.status(429).json({
                success: false,
                error: options.message || 'Too many requests, please try again later',
                code: 'RATE_LIMIT_EXCEEDED'
            });
        }
    });
};
exports.createRateLimiter = createRateLimiter;
/**
 * 🛡️ Security Headers Middleware
 */
const securityHeaders = (req, res, next) => {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        res.setHeader('Content-Security-Policy', "default-src 'self'");
    }
    next();
};
exports.securityHeaders = securityHeaders;
/**
 * 📊 Export utilities
 */
exports.default = {
    ultraAuthManager: exports.ultraAuthManager,
    authenticateToken: exports.authenticateToken,
    requireRole: exports.requireRole,
    requirePermissions: exports.requirePermissions,
    createRateLimiter: exports.createRateLimiter,
    securityHeaders: exports.securityHeaders
};
//# sourceMappingURL=ultra-professional-auth-middleware.js.map