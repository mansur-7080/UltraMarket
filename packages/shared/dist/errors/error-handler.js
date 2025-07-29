"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isOperationalError = exports.createAppError = exports.handleAsyncError = exports.globalErrorHandler = exports.RateLimitErrorRecoveryStrategy = exports.ExternalServiceErrorRecoveryStrategy = exports.DatabaseErrorRecoveryStrategy = exports.expressErrorHandler = exports.GlobalErrorHandler = exports.ErrorSeverity = exports.ErrorType = void 0;
const logger_1 = require("../logging/logger");
const AppError_1 = require("./AppError");
// Error types
var ErrorType;
(function (ErrorType) {
    ErrorType["VALIDATION"] = "VALIDATION";
    ErrorType["AUTHENTICATION"] = "AUTHENTICATION";
    ErrorType["AUTHORIZATION"] = "AUTHORIZATION";
    ErrorType["NOT_FOUND"] = "NOT_FOUND";
    ErrorType["DATABASE"] = "DATABASE";
    ErrorType["EXTERNAL_SERVICE"] = "EXTERNAL_SERVICE";
    ErrorType["RATE_LIMIT"] = "RATE_LIMIT";
    ErrorType["INTERNAL_SERVER"] = "INTERNAL_SERVER";
    ErrorType["NETWORK"] = "NETWORK";
    ErrorType["TIMEOUT"] = "TIMEOUT";
    ErrorType["BUSINESS_LOGIC"] = "BUSINESS_LOGIC";
})(ErrorType || (exports.ErrorType = ErrorType = {}));
// Error severity levels
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "LOW";
    ErrorSeverity["MEDIUM"] = "MEDIUM";
    ErrorSeverity["HIGH"] = "HIGH";
    ErrorSeverity["CRITICAL"] = "CRITICAL";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
// Global error handler class
class GlobalErrorHandler {
    errorReports = new Map();
    recoveryStrategies = [];
    errorCallbacks = [];
    constructor() {
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            this.handleUncaughtException(error);
        });
        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            this.handleUnhandledRejection(reason, promise);
        });
    }
    /**
     * Add error recovery strategy
     */
    addRecoveryStrategy(strategy) {
        this.recoveryStrategies.push(strategy);
    }
    /**
     * Add error callback
     */
    addErrorCallback(callback) {
        this.errorCallbacks.push(callback);
    }
    /**
     * Handle uncaught exception
     */
    handleUncaughtException(error) {
        const context = {
            timestamp: new Date(),
            service: process.env.SERVICE_NAME || 'unknown',
            version: process.env.SERVICE_VERSION || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
        };
        const errorReport = this.createErrorReport(ErrorType.INTERNAL_SERVER, ErrorSeverity.CRITICAL, error, context);
        logger_1.logger.error('Uncaught exception', {
            error: error.message,
            stack: error.stack,
            errorId: errorReport.id,
        });
        // Notify error callbacks
        this.notifyErrorCallbacks(errorReport);
        // Exit process for uncaught exceptions
        process.exit(1);
    }
    /**
     * Handle unhandled promise rejection
     */
    handleUnhandledRejection(reason, promise) {
        const error = reason instanceof Error ? reason : new Error(String(reason));
        const context = {
            timestamp: new Date(),
            service: process.env.SERVICE_NAME || 'unknown',
            version: process.env.SERVICE_VERSION || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
        };
        const errorReport = this.createErrorReport(ErrorType.INTERNAL_SERVER, ErrorSeverity.HIGH, error, context);
        logger_1.logger.error('Unhandled promise rejection', {
            error: error.message,
            stack: error.stack,
            errorId: errorReport.id,
        });
        // Notify error callbacks
        this.notifyErrorCallbacks(errorReport);
    }
    /**
     * Create error report
     */
    createErrorReport(type, severity, error, context, metadata) {
        const errorReport = {
            id: this.generateErrorId(),
            type,
            severity,
            message: error.message,
            stack: error.stack,
            context,
            metadata,
            resolved: false,
            createdAt: new Date(),
        };
        this.errorReports.set(errorReport.id, errorReport);
        // Log error based on severity
        this.logError(errorReport);
        return errorReport;
    }
    /**
     * Generate unique error ID
     */
    generateErrorId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 9);
        return `err_${timestamp}_${random}`;
    }
    /**
     * Log error based on severity
     */
    logError(errorReport) {
        const logData = {
            errorId: errorReport.id,
            type: errorReport.type,
            severity: errorReport.severity,
            message: errorReport.message,
            context: errorReport.context,
            metadata: errorReport.metadata,
        };
        switch (errorReport.severity) {
            case ErrorSeverity.CRITICAL:
                logger_1.logger.error('Critical error occurred', logData);
                break;
            case ErrorSeverity.HIGH:
                logger_1.logger.error('High severity error occurred', logData);
                break;
            case ErrorSeverity.MEDIUM:
                logger_1.logger.warn('Medium severity error occurred', logData);
                break;
            case ErrorSeverity.LOW:
                logger_1.logger.info('Low severity error occurred', logData);
                break;
        }
    }
    /**
     * Notify error callbacks
     */
    notifyErrorCallbacks(errorReport) {
        this.errorCallbacks.forEach((callback) => {
            try {
                callback(errorReport);
            }
            catch (error) {
                logger_1.logger.error('Error in error callback', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        });
    }
    /**
     * Try to recover from error
     */
    async tryRecover(error, context) {
        for (const strategy of this.recoveryStrategies) {
            if (strategy.canRecover(error)) {
                let attempts = 0;
                while (attempts < strategy.maxRetries) {
                    try {
                        const result = await strategy.recover(error, context);
                        logger_1.logger.info('Error recovery successful', {
                            strategy: strategy.constructor.name,
                            attempts: attempts + 1,
                            error: error.message,
                        });
                        return result;
                    }
                    catch (recoveryError) {
                        attempts++;
                        if (attempts < strategy.maxRetries) {
                            await this.delay(strategy.retryDelay);
                        }
                        else {
                            logger_1.logger.error('Error recovery failed', {
                                strategy: strategy.constructor.name,
                                attempts,
                                originalError: error.message,
                                recoveryError: recoveryError instanceof Error ? recoveryError.message : 'Unknown error',
                            });
                        }
                    }
                }
            }
        }
        return null;
    }
    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * Mark error as resolved
     */
    resolveError(errorId) {
        const errorReport = this.errorReports.get(errorId);
        if (errorReport) {
            errorReport.resolved = true;
            errorReport.resolvedAt = new Date();
            logger_1.logger.info('Error resolved', {
                errorId,
                resolvedAt: errorReport.resolvedAt,
            });
        }
    }
    /**
     * Get error statistics
     */
    getErrorStats() {
        const stats = {
            total: this.errorReports.size,
            resolved: 0,
            unresolved: 0,
            byType: {},
            bySeverity: {},
        };
        // Initialize counters
        Object.values(ErrorType).forEach((type) => {
            stats.byType[type] = 0;
        });
        Object.values(ErrorSeverity).forEach((severity) => {
            stats.bySeverity[severity] = 0;
        });
        // Count errors
        for (const errorReport of this.errorReports.values()) {
            if (errorReport.resolved) {
                stats.resolved++;
            }
            else {
                stats.unresolved++;
            }
            stats.byType[errorReport.type]++;
            stats.bySeverity[errorReport.severity]++;
        }
        return stats;
    }
    /**
     * Get recent errors
     */
    getRecentErrors(limit = 10) {
        return Array.from(this.errorReports.values())
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, limit);
    }
    /**
     * Clear old errors
     */
    clearOldErrors(maxAge = 7 * 24 * 60 * 60 * 1000) {
        // 7 days default
        const now = new Date();
        const errorIdsToDelete = [];
        for (const [id, errorReport] of this.errorReports.entries()) {
            const age = now.getTime() - errorReport.createdAt.getTime();
            if (age > maxAge) {
                errorIdsToDelete.push(id);
            }
        }
        errorIdsToDelete.forEach((id) => this.errorReports.delete(id));
        if (errorIdsToDelete.length > 0) {
            logger_1.logger.info('Cleared old errors', {
                clearedCount: errorIdsToDelete.length,
                maxAge,
            });
        }
    }
}
exports.GlobalErrorHandler = GlobalErrorHandler;
// Express error handler middleware
const expressErrorHandler = (error, req, res, next) => {
    // Extract error context from request
    const context = {
        userId: req.user?.id,
        requestId: req.requestId,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers,
        timestamp: new Date(),
        service: process.env.SERVICE_NAME || 'unknown',
        version: process.env.SERVICE_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
    };
    // Determine error type and severity
    let errorType;
    let errorSeverity;
    if (error instanceof AppError_1.AppError) {
        errorType = error.errorCode || ErrorType.INTERNAL_SERVER;
        errorSeverity = error.statusCode >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM;
    }
    else {
        errorType = ErrorType.INTERNAL_SERVER;
        errorSeverity = ErrorSeverity.HIGH;
    }
    // Create error report
    const errorReport = exports.globalErrorHandler.createErrorReport(errorType, errorSeverity, error, context);
    // Try to recover from error
    exports.globalErrorHandler.tryRecover(error, context).then((recoveryResult) => {
        if (recoveryResult) {
            return res.json(recoveryResult);
        }
        // Send error response
        if (error instanceof AppError_1.AppError) {
            return res.status(error.statusCode).json({
                success: false,
                error: {
                    message: error.message,
                    code: error.errorCode,
                    errorId: errorReport.id,
                },
            });
        }
        // Generic error response
        const statusCode = 500;
        const message = process.env.NODE_ENV === 'production' ? 'Ichki server xatosi' : error.message;
        res.status(statusCode).json({
            success: false,
            error: {
                message,
                errorId: errorReport.id,
            },
        });
    });
};
exports.expressErrorHandler = expressErrorHandler;
// Database error recovery strategy
class DatabaseErrorRecoveryStrategy {
    maxRetries = 3;
    retryDelay = 1000;
    canRecover(error) {
        return (error.message.includes('connection') ||
            error.message.includes('timeout') ||
            error.message.includes('ECONNRESET'));
    }
    async recover(error, context) {
        // Implement database reconnection logic
        logger_1.logger.info('Attempting database recovery', {
            error: error.message,
            context: context.requestId,
        });
        // Simulate recovery attempt
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        // Return null if recovery fails, actual result if successful
        return null;
    }
}
exports.DatabaseErrorRecoveryStrategy = DatabaseErrorRecoveryStrategy;
// External service error recovery strategy
class ExternalServiceErrorRecoveryStrategy {
    maxRetries = 2;
    retryDelay = 2000;
    canRecover(error) {
        return (error.message.includes('fetch') ||
            error.message.includes('network') ||
            error.message.includes('timeout'));
    }
    async recover(error, context) {
        logger_1.logger.info('Attempting external service recovery', {
            error: error.message,
            context: context.requestId,
        });
        // Implement retry logic for external services
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        return null;
    }
}
exports.ExternalServiceErrorRecoveryStrategy = ExternalServiceErrorRecoveryStrategy;
// Rate limit error recovery strategy
class RateLimitErrorRecoveryStrategy {
    maxRetries = 1;
    retryDelay = 5000;
    canRecover(error) {
        return error.message.includes('rate limit') || error.message.includes('too many requests');
    }
    async recover(error, context) {
        logger_1.logger.info('Attempting rate limit recovery', {
            error: error.message,
            context: context.requestId,
        });
        // Wait for rate limit to reset
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        return null;
    }
}
exports.RateLimitErrorRecoveryStrategy = RateLimitErrorRecoveryStrategy;
// Create global error handler instance
exports.globalErrorHandler = new GlobalErrorHandler();
// Add default recovery strategies
exports.globalErrorHandler.addRecoveryStrategy(new DatabaseErrorRecoveryStrategy());
exports.globalErrorHandler.addRecoveryStrategy(new ExternalServiceErrorRecoveryStrategy());
exports.globalErrorHandler.addRecoveryStrategy(new RateLimitErrorRecoveryStrategy());
// Error notification callback
exports.globalErrorHandler.addErrorCallback((errorReport) => {
    // Send critical errors to monitoring service
    if (errorReport.severity === ErrorSeverity.CRITICAL) {
        logger_1.logger.error('Critical error notification', {
            errorId: errorReport.id,
            message: errorReport.message,
            service: errorReport.context.service,
        });
        // TODO: Implement external notification service
        // notificationService.sendCriticalAlert(errorReport);
    }
});
// Utility functions
const handleAsyncError = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.handleAsyncError = handleAsyncError;
const createAppError = (message, statusCode = 500, errorCode) => {
    return new AppError_1.AppError(message, statusCode, true, errorCode);
};
exports.createAppError = createAppError;
const isOperationalError = (error) => {
    return error instanceof AppError_1.AppError && error.isOperational;
};
exports.isOperationalError = isOperationalError;
// All classes are already exported above
exports.default = {
    GlobalErrorHandler,
    globalErrorHandler: exports.globalErrorHandler,
    expressErrorHandler: exports.expressErrorHandler,
    handleAsyncError: exports.handleAsyncError,
    createAppError: exports.createAppError,
    isOperationalError: exports.isOperationalError,
    ErrorType,
    ErrorSeverity,
};
//# sourceMappingURL=error-handler.js.map