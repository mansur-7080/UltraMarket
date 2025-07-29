"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestLogger = exports.createLogger = exports.log = exports.logger = exports.UltraProfessionalLogger = exports.LogLevel = void 0;
const tslib_1 = require("tslib");
const winston_1 = tslib_1.__importDefault(require("winston"));
const path_1 = tslib_1.__importDefault(require("path"));
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["HTTP"] = "http";
    LogLevel["VERBOSE"] = "verbose";
    LogLevel["DEBUG"] = "debug";
    LogLevel["SILLY"] = "silly";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
/**
 * Ultra Professional Logger Class
 */
class UltraProfessionalLogger {
    winstonLogger;
    config;
    sensitiveFields;
    performanceThresholds;
    constructor(config = {}) {
        this.config = this.mergeWithDefaults(config);
        this.sensitiveFields = new Set(this.config.redactedFields);
        this.performanceThresholds = new Map([
            ['api_response_time', 1000], // 1 second
            ['database_query_time', 500], // 500ms
            ['cache_operation_time', 100], // 100ms
            ['file_operation_time', 200], // 200ms
            ['external_api_time', 2000] // 2 seconds
        ]);
        this.initializeWinstonLogger();
        this.setupProcessHandlers();
        this.info('📊 Ultra Professional Logger initialized', {
            level: this.config.level,
            format: this.config.format,
            enabledFeatures: {
                console: this.config.enableConsole,
                file: this.config.enableFile,
                elastic: this.config.enableElastic,
                sentry: this.config.enableSentry,
                piiRedaction: this.config.enablePiiRedaction,
                performance: this.config.enablePerformanceLogging,
                security: this.config.enableSecurityLogging,
                audit: this.config.enableAuditLogging
            }
        });
    }
    /**
     * Merge configuration with professional defaults
     */
    mergeWithDefaults(config) {
        return {
            level: process.env.LOG_LEVEL || 'info',
            format: process.env.LOG_FORMAT || 'json',
            enableConsole: process.env.LOG_CONSOLE !== 'false',
            enableFile: process.env.LOG_FILE !== 'false',
            enableElastic: process.env.LOG_ELASTIC === 'true',
            enableSentry: process.env.LOG_SENTRY === 'true',
            filePath: process.env.LOG_FILE_PATH || './logs',
            maxFileSize: process.env.LOG_MAX_FILE_SIZE || '100m',
            maxFiles: parseInt(process.env.LOG_MAX_FILES || '30', 10), // Ensure it's a number
            enablePiiRedaction: process.env.LOG_PII_REDACTION !== 'false',
            enablePerformanceLogging: process.env.LOG_PERFORMANCE !== 'false',
            enableSecurityLogging: process.env.LOG_SECURITY !== 'false',
            enableAuditLogging: process.env.LOG_AUDIT !== 'false',
            redactedFields: [
                'password', 'token', 'secret', 'key', 'auth', 'credential',
                'ssn', 'passport', 'pin', 'cvv', 'cardNumber', 'bankAccount',
                'email', 'phone', 'address', 'inn', 'personalData'
            ],
            timezone: process.env.LOG_TIMEZONE || 'Asia/Tashkent',
            ...config
        };
    }
    /**
     * Initialize Winston logger with professional configuration
     */
    initializeWinstonLogger() {
        const transports = [];
        // Console transport with colorization for development
        if (this.config.enableConsole) {
            transports.push(new winston_1.default.transports.Console({
                format: this.createConsoleFormat(),
                level: this.config.level
            }));
        }
        // File transport with rotation
        if (this.config.enableFile) {
            // Application logs
            transports.push(new winston_1.default.transports.File({
                filename: path_1.default.join(this.config.filePath, 'application.log'),
                format: this.createFileFormat(),
                maxsize: this.parseSize(this.config.maxFileSize),
                maxFiles: this.config.maxFiles,
                tailable: true,
                zippedArchive: true
            }));
            // Error logs (separate file)
            transports.push(new winston_1.default.transports.File({
                filename: path_1.default.join(this.config.filePath, 'error.log'),
                level: 'error',
                format: this.createFileFormat(),
                maxsize: this.parseSize(this.config.maxFileSize),
                maxFiles: this.config.maxFiles,
                tailable: true,
                zippedArchive: true
            }));
            // Security logs (separate file)
            if (this.config.enableSecurityLogging) {
                transports.push(new winston_1.default.transports.File({
                    filename: path_1.default.join(this.config.filePath, 'security.log'),
                    format: this.createFileFormat(),
                    maxsize: this.parseSize(this.config.maxFileSize),
                    maxFiles: this.config.maxFiles,
                    tailable: true,
                    zippedArchive: true
                }));
            }
            // Audit logs (separate file)
            if (this.config.enableAuditLogging) {
                transports.push(new winston_1.default.transports.File({
                    filename: path_1.default.join(this.config.filePath, 'audit.log'),
                    format: this.createFileFormat(),
                    maxsize: this.parseSize(this.config.maxFileSize),
                    maxFiles: this.config.maxFiles,
                    tailable: true,
                    zippedArchive: true
                }));
            }
            // Performance logs (separate file)
            if (this.config.enablePerformanceLogging) {
                transports.push(new winston_1.default.transports.File({
                    filename: path_1.default.join(this.config.filePath, 'performance.log'),
                    format: this.createFileFormat(),
                    maxsize: this.parseSize(this.config.maxFileSize),
                    maxFiles: this.config.maxFiles,
                    tailable: true,
                    zippedArchive: true
                }));
            }
        }
        // Elasticsearch transport (for centralized logging)
        if (this.config.enableElastic && process.env.ELASTICSEARCH_URL) {
            try {
                const ElasticsearchTransport = require('winston-elasticsearch');
                transports.push(new ElasticsearchTransport({
                    level: this.config.level,
                    clientOpts: {
                        node: process.env.ELASTICSEARCH_URL,
                        auth: {
                            username: process.env.ELASTICSEARCH_USERNAME,
                            password: process.env.ELASTICSEARCH_PASSWORD
                        },
                        ssl: {
                            rejectUnauthorized: false
                        }
                    },
                    index: `ultramarket-logs-${new Date().toISOString().slice(0, 10)}`,
                    indexTemplate: {
                        name: 'ultramarket-logs',
                        body: {
                            index_patterns: ['ultramarket-logs-*'],
                            mappings: {
                                properties: {
                                    '@timestamp': { type: 'date' },
                                    level: { type: 'keyword' },
                                    message: { type: 'text' },
                                    service: { type: 'keyword' },
                                    userId: { type: 'keyword' },
                                    sessionId: { type: 'keyword' },
                                    correlationId: { type: 'keyword' },
                                    duration: { type: 'integer' },
                                    statusCode: { type: 'integer' }
                                }
                            }
                        }
                    },
                    transformer: this.elasticsearchTransformer.bind(this)
                }));
            }
            catch (error) {
                console.warn('⚠️ Elasticsearch transport not available:', error.message);
            }
        }
        // Create Winston logger
        this.winstonLogger = winston_1.default.createLogger({
            level: this.config.level,
            levels: winston_1.default.config.npm.levels,
            transports,
            exitOnError: false,
            silent: process.env.NODE_ENV === 'test'
        });
        // Add Sentry error tracking if enabled
        if (this.config.enableSentry && process.env.SENTRY_DSN) {
            try {
                const Sentry = require('@sentry/node');
                Sentry.init({
                    dsn: process.env.SENTRY_DSN,
                    environment: process.env.NODE_ENV || 'development',
                    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0
                });
                // Add Sentry integration
                this.winstonLogger.on('logging', (transport, level, message, meta) => {
                    if (level === 'error') {
                        Sentry.captureException(new Error(message), {
                            tags: { logger: 'winston' },
                            extra: meta
                        });
                    }
                });
            }
            catch (error) {
                console.warn('⚠️ Sentry integration not available:', error.message);
            }
        }
    }
    /**
     * Create console format for development
     */
    createConsoleFormat() {
        return winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
            const colorizer = winston_1.default.format.colorize();
            const colorizedLevel = colorizer.colorize(level, level.toUpperCase());
            let output = `${timestamp} [${colorizedLevel}] ${message}`;
            if (Object.keys(meta).length > 0) {
                const sanitizedMeta = this.sanitizeData(meta);
                output += `\n${JSON.stringify(sanitizedMeta, null, 2)}`;
            }
            return output;
        }));
    }
    /**
     * Create file format for production
     */
    createFileFormat() {
        return winston_1.default.format.combine(winston_1.default.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss.SSS'
        }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.printf((info) => {
            const sanitizedInfo = this.sanitizeData(info);
            return JSON.stringify({
                ...sanitizedInfo,
                environment: process.env.NODE_ENV,
                service: process.env.SERVICE_NAME || 'ultramarket',
                version: process.env.APP_VERSION || '1.0.0',
                hostname: require('os').hostname(),
                pid: process.pid
            });
        }));
    }
    /**
     * Transform logs for Elasticsearch
     */
    elasticsearchTransformer(logData) {
        const transformed = {
            '@timestamp': new Date().toISOString(),
            level: logData.level,
            message: logData.message,
            service: process.env.SERVICE_NAME || 'ultramarket',
            environment: process.env.NODE_ENV || 'development',
            version: process.env.APP_VERSION || '1.0.0',
            hostname: require('os').hostname(),
            pid: process.pid,
            ...this.sanitizeData(logData.meta || {})
        };
        return transformed;
    }
    /**
     * Sanitize sensitive data from logs
     */
    sanitizeData(data) {
        if (!this.config.enablePiiRedaction) {
            return data;
        }
        if (typeof data !== 'object' || data === null) {
            return data;
        }
        if (Array.isArray(data)) {
            return data.map(item => this.sanitizeData(item));
        }
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            const lowerKey = key.toLowerCase();
            if (this.sensitiveFields.has(lowerKey) ||
                this.sensitiveFields.has(key) ||
                this.isSensitiveField(lowerKey)) {
                sanitized[key] = '[REDACTED]';
            }
            else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeData(value);
            }
            else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
    /**
     * Check if field contains sensitive information
     */
    isSensitiveField(fieldName) {
        const sensitivePatterns = [
            /password/i,
            /token/i,
            /secret/i,
            /key/i,
            /auth/i,
            /credential/i,
            /pin/i,
            /ssn/i,
            /passport/i,
            /card/i,
            /bank/i,
            /account/i,
            /personal/i,
            /private/i
        ];
        return sensitivePatterns.some(pattern => pattern.test(fieldName));
    }
    /**
     * Parse file size string to bytes
     */
    parseSize(size) {
        const units = {
            b: 1,
            kb: 1024,
            mb: 1024 * 1024,
            gb: 1024 * 1024 * 1024
        };
        const match = size.toLowerCase().match(/^(\d+)([kmg]?b)$/);
        if (!match) {
            return 100 * 1024 * 1024; // Default 100MB
        }
        const [, value, unit] = match;
        return parseInt(value) * (units[unit] || 1);
    }
    /**
     * Setup global process handlers
     */
    setupProcessHandlers() {
        // Override console methods in production
        if (process.env.NODE_ENV === 'production') {
            this.overrideConsoleMethods();
        }
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            this.error('💥 Uncaught Exception', {
                error: error.message,
                stack: error.stack,
                severity: 'CRITICAL'
            });
            // Give logger time to write before exiting
            setTimeout(() => process.exit(1), 1000);
        });
        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            this.error('💥 Unhandled Promise Rejection', {
                reason: reason?.message || reason,
                stack: reason?.stack,
                promise: promise.toString(),
                severity: 'CRITICAL'
            });
        });
        // Handle process warnings
        process.on('warning', (warning) => {
            this.warn('⚠️ Process Warning', {
                name: warning.name,
                message: warning.message,
                stack: warning.stack
            });
        });
    }
    /**
     * Override console methods to redirect to logger
     */
    overrideConsoleMethods() {
        // Store original console methods
        const originalConsole = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error,
            debug: console.debug
        };
        // Override console.log
        console.log = (...args) => {
            this.info('CONSOLE_LOG', { args: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)) });
        };
        // Override console.info
        console.info = (...args) => {
            this.info('CONSOLE_INFO', { args: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)) });
        };
        // Override console.warn
        console.warn = (...args) => {
            this.warn('CONSOLE_WARN', { args: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)) });
        };
        // Override console.error
        console.error = (...args) => {
            this.error('CONSOLE_ERROR', { args: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)) });
        };
        // Override console.debug
        console.debug = (...args) => {
            this.debug('CONSOLE_DEBUG', { args: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)) });
        };
        this.info('🔄 Console methods overridden for production logging');
    }
    // Public logging methods
    /**
     * Log error messages
     */
    error(message, error, context) {
        const logData = {
            message,
            level: LogLevel.ERROR,
            timestamp: new Date().toISOString(),
            ...context
        };
        if (error) {
            if (error instanceof Error) {
                logData.error = {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                };
            }
            else {
                logData.error = error;
            }
        }
        this.winstonLogger.error(logData);
    }
    /**
     * Log warning messages
     */
    warn(message, context) {
        this.winstonLogger.warn({
            message,
            level: LogLevel.WARN,
            timestamp: new Date().toISOString(),
            ...context
        });
    }
    /**
     * Log info messages
     */
    info(message, context) {
        this.winstonLogger.info({
            message,
            level: LogLevel.INFO,
            timestamp: new Date().toISOString(),
            ...context
        });
    }
    /**
     * Log debug messages
     */
    debug(message, context) {
        this.winstonLogger.debug({
            message,
            level: LogLevel.DEBUG,
            timestamp: new Date().toISOString(),
            ...context
        });
    }
    /**
     * Log HTTP requests
     */
    http(message, context) {
        this.winstonLogger.http({
            message,
            level: LogLevel.HTTP,
            timestamp: new Date().toISOString(),
            ...context
        });
    }
    /**
     * Log security events
     */
    security(message, context) {
        if (!this.config.enableSecurityLogging)
            return;
        this.winstonLogger.info({
            message,
            level: LogLevel.INFO,
            timestamp: new Date().toISOString(),
            category: 'SECURITY',
            ...context
        });
    }
    /**
     * Log performance metrics
     */
    performance(message, context) {
        if (!this.config.enablePerformanceLogging)
            return;
        const threshold = this.performanceThresholds.get(context.metric);
        const exceeded = threshold ? context.value > threshold : false;
        this.winstonLogger.info({
            message,
            level: exceeded ? LogLevel.WARN : LogLevel.INFO,
            timestamp: new Date().toISOString(),
            category: 'PERFORMANCE',
            exceeded,
            threshold,
            ...context
        });
    }
    /**
     * Log audit events
     */
    audit(message, context) {
        if (!this.config.enableAuditLogging)
            return;
        this.winstonLogger.info({
            message,
            level: LogLevel.INFO,
            timestamp: new Date().toISOString(),
            category: 'AUDIT',
            ...context
        });
    }
    /**
     * Log business events
     */
    business(message, context) {
        this.winstonLogger.info({
            message,
            level: LogLevel.INFO,
            timestamp: new Date().toISOString(),
            category: 'BUSINESS',
            ...context
        });
    }
    /**
     * Create child logger with additional context
     */
    createChild(defaultContext) {
        const childLogger = new UltraProfessionalLogger(this.config);
        // Override logging methods to include default context
        const originalMethods = {
            error: childLogger.error.bind(childLogger),
            warn: childLogger.warn.bind(childLogger),
            info: childLogger.info.bind(childLogger),
            debug: childLogger.debug.bind(childLogger),
            http: childLogger.http.bind(childLogger),
            security: childLogger.security.bind(childLogger),
            performance: childLogger.performance.bind(childLogger),
            audit: childLogger.audit.bind(childLogger),
            business: childLogger.business.bind(childLogger)
        };
        childLogger.error = (message, error, context) => {
            originalMethods.error(message, error, { ...defaultContext, ...context });
        };
        childLogger.warn = (message, context) => {
            originalMethods.warn(message, { ...defaultContext, ...context });
        };
        childLogger.info = (message, context) => {
            originalMethods.info(message, { ...defaultContext, ...context });
        };
        childLogger.debug = (message, context) => {
            originalMethods.debug(message, { ...defaultContext, ...context });
        };
        childLogger.http = (message, context) => {
            originalMethods.http(message, { ...defaultContext, ...context });
        };
        childLogger.security = (message, context) => {
            originalMethods.security(message, { ...defaultContext, ...context });
        };
        childLogger.performance = (message, context) => {
            originalMethods.performance(message, { ...defaultContext, ...context });
        };
        childLogger.audit = (message, context) => {
            originalMethods.audit(message, { ...defaultContext, ...context });
        };
        childLogger.business = (message, context) => {
            originalMethods.business(message, { ...defaultContext, ...context });
        };
        return childLogger;
    }
    /**
     * Flush all pending logs
     */
    async flush() {
        return new Promise((resolve) => {
            this.winstonLogger.end(() => resolve());
        });
    }
    /**
     * Get current log level
     */
    getLevel() {
        return this.config.level;
    }
    /**
     * Set log level
     */
    setLevel(level) {
        this.config.level = level;
        this.winstonLogger.level = level;
    }
    /**
     * Check if level is enabled
     */
    isLevelEnabled(level) {
        return this.winstonLogger.isLevelEnabled(level);
    }
}
exports.UltraProfessionalLogger = UltraProfessionalLogger;
// Create and export default logger instance
exports.logger = new UltraProfessionalLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    format: process.env.LOG_FORMAT || 'json',
    enableConsole: process.env.NODE_ENV !== 'production' || process.env.LOG_CONSOLE === 'true',
    enableFile: process.env.LOG_FILE !== 'false',
    enableElastic: process.env.LOG_ELASTIC === 'true',
    enableSentry: process.env.LOG_SENTRY === 'true',
    filePath: process.env.LOG_FILE_PATH || './logs',
    maxFileSize: process.env.LOG_MAX_FILE_SIZE || '100m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '30', 10), // Ensure it's a number
    enablePiiRedaction: process.env.LOG_PII_REDACTION !== 'false',
    enablePerformanceLogging: process.env.LOG_PERFORMANCE !== 'false',
    enableSecurityLogging: process.env.LOG_SECURITY !== 'false',
    enableAuditLogging: process.env.LOG_AUDIT !== 'false',
    timezone: process.env.LOG_TIMEZONE || 'Asia/Tashkent'
});
// Export helper functions for easy migration from console.log
exports.log = {
    // ❌ Replace: console.log('message', data)
    // ✅ With: log.info('message', { data })
    info: (message, context) => exports.logger.info(message, context),
    // ❌ Replace: console.error('error', error)
    // ✅ With: log.error('error', error)
    error: (message, error, context) => exports.logger.error(message, error, context),
    // ❌ Replace: console.warn('warning')
    // ✅ With: log.warn('warning')
    warn: (message, context) => exports.logger.warn(message, context),
    // ❌ Replace: console.debug('debug info')
    // ✅ With: log.debug('debug info')
    debug: (message, context) => exports.logger.debug(message, context),
    // Professional logging methods
    security: (message, context) => exports.logger.security(message, context),
    performance: (message, context) => exports.logger.performance(message, context),
    audit: (message, context) => exports.logger.audit(message, context),
    business: (message, context) => exports.logger.business(message, context),
    http: (message, context) => exports.logger.http(message, context)
};
// Export utility functions
const createLogger = (service) => {
    return exports.logger.createChild({ service });
};
exports.createLogger = createLogger;
const createRequestLogger = (correlationId, userId) => {
    return exports.logger.createChild({ correlationId, userId });
};
exports.createRequestLogger = createRequestLogger;
// Migration helper - detects and warns about console usage
if (process.env.NODE_ENV === 'development') {
    const originalConsoleLog = console.log;
    console.log = (...args) => {
        exports.logger.warn('🚨 MIGRATION NEEDED: console.log detected', {
            message: 'Replace with logger.info() or log.info()',
            args: args.slice(0, 3), // Limit logged args
            stack: new Error().stack?.split('\n')[1]?.trim()
        });
        originalConsoleLog(...args);
    };
}
//# sourceMappingURL=ultra-professional-logger.js.map