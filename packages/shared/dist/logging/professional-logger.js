"use strict";
/**
 * 🚀 PROFESSIONAL LOGGING SYSTEM - UltraMarket
 *
 * Barcha console.log statements larini almashtiruvchi professional TypeScript logger
 * Production-ready Winston logger with structured logging
 *
 * @author UltraMarket Development Team
 * @version 2.0.0
 * @date 2024-12-28
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.gracefulShutdown = exports.validateNoConsoleInProduction = exports.eslintRules = exports.replaceConsole = exports.createRequestLogger = exports.createLogger = exports.logger = exports.ProfessionalLogger = void 0;
const tslib_1 = require("tslib");
const winston_1 = tslib_1.__importDefault(require("winston"));
const winston_daily_rotate_file_1 = tslib_1.__importDefault(require("winston-daily-rotate-file"));
const path_1 = tslib_1.__importDefault(require("path"));
const fs_1 = tslib_1.__importDefault(require("fs"));
// Log levels va ranglar
const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
};
const logColors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white'
};
winston_1.default.addColors(logColors);
// Environment variables
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug');
const SERVICE_NAME = process.env.SERVICE_NAME || 'ultramarket';
// Logs directory yaratish
const logsDir = path_1.default.join(process.cwd(), 'logs');
if (!fs_1.default.existsSync(logsDir)) {
    fs_1.default.mkdirSync(logsDir, { recursive: true });
}
// Professional log format
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
}), winston_1.default.format.errors({ stack: true }), winston_1.default.format.metadata(), winston_1.default.format.printf(({ timestamp, level, message, metadata, stack }) => {
    const meta = metadata && Object.keys(metadata).length > 0
        ? `\n📊 Metadata: ${JSON.stringify(metadata, null, 2)}`
        : '';
    const stackTrace = stack ? `\n📍 Stack: ${stack}` : '';
    return `🕐 ${timestamp} | ${level.toUpperCase().padEnd(5)} | 🏷️  ${SERVICE_NAME} | ${message}${meta}${stackTrace}`;
}));
// Console format for development
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize({ all: true }), winston_1.default.format.timestamp({
    format: 'HH:mm:ss'
}), winston_1.default.format.printf(({ timestamp, level, message, metadata }) => {
    const meta = metadata && Object.keys(metadata).length > 0
        ? ` 📊 ${JSON.stringify(metadata)}`
        : '';
    return `🕐 ${timestamp} | ${level} | 🏷️  ${SERVICE_NAME} | ${message}${meta}`;
}));
// File rotation transport
const createRotatingFileTransport = (filename, level) => {
    return new winston_daily_rotate_file_1.default({
        filename: path_1.default.join(logsDir, `%DATE%-${filename}.log`),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        level,
        format: logFormat,
        handleExceptions: true,
        handleRejections: true,
    });
};
// Transport yaratish
const transports = [
    // Console transport (faqat development uchun)
    ...(NODE_ENV !== 'production' ? [
        new winston_1.default.transports.Console({
            format: consoleFormat,
            level: LOG_LEVEL,
        })
    ] : []),
    // File transports
    createRotatingFileTransport('combined'),
    createRotatingFileTransport('error', 'error'),
    createRotatingFileTransport('debug', 'debug'),
    // HTTP transport (production uchun centralized logging)
    ...(NODE_ENV === 'production' && process.env.LOG_HTTP_URL ? [
        new winston_1.default.transports.Http({
            host: process.env.LOG_HTTP_HOST,
            port: parseInt(process.env.LOG_HTTP_PORT || '80'),
            path: process.env.LOG_HTTP_PATH || '/logs',
            level: 'error',
        })
    ] : [])
];
// Professional Logger Class
class ProfessionalLogger {
    logger;
    serviceName;
    requestId;
    constructor(serviceName = SERVICE_NAME, requestId) {
        this.serviceName = serviceName;
        this.requestId = requestId;
        this.logger = winston_1.default.createLogger({
            levels: logLevels,
            level: LOG_LEVEL,
            format: logFormat,
            transports,
            exitOnError: false,
            defaultMeta: {
                service: this.serviceName,
                environment: NODE_ENV,
                version: process.env.APP_VERSION || '1.0.0',
                requestId: this.requestId
            }
        });
        // Uncaught exception va unhandled rejection handling
        this.logger.exceptions.handle(createRotatingFileTransport('exceptions'));
        this.logger.rejections.handle(createRotatingFileTransport('rejections'));
    }
    // Info level logging
    info(message, metadata) {
        this.logger.info(message, {
            timestamp: new Date().toISOString(),
            ...metadata
        });
    }
    // Error level logging
    error(message, error, metadata) {
        this.logger.error(message, {
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
            } : error,
            ...metadata
        });
    }
    // Warning level logging  
    warn(message, metadata) {
        this.logger.warn(message, {
            timestamp: new Date().toISOString(),
            ...metadata
        });
    }
    // Debug level logging
    debug(message, metadata) {
        this.logger.debug(message, {
            timestamp: new Date().toISOString(),
            ...metadata
        });
    }
    // HTTP level logging
    http(message, metadata) {
        this.logger.http(message, {
            timestamp: new Date().toISOString(),
            ...metadata
        });
    }
    // Performance measurement
    time(label) {
        console.time(`⏱️  ${this.serviceName}-${label}`);
    }
    timeEnd(label, metadata) {
        console.timeEnd(`⏱️  ${this.serviceName}-${label}`);
        this.debug(`Performance measurement: ${label}`, metadata);
    }
    // Database query logging
    database(operation, table, duration, metadata) {
        this.debug(`🗄️  Database ${operation.toLowerCase()}`, {
            operation,
            table,
            duration: duration ? `${duration}ms` : undefined,
            ...metadata
        });
    }
    // Authentication logging
    auth(action, userId, metadata) {
        this.info(`🔐 Auth ${action}`, {
            action,
            userId,
            ...metadata
        });
    }
    // API request logging
    apiRequest(method, path, statusCode, duration, metadata) {
        const level = statusCode >= 400 ? 'error' : 'info';
        this.logger.log(level, `📡 API ${method} ${path}`, {
            method,
            path,
            statusCode,
            duration: `${duration}ms`,
            ...metadata
        });
    }
    // Business logic logging
    business(event, metadata) {
        this.info(`💼 Business Event: ${event}`, metadata);
    }
    // Security event logging
    security(event, severity, metadata) {
        const level = severity === 'critical' ? 'error' : severity === 'high' ? 'warn' : 'info';
        this.logger.log(level, `🛡️  Security Event: ${event}`, {
            severity,
            event,
            ...metadata
        });
    }
}
exports.ProfessionalLogger = ProfessionalLogger;
// Default logger instance
exports.logger = new ProfessionalLogger();
// Factory function
const createLogger = (serviceName, requestId) => {
    return new ProfessionalLogger(serviceName, requestId);
};
exports.createLogger = createLogger;
// Request logger middleware factory
const createRequestLogger = (serviceName) => {
    return (req, res, next) => {
        const requestId = req.headers['x-request-id'] ||
            req.headers['requestid'] ||
            `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        req.logger = new ProfessionalLogger(serviceName, requestId);
        res.setHeader('X-Request-ID', requestId);
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            req.logger.apiRequest(req.method, req.originalUrl || req.url, res.statusCode, duration, {
                userAgent: req.get('User-Agent'),
                ip: req.ip,
                userId: req.user?.id
            });
        });
        next();
    };
};
exports.createRequestLogger = createRequestLogger;
// Console.log replacement functions (backward compatibility)
const replaceConsole = () => {
    if (NODE_ENV === 'production') {
        console.log = (...args) => exports.logger.info(args.join(' '));
        console.error = (...args) => exports.logger.error(args.join(' '));
        console.warn = (...args) => exports.logger.warn(args.join(' '));
        console.info = (...args) => exports.logger.info(args.join(' '));
        console.debug = (...args) => exports.logger.debug(args.join(' '));
    }
};
exports.replaceConsole = replaceConsole;
// ESLint konfiguratsiya
exports.eslintRules = {
    'no-console': NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': NODE_ENV === 'production' ? 'error' : 'warn',
};
// Pre-commit hook function
const validateNoConsoleInProduction = (filePath) => {
    if (NODE_ENV !== 'production')
        return true;
    const fs = require('fs');
    const content = fs.readFileSync(filePath, 'utf8');
    const consoleRegex = /console\.(log|error|warn|info|debug)\s*\(/g;
    const matches = content.match(consoleRegex);
    if (matches && matches.length > 0) {
        exports.logger.error(`❌ Console statements found in production build: ${filePath}`, {
            matches: matches
        });
        return false;
    }
    return true;
};
exports.validateNoConsoleInProduction = validateNoConsoleInProduction;
// Graceful shutdown
const gracefulShutdown = () => {
    exports.logger.info('🛑 Shutting down logger gracefully...');
    // Winston transportlarni yopish
    exports.logger.logger.close();
    setTimeout(() => {
        process.exit(0);
    }, 1000);
};
exports.gracefulShutdown = gracefulShutdown;
// Process event listeners
process.on('SIGINT', exports.gracefulShutdown);
process.on('SIGTERM', exports.gracefulShutdown);
// Export qilingan default logger
exports.default = exports.logger;
//# sourceMappingURL=professional-logger.js.map