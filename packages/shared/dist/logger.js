"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogLevel = exports.createLogger = exports.logger = void 0;
const tslib_1 = require("tslib");
const pino_1 = tslib_1.__importDefault(require("pino"));
const isDevelopment = process.env['NODE_ENV'] === 'development';
// Create logger instance
exports.logger = (0, pino_1.default)({
    level: process.env['LOG_LEVEL'] || 'info',
    transport: isDevelopment
        ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        }
        : undefined,
    formatters: {
        level: (label) => {
            return { level: label.toUpperCase() };
        },
    },
    base: {
        serviceName: process.env['SERVICE_NAME'] || 'unknown-service',
        env: process.env['NODE_ENV'] || 'development',
    },
    serializers: {
        req: pino_1.default.stdSerializers.req,
        res: pino_1.default.stdSerializers.res,
        err: pino_1.default.stdSerializers.err,
    },
    timestamp: pino_1.default.stdTimeFunctions.isoTime,
});
// Create child logger for specific modules
const createLogger = (module) => {
    return exports.logger.child({ module });
};
exports.createLogger = createLogger;
// Log levels
exports.LogLevel = {
    TRACE: 'trace',
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
    FATAL: 'fatal',
};
//# sourceMappingURL=logger.js.map