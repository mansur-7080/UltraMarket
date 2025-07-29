"use strict";
/**
 * UltraMarket Logger
 * Professional logging utility with structured logging and multiple transports
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLoggerMiddleware = exports.logger = exports.Logger = exports.LogLevel = void 0;
const tslib_1 = require("tslib");
const winston_1 = tslib_1.__importDefault(require("winston"));
const winston_daily_rotate_file_1 = tslib_1.__importDefault(require("winston-daily-rotate-file"));
const path_1 = tslib_1.__importDefault(require("path"));
const fs_1 = tslib_1.__importDefault(require("fs"));
// Log levels
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["HTTP"] = "http";
    LogLevel["DEBUG"] = "debug";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
// Professional log format
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const logEntry = {
        timestamp,
        level,
        message,
        service: service || process.env.SERVICE_NAME || 'ultramarket',
        environment: process.env.NODE_ENV || 'development',
        ...meta,
    };
    return JSON.stringify(logEntry);
}));
// Console format for development
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'HH:mm:ss' }), winston_1.default.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const serviceName = service || process.env.SERVICE_NAME || 'ultramarket';
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `[${timestamp}] [${serviceName}] ${level}: ${message} ${metaStr}`;
}));
// Create logs directory if it doesn't exist
const logsDir = path_1.default.join(process.cwd(), 'logs');
if (!fs_1.default.existsSync(logsDir)) {
    fs_1.default.mkdirSync(logsDir, { recursive: true });
}
// Daily rotate file transport for all logs
const dailyRotateTransport = new winston_daily_rotate_file_1.default({
    filename: path_1.default.join(logsDir, 'ultramarket-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: logFormat,
});
// Daily rotate file transport for error logs
const errorRotateTransport = new winston_daily_rotate_file_1.default({
    filename: path_1.default.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    level: 'error',
    format: logFormat,
});
// Create Winston logger instance
const winstonLogger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [dailyRotateTransport, errorRotateTransport],
    exceptionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'exceptions.log'),
            format: logFormat,
        }),
    ],
    rejectionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'rejections.log'),
            format: logFormat,
        }),
    ],
});
// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
    winstonLogger.add(new winston_1.default.transports.Console({
        format: consoleFormat,
    }));
}
// Professional logger interface
class Logger {
    serviceName;
    constructor(serviceName) {
        this.serviceName = serviceName || process.env.SERVICE_NAME || 'ultramarket';
    }
    log(level, message, meta) {
        winstonLogger.log(level, message, { service: this.serviceName, ...meta });
    }
    info(message, meta) {
        this.log(LogLevel.INFO, message, meta);
    }
    warn(message, meta) {
        this.log(LogLevel.WARN, message, meta);
    }
    error(message, error, meta) {
        const errorMeta = error instanceof Error
            ? {
                error: error.message,
                stack: error.stack,
                ...meta,
            }
            : { error, ...meta };
        this.log(LogLevel.ERROR, message, errorMeta);
    }
    debug(message, meta) {
        this.log(LogLevel.DEBUG, message, meta);
    }
    http(message, meta) {
        this.log(LogLevel.HTTP, message, meta);
    }
    // Performance logging
    performance(operation, startTime, meta) {
        const duration = Date.now() - startTime;
        this.info(`Performance: ${operation}`, {
            operation,
            duration_ms: duration,
            ...meta,
        });
    }
    // Business metrics logging
    business(event, data) {
        this.info(`Business Event: ${event}`, {
            event_type: 'business',
            event_name: event,
            ...data,
        });
    }
    // Security logging
    security(event, data) {
        this.warn(`Security Event: ${event}`, {
            event_type: 'security',
            event_name: event,
            ...data,
        });
    }
    // API request logging
    apiRequest(method, url, statusCode, responseTime, meta) {
        this.http(`${method} ${url} ${statusCode}`, {
            method,
            url,
            status_code: statusCode,
            response_time_ms: responseTime,
            ...meta,
        });
    }
}
exports.Logger = Logger;
// Default logger instance
exports.logger = new Logger();
// Express middleware for request logging
const requestLoggerMiddleware = (req, res, next) => {
    const startTime = Date.now();
    res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        exports.logger.apiRequest(req.method, req.originalUrl, res.statusCode, responseTime, {
            user_id: req.user?.id,
            ip: req.ip,
            user_agent: req.get('User-Agent'),
        });
    });
    next();
};
exports.requestLoggerMiddleware = requestLoggerMiddleware;
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map