"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.logStream = exports.logServiceCall = exports.logPerformance = exports.logSecurity = exports.logError = exports.logRequest = exports.logger = void 0;
const winston = __importStar(require("winston"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}
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
winston.addColors(colors);
const logFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston.format.errors({ stack: true }), winston.format.json(), winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(meta).length > 0) {
        logMessage += ` | ${JSON.stringify(meta)}`;
    }
    return logMessage;
}));
const consoleFormat = winston.format.combine(winston.format.colorize({ all: true }), winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    let logMessage = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
        logMessage += ` | ${JSON.stringify(meta, null, 2)}`;
    }
    return logMessage;
}));
const transports = [
    new winston.transports.Console({
        format: consoleFormat,
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    }),
    new winston.transports.File({
        filename: path.join(logsDir, 'api-gateway.log'),
        format: logFormat,
        level: 'info',
        maxsize: 5242880,
        maxFiles: 5,
    }),
    new winston.transports.File({
        filename: path.join(logsDir, 'api-gateway-error.log'),
        format: logFormat,
        level: 'error',
        maxsize: 5242880,
        maxFiles: 5,
    }),
];
if (process.env.NODE_ENV === 'production' && process.env.LOG_SERVICE_URL) {
    transports.push(new winston.transports.Http({
        host: process.env.LOG_SERVICE_HOST || 'localhost',
        port: parseInt(process.env.LOG_SERVICE_PORT || '3000'),
        path: process.env.LOG_SERVICE_PATH || '/logs',
        level: 'error',
    }));
}
exports.logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels,
    format: logFormat,
    transports,
    exitOnError: false,
});
const logRequest = (req, res, responseTime) => {
    const logData = {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        statusCode: res.statusCode,
        contentLength: res.get('Content-Length'),
        responseTime: responseTime ? `${responseTime}ms` : undefined,
        userId: req.user?.id,
        sessionId: req.sessionID,
    };
    const level = res.statusCode >= 400 ? 'error' : 'info';
    exports.logger.log(level, 'API Gateway Request', logData);
};
exports.logRequest = logRequest;
const logError = (error, context) => {
    exports.logger.error('API Gateway Error', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        ...context,
    });
};
exports.logError = logError;
const logSecurity = (event, details) => {
    exports.logger.warn('Security Event', {
        event,
        timestamp: new Date().toISOString(),
        ...details,
    });
};
exports.logSecurity = logSecurity;
const logPerformance = (operation, duration, details) => {
    exports.logger.info('Performance Metric', {
        operation,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        ...details,
    });
};
exports.logPerformance = logPerformance;
const logServiceCall = (service, endpoint, method, duration, error) => {
    const logData = {
        service,
        endpoint,
        method,
        duration: duration ? `${duration}ms` : undefined,
        timestamp: new Date().toISOString(),
    };
    if (error) {
        exports.logger.error('Service Call Failed', {
            ...logData,
            error: error.message,
            stack: error.stack,
        });
    }
    else {
        exports.logger.info('Service Call Success', logData);
    }
};
exports.logServiceCall = logServiceCall;
exports.logStream = {
    write: (message) => {
        exports.logger.http(message.trim());
    },
};
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map