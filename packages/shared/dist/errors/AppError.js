"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatErrorResponse = exports.handleError = exports.createNotFoundError = exports.createAuthError = exports.createValidationError = exports.FileUploadError = exports.BusinessLogicError = exports.PaymentError = exports.ExternalServiceError = exports.DatabaseError = exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.AppError = exports.ErrorCode = void 0;
const logger_1 = require("../logging/logger");
// Error codes enum
var ErrorCode;
(function (ErrorCode) {
    // Authentication & Authorization
    ErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ErrorCode["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    ErrorCode["INVALID_TOKEN"] = "INVALID_TOKEN";
    ErrorCode["TOKEN_BLACKLISTED"] = "TOKEN_BLACKLISTED";
    ErrorCode["WEAK_JWT_SECRET"] = "WEAK_JWT_SECRET";
    ErrorCode["MISSING_AUTH_HEADER"] = "MISSING_AUTH_HEADER";
    // Validation
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["INVALID_INPUT"] = "INVALID_INPUT";
    ErrorCode["REQUIRED_FIELD_MISSING"] = "REQUIRED_FIELD_MISSING";
    ErrorCode["INVALID_FORMAT"] = "INVALID_FORMAT";
    // Database
    ErrorCode["DATABASE_ERROR"] = "DATABASE_ERROR";
    ErrorCode["RECORD_NOT_FOUND"] = "RECORD_NOT_FOUND";
    ErrorCode["DUPLICATE_RECORD"] = "DUPLICATE_RECORD";
    ErrorCode["CONSTRAINT_VIOLATION"] = "CONSTRAINT_VIOLATION";
    // Business Logic
    ErrorCode["INSUFFICIENT_BALANCE"] = "INSUFFICIENT_BALANCE";
    ErrorCode["PRODUCT_OUT_OF_STOCK"] = "PRODUCT_OUT_OF_STOCK";
    ErrorCode["ORDER_ALREADY_PROCESSED"] = "ORDER_ALREADY_PROCESSED";
    ErrorCode["PAYMENT_FAILED"] = "PAYMENT_FAILED";
    // System
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCode["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
    ErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    ErrorCode["FILE_UPLOAD_ERROR"] = "FILE_UPLOAD_ERROR";
    // External Services
    ErrorCode["EXTERNAL_SERVICE_ERROR"] = "EXTERNAL_SERVICE_ERROR";
    ErrorCode["PAYMENT_GATEWAY_ERROR"] = "PAYMENT_GATEWAY_ERROR";
    ErrorCode["SMS_SERVICE_ERROR"] = "SMS_SERVICE_ERROR";
    ErrorCode["EMAIL_SERVICE_ERROR"] = "EMAIL_SERVICE_ERROR";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
// Base Application Error class
class AppError extends Error {
    statusCode;
    isOperational;
    code;
    timestamp;
    context;
    constructor(message, statusCode = 500, isOperational = true, code = ErrorCode.INTERNAL_ERROR, context) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;
        this.timestamp = new Date();
        this.context = context;
        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);
        // Log error creation
        logger_1.logger.error(`AppError created: ${message}`, {
            statusCode,
            code,
            isOperational,
            context,
            stack: this.stack,
        });
    }
    // Convert to JSON for API responses
    toJSON() {
        return {
            success: false,
            error: {
                message: this.message,
                code: this.code,
                statusCode: this.statusCode,
                timestamp: this.timestamp.toISOString(),
                ...(this.context && { context: this.context }),
            },
        };
    }
    // Get user-friendly message
    getUserMessage() {
        // Map technical errors to user-friendly messages
        const userMessages = {
            [ErrorCode.UNAUTHORIZED]: 'Tizimga kirish talab qilinadi',
            [ErrorCode.FORBIDDEN]: "Sizda bu amalni bajarish uchun ruxsat yo'q",
            [ErrorCode.TOKEN_EXPIRED]: 'Sessiya muddati tugagan, qayta kiring',
            [ErrorCode.INVALID_TOKEN]: "Noto'g'ri token",
            [ErrorCode.VALIDATION_ERROR]: "Kiritilgan ma'lumotlar noto'g'ri",
            [ErrorCode.RECORD_NOT_FOUND]: "Ma'lumot topilmadi",
            [ErrorCode.DUPLICATE_RECORD]: "Bu ma'lumot allaqachon mavjud",
            [ErrorCode.INSUFFICIENT_BALANCE]: "Hisobda yetarli mablag' yo'q",
            [ErrorCode.PRODUCT_OUT_OF_STOCK]: "Mahsulot qoldiqda yo'q",
            [ErrorCode.PAYMENT_FAILED]: "To'lov amalga oshmadi",
            [ErrorCode.RATE_LIMIT_EXCEEDED]: "Juda ko'p so'rov yuborildi, biroz kuting",
            [ErrorCode.SERVICE_UNAVAILABLE]: 'Xizmat vaqtincha mavjud emas',
            [ErrorCode.INTERNAL_ERROR]: 'Ichki xatolik yuz berdi',
        };
        return userMessages[this.code] || this.message;
    }
}
exports.AppError = AppError;
// Validation Error
class ValidationError extends AppError {
    errors;
    constructor(errors, message = 'Validation failed', context) {
        super(message, 422, true, ErrorCode.VALIDATION_ERROR, context);
        this.errors = errors;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            error: {
                ...super.toJSON().error,
                errors: this.errors,
            },
        };
    }
}
exports.ValidationError = ValidationError;
// Authentication Error
class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed', code = ErrorCode.UNAUTHORIZED, context) {
        super(message, 401, true, code, context);
    }
}
exports.AuthenticationError = AuthenticationError;
// Authorization Error
class AuthorizationError extends AppError {
    constructor(message = 'Access denied', context) {
        super(message, 403, true, ErrorCode.FORBIDDEN, context);
    }
}
exports.AuthorizationError = AuthorizationError;
// Not Found Error
class NotFoundError extends AppError {
    constructor(resource = 'Resource', context) {
        super(`${resource} not found`, 404, true, ErrorCode.RECORD_NOT_FOUND, context);
    }
}
exports.NotFoundError = NotFoundError;
// Conflict Error
class ConflictError extends AppError {
    constructor(message = 'Resource already exists', context) {
        super(message, 409, true, ErrorCode.DUPLICATE_RECORD, context);
    }
}
exports.ConflictError = ConflictError;
// Rate Limit Error
class RateLimitError extends AppError {
    constructor(message = 'Rate limit exceeded', context) {
        super(message, 429, true, ErrorCode.RATE_LIMIT_EXCEEDED, context);
    }
}
exports.RateLimitError = RateLimitError;
// Database Error
class DatabaseError extends AppError {
    constructor(message = 'Database operation failed', context) {
        super(message, 500, true, ErrorCode.DATABASE_ERROR, context);
    }
}
exports.DatabaseError = DatabaseError;
// External Service Error
class ExternalServiceError extends AppError {
    constructor(serviceName, message = 'External service error', context) {
        super(`${serviceName}: ${message}`, 502, true, ErrorCode.EXTERNAL_SERVICE_ERROR, {
            serviceName,
            ...context,
        });
    }
}
exports.ExternalServiceError = ExternalServiceError;
// Payment Error
class PaymentError extends AppError {
    constructor(message = 'Payment processing failed', context) {
        super(message, 402, true, ErrorCode.PAYMENT_FAILED, context);
    }
}
exports.PaymentError = PaymentError;
// Business Logic Error
class BusinessLogicError extends AppError {
    constructor(message, code, context) {
        super(message, 400, true, code, context);
    }
}
exports.BusinessLogicError = BusinessLogicError;
// File Upload Error
class FileUploadError extends AppError {
    constructor(message = 'File upload failed', context) {
        super(message, 400, true, ErrorCode.FILE_UPLOAD_ERROR, context);
    }
}
exports.FileUploadError = FileUploadError;
// Error factory functions
const createValidationError = (field, message, context) => {
    return new ValidationError({ [field]: [message] }, `Validation failed: ${field}`, context);
};
exports.createValidationError = createValidationError;
const createAuthError = (message = 'Authentication required', context) => {
    return new AuthenticationError(message, ErrorCode.UNAUTHORIZED, context);
};
exports.createAuthError = createAuthError;
const createNotFoundError = (resource, id, context) => {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
    return new NotFoundError(message, { resource, id, ...context });
};
exports.createNotFoundError = createNotFoundError;
// Error handler utility
const handleError = (error, defaultMessage = 'An error occurred') => {
    if (error instanceof AppError) {
        return error;
    }
    if (error instanceof Error) {
        logger_1.logger.error('Unhandled error converted to AppError', {
            originalError: error.message,
            stack: error.stack,
        });
        return new AppError(error.message || defaultMessage, 500, false, ErrorCode.INTERNAL_ERROR, {
            originalError: error.message,
        });
    }
    logger_1.logger.error('Unknown error converted to AppError', {
        error: String(error),
    });
    return new AppError(defaultMessage, 500, false, ErrorCode.INTERNAL_ERROR, {
        originalError: String(error),
    });
};
exports.handleError = handleError;
// Error response formatter
const formatErrorResponse = (error) => {
    const response = error.toJSON();
    // In production, hide sensitive information
    if (process.env.NODE_ENV === 'production' && !error.isOperational) {
        response.error = {
            message: 'Internal server error',
            code: ErrorCode.INTERNAL_ERROR,
            statusCode: 500,
            timestamp: error.timestamp.toISOString(),
        };
    }
    return response;
};
exports.formatErrorResponse = formatErrorResponse;
// Default export
exports.default = AppError;
//# sourceMappingURL=AppError.js.map