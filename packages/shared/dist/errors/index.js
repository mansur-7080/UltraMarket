"use strict";
/**
 * UltraMarket Error Handling System
 * Comprehensive error classes and utilities for all microservices
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMap = exports.ApiError = exports.ServiceUnavailableError = exports.RateLimitError = exports.ExternalServiceError = exports.DatabaseError = exports.PaymentFailedError = exports.InsufficientStockError = exports.BusinessRuleViolationError = exports.ResourceAlreadyExistsError = exports.ResourceNotFoundError = exports.InvalidValueError = exports.InvalidFormatError = exports.RequiredFieldError = exports.ValidationError = exports.AccountLockedError = exports.TokenExpiredError = exports.AuthorizationError = exports.AuthenticationError = exports.AppError = void 0;
exports.isOperationalError = isOperationalError;
exports.createErrorResponse = createErrorResponse;
exports.handleAsyncError = handleAsyncError;
exports.createErrorFromCode = createErrorFromCode;
const api_responses_1 = require("../types/api-responses");
// Base error class for all application errors
class AppError extends Error {
    statusCode;
    code;
    isOperational;
    details;
    timestamp;
    constructor(statusCode, message, code = api_responses_1.ErrorCode.INTERNAL_ERROR, details, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
// Authentication and Authorization Errors
class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed', details) {
        super(api_responses_1.HttpStatusCode.UNAUTHORIZED, message, api_responses_1.ErrorCode.INVALID_CREDENTIALS, details);
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends AppError {
    constructor(message = 'Insufficient permissions', details) {
        super(api_responses_1.HttpStatusCode.FORBIDDEN, message, api_responses_1.ErrorCode.INSUFFICIENT_PERMISSIONS, details);
    }
}
exports.AuthorizationError = AuthorizationError;
class TokenExpiredError extends AppError {
    constructor(message = 'Token has expired', details) {
        super(api_responses_1.HttpStatusCode.UNAUTHORIZED, message, api_responses_1.ErrorCode.TOKEN_EXPIRED, details);
    }
}
exports.TokenExpiredError = TokenExpiredError;
class AccountLockedError extends AppError {
    constructor(message = 'Account is locked', details) {
        super(api_responses_1.HttpStatusCode.FORBIDDEN, message, api_responses_1.ErrorCode.ACCOUNT_LOCKED, details);
    }
}
exports.AccountLockedError = AccountLockedError;
// Validation Errors
class ValidationError extends AppError {
    constructor(message = 'Validation failed', details) {
        super(api_responses_1.HttpStatusCode.BAD_REQUEST, message, api_responses_1.ErrorCode.VALIDATION_ERROR, details);
    }
}
exports.ValidationError = ValidationError;
class RequiredFieldError extends AppError {
    constructor(field, message) {
        super(api_responses_1.HttpStatusCode.BAD_REQUEST, message || `Required field '${field}' is missing`, api_responses_1.ErrorCode.REQUIRED_FIELD_MISSING, [{ field, message: message || `Required field '${field}' is missing` }]);
    }
}
exports.RequiredFieldError = RequiredFieldError;
class InvalidFormatError extends AppError {
    constructor(field, format, value) {
        super(api_responses_1.HttpStatusCode.BAD_REQUEST, `Invalid format for field '${field}'. Expected: ${format}`, api_responses_1.ErrorCode.INVALID_FORMAT, [{ field, format, value }]);
    }
}
exports.InvalidFormatError = InvalidFormatError;
class InvalidValueError extends AppError {
    constructor(field, message, value) {
        super(api_responses_1.HttpStatusCode.BAD_REQUEST, message, api_responses_1.ErrorCode.INVALID_VALUE, [
            { field, message, value },
        ]);
    }
}
exports.InvalidValueError = InvalidValueError;
// Business Logic Errors
class ResourceNotFoundError extends AppError {
    constructor(resource, id) {
        const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
        super(api_responses_1.HttpStatusCode.NOT_FOUND, message, api_responses_1.ErrorCode.RESOURCE_NOT_FOUND, [{ resource, id }]);
    }
}
exports.ResourceNotFoundError = ResourceNotFoundError;
class ResourceAlreadyExistsError extends AppError {
    constructor(resource, field, value) {
        super(api_responses_1.HttpStatusCode.CONFLICT, `${resource} with ${field} '${value}' already exists`, api_responses_1.ErrorCode.RESOURCE_ALREADY_EXISTS, [{ resource, field, value }]);
    }
}
exports.ResourceAlreadyExistsError = ResourceAlreadyExistsError;
class BusinessRuleViolationError extends AppError {
    constructor(message, details) {
        super(api_responses_1.HttpStatusCode.UNPROCESSABLE_ENTITY, message, api_responses_1.ErrorCode.BUSINESS_RULE_VIOLATION, details);
    }
}
exports.BusinessRuleViolationError = BusinessRuleViolationError;
class InsufficientStockError extends AppError {
    constructor(productId, requested, available) {
        super(api_responses_1.HttpStatusCode.UNPROCESSABLE_ENTITY, `Insufficient stock for product ${productId}. Requested: ${requested}, Available: ${available}`, api_responses_1.ErrorCode.INSUFFICIENT_STOCK, [{ productId, requested, available }]);
    }
}
exports.InsufficientStockError = InsufficientStockError;
class PaymentFailedError extends AppError {
    constructor(message, transactionId, details) {
        super(api_responses_1.HttpStatusCode.UNPROCESSABLE_ENTITY, message, api_responses_1.ErrorCode.PAYMENT_FAILED, [
            { transactionId, ...details },
        ]);
    }
}
exports.PaymentFailedError = PaymentFailedError;
// System Errors
class DatabaseError extends AppError {
    constructor(message = 'Database operation failed', details) {
        super(api_responses_1.HttpStatusCode.INTERNAL_SERVER_ERROR, message, api_responses_1.ErrorCode.DATABASE_ERROR, details, false);
    }
}
exports.DatabaseError = DatabaseError;
class ExternalServiceError extends AppError {
    constructor(service, message, details) {
        super(api_responses_1.HttpStatusCode.BAD_GATEWAY, `External service '${service}' error: ${message}`, api_responses_1.ErrorCode.EXTERNAL_SERVICE_ERROR, [{ service, message, ...details }], false);
    }
}
exports.ExternalServiceError = ExternalServiceError;
class RateLimitError extends AppError {
    constructor(message = 'Rate limit exceeded', retryAfter) {
        super(api_responses_1.HttpStatusCode.TOO_MANY_REQUESTS, message, api_responses_1.ErrorCode.RATE_LIMIT_EXCEEDED, [
            { retryAfter },
        ]);
    }
}
exports.RateLimitError = RateLimitError;
class ServiceUnavailableError extends AppError {
    constructor(message = 'Service temporarily unavailable') {
        super(api_responses_1.HttpStatusCode.SERVICE_UNAVAILABLE, message, api_responses_1.ErrorCode.SERVICE_UNAVAILABLE, undefined, false);
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
// Legacy ApiError class for backward compatibility
class ApiError extends AppError {
    constructor(statusCode, message, details, code) {
        super(statusCode, message, code || api_responses_1.ErrorCode.INTERNAL_ERROR, details);
    }
}
exports.ApiError = ApiError;
// Error utilities
function isOperationalError(error) {
    if (error instanceof AppError) {
        return error.isOperational;
    }
    return false;
}
function createErrorResponse(error, requestId) {
    return {
        success: false,
        error: {
            code: error.code,
            message: error.message,
            details: error.details,
            timestamp: error.timestamp,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
        },
        ...(requestId && { requestId }),
        timestamp: new Date().toISOString(),
    };
}
function handleAsyncError(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
// Error mapping utilities
exports.errorMap = {
    [api_responses_1.ErrorCode.INVALID_CREDENTIALS]: AuthenticationError,
    [api_responses_1.ErrorCode.TOKEN_EXPIRED]: TokenExpiredError,
    [api_responses_1.ErrorCode.INSUFFICIENT_PERMISSIONS]: AuthorizationError,
    [api_responses_1.ErrorCode.ACCOUNT_LOCKED]: AccountLockedError,
    [api_responses_1.ErrorCode.VALIDATION_ERROR]: ValidationError,
    [api_responses_1.ErrorCode.REQUIRED_FIELD_MISSING]: RequiredFieldError,
    [api_responses_1.ErrorCode.INVALID_FORMAT]: InvalidFormatError,
    [api_responses_1.ErrorCode.INVALID_VALUE]: InvalidValueError,
    [api_responses_1.ErrorCode.RESOURCE_NOT_FOUND]: ResourceNotFoundError,
    [api_responses_1.ErrorCode.RESOURCE_ALREADY_EXISTS]: ResourceAlreadyExistsError,
    [api_responses_1.ErrorCode.BUSINESS_RULE_VIOLATION]: BusinessRuleViolationError,
    [api_responses_1.ErrorCode.INSUFFICIENT_STOCK]: InsufficientStockError,
    [api_responses_1.ErrorCode.PAYMENT_FAILED]: PaymentFailedError,
    [api_responses_1.ErrorCode.DATABASE_ERROR]: DatabaseError,
    [api_responses_1.ErrorCode.EXTERNAL_SERVICE_ERROR]: ExternalServiceError,
    [api_responses_1.ErrorCode.RATE_LIMIT_EXCEEDED]: RateLimitError,
    [api_responses_1.ErrorCode.SERVICE_UNAVAILABLE]: ServiceUnavailableError,
};
function createErrorFromCode(code, message, details) {
    // For now, just return a generic AppError with the code
    return new AppError(api_responses_1.HttpStatusCode.INTERNAL_SERVER_ERROR, message || 'Unknown error', code, details);
}
//# sourceMappingURL=index.js.map