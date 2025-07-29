"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSeller = exports.requireAdmin = exports.requireRole = exports.authenticateToken = void 0;
const auth_1 = require("@ultramarket/shared/auth");
const errors_1 = require("@ultramarket/shared/errors");
const logger_1 = require("@ultramarket/shared/logging/logger");
const authenticateToken = async (req, res, next) => {
    try {
        const token = (0, auth_1.extractTokenFromHeader)(req.headers.authorization);
        const payload = (0, auth_1.verifyAccessToken)(token);
        req.user = {
            id: payload.userId,
            email: payload.email,
            role: payload.role,
        };
        logger_1.logger.info('Token authenticated successfully', {
            userId: payload.userId,
            email: payload.email,
            operation: 'token_authentication',
        });
        next();
    }
    catch (error) {
        logger_1.logger.error('Token authentication failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            operation: 'token_authentication',
        });
        next(new errors_1.UnauthorizedError('Invalid or expired token'));
    }
};
exports.authenticateToken = authenticateToken;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errors_1.UnauthorizedError('Authentication required'));
        }
        if (!roles.includes(req.user.role)) {
            logger_1.logger.warn('Insufficient permissions', {
                userId: req.user.id,
                userRole: req.user.role,
                requiredRoles: roles,
                operation: 'role_check',
            });
            return next(new errors_1.UnauthorizedError('Insufficient permissions'));
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)(['ADMIN', 'SUPER_ADMIN']);
exports.requireSeller = (0, exports.requireRole)(['SELLER', 'ADMIN', 'SUPER_ADMIN']);
//# sourceMappingURL=authMiddleware.js.map