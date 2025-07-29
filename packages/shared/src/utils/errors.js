"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.UltraMarketError = void 0;
exports.createError = createError;
exports.createValidationError = createValidationError;
exports.createAuthenticationError = createAuthenticationError;
exports.createAuthorizationError = createAuthorizationError;
exports.createNotFoundError = createNotFoundError;
exports.createConflictError = createConflictError;
exports.createRateLimitError = createRateLimitError;
class UltraMarketError extends Error {
    code;
    statusCode;
    isOperational;
    constructor(message, code = 'INTERNAL_ERROR', statusCode = 500, isOperational = true) {
        super(message);
        this.name = 'UltraMarketError';
        this.code = code;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
    }
}
exports.UltraMarketError = UltraMarketError;
class ValidationError extends UltraMarketError {
    constructor(message, code = 'VALIDATION_ERROR') {
        super(message, code, 400);
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends UltraMarketError {
    constructor(message = 'Authentication failed', code = 'AUTHENTICATION_ERROR') {
        super(message, code, 401);
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends UltraMarketError {
    constructor(message = 'Access denied', code = 'AUTHORIZATION_ERROR') {
        super(message, code, 403);
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends UltraMarketError {
    constructor(message = 'Resource not found', code = 'NOT_FOUND_ERROR') {
        super(message, code, 404);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends UltraMarketError {
    constructor(message = 'Resource conflict', code = 'CONFLICT_ERROR') {
        super(message, code, 409);
    }
}
exports.ConflictError = ConflictError;
class RateLimitError extends UltraMarketError {
    constructor(message = 'Rate limit exceeded', code = 'RATE_LIMIT_ERROR') {
        super(message, code, 429);
    }
}
exports.RateLimitError = RateLimitError;
function createError(message, code = 'INTERNAL_ERROR', statusCode = 500) {
    return new UltraMarketError(message, code, statusCode);
}
function createValidationError(message, code) {
    return new ValidationError(message, code);
}
function createAuthenticationError(message, code) {
    return new AuthenticationError(message, code);
}
function createAuthorizationError(message, code) {
    return new AuthorizationError(message, code);
}
function createNotFoundError(message, code) {
    return new NotFoundError(message, code);
}
function createConflictError(message, code) {
    return new ConflictError(message, code);
}
function createRateLimitError(message, code) {
    return new RateLimitError(message, code);
}
//# sourceMappingURL=errors.js.map