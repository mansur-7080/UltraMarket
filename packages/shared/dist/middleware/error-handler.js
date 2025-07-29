"use strict";
/**
 * UltraMarket Error Handler Middleware
 * Professional error handling for Express applications
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitError = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.ValidationAppError = exports.AppError = void 0;
exports.errorHandler = errorHandler;
exports.asyncHandler = asyncHandler;
exports.notFoundHandler = notFoundHandler;
exports.handleValidationError = handleValidationError;
exports.handleDatabaseError = handleDatabaseError;
exports.handleUnhandledRejection = handleUnhandledRejection;
exports.handleUncaughtException = handleUncaughtException;
exports.initializeErrorHandlers = initializeErrorHandlers;
const logger_1 = require("../logging/logger");
const api_responses_1 = require("../types/api-responses");
class AppError extends Error {
    statusCode;
    code;
    isOperational;
    details;
    constructor(message, statusCode = api_responses_1.HttpStatusCode.INTERNAL_SERVER_ERROR, code = api_responses_1.ErrorCode.INTERNAL_ERROR, details, isOperational = true) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationAppError extends AppError {
    validationErrors;
    constructor(message, validationErrors) {
        super(message, api_responses_1.HttpStatusCode.BAD_REQUEST, api_responses_1.ErrorCode.VALIDATION_ERROR);
        this.name = 'ValidationAppError';
        this.validationErrors = validationErrors;
    }
}
exports.ValidationAppError = ValidationAppError;
class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, api_responses_1.HttpStatusCode.NOT_FOUND, api_responses_1.ErrorCode.RESOURCE_NOT_FOUND);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, api_responses_1.HttpStatusCode.UNAUTHORIZED, api_responses_1.ErrorCode.INVALID_CREDENTIALS);
        this.name = 'UnauthorizedError';
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, api_responses_1.HttpStatusCode.FORBIDDEN, api_responses_1.ErrorCode.INSUFFICIENT_PERMISSIONS);
        this.name = 'ForbiddenError';
    }
}
exports.ForbiddenError = ForbiddenError;
class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, api_responses_1.HttpStatusCode.CONFLICT, api_responses_1.ErrorCode.RESOURCE_ALREADY_EXISTS);
        this.name = 'ConflictError';
    }
}
exports.ConflictError = ConflictError;
class RateLimitError extends AppError {
    constructor(message = 'Rate limit exceeded') {
        super(message, api_responses_1.HttpStatusCode.TOO_MANY_REQUESTS, api_responses_1.ErrorCode.RATE_LIMIT_EXCEEDED);
        this.name = 'RateLimitError';
    }
}
exports.RateLimitError = RateLimitError;
// Error handler middleware
function errorHandler(error, req, res, next) {
    // If response already sent, delegate to default Express error handler
    if (res.headersSent) {
        next(error);
        return;
    }
    // Generate request ID if not present
    const requestId = req.headers['x-request-id'] ||
        `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // Determine error details
    let statusCode = api_responses_1.HttpStatusCode.INTERNAL_SERVER_ERROR;
    let errorCode = api_responses_1.ErrorCode.INTERNAL_ERROR;
    let message = 'Internal server error';
    let details = undefined;
    if (error instanceof AppError) {
        statusCode = error.statusCode;
        errorCode = error.code;
        message = error.message;
        details = error.details;
    }
    else if (error.statusCode) {
        statusCode = error.statusCode;
        message = error.message;
    }
    else if (error.code) {
        // Handle specific error codes
        switch (error.code) {
            case 'ENOTFOUND':
                statusCode = api_responses_1.HttpStatusCode.SERVICE_UNAVAILABLE;
                errorCode = api_responses_1.ErrorCode.EXTERNAL_SERVICE_ERROR;
                message = 'External service unavailable';
                break;
            case 'ECONNREFUSED':
                statusCode = api_responses_1.HttpStatusCode.SERVICE_UNAVAILABLE;
                errorCode = api_responses_1.ErrorCode.DATABASE_ERROR;
                message = 'Database connection refused';
                break;
            case 'ECONNRESET':
                statusCode = api_responses_1.HttpStatusCode.SERVICE_UNAVAILABLE;
                errorCode = api_responses_1.ErrorCode.EXTERNAL_SERVICE_ERROR;
                message = 'Connection reset by peer';
                break;
            case 'ETIMEDOUT':
                statusCode = api_responses_1.HttpStatusCode.GATEWAY_TIMEOUT;
                errorCode = api_responses_1.ErrorCode.EXTERNAL_SERVICE_ERROR;
                message = 'Request timeout';
                break;
            default:
                message = error.message || 'Internal server error';
        }
    }
    // Log error
    logger_1.logger.error('Request error', {
        requestId,
        method: req.method,
        url: req.url,
        statusCode,
        errorCode,
        message: error.message,
        stack: error.stack,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        body: req.body,
        params: req.params,
        query: req.query,
    });
    // Send error response
    res.status(statusCode).json({
        success: false,
        message,
        error: {
            code: errorCode,
            message,
            details,
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
        },
        requestId,
        timestamp: new Date().toISOString(),
        version: process.env.APP_VERSION || '1.0.0',
    });
}
// Async error handler wrapper
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
// 404 handler
function notFoundHandler(req, res) {
    const requestId = req.headers['x-request-id'] ||
        `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    logger_1.logger.warn('Route not found', {
        requestId,
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
    });
    res.status(api_responses_1.HttpStatusCode.NOT_FOUND).json({
        success: false,
        message: 'Route not found',
        error: {
            code: api_responses_1.ErrorCode.RESOURCE_NOT_FOUND,
            message: `Route ${req.method} ${req.path} not found`,
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method,
        },
        requestId,
        timestamp: new Date().toISOString(),
        version: process.env.APP_VERSION || '1.0.0',
    });
}
// Validation error handler
function handleValidationError(errors) {
    const message = `Validation failed: ${errors.map((e) => e.message).join(', ')}`;
    return new ValidationAppError(message, errors);
}
// Database error handler
function handleDatabaseError(error) {
    if (error.message.includes('duplicate key')) {
        return new ConflictError('Resource already exists');
    }
    if (error.message.includes('foreign key')) {
        return new AppError('Invalid reference', api_responses_1.HttpStatusCode.BAD_REQUEST, api_responses_1.ErrorCode.VALIDATION_ERROR);
    }
    if (error.message.includes('not null')) {
        return new AppError('Required field missing', api_responses_1.HttpStatusCode.BAD_REQUEST, api_responses_1.ErrorCode.VALIDATION_ERROR);
    }
    return new AppError('Database error', api_responses_1.HttpStatusCode.INTERNAL_SERVER_ERROR, api_responses_1.ErrorCode.DATABASE_ERROR);
}
// Unhandled promise rejection handler
function handleUnhandledRejection() {
    process.on('unhandledRejection', (reason, promise) => {
        logger_1.logger.error('Unhandled Rejection', {
            reason: reason instanceof Error ? reason.message : String(reason),
            stack: reason instanceof Error ? reason.stack : undefined,
            promise: promise.toString(),
        });
        // Exit process in production
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    });
}
// Uncaught exception handler
function handleUncaughtException() {
    process.on('uncaughtException', (error) => {
        logger_1.logger.error('Uncaught Exception', {
            message: error.message,
            stack: error.stack,
        });
        // Exit process
        process.exit(1);
    });
}
// Initialize error handlers
function initializeErrorHandlers() {
    handleUnhandledRejection();
    handleUncaughtException();
}
exports.default = {
    errorHandler,
    notFoundHandler,
    asyncHandler,
    AppError,
    ValidationAppError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    RateLimitError,
    handleValidationError,
    handleDatabaseError,
    initializeErrorHandlers,
};
//# sourceMappingURL=error-handler.js.map