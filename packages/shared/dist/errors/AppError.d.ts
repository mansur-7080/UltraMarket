export declare enum ErrorCode {
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    INVALID_TOKEN = "INVALID_TOKEN",
    TOKEN_BLACKLISTED = "TOKEN_BLACKLISTED",
    WEAK_JWT_SECRET = "WEAK_JWT_SECRET",
    MISSING_AUTH_HEADER = "MISSING_AUTH_HEADER",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    INVALID_INPUT = "INVALID_INPUT",
    REQUIRED_FIELD_MISSING = "REQUIRED_FIELD_MISSING",
    INVALID_FORMAT = "INVALID_FORMAT",
    DATABASE_ERROR = "DATABASE_ERROR",
    RECORD_NOT_FOUND = "RECORD_NOT_FOUND",
    DUPLICATE_RECORD = "DUPLICATE_RECORD",
    CONSTRAINT_VIOLATION = "CONSTRAINT_VIOLATION",
    INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
    PRODUCT_OUT_OF_STOCK = "PRODUCT_OUT_OF_STOCK",
    ORDER_ALREADY_PROCESSED = "ORDER_ALREADY_PROCESSED",
    PAYMENT_FAILED = "PAYMENT_FAILED",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    FILE_UPLOAD_ERROR = "FILE_UPLOAD_ERROR",
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
    PAYMENT_GATEWAY_ERROR = "PAYMENT_GATEWAY_ERROR",
    SMS_SERVICE_ERROR = "SMS_SERVICE_ERROR",
    EMAIL_SERVICE_ERROR = "EMAIL_SERVICE_ERROR"
}
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly code: string;
    readonly timestamp: Date;
    readonly context?: Record<string, any>;
    constructor(message: string, statusCode?: number, isOperational?: boolean, code?: string, context?: Record<string, any>);
    toJSON(): Record<string, any>;
    getUserMessage(): string;
}
export declare class ValidationError extends AppError {
    readonly errors: Record<string, string[]>;
    constructor(errors: Record<string, string[]>, message?: string, context?: Record<string, any>);
    toJSON(): Record<string, any>;
}
export declare class AuthenticationError extends AppError {
    constructor(message?: string, code?: string, context?: Record<string, any>);
}
export declare class AuthorizationError extends AppError {
    constructor(message?: string, context?: Record<string, any>);
}
export declare class NotFoundError extends AppError {
    constructor(resource?: string, context?: Record<string, any>);
}
export declare class ConflictError extends AppError {
    constructor(message?: string, context?: Record<string, any>);
}
export declare class RateLimitError extends AppError {
    constructor(message?: string, context?: Record<string, any>);
}
export declare class DatabaseError extends AppError {
    constructor(message?: string, context?: Record<string, any>);
}
export declare class ExternalServiceError extends AppError {
    constructor(serviceName: string, message?: string, context?: Record<string, any>);
}
export declare class PaymentError extends AppError {
    constructor(message?: string, context?: Record<string, any>);
}
export declare class BusinessLogicError extends AppError {
    constructor(message: string, code: string, context?: Record<string, any>);
}
export declare class FileUploadError extends AppError {
    constructor(message?: string, context?: Record<string, any>);
}
export declare const createValidationError: (field: string, message: string, context?: Record<string, any>) => ValidationError;
export declare const createAuthError: (message?: string, context?: Record<string, any>) => AuthenticationError;
export declare const createNotFoundError: (resource: string, id?: string | number, context?: Record<string, any>) => NotFoundError;
export declare const handleError: (error: unknown, defaultMessage?: string) => AppError;
export declare const formatErrorResponse: (error: AppError) => Record<string, any>;
export default AppError;
//# sourceMappingURL=AppError.d.ts.map