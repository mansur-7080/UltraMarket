"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForbiddenError = exports.UnauthorizedError = exports.AuthError = exports.DatabaseError = exports.RateLimitError = exports.ConflictError = exports.ValidationError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.AuthServiceError = exports.ErrorCode = void 0;
exports.handlePrismaError = handlePrismaError;
exports.errorHandler = errorHandler;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["INVALID_CREDENTIALS"] = "INVALID_CREDENTIALS";
    ErrorCode["ACCOUNT_LOCKED"] = "ACCOUNT_LOCKED";
    ErrorCode["EMAIL_NOT_VERIFIED"] = "EMAIL_NOT_VERIFIED";
    ErrorCode["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    ErrorCode["TOKEN_INVALID"] = "TOKEN_INVALID";
    ErrorCode["TOKEN_REVOKED"] = "TOKEN_REVOKED";
    ErrorCode["USER_NOT_FOUND"] = "USER_NOT_FOUND";
    ErrorCode["USER_ALREADY_EXISTS"] = "USER_ALREADY_EXISTS";
    ErrorCode["EMAIL_ALREADY_IN_USE"] = "EMAIL_ALREADY_IN_USE";
    ErrorCode["INVALID_ROLE"] = "INVALID_ROLE";
    ErrorCode["PASSWORD_TOO_WEAK"] = "PASSWORD_TOO_WEAK";
    ErrorCode["PASSWORD_RECENTLY_USED"] = "PASSWORD_RECENTLY_USED";
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["MISSING_REQUIRED_FIELDS"] = "MISSING_REQUIRED_FIELDS";
    ErrorCode["INSUFFICIENT_PERMISSIONS"] = "INSUFFICIENT_PERMISSIONS";
    ErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    ErrorCode["DATABASE_ERROR"] = "DATABASE_ERROR";
    ErrorCode["INTERNAL_SERVER_ERROR"] = "INTERNAL_SERVER_ERROR";
    ErrorCode["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
class AuthServiceError extends Error {
    statusCode;
    errorCode;
    details;
    isOperational;
    constructor(message, statusCode = 500, errorCode = ErrorCode.INTERNAL_SERVER_ERROR, details, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.details = details;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
        this.logError();
    }
    logError() {
        const logLevel = this.isOperational ? 'warn' : 'error';
        logger_1.logger[logLevel](`${this.errorCode}: ${this.message}`, {
            statusCode: this.statusCode,
            errorCode: this.errorCode,
            details: this.details,
            stack: this.isOperational ? undefined : this.stack,
        });
    }
    toResponse(requestId) {
        return {
            success: false,
            error: {
                code: this.errorCode,
                message: this.message,
                details: this.details,
            },
            meta: {
                timestamp: new Date().toISOString(),
                ...(requestId && { requestId }),
            },
        };
    }
}
exports.AuthServiceError = AuthServiceError;
class AuthenticationError extends AuthServiceError {
    constructor(message = 'Authentication failed', errorCode = ErrorCode.INVALID_CREDENTIALS, details) {
        super(message, 401, errorCode, details, true);
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends AuthServiceError {
    constructor(message = 'Insufficient permissions', errorCode = ErrorCode.INSUFFICIENT_PERMISSIONS, details) {
        super(message, 403, errorCode, details, true);
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends AuthServiceError {
    constructor(resource = 'Resource', errorCode = ErrorCode.USER_NOT_FOUND, details) {
        super(`${resource} not found`, 404, errorCode, details, true);
    }
}
exports.NotFoundError = NotFoundError;
class ValidationError extends AuthServiceError {
    constructor(details, message = 'Validation failed', errorCode = ErrorCode.VALIDATION_ERROR) {
        super(message, 422, errorCode, { validationErrors: details }, true);
    }
}
exports.ValidationError = ValidationError;
class ConflictError extends AuthServiceError {
    constructor(message = 'Resource conflict', errorCode = ErrorCode.USER_ALREADY_EXISTS, details) {
        super(message, 409, errorCode, details, true);
    }
}
exports.ConflictError = ConflictError;
class RateLimitError extends AuthServiceError {
    constructor(message = 'Too many requests', details) {
        super(message, 429, ErrorCode.RATE_LIMIT_EXCEEDED, details, true);
    }
}
exports.RateLimitError = RateLimitError;
class DatabaseError extends AuthServiceError {
    constructor(message = 'Database operation failed', details) {
        super(message, 500, ErrorCode.DATABASE_ERROR, details, false);
    }
}
exports.DatabaseError = DatabaseError;
class AuthError extends AuthServiceError {
    constructor(message = 'Authentication error', statusCode = 401, errorCode = ErrorCode.INVALID_CREDENTIALS) {
        super(message, statusCode, errorCode);
    }
}
exports.AuthError = AuthError;
class UnauthorizedError extends AuthServiceError {
    constructor(message = 'Unauthorized access', statusCode = 401, errorCode = ErrorCode.INSUFFICIENT_PERMISSIONS) {
        super(message, statusCode, errorCode);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AuthServiceError {
    constructor(message = 'Forbidden access', statusCode = 403, errorCode = ErrorCode.INSUFFICIENT_PERMISSIONS) {
        super(message, statusCode, errorCode);
    }
}
exports.ForbiddenError = ForbiddenError;
function handlePrismaError(error, operation) {
    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
            const target = error.meta?.['target'] || [];
            return new ConflictError(`${target.join(', ')} already in use`, target.includes('email') ? ErrorCode.EMAIL_ALREADY_IN_USE : ErrorCode.USER_ALREADY_EXISTS, { fields: target });
        }
        if (error.code === 'P2003') {
            return new ValidationError({ [error.meta?.['field_name']]: ['Invalid reference'] }, 'Invalid reference to related resource');
        }
        if (error.code === 'P2001' || error.code === 'P2018') {
            return new NotFoundError('Record', ErrorCode.USER_NOT_FOUND);
        }
    }
    if (error instanceof client_1.Prisma.PrismaClientValidationError) {
        return new ValidationError({ _general: ['Invalid data format'] }, 'Invalid data format for database operation');
    }
    if (error instanceof client_1.Prisma.PrismaClientInitializationError) {
        return new AuthServiceError('Database connection failed', 503, ErrorCode.SERVICE_UNAVAILABLE, { operation }, false);
    }
    return new DatabaseError(`Database ${operation} operation failed`, {
        originalError: error.message,
    });
}
function errorHandler(err, req, res, next) {
    if (err instanceof AuthServiceError) {
        return res.status(err.statusCode).json(err.toResponse(req.id));
    }
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError ||
        err instanceof client_1.Prisma.PrismaClientValidationError ||
        err instanceof client_1.Prisma.PrismaClientInitializationError) {
        const operation = req.method + ' ' + req.path;
        const serviceError = handlePrismaError(err, operation);
        return res.status(serviceError.statusCode).json(serviceError.toResponse(req.id));
    }
    const serverError = new AuthServiceError(err.message || 'Internal server error', 500, ErrorCode.INTERNAL_SERVER_ERROR, { originalError: err.message }, false);
    logger_1.logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        requestId: req.id,
    });
    return res.status(500).json(serverError.toResponse(req.id));
}
//# sourceMappingURL=error-handler.js.map