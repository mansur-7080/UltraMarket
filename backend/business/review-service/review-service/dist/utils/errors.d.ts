export declare class ApiError extends Error {
    statusCode: number;
    isOperational: boolean;
    code?: string;
    details?: any;
    constructor(message: string, statusCode?: number, isOperational?: boolean, code?: string, details?: any);
}
export declare class ValidationError extends ApiError {
    constructor(message: string, details?: any);
}
export declare class NotFoundError extends ApiError {
    constructor(resource?: string);
}
export declare class UnauthorizedError extends ApiError {
    constructor(message?: string);
}
export declare class ForbiddenError extends ApiError {
    constructor(message?: string);
}
export declare class ConflictError extends ApiError {
    constructor(message: string, details?: any);
}
export declare class TooManyRequestsError extends ApiError {
    constructor(message?: string);
}
export declare class DatabaseError extends ApiError {
    constructor(message?: string, details?: any);
}
export declare class ExternalServiceError extends ApiError {
    constructor(service: string, message?: string, details?: any);
}
export declare class ReviewError extends ApiError {
    constructor(message: string, statusCode?: number, details?: any);
}
export declare class ReviewNotFoundError extends NotFoundError {
    constructor();
}
export declare class ReviewAlreadyExistsError extends ConflictError {
    constructor();
}
export declare class ReviewPermissionError extends ForbiddenError {
    constructor(action?: string);
}
export declare class ReviewModerationError extends ApiError {
    constructor(message?: string);
}
export declare class ReviewVotingError extends ApiError {
    constructor(message?: string);
}
export declare class ReviewFlagError extends ApiError {
    constructor(message?: string);
}
export declare class ReviewReplyError extends ApiError {
    constructor(message?: string);
}
export declare const handleDatabaseError: (error: any) => ApiError;
export declare const handleAsyncError: (fn: Function) => (req: any, res: any, next: any) => void;
export declare const formatErrorResponse: (error: ApiError) => any;
export declare const logError: (error: Error, context?: any) => void;
export declare const formatValidationError: (errors: any[]) => ValidationError;
export declare const isClientError: (statusCode: number) => boolean;
export declare const isServerError: (statusCode: number) => boolean;
export declare const isOperationalError: (error: Error) => boolean;
export declare const ERROR_CODES: {
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly CONFLICT: "CONFLICT";
    readonly TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS";
    readonly DATABASE_ERROR: "DATABASE_ERROR";
    readonly EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR";
    readonly REVIEW_ERROR: "REVIEW_ERROR";
    readonly REVIEW_MODERATION_ERROR: "REVIEW_MODERATION_ERROR";
    readonly REVIEW_VOTING_ERROR: "REVIEW_VOTING_ERROR";
    readonly REVIEW_FLAG_ERROR: "REVIEW_FLAG_ERROR";
    readonly REVIEW_REPLY_ERROR: "REVIEW_REPLY_ERROR";
};
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly TOO_MANY_REQUESTS: 429;
    readonly INTERNAL_SERVER_ERROR: 500;
    readonly SERVICE_UNAVAILABLE: 503;
};
//# sourceMappingURL=errors.d.ts.map