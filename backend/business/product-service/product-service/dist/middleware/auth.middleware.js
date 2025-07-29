"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireVendor = exports.requireAdmin = exports.validateToken = void 0;
const tslib_1 = require("tslib");
const jsonwebtoken_1 = tslib_1.__importDefault(require("jsonwebtoken"));
const error_middleware_1 = require("./error.middleware");
const logger_1 = require("../utils/logger");
// Validate JWT token
const validateToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new error_middleware_1.UnauthorizedError('Access token required');
        }
        const token = authHeader.substring(7);
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET not configured');
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = {
            userId: decoded.userId || decoded.id,
            email: decoded.email,
            role: decoded.role || 'CUSTOMER',
        };
        logger_1.logger.debug('User authenticated successfully', {
            userId: req.user.userId,
            role: req.user.role,
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
exports.validateToken = validateToken;
// Require admin role
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return next(new error_middleware_1.UnauthorizedError('Authentication required'));
    }
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
        return next(new error_middleware_1.ForbiddenError('Admin access required'));
    }
    next();
};
exports.requireAdmin = requireAdmin;
// Require vendor role
const requireVendor = (req, res, next) => {
    if (!req.user) {
        return next(new error_middleware_1.UnauthorizedError('Authentication required'));
    }
    if (!['VENDOR', 'ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return next(new error_middleware_1.ForbiddenError('Vendor access required'));
    }
    next();
};
exports.requireVendor = requireVendor;
// Optional authentication (doesn't throw error if no token)
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }
        const token = authHeader.substring(7);
        if (!process.env.JWT_SECRET) {
            return next();
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = {
            userId: decoded.userId || decoded.id,
            email: decoded.email,
            role: decoded.role || 'CUSTOMER',
        };
        next();
    }
    catch (error) {
        // Ignore authentication errors for optional auth
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.middleware.js.map