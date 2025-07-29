"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalServerError = exports.ValidationError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.ErrorCode = exports.HttpStatusCode = exports.AppError = void 0;
exports.createError = createError;
class AppError extends Error {
    statusCode;
    isOperational;
    code;
    constructor(message, statusCode = 500, isOperational = true, code) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
var HttpStatusCode;
(function (HttpStatusCode) {
    HttpStatusCode[HttpStatusCode["OK"] = 200] = "OK";
    HttpStatusCode[HttpStatusCode["CREATED"] = 201] = "CREATED";
    HttpStatusCode[HttpStatusCode["BAD_REQUEST"] = 400] = "BAD_REQUEST";
    HttpStatusCode[HttpStatusCode["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
    HttpStatusCode[HttpStatusCode["FORBIDDEN"] = 403] = "FORBIDDEN";
    HttpStatusCode[HttpStatusCode["NOT_FOUND"] = 404] = "NOT_FOUND";
    HttpStatusCode[HttpStatusCode["CONFLICT"] = 409] = "CONFLICT";
    HttpStatusCode[HttpStatusCode["UNPROCESSABLE_ENTITY"] = 422] = "UNPROCESSABLE_ENTITY";
    HttpStatusCode[HttpStatusCode["INTERNAL_SERVER_ERROR"] = 500] = "INTERNAL_SERVER_ERROR";
})(HttpStatusCode || (exports.HttpStatusCode = HttpStatusCode = {}));
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["INVALID_CREDENTIALS"] = "INVALID_CREDENTIALS";
    ErrorCode["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    ErrorCode["INSUFFICIENT_PERMISSIONS"] = "INSUFFICIENT_PERMISSIONS";
    ErrorCode["RESOURCE_NOT_FOUND"] = "RESOURCE_NOT_FOUND";
    ErrorCode["RESOURCE_ALREADY_EXISTS"] = "RESOURCE_ALREADY_EXISTS";
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["BUSINESS_RULE_VIOLATION"] = "BUSINESS_RULE_VIOLATION";
    ErrorCode["INSUFFICIENT_STOCK"] = "INSUFFICIENT_STOCK";
    ErrorCode["INTERNAL_SERVER_ERROR"] = "INTERNAL_SERVER_ERROR";
    ErrorCode["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
class BadRequestError extends AppError {
    constructor(message = 'Bad Request', code) {
        super(message, HttpStatusCode.BAD_REQUEST, true, code || ErrorCode.VALIDATION_ERROR);
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized', code) {
        super(message, HttpStatusCode.UNAUTHORIZED, true, code || ErrorCode.INVALID_CREDENTIALS);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden', code) {
        super(message, HttpStatusCode.FORBIDDEN, true, code || ErrorCode.INSUFFICIENT_PERMISSIONS);
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(message = 'Resource not found', code) {
        super(message, HttpStatusCode.NOT_FOUND, true, code || ErrorCode.RESOURCE_NOT_FOUND);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message = 'Resource already exists', code) {
        super(message, HttpStatusCode.CONFLICT, true, code || ErrorCode.RESOURCE_ALREADY_EXISTS);
    }
}
exports.ConflictError = ConflictError;
class ValidationError extends AppError {
    constructor(message = 'Validation failed', details) {
        super(message, HttpStatusCode.UNPROCESSABLE_ENTITY, true, ErrorCode.VALIDATION_ERROR);
        this.details = details;
    }
    details;
}
exports.ValidationError = ValidationError;
class InternalServerError extends AppError {
    constructor(message = 'Internal Server Error', code) {
        super(message, HttpStatusCode.INTERNAL_SERVER_ERROR, false, code || ErrorCode.INTERNAL_SERVER_ERROR);
    }
}
exports.InternalServerError = InternalServerError;
function createError(status, message, details) {
    switch (status) {
        case 400:
            return new BadRequestError(message);
        case 401:
            return new UnauthorizedError(message);
        case 403:
            return new ForbiddenError(message);
        case 404:
            return new NotFoundError(message);
        case 409:
            return new ConflictError(message);
        case 422:
            return new ValidationError(message, details);
        default:
            return new InternalServerError(message);
    }
}
//# sourceMappingURL=errors.js.map