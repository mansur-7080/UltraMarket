"use strict";
/**
 * 🚨 Ultra Professional Error Handling System
 * UltraMarket E-commerce Platform
 *
 * Bu fayl barcha application errors ni professional tarzda handle qiladi
 * va comprehensive error reporting, monitoring va recovery ni ta'minlaydi
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorUtils = exports.expressErrorHandler = exports.wrapAsync = exports.transformError = exports.createError = exports.ultraErrorHandler = exports.UltraProfessionalErrorHandler = exports.UltraConfigurationError = exports.UltraFileUploadError = exports.UltraPaymentError = exports.UltraBusinessLogicError = exports.UltraExternalServiceError = exports.UltraDatabaseError = exports.UltraRateLimitError = exports.UltraConflictError = exports.UltraNotFoundError = exports.UltraAuthorizationError = exports.UltraAuthenticationError = exports.UltraValidationError = exports.UltraProfessionalError = void 0;
const zod_1 = require("zod");
const library_1 = require("@prisma/client/runtime/library");
const mongodb_1 = require("mongodb");
const joi_1 = require("joi");
/**
 * 🚨 Ultra Professional Error Class
 */
class UltraProfessionalError extends Error {
    statusCode;
    errorType;
    code;
    details;
    originalError;
    isOperational;
    context;
    timestamp;
    requestId;
    userId;
    sessionId;
    traceId;
    constructor(message, statusCode = 500, errorType = 'INTERNAL_SERVER_ERROR', code = 'UNKNOWN_ERROR', details, originalError, isOperational = true, context) {
        super(message);
        this.statusCode = statusCode;
        this.errorType = errorType;
        this.code = code;
        this.details = details;
        this.originalError = originalError;
        this.isOperational = isOperational;
        this.context = context;
        this.name = 'UltraProfessionalError';
        this.timestamp = new Date();
        // Capture stack trace
        Error.captureStackTrace(this, UltraProfessionalError);
    }
    /**
     * 📝 Convert to JSON for logging/response
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            statusCode: this.statusCode,
            errorType: this.errorType,
            code: this.code,
            details: this.details,
            timestamp: this.timestamp,
            requestId: this.requestId,
            userId: this.userId,
            sessionId: this.sessionId,
            traceId: this.traceId,
            isOperational: this.isOperational,
            context: this.context,
            stack: process.env.NODE_ENV === 'development' ? this.stack : undefined
        };
    }
    /**
     * 📱 Convert to client response format
     */
    toClientResponse() {
        return {
            success: false,
            error: {
                message: this.message,
                code: this.code,
                type: this.errorType,
                timestamp: this.timestamp,
                ...(process.env.NODE_ENV === 'development' && { details: this.details })
            }
        };
    }
}
exports.UltraProfessionalError = UltraProfessionalError;
/**
 * 🔍 Validation Error
 */
class UltraValidationError extends UltraProfessionalError {
    constructor(message = 'Validation failed', details, originalError) {
        super(message, 400, 'VALIDATION_ERROR', 'VALIDATION_FAILED', details, originalError);
    }
}
exports.UltraValidationError = UltraValidationError;
/**
 * 🔐 Authentication Error
 */
class UltraAuthenticationError extends UltraProfessionalError {
    constructor(message = 'Authentication required', code = 'AUTH_REQUIRED', details) {
        super(message, 401, 'AUTHENTICATION_ERROR', code, details);
    }
}
exports.UltraAuthenticationError = UltraAuthenticationError;
/**
 * 🚫 Authorization Error
 */
class UltraAuthorizationError extends UltraProfessionalError {
    constructor(message = 'Insufficient permissions', code = 'INSUFFICIENT_PERMISSIONS', details) {
        super(message, 403, 'AUTHORIZATION_ERROR', code, details);
    }
}
exports.UltraAuthorizationError = UltraAuthorizationError;
/**
 * 🔍 Not Found Error
 */
class UltraNotFoundError extends UltraProfessionalError {
    constructor(resource = 'Resource', identifier, details) {
        const message = identifier
            ? `${resource} with identifier '${identifier}' not found`
            : `${resource} not found`;
        super(message, 404, 'NOT_FOUND_ERROR', 'RESOURCE_NOT_FOUND', details);
    }
}
exports.UltraNotFoundError = UltraNotFoundError;
/**
 * ⚔️ Conflict Error
 */
class UltraConflictError extends UltraProfessionalError {
    constructor(message = 'Resource conflict', code = 'RESOURCE_CONFLICT', details) {
        super(message, 409, 'CONFLICT_ERROR', code, details);
    }
}
exports.UltraConflictError = UltraConflictError;
/**
 * 🚦 Rate Limit Error
 */
class UltraRateLimitError extends UltraProfessionalError {
    constructor(message = 'Rate limit exceeded', retryAfter, details) {
        super(message, 429, 'RATE_LIMIT_ERROR', 'RATE_LIMIT_EXCEEDED', { ...details, retryAfter });
    }
}
exports.UltraRateLimitError = UltraRateLimitError;
/**
 * 🗄️ Database Error
 */
class UltraDatabaseError extends UltraProfessionalError {
    constructor(message = 'Database operation failed', operation, originalError, details) {
        super(message, 500, 'DATABASE_ERROR', 'DATABASE_OPERATION_FAILED', { operation, ...details }, originalError);
    }
}
exports.UltraDatabaseError = UltraDatabaseError;
/**
 * 🌐 External Service Error
 */
class UltraExternalServiceError extends UltraProfessionalError {
    constructor(service, message = 'External service error', statusCode = 502, originalError, details) {
        super(message, statusCode, 'EXTERNAL_SERVICE_ERROR', 'EXTERNAL_SERVICE_FAILED', { service, ...details }, originalError);
    }
}
exports.UltraExternalServiceError = UltraExternalServiceError;
/**
 * 💼 Business Logic Error
 */
class UltraBusinessLogicError extends UltraProfessionalError {
    constructor(message, code = 'BUSINESS_RULE_VIOLATION', details) {
        super(message, 400, 'BUSINESS_LOGIC_ERROR', code, details);
    }
}
exports.UltraBusinessLogicError = UltraBusinessLogicError;
/**
 * 💳 Payment Error
 */
class UltraPaymentError extends UltraProfessionalError {
    constructor(message, paymentProvider, code = 'PAYMENT_FAILED', details, originalError) {
        super(message, 402, 'PAYMENT_ERROR', code, { paymentProvider, ...details }, originalError);
    }
}
exports.UltraPaymentError = UltraPaymentError;
/**
 * 📁 File Upload Error
 */
class UltraFileUploadError extends UltraProfessionalError {
    constructor(message = 'File upload failed', code = 'FILE_UPLOAD_FAILED', details, originalError) {
        super(message, 400, 'FILE_UPLOAD_ERROR', code, details, originalError);
    }
}
exports.UltraFileUploadError = UltraFileUploadError;
/**
 * 🔧 Configuration Error
 */
class UltraConfigurationError extends UltraProfessionalError {
    constructor(message = 'Configuration error', configKey, details) {
        super(message, 500, 'CONFIGURATION_ERROR', 'INVALID_CONFIGURATION', { configKey, ...details });
    }
}
exports.UltraConfigurationError = UltraConfigurationError;
/**
 * 🏭 Ultra Professional Error Handler
 */
class UltraProfessionalErrorHandler {
    static instance;
    errorCounts = new Map();
    lastErrors = [];
    maxLastErrors = 100;
    /**
     * 🏭 Singleton pattern
     */
    static getInstance() {
        if (!UltraProfessionalErrorHandler.instance) {
            UltraProfessionalErrorHandler.instance = new UltraProfessionalErrorHandler();
        }
        return UltraProfessionalErrorHandler.instance;
    }
    /**
     * 🔄 Transform known errors to UltraProfessionalError
     */
    transformError(error, context) {
        // Already an UltraProfessionalError
        if (error instanceof UltraProfessionalError) {
            return error;
        }
        // Zod validation errors
        if (error instanceof zod_1.ZodError) {
            return new UltraValidationError('Input validation failed', {
                issues: error.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                    code: issue.code
                }))
            }, error);
        }
        // Joi validation errors
        if (error instanceof joi_1.ValidationError) {
            return new UltraValidationError(error.message, {
                details: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                    type: detail.type
                }))
            }, error);
        }
        // Prisma errors
        if (error instanceof library_1.PrismaClientKnownRequestError) {
            return this.transformPrismaError(error);
        }
        if (error instanceof library_1.PrismaClientValidationError) {
            return new UltraValidationError('Database validation error', { prismaError: error.message }, error);
        }
        // MongoDB errors
        if (error instanceof mongodb_1.MongoError) {
            return this.transformMongoError(error);
        }
        // JWT errors
        if (error.name === 'JsonWebTokenError') {
            return new UltraAuthenticationError('Invalid token', 'INVALID_TOKEN', { jwtError: error.message });
        }
        if (error.name === 'TokenExpiredError') {
            return new UltraAuthenticationError('Token expired', 'TOKEN_EXPIRED', { jwtError: error.message });
        }
        // HTTP errors (from external services)
        if (error.response) {
            return new UltraExternalServiceError('Unknown Service', error.message || 'External service error', error.response.status || 502, error, {
                url: error.config?.url,
                method: error.config?.method,
                data: error.response.data
            });
        }
        // Network errors
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            return new UltraProfessionalError('Network connection failed', 503, 'NETWORK_ERROR', 'CONNECTION_FAILED', { networkError: error.code }, error);
        }
        // Timeout errors
        if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
            return new UltraProfessionalError('Operation timed out', 408, 'TIMEOUT_ERROR', 'OPERATION_TIMEOUT', undefined, error);
        }
        // Generic error
        return new UltraProfessionalError(error.message || 'An unexpected error occurred', 500, 'INTERNAL_SERVER_ERROR', 'UNKNOWN_ERROR', context, error, false // Non-operational since it's unexpected
        );
    }
    /**
     * 🎯 Transform Prisma errors
     */
    transformPrismaError(error) {
        switch (error.code) {
            case 'P2002': // Unique constraint violation
                return new UltraConflictError('A record with this value already exists', 'DUPLICATE_RECORD', {
                    fields: error.meta?.target,
                    prismaCode: error.code
                });
            case 'P2025': // Record not found
                return new UltraNotFoundError('Record', undefined, {
                    cause: error.meta?.cause,
                    prismaCode: error.code
                });
            case 'P2003': // Foreign key constraint violation
                return new UltraValidationError('Referenced record does not exist', {
                    field: error.meta?.field_name,
                    prismaCode: error.code
                }, error);
            case 'P2014': // Required relation violation
                return new UltraValidationError('Required relation missing', {
                    relation: error.meta?.relation_name,
                    prismaCode: error.code
                }, error);
            default:
                return new UltraDatabaseError(error.message, 'prisma_operation', error, {
                    prismaCode: error.code,
                    meta: error.meta
                });
        }
    }
    /**
     * 🍃 Transform MongoDB errors
     */
    transformMongoError(error) {
        if (error.code === 11000) {
            // Duplicate key error
            return new UltraConflictError('Duplicate record found', 'DUPLICATE_RECORD', {
                mongoCode: error.code,
                keyPattern: error.keyPattern,
                keyValue: error.keyValue
            });
        }
        return new UltraDatabaseError(error.message, 'mongodb_operation', error, {
            mongoCode: error.code
        });
    }
    /**
     * 📊 Track error statistics
     */
    trackError(error) {
        const errorKey = `${error.errorType}:${error.code}`;
        const currentCount = this.errorCounts.get(errorKey) || 0;
        this.errorCounts.set(errorKey, currentCount + 1);
        // Keep track of recent errors
        this.lastErrors.push(error);
        if (this.lastErrors.length > this.maxLastErrors) {
            this.lastErrors.shift();
        }
    }
    /**
     * 📈 Get error statistics
     */
    getErrorStatistics() {
        return {
            errorCounts: Object.fromEntries(this.errorCounts),
            recentErrors: this.lastErrors.slice(-10),
            totalErrors: this.lastErrors.length
        };
    }
    /**
     * 📧 Send error notification (for critical errors)
     */
    async sendErrorNotification(error) {
        // Only send notifications for critical errors in production
        if (process.env.NODE_ENV !== 'production')
            return;
        if (error.statusCode < 500)
            return;
        try {
            // Integration with notification service would go here
            console.error('🚨 Critical error notification:', {
                error: error.toJSON(),
                timestamp: new Date().toISOString()
            });
        }
        catch (notificationError) {
            console.error('Failed to send error notification:', notificationError);
        }
    }
    /**
     * 🎭 Express error handler middleware
     */
    createExpressErrorHandler() {
        return async (error, req, res, next) => {
            try {
                // Transform to UltraProfessionalError
                const ultraError = this.transformError(error, {
                    url: req.originalUrl,
                    method: req.method,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    userId: req.user?.userId,
                    sessionId: req.sessionId
                });
                // Add request context
                ultraError.requestId = req.id || req.headers['x-request-id'];
                ultraError.userId = req.user?.userId;
                ultraError.sessionId = req.sessionId;
                // Track error statistics
                this.trackError(ultraError);
                // Log error
                this.logError(ultraError, req);
                // Send notification for critical errors
                await this.sendErrorNotification(ultraError);
                // Send response
                res.status(ultraError.statusCode).json(ultraError.toClientResponse());
            }
            catch (handlerError) {
                // Fallback error handling
                console.error('Error handler failed:', handlerError);
                res.status(500).json({
                    success: false,
                    error: {
                        message: 'Internal server error',
                        code: 'ERROR_HANDLER_FAILED',
                        type: 'INTERNAL_SERVER_ERROR',
                        timestamp: new Date()
                    }
                });
            }
        };
    }
    /**
     * 📝 Log error with appropriate level
     */
    logError(error, req) {
        const logContext = {
            error: error.toJSON(),
            request: req ? {
                url: req.originalUrl,
                method: req.method,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                userId: req.user?.userId,
                sessionId: req.sessionId
            } : undefined
        };
        if (error.statusCode >= 500) {
            console.error('🚨 Server Error:', logContext);
        }
        else if (error.statusCode >= 400) {
            console.warn('⚠️ Client Error:', logContext);
        }
        else {
            console.info('ℹ️ Error Info:', logContext);
        }
    }
    /**
     * 🔄 Async error wrapper
     */
    wrapAsync(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }
    /**
     * 🎯 Create standard error responses
     */
    createStandardErrors() {
        return {
            notFound: (resource, identifier) => new UltraNotFoundError(resource, identifier),
            validation: (message, details) => new UltraValidationError(message, details),
            authentication: (message, code) => new UltraAuthenticationError(message, code),
            authorization: (message, code) => new UltraAuthorizationError(message, code),
            conflict: (message, code) => new UltraConflictError(message, code),
            rateLimit: (message, retryAfter) => new UltraRateLimitError(message, retryAfter),
            database: (message, operation, originalError) => new UltraDatabaseError(message, operation, originalError),
            externalService: (service, message, statusCode, originalError) => new UltraExternalServiceError(service, message, statusCode, originalError),
            businessLogic: (message, code) => new UltraBusinessLogicError(message, code),
            payment: (message, provider, code) => new UltraPaymentError(message, provider, code),
            fileUpload: (message, code) => new UltraFileUploadError(message, code),
            configuration: (message, configKey) => new UltraConfigurationError(message, configKey)
        };
    }
}
exports.UltraProfessionalErrorHandler = UltraProfessionalErrorHandler;
/**
 * 🌟 Global error handler instance
 */
exports.ultraErrorHandler = UltraProfessionalErrorHandler.getInstance();
/**
 * 🚀 Quick access functions
 */
exports.createError = exports.ultraErrorHandler.createStandardErrors();
const transformError = (error, context) => exports.ultraErrorHandler.transformError(error, context);
exports.transformError = transformError;
const wrapAsync = (fn) => exports.ultraErrorHandler.wrapAsync(fn);
exports.wrapAsync = wrapAsync;
exports.expressErrorHandler = exports.ultraErrorHandler.createExpressErrorHandler();
/**
 * 📊 Error utilities
 */
exports.errorUtils = {
    isOperational: (error) => {
        if (error instanceof UltraProfessionalError) {
            return error.isOperational;
        }
        return false;
    },
    getErrorStatistics: () => exports.ultraErrorHandler.getErrorStatistics(),
    handleUncaughtExceptions: () => {
        process.on('uncaughtException', (error) => {
            console.error('🚨 Uncaught Exception:', error);
            const ultraError = exports.ultraErrorHandler.transformError(error);
            console.error('Transformed error:', ultraError.toJSON());
            // Graceful shutdown for non-operational errors
            if (!exports.errorUtils.isOperational(error)) {
                console.error('Non-operational error detected, shutting down...');
                process.exit(1);
            }
        });
        process.on('unhandledRejection', (reason) => {
            console.error('🚨 Unhandled Rejection:', reason);
            const ultraError = exports.ultraErrorHandler.transformError(reason);
            console.error('Transformed error:', ultraError.toJSON());
        });
    }
};
exports.default = {
    UltraProfessionalError,
    UltraValidationError,
    UltraAuthenticationError,
    UltraAuthorizationError,
    UltraNotFoundError,
    UltraConflictError,
    UltraRateLimitError,
    UltraDatabaseError,
    UltraExternalServiceError,
    UltraBusinessLogicError,
    UltraPaymentError,
    UltraFileUploadError,
    UltraConfigurationError,
    ultraErrorHandler: exports.ultraErrorHandler,
    createError: exports.createError,
    transformError: exports.transformError,
    wrapAsync: exports.wrapAsync,
    expressErrorHandler: exports.expressErrorHandler,
    errorUtils: exports.errorUtils
};
//# sourceMappingURL=ultra-professional-error-handler.js.map