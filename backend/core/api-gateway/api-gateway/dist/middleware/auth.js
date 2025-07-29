"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../utils/logger");
const authMiddleware = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Access token is required',
                timestamp: new Date().toISOString(),
            });
            return;
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            logger_1.logger.error('JWT_SECRET is not configured');
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Server configuration error',
                timestamp: new Date().toISOString(),
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        req.user = {
            id: decoded.id || decoded.userId,
            email: decoded.email,
            role: decoded.role || 'user',
        };
        next();
    }
    catch (error) {
        logger_1.logger.error('Authentication error:', error);
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid token',
                timestamp: new Date().toISOString(),
            });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Token expired',
                timestamp: new Date().toISOString(),
            });
            return;
        }
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Authentication failed',
            timestamp: new Date().toISOString(),
        });
    }
};
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=auth.js.map