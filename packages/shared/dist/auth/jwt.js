"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireUserOrAdmin = exports.requireAdmin = exports.requireRole = exports.verifyRefreshToken = exports.generateRefreshToken = exports.generateAccessToken = exports.validateToken = void 0;
const tslib_1 = require("tslib");
const jsonwebtoken_1 = tslib_1.__importDefault(require("jsonwebtoken"));
const logger_1 = require("../logging/logger");
/**
 * Validate JWT token middleware
 */
const env_validator_1 = require("../config/env-validator");
// Fallback values for environment variables
const JWT_SECRET = env_validator_1.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = env_validator_1.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_ACCESS_EXPIRES_IN = env_validator_1.env.JWT_ACCESS_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = env_validator_1.env.JWT_REFRESH_EXPIRES_IN || '7d';
const validateToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'Access token required',
            });
            return;
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        // JWT_SECRET is guaranteed to exist and be valid due to env validation
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET, {
            issuer: 'ultramarket',
            audience: 'ultramarket-users'
        });
        // Add user info to request
        req.user = decoded;
        next();
    }
    catch (error) {
        logger_1.logger.error('Token validation failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                success: false,
                message: 'Token expired',
            });
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                message: 'Invalid token',
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: 'Token validation error',
            });
        }
    }
};
exports.validateToken = validateToken;
/**
 * Generate access token
 */
const generateAccessToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
        expiresIn: JWT_ACCESS_EXPIRES_IN,
        issuer: 'ultramarket',
        audience: 'ultramarket-users'
    });
};
exports.generateAccessToken = generateAccessToken;
/**
 * Generate refresh token
 */
const generateRefreshToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId, type: 'refresh' }, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
        issuer: 'ultramarket',
        audience: 'ultramarket-users'
    });
};
exports.generateRefreshToken = generateRefreshToken;
/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
    return jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET, {
        issuer: 'ultramarket',
        audience: 'ultramarket-users'
    });
};
exports.verifyRefreshToken = verifyRefreshToken;
/**
 * Role-based access control middleware
 */
const requireRole = (roles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user || !roles.includes(user.role)) {
            res.status(403).json({
                success: false,
                message: 'Insufficient permissions',
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
/**
 * Admin-only middleware
 */
exports.requireAdmin = (0, exports.requireRole)(['ADMIN', 'SUPER_ADMIN']);
/**
 * User or admin middleware
 */
exports.requireUserOrAdmin = (0, exports.requireRole)(['USER', 'ADMIN', 'SUPER_ADMIN']);
//# sourceMappingURL=jwt.js.map