export declare enum ErrorCode {
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
    ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
    EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    TOKEN_INVALID = "TOKEN_INVALID",
    TOKEN_REVOKED = "TOKEN_REVOKED",
    USER_NOT_FOUND = "USER_NOT_FOUND",
    USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS",
    EMAIL_ALREADY_IN_USE = "EMAIL_ALREADY_IN_USE",
    INVALID_ROLE = "INVALID_ROLE",
    PASSWORD_TOO_WEAK = "PASSWORD_TOO_WEAK",
    PASSWORD_RECENTLY_USED = "PASSWORD_RECENTLY_USED",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    MISSING_REQUIRED_FIELDS = "MISSING_REQUIRED_FIELDS",
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    DATABASE_ERROR = "DATABASE_ERROR",
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
}
export interface ErrorResponse {
    success: boolean;
    error: {
        code: string;
        message: string;
        details?: any;
    };
    meta?: {
        timestamp: string;
        requestId?: string;
    };
}
export declare class AuthServiceError extends Error {
    readonly statusCode: number;
    readonly errorCode: string;
    readonly details?: any;
    readonly isOperational: boolean;
    constructor(message: string, statusCode?: number, errorCode?: string, details?: any, isOperational?: boolean);
    private logError;
    toResponse(requestId?: string): ErrorResponse;
}
export declare class AuthenticationError extends AuthServiceError {
    constructor(message?: string, errorCode?: string, details?: any);
}
export declare class AuthorizationError extends AuthServiceError {
    constructor(message?: string, errorCode?: string, details?: any);
}
export declare class NotFoundError extends AuthServiceError {
    constructor(resource?: string, errorCode?: string, details?: any);
}
export declare class ValidationError extends AuthServiceError {
    constructor(details: Record<string, string[]>, message?: string, errorCode?: string);
}
export declare class ConflictError extends AuthServiceError {
    constructor(message?: string, errorCode?: string, details?: any);
}
export declare class RateLimitError extends AuthServiceError {
    constructor(message?: string, details?: any);
}
export declare class DatabaseError extends AuthServiceError {
    constructor(message?: string, details?: any);
}
export declare class AuthError extends AuthServiceError {
    constructor(message?: string, statusCode?: number, errorCode?: string);
}
export declare class UnauthorizedError extends AuthServiceError {
    constructor(message?: string, statusCode?: number, errorCode?: string);
}
export declare class ForbiddenError extends AuthServiceError {
    constructor(message?: string, statusCode?: number, errorCode?: string);
}
export declare function handlePrismaError(error: any, operation: string): AuthServiceError;
export declare function errorHandler(err: any, req: any, res: any, next: any): any;
//# sourceMappingURL=error-handler.d.ts.map