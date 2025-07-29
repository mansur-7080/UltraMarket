"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logSecurityEvent = exports.logBusinessEvent = exports.logPerformance = exports.logHttp = exports.logDebug = exports.logWarn = exports.logInfo = exports.logError = exports.logWithContext = exports.stream = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};
winston_1.default.addColors(colors);
const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : 'warn';
};
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf((info) => {
    const { timestamp, level, message, service = 'review-service', ...args } = info;
    const ts = timestamp.slice(0, 19).replace('T', ' ');
    return `${ts} [${service}] ${level}: ${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ''}`;
}));
const fileFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
const transports = [
    new winston_1.default.transports.Console({
        level: level(),
        format: consoleFormat,
    }),
    new winston_1.default.transports.File({
        filename: path_1.default.join(process.cwd(), 'logs', 'review-service.log'),
        level: 'info',
        format: fileFormat,
        maxsize: 5242880,
        maxFiles: 5,
    }),
    new winston_1.default.transports.File({
        filename: path_1.default.join(process.cwd(), 'logs', 'review-service-error.log'),
        level: 'error',
        format: fileFormat,
        maxsize: 5242880,
        maxFiles: 5,
    }),
];
const logger = winston_1.default.createLogger({
    level: level(),
    levels,
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    defaultMeta: { service: 'review-service' },
    transports,
});
exports.logger = logger;
const stream = {
    write: (message) => {
        logger.http(message.trim());
    },
};
exports.stream = stream;
const logWithContext = (level, message, context) => {
    logger.log(level, message, context);
};
exports.logWithContext = logWithContext;
const logError = (message, error, context) => {
    logger.error(message, {
        error: error
            ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
            }
            : undefined,
        ...context,
    });
};
exports.logError = logError;
const logInfo = (message, context) => {
    logger.info(message, context);
};
exports.logInfo = logInfo;
const logWarn = (message, context) => {
    logger.warn(message, context);
};
exports.logWarn = logWarn;
const logDebug = (message, context) => {
    logger.debug(message, context);
};
exports.logDebug = logDebug;
const logHttp = (message, context) => {
    logger.http(message, context);
};
exports.logHttp = logHttp;
const logPerformance = (operation, startTime, context) => {
    const duration = Date.now() - startTime;
    logger.info(`Performance: ${operation} completed in ${duration}ms`, {
        operation,
        duration,
        ...context,
    });
};
exports.logPerformance = logPerformance;
const logBusinessEvent = (event, data) => {
    logger.info(`Business Event: ${event}`, {
        event,
        data,
        timestamp: new Date().toISOString(),
    });
};
exports.logBusinessEvent = logBusinessEvent;
const logSecurityEvent = (event, userId, ip, details) => {
    logger.warn(`Security Event: ${event}`, {
        event,
        userId,
        ip,
        details,
        timestamp: new Date().toISOString(),
    });
};
exports.logSecurityEvent = logSecurityEvent;
exports.default = logger;
//# sourceMappingURL=logger.js.map