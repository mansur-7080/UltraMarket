"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testLogger = exports.professionalLogger = exports.LogCategory = exports.LogLevel = void 0;
const tslib_1 = require("tslib");
const winston_1 = tslib_1.__importDefault(require("winston"));
const path_1 = tslib_1.__importDefault(require("path"));
const fs_1 = tslib_1.__importDefault(require("fs"));
// Define log levels for different types of operations
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["HTTP"] = "http";
    LogLevel["DEBUG"] = "debug";
    LogLevel["VERBOSE"] = "verbose";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
// Define log categories
var LogCategory;
(function (LogCategory) {
    LogCategory["PERFORMANCE_TEST"] = "performance-test";
    LogCategory["SECURITY_AUDIT"] = "security-audit";
    LogCategory["LOAD_TEST"] = "load-test";
    LogCategory["E2E_TEST"] = "e2e-test";
    LogCategory["INTEGRATION_TEST"] = "integration-test";
    LogCategory["PENETRATION_TEST"] = "penetration-test";
})(LogCategory || (exports.LogCategory = LogCategory = {}));
// Professional Logger Class
class ProfessionalLogger {
    loggers = new Map();
    logDir;
    constructor() {
        this.logDir = process.env.LOG_DIR || path_1.default.join(process.cwd(), 'logs');
        this.ensureLogDirectory();
        this.initializeLoggers();
    }
    ensureLogDirectory() {
        if (!fs_1.default.existsSync(this.logDir)) {
            fs_1.default.mkdirSync(this.logDir, { recursive: true });
        }
    }
    initializeLoggers() {
        const categories = Object.values(LogCategory);
        categories.forEach(category => {
            const logger = winston_1.default.createLogger({
                level: process.env.LOG_LEVEL || 'info',
                format: winston_1.default.format.combine(winston_1.default.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.prettyPrint()),
                defaultMeta: {
                    category,
                    service: 'ultramarket',
                    environment: process.env.NODE_ENV || 'development'
                },
                transports: [
                    // Error logs
                    new winston_1.default.transports.File({
                        filename: path_1.default.join(this.logDir, `${category}-error.log`),
                        level: 'error',
                        maxsize: 5242880, // 5MB
                        maxFiles: 5,
                    }),
                    // Combined logs
                    new winston_1.default.transports.File({
                        filename: path_1.default.join(this.logDir, `${category}.log`),
                        maxsize: 5242880, // 5MB
                        maxFiles: 5,
                    }),
                    // Console output with colors
                    new winston_1.default.transports.Console({
                        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.printf(({ level, message, timestamp, category, ...meta }) => {
                            const emoji = this.getEmojiForLevel(level);
                            const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
                            return `${emoji} [${timestamp}] [${category}] ${level}: ${message} ${metaStr}`;
                        }))
                    })
                ],
                // Handle uncaught exceptions and rejections
                exceptionHandlers: [
                    new winston_1.default.transports.File({
                        filename: path_1.default.join(this.logDir, `${category}-exceptions.log`)
                    })
                ],
                rejectionHandlers: [
                    new winston_1.default.transports.File({
                        filename: path_1.default.join(this.logDir, `${category}-rejections.log`)
                    })
                ]
            });
            this.loggers.set(category, logger);
        });
    }
    getEmojiForLevel(level) {
        const emojiMap = {
            error: '❌',
            warn: '⚠️',
            info: 'ℹ️',
            http: '🌐',
            debug: '🐛',
            verbose: '📝'
        };
        return emojiMap[level] || '📋';
    }
    // Get logger for specific category
    getLogger(category) {
        const logger = this.loggers.get(category);
        if (!logger) {
            throw new Error(`Logger for category ${category} not found`);
        }
        return logger;
    }
    // Convenience methods for different test types
    performanceTest(level, message, meta) {
        this.log(LogCategory.PERFORMANCE_TEST, level, message, meta);
    }
    securityAudit(level, message, meta) {
        this.log(LogCategory.SECURITY_AUDIT, level, message, meta);
    }
    loadTest(level, message, meta) {
        this.log(LogCategory.LOAD_TEST, level, message, meta);
    }
    penetrationTest(level, message, meta) {
        this.log(LogCategory.PENETRATION_TEST, level, message, meta);
    }
    // Generic log method
    log(category, level, message, meta) {
        const logger = this.getLogger(category);
        logger.log(level, message, meta);
    }
    // Test-specific formatted logs
    testStart(category, testName, meta) {
        this.log(category, LogLevel.INFO, `🚀 Starting ${testName}`, {
            event: 'test_start',
            testName,
            timestamp: new Date().toISOString(),
            ...meta
        });
    }
    testComplete(category, testName, duration, results) {
        this.log(category, LogLevel.INFO, `🏁 ${testName} completed`, {
            event: 'test_complete',
            testName,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
            ...results
        });
    }
    testError(category, testName, error, meta) {
        this.log(category, LogLevel.ERROR, `❌ ${testName} failed`, {
            event: 'test_error',
            testName,
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
            ...meta
        });
    }
    securityVulnerability(severity, vulnerability, details) {
        const level = severity === 'CRITICAL' || severity === 'HIGH' ? LogLevel.ERROR : LogLevel.WARN;
        this.log(LogCategory.SECURITY_AUDIT, level, `🛡️ Security vulnerability found: ${vulnerability}`, {
            event: 'vulnerability_found',
            severity,
            vulnerability,
            timestamp: new Date().toISOString(),
            ...details
        });
    }
    performanceMetric(metricName, value, unit, meta) {
        this.log(LogCategory.PERFORMANCE_TEST, LogLevel.INFO, `📊 ${metricName}: ${value}${unit}`, {
            event: 'performance_metric',
            metric: metricName,
            value,
            unit,
            timestamp: new Date().toISOString(),
            ...meta
        });
    }
    // Close all loggers
    close() {
        this.loggers.forEach(logger => {
            logger.close();
        });
    }
}
// Create singleton instance
exports.professionalLogger = new ProfessionalLogger();
// Export convenience functions
exports.testLogger = {
    performanceTest: (level, message, meta) => exports.professionalLogger.performanceTest(level, message, meta),
    securityAudit: (level, message, meta) => exports.professionalLogger.securityAudit(level, message, meta),
    loadTest: (level, message, meta) => exports.professionalLogger.loadTest(level, message, meta),
    penetrationTest: (level, message, meta) => exports.professionalLogger.penetrationTest(level, message, meta),
    testStart: (category, testName, meta) => exports.professionalLogger.testStart(category, testName, meta),
    testComplete: (category, testName, duration, results) => exports.professionalLogger.testComplete(category, testName, duration, results),
    testError: (category, testName, error, meta) => exports.professionalLogger.testError(category, testName, error, meta),
    securityVulnerability: (severity, vulnerability, details) => exports.professionalLogger.securityVulnerability(severity, vulnerability, details),
    performanceMetric: (metricName, value, unit, meta) => exports.professionalLogger.performanceMetric(metricName, value, unit, meta)
};
exports.default = exports.professionalLogger;
//# sourceMappingURL=professional-logger.js.map