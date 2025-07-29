"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateToken = exports.optionalAuth = exports.requirePermission = exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger = console;
const getJWTManager = () => ({
    verifyToken: async (token, type) => {
        const secret = process.env['JWT_SECRET'] || 'fallback-secret';
        return jsonwebtoken_1.default.verify(token, secret);
    }
});
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required',
            });
        }
        const jwtManager = getJWTManager();
        const decoded = await jwtManager.verifyToken(token, 'access');
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            permissions: decoded.permissions,
            sessionId: decoded.sessionId,
            deviceId: decoded.deviceId,
            ipAddress: decoded.ipAddress,
            userAgent: decoded.userAgent,
        };
        return next();
    }
    catch (error) {
        logger.error('Token authentication failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token',
        });
    }
};
exports.authenticateToken = authenticateToken;
const requireRole = (roles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
        }
        if (!roles.includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions',
            });
        }
        return next();
    };
};
exports.requireRole = requireRole;
const requirePermission = (permissions) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
        }
        if (user.role === 'SUPER_ADMIN') {
            return next();
        }
        const hasPermission = permissions.some((permission) => user.permissions.includes(permission) || user.permissions.includes('*'));
        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions',
            });
        }
        next();
    };
};
exports.requirePermission = requirePermission;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return next();
        }
        const jwtManager = getJWTManager();
        const decoded = await jwtManager.verifyToken(token, 'access');
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            permissions: decoded.permissions,
            sessionId: decoded.sessionId,
            deviceId: decoded.deviceId,
            ipAddress: decoded.ipAddress,
            userAgent: decoded.userAgent,
        };
        next();
    }
    catch (error) {
        logger.debug('Optional authentication failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        next();
    }
};
exports.optionalAuth = optionalAuth;
const validateToken = async (token) => {
    try {
        const jwtManager = getJWTManager();
        return await jwtManager.verifyToken(token, 'access');
    }
    catch (error) {
        throw new Error('Invalid token');
    }
};
exports.validateToken = validateToken;
//# sourceMappingURL=auth.js.map