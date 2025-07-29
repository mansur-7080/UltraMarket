"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCode = exports.ServiceUnavailableError = exports.InternalServerError = exports.TooManyRequestsError = exports.ValidationError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.AppError = void 0;
exports.createError = createError;
// Base error class
class AppError extends Error {
    statusCode;
    isOperational;
    code;
    constructor(message, statusCode, isOperational = true, code) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
// Factory function to create errors
function createError(statusCode, message, code) {
    switch (statusCode) {
        case 400:
            return new BadRequestError(message, code);
        case 401:
            return new UnauthorizedError(message, code);
        case 403:
            return new ForbiddenError(message, code);
        case 404:
            return new NotFoundError(message, code);
        case 409:
            return new ConflictError(message, code);
        case 422:
            return new ValidationError({}, message);
        case 429:
            return new TooManyRequestsError(message, code);
        case 500:
            return new InternalServerError(message, code);
        case 503:
            return new ServiceUnavailableError(message, code);
        default:
            return new AppError(message, statusCode, true, code);
    }
}
// Common error classes
class BadRequestError extends AppError {
    constructor(message = 'Bad Request', code) {
        super(message, 400, true, code);
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized', code) {
        super(message, 401, true, code);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden', code) {
        super(message, 403, true, code);
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(message = 'Resource not found', code) {
        super(message, 404, true, code);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message = 'Conflict', code) {
        super(message, 409, true, code);
    }
}
exports.ConflictError = ConflictError;
class ValidationError extends AppError {
    errors;
    constructor(errors, message = 'Validation failed') {
        super(message, 422, true, 'VALIDATION_ERROR');
        this.errors = errors;
    }
}
exports.ValidationError = ValidationError;
class TooManyRequestsError extends AppError {
    constructor(message = 'Too many requests', code) {
        super(message, 429, true, code);
    }
}
exports.TooManyRequestsError = TooManyRequestsError;
class InternalServerError extends AppError {
    constructor(message = 'Internal server error', code) {
        super(message, 500, false, code);
    }
}
exports.InternalServerError = InternalServerError;
class ServiceUnavailableError extends AppError {
    constructor(message = 'Service unavailable', code) {
        super(message, 503, false, code);
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
// Error codes
exports.ErrorCode = {
    // Authentication errors
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    TOKEN_INVALID: 'TOKEN_INVALID',
    // User errors
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
    EMAIL_ALREADY_VERIFIED: 'EMAIL_ALREADY_VERIFIED',
    // Product errors
    PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
    PRODUCT_OUT_OF_STOCK: 'PRODUCT_OUT_OF_STOCK',
    // Order errors
    ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
    ORDER_ALREADY_CANCELLED: 'ORDER_ALREADY_CANCELLED',
    // Payment errors
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
    // General errors
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
};
//# sourceMappingURL=errors.js.map