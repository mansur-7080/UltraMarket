"use strict";
/**
 * 🚀 ULTRAMARKET SHARED LOGGER
 * Centralized logging utility for all microservices
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.createLogger = createLogger;
var ConsoleLogger = /** @class */ (function () {
    function ConsoleLogger(service) {
        if (service === void 0) { service = 'unknown'; }
        this.service = service;
    }
    ConsoleLogger.prototype.formatMessage = function (level, message, context) {
        var timestamp = new Date().toISOString();
        var contextStr = context ? " [".concat(JSON.stringify(context), "]") : '';
        return "[".concat(timestamp, "] [").concat(level.toUpperCase(), "] [").concat(this.service, "] ").concat(message).concat(contextStr);
    };
    ConsoleLogger.prototype.error = function (message, error, context) {
        var errorInfo = error ? " - ".concat(error.message) : '';
        console.error(this.formatMessage('ERROR', message + errorInfo, context));
        if (error === null || error === void 0 ? void 0 : error.stack) {
            console.error(error.stack);
        }
    };
    ConsoleLogger.prototype.warn = function (message, context) {
        console.warn(this.formatMessage('WARN', message, context));
    };
    ConsoleLogger.prototype.info = function (message, context) {
        console.info(this.formatMessage('INFO', message, context));
    };
    ConsoleLogger.prototype.debug = function (message, context) {
        console.debug(this.formatMessage('DEBUG', message, context));
    };
    return ConsoleLogger;
}());
// Create default logger instance
exports.logger = new ConsoleLogger();
// Factory function to create service-specific loggers
function createLogger(service) {
    return new ConsoleLogger(service);
}
// Export types
// export type { LogContext };
