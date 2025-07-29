"use strict";
// Shared utilities and types for product-service
// This file provides local implementations of shared functionality
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = exports.verifyAccessToken = exports.extractTokenFromHeader = exports.UnauthorizedError = exports.AppError = exports.logger = void 0;
const tslib_1 = require("tslib");
const winston_1 = require("winston");
const jsonwebtoken_1 = tslib_1.__importDefault(require("jsonwebtoken"));
// Create local logger
const logger = (0, winston_1.createLogger)({
    level: process.env.LOG_LEVEL || 'info',
    format: winston_1.format.combine(winston_1.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.format.errors({ stack: true }), winston_1.format.splat(), winston_1.format.json()),
    defaultMeta: { service: 'product-service' },
    transports: [
        new winston_1.transports.Console({
            format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.printf(({ timestamp, level, message, service, ...meta }) => {
                return `${timestamp} [${service}] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
            })),
        }),
    ],
});
exports.logger = logger;
// Error classes
class AppError extends Error {
    statusCode;
    code;
    details;
    constructor(statusCode, message, code = 'INTERNAL_ERROR', details = {}) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized', details = {}) {
        super(401, message, 'UNAUTHORIZED', details);
    }
}
exports.UnauthorizedError = UnauthorizedError;
// Auth functions
const extractTokenFromHeader = (header) => {
    if (!header || !header.startsWith('Bearer ')) {
        return null;
    }
    return header.split(' ')[1];
};
exports.extractTokenFromHeader = extractTokenFromHeader;
const verifyAccessToken = (token) => {
    try {
        const secret = process.env.JWT_SECRET || 'default-jwt-secret-key';
        const payload = jsonwebtoken_1.default.verify(token, secret);
        return payload;
    }
    catch (error) {
        throw new UnauthorizedError('Invalid token', { error });
    }
};
exports.verifyAccessToken = verifyAccessToken;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["CUSTOMER"] = "CUSTOMER";
    UserRole["VENDOR"] = "VENDOR";
    UserRole["STAFF"] = "STAFF";
})(UserRole || (exports.UserRole = UserRole = {}));
//# sourceMappingURL=index.js.map