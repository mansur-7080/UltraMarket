"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.errorHandler = exports.InternalServerError = exports.TooManyRequestsError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.ValidationError = exports.AppError = void 0;
const logger_1 = require("../utils/logger");
// Custom error classes
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
/**
 * Professional error handler middleware with standardized responses
 */
const errorHandler = (error, req, res, next) => {
    let statusCode = 500;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';
    let details = {};
    let isOperational = false;
    // Get request ID for error tracking
    const requestId = req.id || req.header('X-Request-ID') || 'unknown';
    // Handle custom application errors
    if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;
        isOperational = error.isOperational;
        errorCode = error.code || getErrorCodeFromStatus(statusCode);
    }
    // Handle Mongoose / MongoDB errors with detailed information
    else if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation failed';
        errorCode = 'VALIDATION_ERROR';
        isOperational = true;
        // Format validation errors for better client understanding
        const errors = error.errors || {};
        details.validationErrors = Object.keys(errors).reduce((acc, field) => {
            acc[field] = errors[field].message || 'Invalid value';
            return acc;
        }, {});
    }
    else if (error.name === 'CastError') {
        const castError = error;
        statusCode = 400;
        message = `Invalid ${castError.kind || 'value'} for ${castError.path || 'field'}`;
        errorCode = 'INVALID_FORMAT';
        isOperational = true;
        details = {
            field: castError.path,
            type: castError.kind,
            value: castError.value,
        };
    }
    else if (error.name === 'MongoServerError' && error.code === 11000) {
        statusCode = 409;
        const duplicateKey = Object.keys(error.keyPattern || {})[0] || 'field';
        message = `Duplicate value for ${duplicateKey}`;
        errorCode = 'DUPLICATE_ENTRY';
        isOperational = true;
        details = {
            field: duplicateKey,
            value: (error.keyValue || {})[duplicateKey],
        };
    }
    // Handle JWT errors for authentication issues
    else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid authentication token';
        errorCode = 'INVALID_TOKEN';
        isOperational = true;
    }
    else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Authentication token expired';
        errorCode = 'TOKEN_EXPIRED';
        isOperational = true;
    }
    // Handle file upload errors
    else if (error.name === 'MulterError') {
        statusCode = 400;
        const multerError = error;
        message = getMulterErrorMessage(multerError.code, multerError.field);
        errorCode = `FILE_UPLOAD_ERROR_${multerError.code?.toUpperCase() || 'UNKNOWN'}`;
        isOperational = true;
        details = {
            field: multerError.field,
            type: multerError.code,
            fileSize: multerError.size,
        };
    }
    // Network and connection errors
    else if (error.name === 'MongoNetworkError' ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('ETIMEDOUT')) {
        statusCode = 503;
        message = 'Service temporarily unavailable';
        errorCode = 'SERVICE_UNAVAILABLE';
        isOperational = true;
    }
    // Professional error logging with security audit
    const errorContext = {
        errorCode,
        message: error.message,
        name: error.name,
        stack: isOperational ? undefined : error.stack,
        statusCode,
        url: req.url,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.userId,
        requestId,
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
        service: 'product-service',
        isOperational
    };
    // Log error with appropriate level and professional categorization
    const logLevel = isOperational ? 'warn' : 'error';
    logger_1.logger[logLevel](`Product Service Error: ${req.method} ${req.path} - ${statusCode} ${errorCode}`, errorContext);
    // Security audit for suspicious activities
    if (['VALIDATION_ERROR', 'UNAUTHORIZED', 'FORBIDDEN'].includes(errorCode)) {
        logger_1.professionalLogger.security('Product service security event', {
            errorCode,
            statusCode,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            url: req.url,
            userId: req.user?.userId
        }, statusCode >= 400 && statusCode < 500 ? 'medium' : 'high');
    }
    // Business operation audit for product-related errors
    if (req.url.includes('/products/') && req.user?.userId) {
        logger_1.professionalLogger.business('Product operation error', req.params?.id || 'unknown', { errorCode, statusCode, operation: req.method }, req.user?.userId);
    }
    // Performance monitoring for slow operations
    if (errorContext.correlationId) {
        logger_1.professionalLogger.performance('Error handling', 0, {
            errorCode,
            statusCode,
            path: req.path,
            method: req.method
        });
    }
    // Professional audit logging
    logger_1.professionalLogger.audit('Error handled', {
        errorCode,
        statusCode,
        service: 'product-service',
        path: req.path,
        method: req.method,
        isOperational
    }, req.user?.userId);
    // Send standardized professional response format
    res.status(statusCode).json({
        success: false,
        error: {
            code: errorCode,
            message,
            details: Object.keys(details).length > 0 ? details : undefined,
        },
        meta: {
            requestId,
            timestamp: new Date().toISOString(),
            service: 'product-service',
            correlationId: errorContext.correlationId
        },
    });
    // Send error response
    const errorResponse = {
        success: false,
        message,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
    };
    // Include details in development mode
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = error.stack;
        errorResponse.details = details;
    }
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
// Async error handler wrapper
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
/**
 * Map HTTP status codes to standardized error codes
 */
const getErrorCodeFromStatus = (statusCode) => {
    const statusCodeMap = {
        400: 'BAD_REQUEST',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        409: 'CONFLICT',
        422: 'VALIDATION_ERROR',
        429: 'TOO_MANY_REQUESTS',
        500: 'INTERNAL_SERVER_ERROR',
        503: 'SERVICE_UNAVAILABLE',
    };
    return statusCodeMap[statusCode] || 'INTERNAL_SERVER_ERROR';
};
/**
 * Get user-friendly error messages for file upload errors
 */
const getMulterErrorMessage = (code, field = 'file') => {
    const codeMessages = {
        LIMIT_PART_COUNT: 'Too many parts in the multipart form',
        LIMIT_FILE_SIZE: `File ${field} is too large`,
        LIMIT_FILE_COUNT: 'Too many files uploaded',
        LIMIT_FIELD_KEY: 'Field name is too long',
        LIMIT_FIELD_VALUE: 'Field value is too long',
        LIMIT_FIELD_COUNT: 'Too many fields in form',
        LIMIT_UNEXPECTED_FILE: `Unexpected field ${field}`,
        MISSING_FIELD_NAME: 'Field name missing',
    };
    return codeMessages[code] || `Error uploading file ${field}`;
};
//# sourceMappingURL=error.middleware.js.map