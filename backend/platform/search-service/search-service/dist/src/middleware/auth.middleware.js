"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = exports.optionalAuthMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const shared_1 = require("@ultramarket/shared");
const authMiddleware = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({
                success: false,
                error: 'Access denied. No token provided.',
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env['JWT_SECRET']);
        req.user = decoded;
        next();
    }
    catch (error) {
        shared_1.logger.error('Auth middleware error', { error: error instanceof Error ? error.message : 'Unknown error' });
        res.status(401).json({
            success: false,
            error: 'Invalid token.',
        });
    }
};
exports.authMiddleware = authMiddleware;
const optionalAuthMiddleware = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (token) {
            const decoded = jsonwebtoken_1.default.verify(token, process.env['JWT_SECRET']);
            req.user = decoded;
        }
        next();
    }
    catch (error) {
        shared_1.logger.debug('Optional auth failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        next();
    }
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
const adminMiddleware = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: 'Authentication required.',
        });
        return;
    }
    if (req.user.role !== 'admin') {
        res.status(403).json({
            success: false,
            error: 'Admin access required.',
        });
        return;
    }
    next();
};
exports.adminMiddleware = adminMiddleware;
//# sourceMappingURL=auth.middleware.js.map