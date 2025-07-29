"use strict";
/**
 * UltraMarket Error Handler Middleware
 * Professional error handling for Express applications
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.AppError = void 0;
exports.formatErrorResponse = formatErrorResponse;
exports.logError = logError;
exports.errorHandler = errorHandler;
exports.asyncHandler = asyncHandler;
exports.requestIdMiddleware = requestIdMiddleware;
exports.notFoundHandler = notFoundHandler;
exports.handleValidationError = handleValidationError;
exports.handleDatabaseError = handleDatabaseError;
exports.handleRateLimitError = handleRateLimitError;
exports.setupErrorMonitoring = setupErrorMonitoring;
const logger_1 = require("../logging/logger");
// Node.js types are already available
// Professional error classes
class AppError extends Error {
    statusCode;
    isOperational;
    code;
    details;
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', isOperational = true, details) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, details) {
        super(message, 400, 'VALIDATION_ERROR', true, details);
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'AUTHENTICATION_ERROR', true);
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends AppError {
    constructor(message = 'Insufficient permissions') {
        super(message, 403, 'AUTHORIZATION_ERROR', true);
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND_ERROR', true);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, 409, 'CONFLICT_ERROR', true);
    }
}
exports.ConflictError = ConflictError;
class RateLimitError extends AppError {
    constructor(message = 'Rate limit exceeded') {
        super(message, 429, 'RATE_LIMIT_ERROR', true);
    }
}
exports.RateLimitError = RateLimitError;
// Professional error response formatter
function formatErrorResponse(error, requestId) {
    const timestamp = new Date().toISOString();
    if (error instanceof AppError) {
        return {
            success: false,
            error: {
                code: error.code,
                message: error.message,
                details: error.details,
                timestamp,
                requestId,
            },
        };
    }
    // Handle unknown errors
    return {
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
            details: process.env.NODE_ENV === 'production' ? undefined : error.stack,
            timestamp,
            requestId,
        },
    };
}
// Professional error logging
function logError(error, req, operation) {
    const errorData = {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: req.headers['x-request-id'],
        operation,
        service: process.env.APP_NAME || 'unknown',
        timestamp: new Date().toISOString(),
    };
    if (error instanceof AppError) {
        errorData['statusCode'] = error.statusCode;
        errorData['code'] = error.code;
        errorData['details'] = error.details;
    }
    logger_1.logger.error('Request error occurred', errorData);
}
// Professional error handling middleware
function errorHandler(error, req, res, next) {
    // Log the error
    logError(error, req);
    // Format the response
    const requestId = req.headers['x-request-id'];
    const response = formatErrorResponse(error, requestId);
    // Set appropriate status code
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    res.status(statusCode).json(response);
}
// Professional async error wrapper
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
// Professional request ID middleware
function requestIdMiddleware(req, res, next) {
    const requestId = req.headers['x-request-id'] ||
        `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
}
// Professional not found handler
function notFoundHandler(req, res, next) {
    const error = new NotFoundError('Endpoint');
    next(error);
}
// Professional validation error handler
function handleValidationError(error) {
    const details = error.details?.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
    })) || [];
    return new ValidationError('Validation failed', details);
}
// Professional database error handler
function handleDatabaseError(error) {
    // Handle Prisma errors
    if (error.code) {
        switch (error.code) {
            case 'P2002':
                return new ConflictError('Resource already exists');
            case 'P2025':
                return new NotFoundError('Record');
            case 'P2003':
                return new ValidationError('Foreign key constraint failed');
            default:
                return new AppError('Database operation failed', 500, 'DATABASE_ERROR');
        }
    }
    // Handle other database errors
    if (error.message?.includes('duplicate key')) {
        return new ConflictError('Resource already exists');
    }
    if (error.message?.includes('not found')) {
        return new NotFoundError('Record');
    }
    return new AppError('Database operation failed', 500, 'DATABASE_ERROR');
}
// Professional rate limiting error handler
function handleRateLimitError(req) {
    const retryAfter = req.headers['retry-after'];
    const error = new RateLimitError('Too many requests');
    if (retryAfter) {
        error.details = { retryAfter };
    }
    return error;
}
// Professional error monitoring
function setupErrorMonitoring() {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        logger_1.logger.error('Uncaught Exception', {
            error: error.message,
            stack: error.stack,
            service: process.env.APP_NAME || 'unknown',
            timestamp: new Date().toISOString(),
        });
        // Graceful shutdown
        process.exit(1);
    });
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        logger_1.logger.error('Unhandled Rejection', {
            reason: reason instanceof Error ? reason.message : reason,
            stack: reason instanceof Error ? reason.stack : undefined,
            service: process.env.APP_NAME || 'unknown',
            timestamp: new Date().toISOString(),
        });
        // Graceful shutdown
        process.exit(1);
    });
}
// All classes and functions are already exported above
//# sourceMappingURL=error-handler.js.map