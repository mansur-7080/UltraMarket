"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenIfNeeded = exports.requireSelfAccess = exports.requireSuperAdmin = exports.requireAdmin = exports.requirePermission = exports.requireRole = exports.optionalAuth = exports.authenticateToken = exports.AuthorizationError = exports.AuthenticationError = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
class AuthenticationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthorizationError';
    }
}
exports.AuthorizationError = AuthorizationError;
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({
                success: false,
                error: 'Access token required',
                code: 'TOKEN_MISSING',
            });
            return;
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            logger_1.logger.error('JWT_SECRET not configured');
            res.status(500).json({
                success: false,
                error: 'Authentication configuration error',
            });
            return;
        }
        const decoded = jwt.verify(token, jwtSecret);
        const isBlacklisted = await checkTokenBlacklist(token);
        if (isBlacklisted) {
            res.status(401).json({
                success: false,
                error: 'Token has been revoked',
                code: 'TOKEN_REVOKED',
            });
            return;
        }
        req.user = {
            id: decoded.id || decoded.userId,
            email: decoded.email,
            role: decoded.role,
            permissions: decoded.permissions || [],
            sessionId: decoded.sessionId,
        };
        logger_1.logger.info('User authenticated successfully', {
            userId: req.user.id,
            role: req.user.role,
            endpoint: req.originalUrl,
        });
        next();
    }
    catch (error) {
        logger_1.logger.error('Authentication error:', error);
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                error: 'Invalid token',
                code: 'TOKEN_INVALID',
            });
            return;
        }
        else if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                success: false,
                error: 'Token expired',
                code: 'TOKEN_EXPIRED',
            });
            return;
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Authentication failed',
            });
            return;
        }
    }
};
exports.authenticateToken = authenticateToken;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            next();
            return;
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            next();
            return;
        }
        const decoded = jwt.verify(token, jwtSecret);
        const isBlacklisted = await checkTokenBlacklist(token);
        if (isBlacklisted) {
            next();
            return;
        }
        req.user = {
            id: decoded.id || decoded.userId,
            email: decoded.email,
            role: decoded.role,
            permissions: decoded.permissions || [],
            sessionId: decoded.sessionId,
        };
        next();
    }
    catch (error) {
        logger_1.logger.warn('Optional authentication failed:', error);
        next();
    }
};
exports.optionalAuth = optionalAuth;
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
                code: 'AUTH_REQUIRED',
            });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
                code: 'INSUFFICIENT_ROLE',
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
const requirePermission = (requiredPermissions) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
                code: 'AUTH_REQUIRED',
            });
            return;
        }
        const hasPermission = requiredPermissions.some((permission) => req.user.permissions.includes(permission));
        if (!hasPermission) {
            res.status(403).json({
                success: false,
                error: `Access denied. Required permissions: ${requiredPermissions.join(', ')}`,
                code: 'INSUFFICIENT_PERMISSION',
            });
            return;
        }
        next();
    };
};
exports.requirePermission = requirePermission;
exports.requireAdmin = (0, exports.requireRole)(['ADMIN', 'SUPER_ADMIN']);
exports.requireSuperAdmin = (0, exports.requireRole)(['SUPER_ADMIN']);
const requireSelfAccess = (userIdParam = 'id') => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
                code: 'AUTH_REQUIRED',
            });
            return;
        }
        const resourceUserId = req.params[userIdParam];
        if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') {
            next();
            return;
        }
        if (req.user.id !== resourceUserId) {
            res.status(403).json({
                success: false,
                error: 'Access denied. You can only access your own resources',
                code: 'SELF_ACCESS_ONLY',
            });
            return;
        }
        next();
    };
};
exports.requireSelfAccess = requireSelfAccess;
async function checkTokenBlacklist(token) {
    try {
        const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3002';
        const response = await axios_1.default.post(`${authServiceUrl}/api/v1/auth/verify-token`, {
            token,
        }, {
            timeout: 5000,
        });
        return response.data.blacklisted === true;
    }
    catch (error) {
        logger_1.logger.warn('Failed to check token blacklist:', error);
        return false;
    }
}
const refreshTokenIfNeeded = async (req, res, next) => {
    try {
        if (!req.user) {
            next();
            return;
        }
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            next();
            return;
        }
        const decoded = jwt.decode(token);
        const now = Math.floor(Date.now() / 1000);
        const timeToExpire = decoded.exp - now;
        if (timeToExpire < 300) {
            try {
                const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3002';
                const response = await axios_1.default.post(`${authServiceUrl}/api/v1/auth/refresh`, {}, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    timeout: 5000,
                });
                if (response.data.success && response.data.data.accessToken) {
                    res.setHeader('X-New-Token', response.data.data.accessToken);
                }
            }
            catch (error) {
                logger_1.logger.warn('Failed to refresh token:', error);
            }
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Token refresh middleware error:', error);
        next();
    }
};
exports.refreshTokenIfNeeded = refreshTokenIfNeeded;
//# sourceMappingURL=auth.middleware.js.map