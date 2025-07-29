"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeSelfOrAdmin = exports.authorize = exports.optionalAuth = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const redis_1 = require("redis");
const error_middleware_1 = require("./error.middleware");
const logger_1 = require("../utils/logger");
const redis = (0, redis_1.createClient)({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});
redis.connect().catch((err) => {
    logger_1.logger.error('Redis connection failed:', err);
});
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new error_middleware_1.UnauthorizedError('Authorization header is required');
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new error_middleware_1.UnauthorizedError('Token is required');
        }
        const isBlacklisted = await redis.get(`blacklist:${token}`);
        if (isBlacklisted) {
            throw new error_middleware_1.UnauthorizedError('Token has been revoked');
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            sessionId: decoded.sessionId,
        };
        logger_1.logger.info('User authenticated successfully', {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            next(new error_middleware_1.UnauthorizedError('Invalid token'));
        }
        else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            next(new error_middleware_1.UnauthorizedError('Token expired'));
        }
        else {
            next(error);
        }
    }
};
exports.authenticate = authenticate;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return next();
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            return next();
        }
        const isBlacklisted = await redis.get(`blacklist:${token}`);
        if (isBlacklisted) {
            return next();
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            sessionId: decoded.sessionId,
        };
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new error_middleware_1.UnauthorizedError('Authentication required'));
        }
        if (!roles.includes(req.user.role)) {
            logger_1.logger.warn('Authorization failed', {
                userId: req.user.userId,
                userRole: req.user.role,
                requiredRoles: roles,
                ip: req.ip,
                path: req.path,
            });
            return next(new error_middleware_1.ForbiddenError('Insufficient permissions'));
        }
        next();
    };
};
exports.authorize = authorize;
const authorizeSelfOrAdmin = (userIdParam = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new error_middleware_1.UnauthorizedError('Authentication required'));
        }
        const requestedUserId = req.params[userIdParam];
        const isOwner = req.user.userId === requestedUserId;
        const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
        if (!isOwner && !isAdmin) {
            logger_1.logger.warn('Self-access authorization failed', {
                userId: req.user.userId,
                requestedUserId,
                userRole: req.user.role,
                ip: req.ip,
                path: req.path,
            });
            return next(new error_middleware_1.ForbiddenError('Can only access own resources'));
        }
        next();
    };
};
exports.authorizeSelfOrAdmin = authorizeSelfOrAdmin;
//# sourceMappingURL=auth.middleware.js.map