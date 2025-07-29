"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityHeaders = exports.rateLimitByUser = exports.requireVerified = exports.requireModerator = exports.requireAdmin = exports.requirePermission = exports.requireRole = exports.optionalAuthMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errors_1.UnauthorizedError('No token provided');
        }
        const token = authHeader.substring(7);
        if (!token) {
            throw new errors_1.UnauthorizedError('No token provided');
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            logger_1.logger.error('JWT_SECRET environment variable is not set');
            throw new Error('Server configuration error');
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        if (!decoded.verified) {
            throw new errors_1.UnauthorizedError('Account not verified');
        }
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            verified: decoded.verified,
            permissions: decoded.permissions || [],
        };
        logger_1.logger.info('User authenticated successfully', {
            userId: decoded.id,
            email: decoded.email,
            role: decoded.role,
            route: req.path,
        });
        next();
    }
    catch (error) {
        logger_1.logger.error('Authentication error:', error);
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                message: 'Invalid token',
                error: 'INVALID_TOKEN',
            });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                success: false,
                message: 'Token expired',
                error: 'TOKEN_EXPIRED',
            });
            return;
        }
        if (error instanceof errors_1.UnauthorizedError) {
            res.status(401).json({
                success: false,
                message: error.message,
                error: 'UNAUTHORIZED',
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Authentication failed',
            error: 'AUTH_ERROR',
        });
    }
};
exports.authMiddleware = authMiddleware;
const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            next();
            return;
        }
        const token = authHeader.substring(7);
        if (!token) {
            next();
            return;
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            logger_1.logger.error('JWT_SECRET environment variable is not set');
            next();
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            verified: decoded.verified,
            permissions: decoded.permissions || [],
        };
        logger_1.logger.info('Optional authentication successful', {
            userId: decoded.id,
            email: decoded.email,
            role: decoded.role,
            route: req.path,
        });
        next();
    }
    catch (error) {
        logger_1.logger.warn('Optional authentication failed:', error);
        next();
    }
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new errors_1.UnauthorizedError('Authentication required');
            }
            const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
            if (!roles.includes(req.user.role)) {
                throw new errors_1.ForbiddenError(`Access denied. Required role: ${roles.join(' or ')}`);
            }
            logger_1.logger.info('Role authorization successful', {
                userId: req.user.id,
                userRole: req.user.role,
                requiredRoles: roles,
                route: req.path,
            });
            next();
        }
        catch (error) {
            logger_1.logger.error('Role authorization error:', error);
            if (error instanceof errors_1.UnauthorizedError) {
                res.status(401).json({
                    success: false,
                    message: error.message,
                    error: 'UNAUTHORIZED',
                });
                return;
            }
            if (error instanceof errors_1.ForbiddenError) {
                res.status(403).json({
                    success: false,
                    message: error.message,
                    error: 'FORBIDDEN',
                });
                return;
            }
            res.status(500).json({
                success: false,
                message: 'Authorization failed',
                error: 'AUTH_ERROR',
            });
        }
    };
};
exports.requireRole = requireRole;
const requirePermission = (permission) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new errors_1.UnauthorizedError('Authentication required');
            }
            const userPermissions = req.user.permissions || [];
            if (!userPermissions.includes(permission)) {
                throw new errors_1.ForbiddenError(`Access denied. Required permission: ${permission}`);
            }
            logger_1.logger.info('Permission authorization successful', {
                userId: req.user.id,
                userPermissions,
                requiredPermission: permission,
                route: req.path,
            });
            next();
        }
        catch (error) {
            logger_1.logger.error('Permission authorization error:', error);
            if (error instanceof errors_1.UnauthorizedError) {
                res.status(401).json({
                    success: false,
                    message: error.message,
                    error: 'UNAUTHORIZED',
                });
                return;
            }
            if (error instanceof errors_1.ForbiddenError) {
                res.status(403).json({
                    success: false,
                    message: error.message,
                    error: 'FORBIDDEN',
                });
                return;
            }
            res.status(500).json({
                success: false,
                message: 'Authorization failed',
                error: 'AUTH_ERROR',
            });
        }
    };
};
exports.requirePermission = requirePermission;
exports.requireAdmin = (0, exports.requireRole)(['admin', 'super_admin']);
exports.requireModerator = (0, exports.requireRole)(['admin', 'super_admin', 'moderator']);
const requireVerified = (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Authentication required');
        }
        if (!req.user.verified) {
            throw new errors_1.ForbiddenError('Account verification required');
        }
        logger_1.logger.info('Verification check successful', {
            userId: req.user.id,
            verified: req.user.verified,
            route: req.path,
        });
        next();
    }
    catch (error) {
        logger_1.logger.error('Verification check error:', error);
        if (error instanceof errors_1.UnauthorizedError) {
            res.status(401).json({
                success: false,
                message: error.message,
                error: 'UNAUTHORIZED',
            });
            return;
        }
        if (error instanceof errors_1.ForbiddenError) {
            res.status(403).json({
                success: false,
                message: error.message,
                error: 'FORBIDDEN',
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Verification check failed',
            error: 'AUTH_ERROR',
        });
    }
};
exports.requireVerified = requireVerified;
const rateLimitByUser = (maxRequests, windowMs) => {
    const userRequestCounts = new Map();
    return (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                next();
                return;
            }
            const now = Date.now();
            const userKey = `user:${userId}`;
            const userData = userRequestCounts.get(userKey);
            if (!userData || now > userData.resetTime) {
                userRequestCounts.set(userKey, {
                    count: 1,
                    resetTime: now + windowMs,
                });
                next();
                return;
            }
            if (userData.count >= maxRequests) {
                logger_1.logger.warn('Rate limit exceeded for user', {
                    userId,
                    count: userData.count,
                    maxRequests,
                    route: req.path,
                });
                res.status(429).json({
                    success: false,
                    message: 'Rate limit exceeded',
                    error: 'RATE_LIMIT_EXCEEDED',
                    retryAfter: Math.ceil((userData.resetTime - now) / 1000),
                });
                return;
            }
            userData.count++;
            userRequestCounts.set(userKey, userData);
            next();
        }
        catch (error) {
            logger_1.logger.error('Rate limiting error:', error);
            next();
        }
    };
};
exports.rateLimitByUser = rateLimitByUser;
const securityHeaders = (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.removeHeader('X-Powered-By');
    next();
};
exports.securityHeaders = securityHeaders;
exports.default = exports.authMiddleware;
//# sourceMappingURL=auth.middleware.js.map