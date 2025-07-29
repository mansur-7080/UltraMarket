/**
 * 🚨 ULTRA ERROR MANAGER
 * UltraMarket E-commerce Platform
 *
 * SOLVES: Centralized error handling and professional error management
 *
 * Key Features:
 * - Unified error handling across all services
 * - Professional error classification and recovery
 * - Real-time error monitoring and alerting
 * - Comprehensive error tracking and analytics
 * - Performance impact analysis
 * - User-friendly error messages
 * - TypeScript strict mode compatibility
 *
 * @author UltraMarket Error Management Team
 * @version 3.0.0
 * @date 2024-12-28
 */
import { EventEmitter } from 'events';
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum ErrorCategory {
    VALIDATION = "validation",
    AUTHENTICATION = "authentication",
    AUTHORIZATION = "authorization",
    DATABASE = "database",
    EXTERNAL_API = "external_api",
    BUSINESS_LOGIC = "business_logic",
    SYSTEM = "system",
    NETWORK = "network",
    PERFORMANCE = "performance",
    SECURITY = "security"
}
export declare enum ErrorCode {
    VALIDATION_FAILED = "ERR_1001",
    INVALID_INPUT = "ERR_1002",
    MISSING_REQUIRED_FIELD = "ERR_1003",
    INVALID_FORMAT = "ERR_1004",
    AUTHENTICATION_FAILED = "ERR_2001",
    INVALID_CREDENTIALS = "ERR_2002",
    TOKEN_EXPIRED = "ERR_2003",
    TOKEN_INVALID = "ERR_2004",
    MFA_REQUIRED = "ERR_2005",
    ACCESS_DENIED = "ERR_3001",
    INSUFFICIENT_PERMISSIONS = "ERR_3002",
    ROLE_REQUIRED = "ERR_3003",
    SUBSCRIPTION_REQUIRED = "ERR_3004",
    DATABASE_CONNECTION_FAILED = "ERR_4001",
    QUERY_FAILED = "ERR_4002",
    RECORD_NOT_FOUND = "ERR_4003",
    DUPLICATE_ENTRY = "ERR_4004",
    CONSTRAINT_VIOLATION = "ERR_4005",
    TRANSACTION_FAILED = "ERR_4006",
    EXTERNAL_SERVICE_UNAVAILABLE = "ERR_5001",
    API_RATE_LIMIT_EXCEEDED = "ERR_5002",
    THIRD_PARTY_ERROR = "ERR_5003",
    PAYMENT_GATEWAY_ERROR = "ERR_5004",
    BUSINESS_RULE_VIOLATION = "ERR_6001",
    INSUFFICIENT_INVENTORY = "ERR_6002",
    ORDER_PROCESSING_ERROR = "ERR_6003",
    PRICE_CALCULATION_ERROR = "ERR_6004",
    INTERNAL_SERVER_ERROR = "ERR_7001",
    SERVICE_UNAVAILABLE = "ERR_7002",
    CONFIGURATION_ERROR = "ERR_7003",
    MEMORY_LIMIT_EXCEEDED = "ERR_7004",
    NETWORK_ERROR = "ERR_8001",
    TIMEOUT_ERROR = "ERR_8002",
    CONNECTION_REFUSED = "ERR_8003",
    SLOW_QUERY = "ERR_9001",
    HIGH_MEMORY_USAGE = "ERR_9002",
    CPU_OVERLOAD = "ERR_9003",
    SECURITY_VIOLATION = "ERR_10001",
    SUSPICIOUS_ACTIVITY = "ERR_10002",
    XSS_ATTEMPT = "ERR_10003",
    SQL_INJECTION_ATTEMPT = "ERR_10004"
}
export interface UltraErrorDetails {
    code: ErrorCode;
    message: string;
    severity: ErrorSeverity;
    category: ErrorCategory;
    context?: Record<string, any>;
    userId?: string;
    sessionId?: string;
    requestId?: string;
    timestamp: Date;
    stack?: string;
    source: {
        service: string;
        method: string;
        file?: string;
        line?: number;
    };
    recovery?: {
        suggestions: string[];
        retryable: boolean;
        maxRetries?: number;
    };
}
export interface ErrorMetrics {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    errorsByCode: Record<ErrorCode, number>;
    averageResolutionTime: number;
    errorRate: number;
    recentErrors: UltraErrorDetails[];
}
export interface ErrorRecoveryStrategy {
    code: ErrorCode;
    strategy: 'retry' | 'fallback' | 'circuit_breaker' | 'graceful_degradation' | 'manual_intervention';
    config: Record<string, any>;
    isActive: boolean;
}
/**
 * Ultra Professional Error Class
 * Enhanced error with comprehensive metadata
 */
export declare class UltraError extends Error {
    readonly details: UltraErrorDetails;
    readonly timestamp: Date;
    readonly errorId: string;
    constructor(details: Partial<UltraErrorDetails> & {
        code: ErrorCode;
        message: string;
    });
    private generateErrorId;
    private getCategoryFromCode;
    toJSON(): Record<string, any>;
}
/**
 * Ultra Error Manager
 * Centralized error handling and monitoring system
 */
export declare class UltraErrorManager extends EventEmitter {
    private static instance;
    private errors;
    private metrics;
    private recoveryStrategies;
    private circuitBreakers;
    private config;
    private constructor();
    /**
     * Singleton pattern - get instance
     */
    static getInstance(): UltraErrorManager;
    /**
     * Handle error with comprehensive processing
     */
    handleError(error: Error | UltraError, context?: {
        userId?: string;
        sessionId?: string;
        requestId?: string;
        service?: string;
        method?: string;
        additionalContext?: Record<string, any>;
    }): Promise<{
        errorId: string;
        handled: boolean;
        recovery?: any;
        userMessage?: string;
    }>;
    /**
     * Create error with enhanced metadata
     */
    createError(code: ErrorCode, message: string, options?: {
        severity?: ErrorSeverity;
        context?: Record<string, any>;
        userId?: string;
        sessionId?: string;
        requestId?: string;
        source?: {
            service: string;
            method: string;
            file?: string;
            line?: number;
        };
        recovery?: {
            suggestions: string[];
            retryable: boolean;
            maxRetries?: number;
        };
    }): UltraError;
    /**
     * Get error metrics and statistics
     */
    getMetrics(): ErrorMetrics;
    /**
     * Get errors with filtering
     */
    getErrors(filters?: {
        category?: ErrorCategory;
        severity?: ErrorSeverity;
        code?: ErrorCode;
        userId?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }): UltraErrorDetails[];
    /**
     * Retry operation with exponential backoff
     */
    retryOperation<T>(operation: () => Promise<T>, options?: {
        maxRetries?: number;
        baseDelay?: number;
        maxDelay?: number;
        retryCondition?: (error: Error) => boolean;
        onRetry?: (attempt: number, error: Error) => void;
    }): Promise<T>;
    /**
     * Circuit breaker pattern implementation
     */
    circuitBreaker<T>(key: string, operation: () => Promise<T>, options?: {
        failureThreshold?: number;
        timeout?: number;
        fallback?: () => Promise<T>;
    }): Promise<T>;
    /**
     * Initialize default recovery strategies
     */
    private initializeRecoveryStrategies;
    /**
     * Convert regular error to UltraError
     */
    private convertToUltraError;
    /**
     * Store error in memory (in production, use database)
     */
    private storeError;
    /**
     * Update error metrics
     */
    private updateMetrics;
    /**
     * Log error with appropriate level
     */
    private logError;
    /**
     * Attempt error recovery
     */
    private attemptRecovery;
    /**
     * Check alert conditions
     */
    private checkAlertConditions;
    /**
     * Get user-friendly error message
     */
    private getUserFriendlyMessage;
    /**
     * Setup global error handlers
     */
    private setupGlobalErrorHandlers;
    /**
     * Initialize metrics structure
     */
    private initializeMetrics;
    /**
     * Delay utility function
     */
    private delay;
}
/**
 * Global error manager instance
 */
export declare const errorManager: UltraErrorManager;
/**
 * Helper functions for common error scenarios
 */
export declare const ErrorHelpers: {
    /**
     * Create validation error
     */
    validation: (message: string, field?: string, value?: any) => UltraError;
    /**
     * Create authentication error
     */
    authentication: (message?: string) => UltraError;
    /**
     * Create authorization error
     */
    authorization: (message?: string) => UltraError;
    /**
     * Create database error
     */
    database: (message: string, query?: string) => UltraError;
    /**
     * Create business logic error
     */
    business: (message: string, context?: Record<string, any>) => UltraError;
};
/**
 * Export types for external use
 */
export type { UltraErrorDetails as ErrorDetails, ErrorMetrics as UltraErrorMetrics, ErrorRecoveryStrategy as RecoveryStrategy };
//# sourceMappingURL=ultra-error-manager.d.ts.map