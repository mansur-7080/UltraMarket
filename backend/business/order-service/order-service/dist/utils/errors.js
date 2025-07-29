"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalServerError = exports.ValidationError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.ErrorCode = exports.HttpStatusCode = exports.AppError = void 0;
// Base error class
var AppError = /** @class */ (function (_super) {
    __extends(AppError, _super);
    function AppError(statusCode, message, code, details, isOperational) {
        if (statusCode === void 0) { statusCode = 500; }
        if (isOperational === void 0) { isOperational = true; }
        var _this = _super.call(this, message) || this;
        _this.statusCode = statusCode;
        _this.isOperational = isOperational;
        _this.code = code;
        _this.details = details;
        Error.captureStackTrace(_this, _this.constructor);
        return _this;
    }
    return AppError;
}(Error));
exports.AppError = AppError;
// HTTP status codes
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
// Error codes
var ErrorCode;
(function (ErrorCode) {
    // Authentication & Authorization
    ErrorCode["INVALID_CREDENTIALS"] = "INVALID_CREDENTIALS";
    ErrorCode["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    ErrorCode["INSUFFICIENT_PERMISSIONS"] = "INSUFFICIENT_PERMISSIONS";
    // Resource errors
    ErrorCode["RESOURCE_NOT_FOUND"] = "RESOURCE_NOT_FOUND";
    ErrorCode["RESOURCE_ALREADY_EXISTS"] = "RESOURCE_ALREADY_EXISTS";
    // Validation errors
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    // Business logic errors
    ErrorCode["BUSINESS_RULE_VIOLATION"] = "BUSINESS_RULE_VIOLATION";
    ErrorCode["INSUFFICIENT_STOCK"] = "INSUFFICIENT_STOCK";
    // System errors
    ErrorCode["INTERNAL_SERVER_ERROR"] = "INTERNAL_SERVER_ERROR";
    ErrorCode["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
// Specific error classes
var BadRequestError = /** @class */ (function (_super) {
    __extends(BadRequestError, _super);
    function BadRequestError(message, code) {
        if (message === void 0) { message = 'Bad Request'; }
        return _super.call(this, HttpStatusCode.BAD_REQUEST, message, code || ErrorCode.VALIDATION_ERROR) || this;
    }
    return BadRequestError;
}(AppError));
exports.BadRequestError = BadRequestError;
var UnauthorizedError = /** @class */ (function (_super) {
    __extends(UnauthorizedError, _super);
    function UnauthorizedError(message, code) {
        if (message === void 0) { message = 'Unauthorized'; }
        return _super.call(this, HttpStatusCode.UNAUTHORIZED, message, code || ErrorCode.INVALID_CREDENTIALS) || this;
    }
    return UnauthorizedError;
}(AppError));
exports.UnauthorizedError = UnauthorizedError;
var ForbiddenError = /** @class */ (function (_super) {
    __extends(ForbiddenError, _super);
    function ForbiddenError(message, code) {
        if (message === void 0) { message = 'Forbidden'; }
        return _super.call(this, HttpStatusCode.FORBIDDEN, message, code || ErrorCode.INSUFFICIENT_PERMISSIONS) || this;
    }
    return ForbiddenError;
}(AppError));
exports.ForbiddenError = ForbiddenError;
var NotFoundError = /** @class */ (function (_super) {
    __extends(NotFoundError, _super);
    function NotFoundError(message, code) {
        if (message === void 0) { message = 'Resource not found'; }
        return _super.call(this, HttpStatusCode.NOT_FOUND, message, code || ErrorCode.RESOURCE_NOT_FOUND) || this;
    }
    return NotFoundError;
}(AppError));
exports.NotFoundError = NotFoundError;
var ConflictError = /** @class */ (function (_super) {
    __extends(ConflictError, _super);
    function ConflictError(message, code) {
        if (message === void 0) { message = 'Resource already exists'; }
        return _super.call(this, HttpStatusCode.CONFLICT, message, code || ErrorCode.RESOURCE_ALREADY_EXISTS) || this;
    }
    return ConflictError;
}(AppError));
exports.ConflictError = ConflictError;
var ValidationError = /** @class */ (function (_super) {
    __extends(ValidationError, _super);
    function ValidationError(message, details) {
        if (message === void 0) { message = 'Validation failed'; }
        return _super.call(this, HttpStatusCode.UNPROCESSABLE_ENTITY, message, ErrorCode.VALIDATION_ERROR, details) || this;
    }
    return ValidationError;
}(AppError));
exports.ValidationError = ValidationError;
var InternalServerError = /** @class */ (function (_super) {
    __extends(InternalServerError, _super);
    function InternalServerError(message, code) {
        if (message === void 0) { message = 'Internal Server Error'; }
        return _super.call(this, HttpStatusCode.INTERNAL_SERVER_ERROR, message, code || ErrorCode.INTERNAL_SERVER_ERROR, undefined, false) || this;
    }
    return InternalServerError;
}(AppError));
exports.InternalServerError = InternalServerError;
