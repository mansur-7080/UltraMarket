"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTP_STATUS = exports.ERROR_CODES = exports.isOperationalError = exports.isServerError = exports.isClientError = exports.formatValidationError = exports.logError = exports.formatErrorResponse = exports.handleAsyncError = exports.handleDatabaseError = exports.ReviewReplyError = exports.ReviewFlagError = exports.ReviewVotingError = exports.ReviewModerationError = exports.ReviewPermissionError = exports.ReviewAlreadyExistsError = exports.ReviewNotFoundError = exports.ReviewError = exports.ExternalServiceError = exports.DatabaseError = exports.TooManyRequestsError = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = exports.ApiError = void 0;
class ApiError extends Error {
    statusCode;
    isOperational;
    code;
    details;
    constructor(message, statusCode = 500, isOperational = true, code, details) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApiError = ApiError;
class ValidationError extends ApiError {
    constructor(message, details) {
        super(message, 400, true, 'VALIDATION_ERROR', details);
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends ApiError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, true, 'NOT_FOUND');
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends ApiError {
    constructor(message = 'Unauthorized access') {
        super(message, 401, true, 'UNAUTHORIZED');
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends ApiError {
    constructor(message = 'Forbidden access') {
        super(message, 403, true, 'FORBIDDEN');
    }
}
exports.ForbiddenError = ForbiddenError;
class ConflictError extends ApiError {
    constructor(message, details) {
        super(message, 409, true, 'CONFLICT', details);
    }
}
exports.ConflictError = ConflictError;
class TooManyRequestsError extends ApiError {
    constructor(message = 'Too many requests') {
        super(message, 429, true, 'TOO_MANY_REQUESTS');
    }
}
exports.TooManyRequestsError = TooManyRequestsError;
class DatabaseError extends ApiError {
    constructor(message = 'Database operation failed', details) {
        super(message, 500, true, 'DATABASE_ERROR', details);
    }
}
exports.DatabaseError = DatabaseError;
class ExternalServiceError extends ApiError {
    constructor(service, message, details) {
        super(message || `External service ${service} is unavailable`, 503, true, 'EXTERNAL_SERVICE_ERROR', { service, ...details });
    }
}
exports.ExternalServiceError = ExternalServiceError;
class ReviewError extends ApiError {
    constructor(message, statusCode = 400, details) {
        super(message, statusCode, true, 'REVIEW_ERROR', details);
    }
}
exports.ReviewError = ReviewError;
class ReviewNotFoundError extends NotFoundError {
    constructor() {
        super('Review');
    }
}
exports.ReviewNotFoundError = ReviewNotFoundError;
class ReviewAlreadyExistsError extends ConflictError {
    constructor() {
        super('You have already reviewed this product');
    }
}
exports.ReviewAlreadyExistsError = ReviewAlreadyExistsError;
class ReviewPermissionError extends ForbiddenError {
    constructor(action = 'perform this action') {
        super(`You don't have permission to ${action} on this review`);
    }
}
exports.ReviewPermissionError = ReviewPermissionError;
class ReviewModerationError extends ApiError {
    constructor(message = 'Review moderation failed') {
        super(message, 422, true, 'REVIEW_MODERATION_ERROR');
    }
}
exports.ReviewModerationError = ReviewModerationError;
class ReviewVotingError extends ApiError {
    constructor(message = 'Review voting failed') {
        super(message, 422, true, 'REVIEW_VOTING_ERROR');
    }
}
exports.ReviewVotingError = ReviewVotingError;
class ReviewFlagError extends ApiError {
    constructor(message = 'Review flagging failed') {
        super(message, 422, true, 'REVIEW_FLAG_ERROR');
    }
}
exports.ReviewFlagError = ReviewFlagError;
class ReviewReplyError extends ApiError {
    constructor(message = 'Review reply failed') {
        super(message, 422, true, 'REVIEW_REPLY_ERROR');
    }
}
exports.ReviewReplyError = ReviewReplyError;
const handleDatabaseError = (error) => {
    if (error.name === 'ValidationError') {
        return new ValidationError('Invalid data provided', error.errors);
    }
    if (error.name === 'CastError') {
        return new ValidationError('Invalid ID format');
    }
    if (error.code === 11000) {
        return new ConflictError('Duplicate entry', error.keyValue);
    }
    return new DatabaseError('Database operation failed', error.message);
};
exports.handleDatabaseError = handleDatabaseError;
const handleAsyncError = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.handleAsyncError = handleAsyncError;
const formatErrorResponse = (error) => {
    const response = {
        success: false,
        error: {
            message: error.message,
            code: error.code,
            statusCode: error.statusCode,
        },
    };
    if (error.details) {
        response.error.details = error.details;
    }
    if (process.env.NODE_ENV === 'development') {
        response.error.stack = error.stack;
    }
    return response;
};
exports.formatErrorResponse = formatErrorResponse;
const logError = (error, context) => {
    const errorInfo = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...context,
    };
    if (error instanceof ApiError) {
        errorInfo.statusCode = error.statusCode;
        errorInfo.code = error.code;
        errorInfo.isOperational = error.isOperational;
        errorInfo.details = error.details;
    }
    console.error('Error occurred:', errorInfo);
};
exports.logError = logError;
const formatValidationError = (errors) => {
    const formattedErrors = errors.map((error) => ({
        field: error.path || error.field,
        message: error.message,
        value: error.value,
    }));
    return new ValidationError('Validation failed', formattedErrors);
};
exports.formatValidationError = formatValidationError;
const isClientError = (statusCode) => {
    return statusCode >= 400 && statusCode < 500;
};
exports.isClientError = isClientError;
const isServerError = (statusCode) => {
    return statusCode >= 500;
};
exports.isServerError = isServerError;
const isOperationalError = (error) => {
    if (error instanceof ApiError) {
        return error.isOperational;
    }
    return false;
};
exports.isOperationalError = isOperationalError;
exports.ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    CONFLICT: 'CONFLICT',
    TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
    DATABASE_ERROR: 'DATABASE_ERROR',
    EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
    REVIEW_ERROR: 'REVIEW_ERROR',
    REVIEW_MODERATION_ERROR: 'REVIEW_MODERATION_ERROR',
    REVIEW_VOTING_ERROR: 'REVIEW_VOTING_ERROR',
    REVIEW_FLAG_ERROR: 'REVIEW_FLAG_ERROR',
    REVIEW_REPLY_ERROR: 'REVIEW_REPLY_ERROR',
};
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
};
//# sourceMappingURL=errors.js.map