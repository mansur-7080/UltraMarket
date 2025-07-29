/**
 * 🚨 Ultra Professional Error Handling System
 * UltraMarket E-commerce Platform
 *
 * Bu fayl barcha application errors ni professional tarzda handle qiladi
 * va comprehensive error reporting, monitoring va recovery ni ta'minlaydi
 */
import { Request, Response, NextFunction } from 'express';
/**
 * 🎯 Error Types
 */
export type UltraErrorType = 'VALIDATION_ERROR' | 'AUTHENTICATION_ERROR' | 'AUTHORIZATION_ERROR' | 'NOT_FOUND_ERROR' | 'CONFLICT_ERROR' | 'RATE_LIMIT_ERROR' | 'DATABASE_ERROR' | 'EXTERNAL_SERVICE_ERROR' | 'BUSINESS_LOGIC_ERROR' | 'NETWORK_ERROR' | 'TIMEOUT_ERROR' | 'INTERNAL_SERVER_ERROR' | 'BAD_REQUEST_ERROR' | 'PAYMENT_ERROR' | 'FILE_UPLOAD_ERROR' | 'CONFIGURATION_ERROR';
/**
 * 🚨 Ultra Professional Error Class
 */
export declare class UltraProfessionalError extends Error {
    readonly statusCode: number;
    readonly errorType: UltraErrorType;
    readonly code: string;
    readonly details?: any | undefined;
    readonly originalError?: Error | undefined;
    readonly isOperational: boolean;
    readonly context?: Record<string, any> | undefined;
    readonly timestamp: Date;
    readonly requestId?: string;
    readonly userId?: string;
    readonly sessionId?: string;
    readonly traceId?: string;
    constructor(message: string, statusCode?: number, errorType?: UltraErrorType, code?: string, details?: any | undefined, originalError?: Error | undefined, isOperational?: boolean, context?: Record<string, any> | undefined);
    /**
     * 📝 Convert to JSON for logging/response
     */
    toJSON(): Record<string, any>;
    /**
     * 📱 Convert to client response format
     */
    toClientResponse(): Record<string, any>;
}
/**
 * 🔍 Validation Error
 */
export declare class UltraValidationError extends UltraProfessionalError {
    constructor(message?: string, details?: any, originalError?: Error);
}
/**
 * 🔐 Authentication Error
 */
export declare class UltraAuthenticationError extends UltraProfessionalError {
    constructor(message?: string, code?: string, details?: any);
}
/**
 * 🚫 Authorization Error
 */
export declare class UltraAuthorizationError extends UltraProfessionalError {
    constructor(message?: string, code?: string, details?: any);
}
/**
 * 🔍 Not Found Error
 */
export declare class UltraNotFoundError extends UltraProfessionalError {
    constructor(resource?: string, identifier?: string | number, details?: any);
}
/**
 * ⚔️ Conflict Error
 */
export declare class UltraConflictError extends UltraProfessionalError {
    constructor(message?: string, code?: string, details?: any);
}
/**
 * 🚦 Rate Limit Error
 */
export declare class UltraRateLimitError extends UltraProfessionalError {
    constructor(message?: string, retryAfter?: number, details?: any);
}
/**
 * 🗄️ Database Error
 */
export declare class UltraDatabaseError extends UltraProfessionalError {
    constructor(message: string | undefined, operation: string, originalError?: Error, details?: any);
}
/**
 * 🌐 External Service Error
 */
export declare class UltraExternalServiceError extends UltraProfessionalError {
    constructor(service: string, message?: string, statusCode?: number, originalError?: Error, details?: any);
}
/**
 * 💼 Business Logic Error
 */
export declare class UltraBusinessLogicError extends UltraProfessionalError {
    constructor(message: string, code?: string, details?: any);
}
/**
 * 💳 Payment Error
 */
export declare class UltraPaymentError extends UltraProfessionalError {
    constructor(message: string, paymentProvider: 'CLICK' | 'PAYME' | 'UZCARD', code?: string, details?: any, originalError?: Error);
}
/**
 * 📁 File Upload Error
 */
export declare class UltraFileUploadError extends UltraProfessionalError {
    constructor(message?: string, code?: string, details?: any, originalError?: Error);
}
/**
 * 🔧 Configuration Error
 */
export declare class UltraConfigurationError extends UltraProfessionalError {
    constructor(message?: string, configKey?: string, details?: any);
}
/**
 * 🏭 Ultra Professional Error Handler
 */
export declare class UltraProfessionalErrorHandler {
    private static instance;
    private errorCounts;
    private lastErrors;
    private maxLastErrors;
    /**
     * 🏭 Singleton pattern
     */
    static getInstance(): UltraProfessionalErrorHandler;
    /**
     * 🔄 Transform known errors to UltraProfessionalError
     */
    transformError(error: any, context?: Record<string, any>): UltraProfessionalError;
    /**
     * 🎯 Transform Prisma errors
     */
    private transformPrismaError;
    /**
     * 🍃 Transform MongoDB errors
     */
    private transformMongoError;
    /**
     * 📊 Track error statistics
     */
    private trackError;
    /**
     * 📈 Get error statistics
     */
    getErrorStatistics(): {
        errorCounts: {
            [k: string]: number;
        };
        recentErrors: UltraProfessionalError[];
        totalErrors: number;
    };
    /**
     * 📧 Send error notification (for critical errors)
     */
    private sendErrorNotification;
    /**
     * 🎭 Express error handler middleware
     */
    createExpressErrorHandler(): (error: any, req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * 📝 Log error with appropriate level
     */
    private logError;
    /**
     * 🔄 Async error wrapper
     */
    wrapAsync(fn: Function): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * 🎯 Create standard error responses
     */
    createStandardErrors(): {
        notFound: (resource: string, identifier?: string | number) => UltraNotFoundError;
        validation: (message: string, details?: any) => UltraValidationError;
        authentication: (message?: string, code?: string) => UltraAuthenticationError;
        authorization: (message?: string, code?: string) => UltraAuthorizationError;
        conflict: (message: string, code?: string) => UltraConflictError;
        rateLimit: (message?: string, retryAfter?: number) => UltraRateLimitError;
        database: (message: string, operation: string, originalError?: Error) => UltraDatabaseError;
        externalService: (service: string, message?: string, statusCode?: number, originalError?: Error) => UltraExternalServiceError;
        businessLogic: (message: string, code?: string) => UltraBusinessLogicError;
        payment: (message: string, provider: "CLICK" | "PAYME" | "UZCARD", code?: string) => UltraPaymentError;
        fileUpload: (message?: string, code?: string) => UltraFileUploadError;
        configuration: (message: string, configKey?: string) => UltraConfigurationError;
    };
}
/**
 * 🌟 Global error handler instance
 */
export declare const ultraErrorHandler: UltraProfessionalErrorHandler;
/**
 * 🚀 Quick access functions
 */
export declare const createError: {
    notFound: (resource: string, identifier?: string | number) => UltraNotFoundError;
    validation: (message: string, details?: any) => UltraValidationError;
    authentication: (message?: string, code?: string) => UltraAuthenticationError;
    authorization: (message?: string, code?: string) => UltraAuthorizationError;
    conflict: (message: string, code?: string) => UltraConflictError;
    rateLimit: (message?: string, retryAfter?: number) => UltraRateLimitError;
    database: (message: string, operation: string, originalError?: Error) => UltraDatabaseError;
    externalService: (service: string, message?: string, statusCode?: number, originalError?: Error) => UltraExternalServiceError;
    businessLogic: (message: string, code?: string) => UltraBusinessLogicError;
    payment: (message: string, provider: "CLICK" | "PAYME" | "UZCARD", code?: string) => UltraPaymentError;
    fileUpload: (message?: string, code?: string) => UltraFileUploadError;
    configuration: (message: string, configKey?: string) => UltraConfigurationError;
};
export declare const transformError: (error: any, context?: Record<string, any>) => UltraProfessionalError;
export declare const wrapAsync: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
export declare const expressErrorHandler: (error: any, req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * 📊 Error utilities
 */
export declare const errorUtils: {
    isOperational: (error: Error) => boolean;
    getErrorStatistics: () => {
        errorCounts: {
            [k: string]: number;
        };
        recentErrors: UltraProfessionalError[];
        totalErrors: number;
    };
    handleUncaughtExceptions: () => void;
};
declare const _default: {
    UltraProfessionalError: typeof UltraProfessionalError;
    UltraValidationError: typeof UltraValidationError;
    UltraAuthenticationError: typeof UltraAuthenticationError;
    UltraAuthorizationError: typeof UltraAuthorizationError;
    UltraNotFoundError: typeof UltraNotFoundError;
    UltraConflictError: typeof UltraConflictError;
    UltraRateLimitError: typeof UltraRateLimitError;
    UltraDatabaseError: typeof UltraDatabaseError;
    UltraExternalServiceError: typeof UltraExternalServiceError;
    UltraBusinessLogicError: typeof UltraBusinessLogicError;
    UltraPaymentError: typeof UltraPaymentError;
    UltraFileUploadError: typeof UltraFileUploadError;
    UltraConfigurationError: typeof UltraConfigurationError;
    ultraErrorHandler: UltraProfessionalErrorHandler;
    createError: {
        notFound: (resource: string, identifier?: string | number) => UltraNotFoundError;
        validation: (message: string, details?: any) => UltraValidationError;
        authentication: (message?: string, code?: string) => UltraAuthenticationError;
        authorization: (message?: string, code?: string) => UltraAuthorizationError;
        conflict: (message: string, code?: string) => UltraConflictError;
        rateLimit: (message?: string, retryAfter?: number) => UltraRateLimitError;
        database: (message: string, operation: string, originalError?: Error) => UltraDatabaseError;
        externalService: (service: string, message?: string, statusCode?: number, originalError?: Error) => UltraExternalServiceError;
        businessLogic: (message: string, code?: string) => UltraBusinessLogicError;
        payment: (message: string, provider: "CLICK" | "PAYME" | "UZCARD", code?: string) => UltraPaymentError;
        fileUpload: (message?: string, code?: string) => UltraFileUploadError;
        configuration: (message: string, configKey?: string) => UltraConfigurationError;
    };
    transformError: (error: any, context?: Record<string, any>) => UltraProfessionalError;
    wrapAsync: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
    expressErrorHandler: (error: any, req: Request, res: Response, next: NextFunction) => Promise<void>;
    errorUtils: {
        isOperational: (error: Error) => boolean;
        getErrorStatistics: () => {
            errorCounts: {
                [k: string]: number;
            };
            recentErrors: UltraProfessionalError[];
            totalErrors: number;
        };
        handleUncaughtExceptions: () => void;
    };
};
export default _default;
//# sourceMappingURL=ultra-professional-error-handler.d.ts.map