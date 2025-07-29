"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkTokenExpiration = exports.validateTokenFormat = exports.logAuthAttempt = exports.authRateLimit = exports.optionalAuth = exports.requireVendorOrAdmin = exports.requireAdmin = exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger = console;
const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required',
            });
        }
        const accessTokenSecret = process.env['JWT_ACCESS_SECRET'] || 'access-secret';
        return jsonwebtoken_1.default.verify(token, accessTokenSecret, (err, decoded) => {
            if (err) {
                logger.warn('Token verification failed', { error: err.message });
                return res.status(403).json({
                    success: false,
                    message: 'Invalid or expired token',
                });
            }
            req.user = decoded;
            return next();
        });
    }
    catch (error) {
        logger.error('Authentication middleware error', { error });
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};
exports.authenticateToken = authenticateToken;
const requireRole = (roles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }
            if (!roles.includes(req.user.role)) {
                logger.warn('Access denied: Insufficient role', {
                    userId: req.user.userId,
                    userRole: req.user.role,
                    requiredRoles: roles,
                });
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions',
                });
            }
            return next();
        }
        catch (error) {
            logger.error('Role check middleware error', { error });
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    };
};
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)(['admin']);
exports.requireVendorOrAdmin = (0, exports.requireRole)(['vendor', 'admin']);
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            const accessTokenSecret = process.env['JWT_ACCESS_SECRET'] || 'access-secret';
            jsonwebtoken_1.default.verify(token, accessTokenSecret, (err, decoded) => {
                if (!err) {
                    req.user = decoded;
                }
                return next();
            });
        }
        else {
            return next();
        }
    }
    catch (error) {
        logger.error('Optional auth middleware error', { error });
        return next();
    }
};
exports.optionalAuth = optionalAuth;
const authRateLimit = (req, res, next) => {
    return next();
};
exports.authRateLimit = authRateLimit;
const logAuthAttempt = (req, res, next) => {
    const startTime = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const status = res.statusCode;
        const method = req.method;
        const path = req.path;
        const ip = req.ip || req.connection.remoteAddress;
        logger.info('Authentication attempt', {
            method,
            path,
            status,
            duration,
            ip,
            userAgent: req.get('User-Agent'),
        });
    });
    return next();
};
exports.logAuthAttempt = logAuthAttempt;
const validateTokenFormat = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token format. Use Bearer token.',
        });
    }
    return next();
};
exports.validateTokenFormat = validateTokenFormat;
const checkTokenExpiration = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            const decoded = jsonwebtoken_1.default.decode(token);
            if (decoded && decoded.exp) {
                const expirationTime = decoded.exp * 1000;
                const currentTime = Date.now();
                if (currentTime >= expirationTime) {
                    return res.status(401).json({
                        success: false,
                        message: 'Token has expired',
                    });
                }
            }
        }
        return next();
    }
    catch (error) {
        logger.error('Token expiration check error', { error });
        return next();
    }
};
exports.checkTokenExpiration = checkTokenExpiration;
//# sourceMappingURL=authMiddleware.js.map