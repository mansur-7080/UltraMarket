"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.ConflictError = exports.NotFoundError = exports.ValidationError = exports.AuthError = void 0;
const logger_1 = require("../utils/logger");
class AuthError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode = 401) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AuthError = AuthError;
class ValidationError extends Error {
    statusCode;
    isOperational;
    constructor(message) {
        super(message);
        this.statusCode = 400;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends Error {
    statusCode;
    isOperational;
    constructor(message = 'Resource not found') {
        super(message);
        this.statusCode = 404;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends Error {
    statusCode;
    isOperational;
    constructor(message) {
        super(message);
        this.statusCode = 409;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ConflictError = ConflictError;
const errorHandler = (error, req, res, next) => {
    let { statusCode = 500, message } = error;
    logger_1.logger.error('Error occurred:', {
        error: message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
    });
    if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation failed';
    }
    if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }
    if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }
    if (error.name === 'PrismaClientKnownRequestError') {
        statusCode = 400;
        message = 'Database operation failed';
    }
    if (process.env['NODE_ENV'] === 'production' && statusCode === 500) {
        message = 'Internal server error';
    }
    res.status(statusCode).json({
        success: false,
        error: {
            message,
            ...(process.env['NODE_ENV'] === 'development' && { stack: error.stack }),
        },
    });
};
exports.errorHandler = errorHandler;
exports.default = exports.errorHandler;
//# sourceMappingURL=errorHandler.js.map