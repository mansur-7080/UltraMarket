"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.errorHandler = exports.InternalServerError = exports.TooManyRequestsError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.ValidationError = exports.AppError = void 0;
const logger_1 = require("../utils/logger");
class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message) {
        super(message, 400);
    }
}
exports.ValidationError = ValidationError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403);
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, 409);
    }
}
exports.ConflictError = ConflictError;
class TooManyRequestsError extends AppError {
    constructor(message = 'Too many requests') {
        super(message, 429);
    }
}
exports.TooManyRequestsError = TooManyRequestsError;
class InternalServerError extends AppError {
    constructor(message = 'Internal server error') {
        super(message, 500);
    }
}
exports.InternalServerError = InternalServerError;
const errorHandler = (error, req, res, next) => {
    let statusCode = 500;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let details = {};
    if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;
        errorCode = 'BUSINESS_ERROR';
    }
    else if (error.name === 'PrismaClientKnownRequestError') {
        const prismaError = error;
        switch (prismaError.code) {
            case 'P2002':
                statusCode = 409;
                message = 'Resource already exists';
                errorCode = 'DUPLICATE_RESOURCE';
                details = { field: prismaError.meta?.target };
                break;
            case 'P2025':
                statusCode = 404;
                message = 'Resource not found';
                errorCode = 'RESOURCE_NOT_FOUND';
                break;
            case 'P2014':
                statusCode = 400;
                message = 'Invalid data provided';
                errorCode = 'INVALID_DATA';
                break;
            case 'P2003':
                statusCode = 400;
                message = 'Foreign key constraint violation';
                errorCode = 'CONSTRAINT_VIOLATION';
                break;
            case 'P2011':
                statusCode = 400;
                message = 'Null constraint violation';
                errorCode = 'NULL_CONSTRAINT';
                break;
            default:
                statusCode = 400;
                message = 'Database operation failed';
                errorCode = 'DATABASE_ERROR';
        }
    }
    else if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation failed';
        errorCode = 'VALIDATION_ERROR';
        details = { errors: error.details };
    }
    else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
        errorCode = 'INVALID_TOKEN';
        logger_1.professionalLogger.security('Invalid JWT token attempt', {
            error: error.message,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            url: req.url
        }, 'medium');
    }
    else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
        errorCode = 'TOKEN_EXPIRED';
    }
    else if (error.name === 'RedisError') {
        statusCode = 503;
        message = 'Service temporarily unavailable';
        errorCode = 'SERVICE_UNAVAILABLE';
    }
    else if (error.name === 'TooManyRequestsError') {
        statusCode = 429;
        message = 'Too many requests';
        errorCode = 'RATE_LIMITED';
        logger_1.professionalLogger.security('Rate limit exceeded', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            url: req.url
        }, 'high');
    }
    const errorContext = {
        errorCode,
        message: error.message,
        stack: error.stack,
        statusCode,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.userId,
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
        service: 'user-service'
    };
    if (statusCode >= 500) {
        logger_1.logger.error('Internal server error occurred', errorContext);
    }
    else if (statusCode >= 400) {
        logger_1.logger.warn('Client error occurred', errorContext);
    }
    else {
        logger_1.logger.info('Error handled successfully', errorContext);
    }
    if (['INVALID_TOKEN', 'TOKEN_EXPIRED', 'RATE_LIMITED'].includes(errorCode)) {
        logger_1.professionalLogger.audit('Security error handled', {
            errorCode,
            statusCode,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        }, req.user?.userId);
    }
    const errorResponse = {
        success: false,
        message,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
    };
    if (process.env['NODE_ENV'] === 'development') {
        errorResponse.stack = error.stack;
        errorResponse.details = details;
    }
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=error.middleware.js.map