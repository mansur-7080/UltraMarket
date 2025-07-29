"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfessionalJWTConfig = exports.AuthError = exports.requireRole = exports.authenticateToken = exports.authMiddleware = exports.requireOrderManagement = exports.requireSystemAccess = exports.requireUserManagement = exports.requireCustomer = exports.requireVendor = exports.requireSuperAdmin = exports.requireAdmin = exports.professionalRequirePermissions = exports.professionalAuthorize = exports.professionalAuthMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../utils/logger");
class ProfessionalJWTConfig {
    static instance;
    accessSecret;
    refreshSecret;
    issuer;
    audience;
    constructor() {
        this.accessSecret = this.getRequiredEnvVar('JWT_ACCESS_SECRET', 'JWT_SECRET');
        this.refreshSecret = this.getRequiredEnvVar('JWT_REFRESH_SECRET', 'JWT_SECRET');
        this.issuer = process.env['JWT_ISSUER'] || 'UltraMarket-Auth';
        this.audience = process.env['JWT_AUDIENCE'] || 'ultramarket.uz';
        this.validateSecrets();
    }
    static getInstance() {
        if (!ProfessionalJWTConfig.instance) {
            ProfessionalJWTConfig.instance = new ProfessionalJWTConfig();
        }
        return ProfessionalJWTConfig.instance;
    }
    getRequiredEnvVar(primary, fallback) {
        const value = process.env[primary] || (fallback ? process.env[fallback] : undefined);
        if (!value) {
            const envVarName = fallback ? `${primary} or ${fallback}` : primary;
            throw new Error(`🚨 CRITICAL: ${envVarName} environment variable is required`);
        }
        return value;
    }
    validateSecrets() {
        if (this.accessSecret.length < 32) {
            logger_1.logger.warn('⚠️ JWT access secret is weak (< 32 characters)', {
                length: this.accessSecret.length
            });
        }
        if (this.refreshSecret.length < 32) {
            logger_1.logger.warn('⚠️ JWT refresh secret is weak (< 32 characters)', {
                length: this.refreshSecret.length
            });
        }
        logger_1.logger.info('✅ JWT configuration validated', {
            issuer: this.issuer,
            audience: this.audience,
            secretsConfigured: true
        });
    }
}
exports.ProfessionalJWTConfig = ProfessionalJWTConfig;
class AuthError extends Error {
    statusCode;
    constructor(message, statusCode = 401) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AuthError';
    }
}
exports.AuthError = AuthError;
const professionalAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AuthError('Authorization header with Bearer token required');
        }
        const token = authHeader.substring(7).trim();
        if (!token) {
            throw new AuthError('JWT token is required');
        }
        const config = ProfessionalJWTConfig.getInstance();
        const verifyOptions = {
            issuer: config.issuer,
            audience: config.audience,
            algorithms: ['HS256'],
            clockTolerance: 30
        };
        const decoded = jsonwebtoken_1.default.verify(token, config.accessSecret, verifyOptions);
        if (decoded.tokenType && decoded.tokenType !== 'access') {
            throw new AuthError('Invalid token type for authentication');
        }
        if (!decoded.userId || !decoded.email || !decoded.role) {
            throw new AuthError('Invalid token payload structure');
        }
        req.user = decoded;
        logger_1.logger.debug('✅ Authentication successful', {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            sessionId: decoded.sessionId,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        next();
    }
    catch (error) {
        logger_1.logger.error('❌ Authentication failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            url: req.url,
            method: req.method
        });
        let statusCode = 401;
        let message = 'Authentication failed';
        let shouldRefresh = false;
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            message = 'Token has expired';
            shouldRefresh = true;
            logger_1.logger.info('🕒 Token expired, refresh suggested', {
                ip: req.ip
            });
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            message = 'Invalid token format';
            logger_1.logger.warn('🔍 Invalid JWT token detected', {
                error: error.message,
                ip: req.ip
            });
        }
        else if (error instanceof AuthError) {
            statusCode = error.statusCode;
            message = error.message;
        }
        res.status(statusCode).json({
            success: false,
            error: {
                code: statusCode === 401 ? 'AUTHENTICATION_FAILED' : 'AUTHORIZATION_FAILED',
                message,
                shouldRefresh,
                timestamp: new Date().toISOString()
            }
        });
    }
};
exports.professionalAuthMiddleware = professionalAuthMiddleware;
const professionalAuthorize = (requiredRoles) => {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            logger_1.logger.warn('🔒 Authorization attempted without authentication', {
                ip: req.ip,
                url: req.url
            });
            res.status(401).json({
                success: false,
                error: {
                    code: 'AUTHENTICATION_REQUIRED',
                    message: 'Authentication required for authorization',
                    timestamp: new Date().toISOString()
                }
            });
            return;
        }
        if (!roles.includes(user.role)) {
            logger_1.logger.warn('🚫 Authorization failed - insufficient role', {
                userId: user.userId,
                userRole: user.role,
                requiredRoles: roles,
                ip: req.ip,
                url: req.url
            });
            res.status(403).json({
                success: false,
                error: {
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: 'Insufficient role permissions',
                    requiredRoles: roles,
                    userRole: user.role,
                    timestamp: new Date().toISOString()
                }
            });
            return;
        }
        logger_1.logger.debug('✅ Authorization successful', {
            userId: user.userId,
            role: user.role,
            requiredRoles: roles
        });
        next();
    };
};
exports.professionalAuthorize = professionalAuthorize;
const professionalRequirePermissions = (requiredPermissions) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'AUTHENTICATION_REQUIRED',
                    message: 'Authentication required',
                    timestamp: new Date().toISOString()
                }
            });
            return;
        }
        const userPermissions = user.permissions || [];
        const hasAllPermissions = requiredPermissions.every(permission => userPermissions.includes(permission) || userPermissions.includes('*'));
        if (!hasAllPermissions) {
            logger_1.logger.warn('🔐 Permission check failed', {
                userId: user.userId,
                userPermissions,
                requiredPermissions,
                ip: req.ip
            });
            res.status(403).json({
                success: false,
                error: {
                    code: 'MISSING_PERMISSIONS',
                    message: 'Required permissions not found',
                    requiredPermissions,
                    timestamp: new Date().toISOString()
                }
            });
            return;
        }
        next();
    };
};
exports.professionalRequirePermissions = professionalRequirePermissions;
exports.requireAdmin = (0, exports.professionalAuthorize)(['ADMIN', 'SUPER_ADMIN']);
exports.requireSuperAdmin = (0, exports.professionalAuthorize)('SUPER_ADMIN');
exports.requireVendor = (0, exports.professionalAuthorize)(['VENDOR', 'ADMIN', 'SUPER_ADMIN']);
exports.requireCustomer = (0, exports.professionalAuthorize)(['CUSTOMER', 'ADMIN', 'SUPER_ADMIN']);
exports.requireUserManagement = (0, exports.professionalRequirePermissions)(['user:read', 'user:write']);
exports.requireSystemAccess = (0, exports.professionalRequirePermissions)(['system:admin']);
exports.requireOrderManagement = (0, exports.professionalRequirePermissions)(['order:read', 'order:write']);
exports.authMiddleware = exports.professionalAuthMiddleware;
exports.authenticateToken = exports.professionalAuthMiddleware;
const requireRole = (roles) => (0, exports.professionalAuthorize)(roles);
exports.requireRole = requireRole;
//# sourceMappingURL=auth.middleware.js.map