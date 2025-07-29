"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.professionalLogger = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
};
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    verbose: 'cyan',
    debug: 'blue',
    silly: 'grey'
};
winston_1.default.addColors(colors);
const SERVICE_CONTEXT = {
    service: 'user-service',
    component: 'core',
    version: '3.0.0',
    environment: process.env.NODE_ENV || 'development'
};
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    const correlationId = meta.correlationId || 'no-correlation';
    const serviceInfo = `[${SERVICE_CONTEXT.service}:${SERVICE_CONTEXT.version}]`;
    let metaString = '';
    if (Object.keys(meta).length > 0) {
        metaString = ` ${JSON.stringify(meta)}`;
    }
    return `${timestamp} ${serviceInfo} [${correlationId}] ${level}: ${message}${metaString}`;
}));
const jsonFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.printf((info) => {
    return JSON.stringify({
        ...info,
        ...SERVICE_CONTEXT,
        correlationId: info.correlationId || (0, crypto_1.randomUUID)(),
    });
}));
const transports = [
    new winston_1.default.transports.Console({
        format: consoleFormat,
        level: SERVICE_CONTEXT.environment === 'production' ? 'info' : 'debug',
    }),
];
if (SERVICE_CONTEXT.environment === 'production') {
    const logDir = path_1.default.join(process.cwd(), 'logs');
    transports.push(new winston_1.default.transports.File({
        filename: path_1.default.join(logDir, 'user-service-error.log'),
        level: 'error',
        format: jsonFormat,
        maxsize: 50 * 1024 * 1024,
        maxFiles: 10,
        tailable: true
    }), new winston_1.default.transports.File({
        filename: path_1.default.join(logDir, 'user-service.log'),
        format: jsonFormat,
        maxsize: 100 * 1024 * 1024,
        maxFiles: 5,
        tailable: true
    }), new winston_1.default.transports.File({
        filename: path_1.default.join(logDir, 'user-service-audit.log'),
        level: 'info',
        format: jsonFormat,
        maxsize: 25 * 1024 * 1024,
        maxFiles: 20,
        tailable: true
    }));
}
exports.logger = winston_1.default.createLogger({
    level: SERVICE_CONTEXT.environment === 'production' ? 'info' : 'debug',
    levels,
    format: jsonFormat,
    transports,
    exitOnError: false,
    defaultMeta: SERVICE_CONTEXT
});
exports.professionalLogger = {
    error: (message, meta) => exports.logger.error(message, meta),
    warn: (message, meta) => exports.logger.warn(message, meta),
    info: (message, meta) => exports.logger.info(message, meta),
    http: (message, meta) => exports.logger.http(message, meta),
    verbose: (message, meta) => exports.logger.verbose(message, meta),
    debug: (message, meta) => exports.logger.debug(message, meta),
    audit: (action, details, userId) => {
        exports.logger.info(`AUDIT: ${action}`, {
            audit: true,
            action,
            details,
            userId,
            timestamp: new Date().toISOString(),
            service: SERVICE_CONTEXT.service
        });
    },
    security: (event, details, severity = 'medium') => {
        const level = severity === 'critical' ? 'error' : severity === 'high' ? 'warn' : 'info';
        exports.logger[level](`SECURITY: ${event}`, {
            security: true,
            event,
            details,
            severity,
            timestamp: new Date().toISOString(),
            service: SERVICE_CONTEXT.service
        });
    },
    performance: (operation, duration, metadata) => {
        exports.logger.info(`PERFORMANCE: ${operation}`, {
            performance: true,
            operation,
            duration,
            metadata,
            timestamp: new Date().toISOString(),
            service: SERVICE_CONTEXT.service
        });
    },
    business: (operation, userId, details) => {
        exports.logger.info(`BUSINESS: ${operation}`, {
            business: true,
            operation,
            userId,
            details,
            timestamp: new Date().toISOString(),
            service: SERVICE_CONTEXT.service
        });
    }
};
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map