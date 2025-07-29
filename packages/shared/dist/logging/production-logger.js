"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackVendorEvent = exports.trackPayment = exports.trackApiCall = exports.trackUserAction = exports.logDebug = exports.logError = exports.logWarn = exports.logInfo = exports.productionLogger = void 0;
const tslib_1 = require("tslib");
const winston_1 = tslib_1.__importDefault(require("winston"));
const Sentry = tslib_1.__importStar(require("@sentry/node"));
class ProductionLogger {
    logger;
    constructor() {
        this.logger = winston_1.default.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
            defaultMeta: {
                service: process.env.SERVICE_NAME || 'ultramarket',
                version: process.env.APP_VERSION || '1.0.0',
                environment: process.env.NODE_ENV || 'development'
            },
            transports: [
                new winston_1.default.transports.File({
                    filename: 'logs/error.log',
                    level: 'error',
                    maxsize: 10485760, // 10MB
                    maxFiles: 5
                }),
                new winston_1.default.transports.File({
                    filename: 'logs/combined.log',
                    maxsize: 10485760,
                    maxFiles: 5
                })
            ]
        });
        // Add console transport for development
        if (process.env.NODE_ENV === 'development') {
            this.logger.add(new winston_1.default.transports.Console({
                format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
            }));
        }
    }
    info(message, context) {
        this.logger.info(message, context);
    }
    warn(message, context) {
        this.logger.warn(message, context);
        // Send warnings to Sentry in production
        if (process.env.NODE_ENV === 'production') {
            Sentry.captureMessage(message, 'warning');
        }
    }
    error(message, error, context) {
        this.logger.error(message, { ...context, error: error?.stack });
        // Send errors to Sentry
        if (error) {
            Sentry.captureException(error, {
                tags: context,
                extra: { message }
            });
        }
        else {
            Sentry.captureMessage(message, 'error');
        }
    }
    debug(message, context) {
        this.logger.debug(message, context);
    }
    // Track user actions
    trackUserAction(action, userId, metadata) {
        this.info(`User action: ${action}`, {
            userId,
            action,
            metadata
        });
    }
    // Track API calls
    trackApiCall(method, endpoint, statusCode, duration, context) {
        const level = statusCode >= 400 ? 'error' : 'info';
        this.logger.log(level, `${method} ${endpoint} - ${statusCode} (${duration}ms)`, {
            ...context,
            httpMethod: method,
            endpoint,
            statusCode,
            duration
        });
    }
    // Track payment events
    trackPayment(event, paymentId, amount, currency) {
        this.info(`Payment event: ${event}`, {
            service: 'payment',
            action: event,
            metadata: {
                paymentId,
                amount,
                currency
            }
        });
    }
    // Track vendor events
    trackVendorEvent(event, vendorId, metadata) {
        this.info(`Vendor event: ${event}`, {
            service: 'vendor-management',
            action: event,
            metadata: {
                vendorId,
                ...metadata
            }
        });
    }
}
exports.productionLogger = new ProductionLogger();
// Export convenience methods
const logInfo = (message, context) => exports.productionLogger.info(message, context);
exports.logInfo = logInfo;
const logWarn = (message, context) => exports.productionLogger.warn(message, context);
exports.logWarn = logWarn;
const logError = (message, error, context) => exports.productionLogger.error(message, error, context);
exports.logError = logError;
const logDebug = (message, context) => exports.productionLogger.debug(message, context);
exports.logDebug = logDebug;
const trackUserAction = (action, userId, metadata) => exports.productionLogger.trackUserAction(action, userId, metadata);
exports.trackUserAction = trackUserAction;
const trackApiCall = (method, endpoint, statusCode, duration, context) => exports.productionLogger.trackApiCall(method, endpoint, statusCode, duration, context);
exports.trackApiCall = trackApiCall;
const trackPayment = (event, paymentId, amount, currency) => exports.productionLogger.trackPayment(event, paymentId, amount, currency);
exports.trackPayment = trackPayment;
const trackVendorEvent = (event, vendorId, metadata) => exports.productionLogger.trackVendorEvent(event, vendorId, metadata);
exports.trackVendorEvent = trackVendorEvent;
//# sourceMappingURL=production-logger.js.map