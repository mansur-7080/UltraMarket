import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError';
export declare enum ErrorType {
    VALIDATION = "VALIDATION",
    AUTHENTICATION = "AUTHENTICATION",
    AUTHORIZATION = "AUTHORIZATION",
    NOT_FOUND = "NOT_FOUND",
    DATABASE = "DATABASE",
    EXTERNAL_SERVICE = "EXTERNAL_SERVICE",
    RATE_LIMIT = "RATE_LIMIT",
    INTERNAL_SERVER = "INTERNAL_SERVER",
    NETWORK = "NETWORK",
    TIMEOUT = "TIMEOUT",
    BUSINESS_LOGIC = "BUSINESS_LOGIC"
}
export declare enum ErrorSeverity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export interface ErrorContext {
    userId?: string;
    requestId?: string;
    userAgent?: string;
    ip?: string;
    method?: string;
    url?: string;
    body?: any;
    query?: any;
    params?: any;
    headers?: any;
    timestamp: Date;
    service?: string;
    version?: string;
    environment?: string;
}
export interface ErrorReport {
    id: string;
    type: ErrorType;
    severity: ErrorSeverity;
    message: string;
    stack?: string;
    context: ErrorContext;
    metadata?: Record<string, any>;
    resolved: boolean;
    createdAt: Date;
    resolvedAt?: Date;
}
export interface ErrorRecoveryStrategy {
    canRecover: (error: Error) => boolean;
    recover: (error: Error, context: ErrorContext) => Promise<any>;
    maxRetries: number;
    retryDelay: number;
}
export declare class GlobalErrorHandler {
    private errorReports;
    private recoveryStrategies;
    private errorCallbacks;
    constructor();
    /**
     * Add error recovery strategy
     */
    addRecoveryStrategy(strategy: ErrorRecoveryStrategy): void;
    /**
     * Add error callback
     */
    addErrorCallback(callback: (error: ErrorReport) => void): void;
    /**
     * Handle uncaught exception
     */
    private handleUncaughtException;
    /**
     * Handle unhandled promise rejection
     */
    private handleUnhandledRejection;
    /**
     * Create error report
     */
    createErrorReport(type: ErrorType, severity: ErrorSeverity, error: Error, context: ErrorContext, metadata?: Record<string, any>): ErrorReport;
    /**
     * Generate unique error ID
     */
    private generateErrorId;
    /**
     * Log error based on severity
     */
    private logError;
    /**
     * Notify error callbacks
     */
    private notifyErrorCallbacks;
    /**
     * Try to recover from error
     */
    tryRecover(error: Error, context: ErrorContext): Promise<any>;
    /**
     * Delay helper
     */
    private delay;
    /**
     * Mark error as resolved
     */
    resolveError(errorId: string): void;
    /**
     * Get error statistics
     */
    getErrorStats(): {
        total: number;
        resolved: number;
        unresolved: number;
        byType: Record<ErrorType, number>;
        bySeverity: Record<ErrorSeverity, number>;
    };
    /**
     * Get recent errors
     */
    getRecentErrors(limit?: number): ErrorReport[];
    /**
     * Clear old errors
     */
    clearOldErrors(maxAge?: number): void;
}
export declare const expressErrorHandler: (error: Error, req: Request, res: Response, next: NextFunction) => void;
export declare class DatabaseErrorRecoveryStrategy implements ErrorRecoveryStrategy {
    maxRetries: number;
    retryDelay: number;
    canRecover(error: Error): boolean;
    recover(error: Error, context: ErrorContext): Promise<any>;
}
export declare class ExternalServiceErrorRecoveryStrategy implements ErrorRecoveryStrategy {
    maxRetries: number;
    retryDelay: number;
    canRecover(error: Error): boolean;
    recover(error: Error, context: ErrorContext): Promise<any>;
}
export declare class RateLimitErrorRecoveryStrategy implements ErrorRecoveryStrategy {
    maxRetries: number;
    retryDelay: number;
    canRecover(error: Error): boolean;
    recover(error: Error, context: ErrorContext): Promise<any>;
}
export declare const globalErrorHandler: GlobalErrorHandler;
export declare const handleAsyncError: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
export declare const createAppError: (message: string, statusCode?: number, errorCode?: string) => AppError;
export declare const isOperationalError: (error: Error) => boolean;
declare const _default: {
    GlobalErrorHandler: typeof GlobalErrorHandler;
    globalErrorHandler: GlobalErrorHandler;
    expressErrorHandler: (error: Error, req: Request, res: Response, next: NextFunction) => void;
    handleAsyncError: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
    createAppError: (message: string, statusCode?: number, errorCode?: string) => AppError;
    isOperationalError: (error: Error) => boolean;
    ErrorType: typeof ErrorType;
    ErrorSeverity: typeof ErrorSeverity;
};
export default _default;
//# sourceMappingURL=error-handler.d.ts.map