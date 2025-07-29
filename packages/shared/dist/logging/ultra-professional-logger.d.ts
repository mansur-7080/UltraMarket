/**
 * 📊 ULTRA PROFESSIONAL LOGGING SYSTEM
 * UltraMarket E-commerce Platform
 *
 * Replaces all console.log statements with professional logging
 * Features:
 * - Structured logging with Winston
 * - Security-aware logging (PII redaction)
 * - Performance monitoring
 * - Log levels and filtering
 * - Log rotation and retention
 * - Error tracking integration
 * - O'zbekiston compliance logging
 *
 * @author UltraMarket Logging Team
 * @version 3.0.0
 * @date 2024-12-28
 */
export interface LogContext {
    userId?: string;
    sessionId?: string;
    correlationId?: string;
    service?: string;
    operation?: string;
    duration?: number;
    statusCode?: number;
    userAgent?: string;
    ipAddress?: string;
    region?: 'UZ' | 'RU' | 'EN';
    metadata?: Record<string, any>;
    level?: string;
    error?: any;
    stack?: string;
    name?: string;
    args?: string[];
    [key: string]: any;
}
export interface SecurityLogContext extends LogContext {
    event: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    threatType?: string;
    blocked?: boolean;
    payload?: string;
}
export interface PerformanceLogContext extends LogContext {
    metric: string;
    value: number;
    unit: 'ms' | 'mb' | 'count' | '%';
    threshold?: number;
    exceeded?: boolean;
}
export interface AuditLogContext extends LogContext {
    action: string;
    resource: string;
    resourceId?: string;
    previousValue?: any;
    newValue?: any;
    success: boolean;
}
export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    HTTP = "http",
    VERBOSE = "verbose",
    DEBUG = "debug",
    SILLY = "silly"
}
export interface LoggerConfig {
    level: string;
    format: 'json' | 'simple' | 'colorized';
    enableConsole: boolean;
    enableFile: boolean;
    enableElastic: boolean;
    enableSentry: boolean;
    filePath: string;
    maxFileSize: string;
    maxFiles: number;
    enablePiiRedaction: boolean;
    enablePerformanceLogging: boolean;
    enableSecurityLogging: boolean;
    enableAuditLogging: boolean;
    redactedFields: string[];
    timezone: string;
}
/**
 * Ultra Professional Logger Class
 */
export declare class UltraProfessionalLogger {
    private winstonLogger;
    private config;
    private sensitiveFields;
    private performanceThresholds;
    constructor(config?: Partial<LoggerConfig>);
    /**
     * Merge configuration with professional defaults
     */
    private mergeWithDefaults;
    /**
     * Initialize Winston logger with professional configuration
     */
    private initializeWinstonLogger;
    /**
     * Create console format for development
     */
    private createConsoleFormat;
    /**
     * Create file format for production
     */
    private createFileFormat;
    /**
     * Transform logs for Elasticsearch
     */
    private elasticsearchTransformer;
    /**
     * Sanitize sensitive data from logs
     */
    private sanitizeData;
    /**
     * Check if field contains sensitive information
     */
    private isSensitiveField;
    /**
     * Parse file size string to bytes
     */
    private parseSize;
    /**
     * Setup global process handlers
     */
    private setupProcessHandlers;
    /**
     * Override console methods to redirect to logger
     */
    private overrideConsoleMethods;
    /**
     * Log error messages
     */
    error(message: string, error?: Error | any, context?: LogContext): void;
    /**
     * Log warning messages
     */
    warn(message: string, context?: LogContext): void;
    /**
     * Log info messages
     */
    info(message: string, context?: LogContext): void;
    /**
     * Log debug messages
     */
    debug(message: string, context?: LogContext): void;
    /**
     * Log HTTP requests
     */
    http(message: string, context?: LogContext): void;
    /**
     * Log security events
     */
    security(message: string, context?: SecurityLogContext): void;
    /**
     * Log performance metrics
     */
    performance(message: string, context: PerformanceLogContext): void;
    /**
     * Log audit events
     */
    audit(message: string, context: AuditLogContext): void;
    /**
     * Log business events
     */
    business(message: string, context?: LogContext): void;
    /**
     * Create child logger with additional context
     */
    createChild(defaultContext: LogContext): UltraProfessionalLogger;
    /**
     * Flush all pending logs
     */
    flush(): Promise<void>;
    /**
     * Get current log level
     */
    getLevel(): string;
    /**
     * Set log level
     */
    setLevel(level: string): void;
    /**
     * Check if level is enabled
     */
    isLevelEnabled(level: string): boolean;
}
export declare const logger: UltraProfessionalLogger;
export declare const log: {
    info: (message: string, context?: LogContext) => void;
    error: (message: string, error?: Error | any, context?: LogContext) => void;
    warn: (message: string, context?: LogContext) => void;
    debug: (message: string, context?: LogContext) => void;
    security: (message: string, context?: SecurityLogContext) => void;
    performance: (message: string, context: PerformanceLogContext) => void;
    audit: (message: string, context: AuditLogContext) => void;
    business: (message: string, context?: LogContext) => void;
    http: (message: string, context?: LogContext) => void;
};
export declare const createLogger: (service: string) => UltraProfessionalLogger;
export declare const createRequestLogger: (correlationId: string, userId?: string) => UltraProfessionalLogger;
//# sourceMappingURL=ultra-professional-logger.d.ts.map