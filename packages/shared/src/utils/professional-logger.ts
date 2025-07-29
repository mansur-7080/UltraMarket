import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Define log levels for different types of operations
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  DEBUG = 'debug',
  VERBOSE = 'verbose'
}

// Define log categories
export enum LogCategory {
  PERFORMANCE_TEST = 'performance-test',
  SECURITY_AUDIT = 'security-audit',
  LOAD_TEST = 'load-test',
  E2E_TEST = 'e2e-test',
  INTEGRATION_TEST = 'integration-test',
  PENETRATION_TEST = 'penetration-test'
}

// Professional Logger Class
class ProfessionalLogger {
  private loggers: Map<LogCategory, winston.Logger> = new Map();
  private logDir: string;

  constructor() {
    this.logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
    this.initializeLoggers();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private initializeLoggers(): void {
    const categories = Object.values(LogCategory);
    
    categories.forEach(category => {
      const logger = winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: winston.format.combine(
          winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
          }),
          winston.format.errors({ stack: true }),
          winston.format.json(),
          winston.format.prettyPrint()
        ),
        defaultMeta: { 
          category,
          service: 'ultramarket',
          environment: process.env.NODE_ENV || 'development'
        },
        transports: [
          // Error logs
          new winston.transports.File({
            filename: path.join(this.logDir, `${category}-error.log`),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
          // Combined logs
          new winston.transports.File({
            filename: path.join(this.logDir, `${category}.log`),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
          // Console output with colors
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(({ level, message, timestamp, category, ...meta }) => {
                const emoji = this.getEmojiForLevel(level);
                const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
                return `${emoji} [${timestamp}] [${category}] ${level}: ${message} ${metaStr}`;
              })
            )
          })
        ],
        // Handle uncaught exceptions and rejections
        exceptionHandlers: [
          new winston.transports.File({
            filename: path.join(this.logDir, `${category}-exceptions.log`)
          })
        ],
        rejectionHandlers: [
          new winston.transports.File({
            filename: path.join(this.logDir, `${category}-rejections.log`)
          })
        ]
      });

      this.loggers.set(category, logger);
    });
  }

  private getEmojiForLevel(level: string): string {
    const emojiMap: { [key: string]: string } = {
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
  public getLogger(category: LogCategory): winston.Logger {
    const logger = this.loggers.get(category);
    if (!logger) {
      throw new Error(`Logger for category ${category} not found`);
    }
    return logger;
  }

  // Convenience methods for different test types
  public performanceTest(level: LogLevel, message: string, meta?: any): void {
    this.log(LogCategory.PERFORMANCE_TEST, level, message, meta);
  }

  public securityAudit(level: LogLevel, message: string, meta?: any): void {
    this.log(LogCategory.SECURITY_AUDIT, level, message, meta);
  }

  public loadTest(level: LogLevel, message: string, meta?: any): void {
    this.log(LogCategory.LOAD_TEST, level, message, meta);
  }

  public penetrationTest(level: LogLevel, message: string, meta?: any): void {
    this.log(LogCategory.PENETRATION_TEST, level, message, meta);
  }

  // Generic log method
  public log(category: LogCategory, level: LogLevel, message: string, meta?: any): void {
    const logger = this.getLogger(category);
    logger.log(level, message, meta);
  }

  // Test-specific formatted logs
  public testStart(category: LogCategory, testName: string, meta?: any): void {
    this.log(category, LogLevel.INFO, `🚀 Starting ${testName}`, {
      event: 'test_start',
      testName,
      timestamp: new Date().toISOString(),
      ...meta
    });
  }

  public testComplete(category: LogCategory, testName: string, duration: number, results?: any): void {
    this.log(category, LogLevel.INFO, `🏁 ${testName} completed`, {
      event: 'test_complete',
      testName,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      ...results
    });
  }

  public testError(category: LogCategory, testName: string, error: Error | string, meta?: any): void {
    this.log(category, LogLevel.ERROR, `❌ ${testName} failed`, {
      event: 'test_error',
      testName,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      ...meta
    });
  }

  public securityVulnerability(severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW', 
                              vulnerability: string, details: any): void {
    const level = severity === 'CRITICAL' || severity === 'HIGH' ? LogLevel.ERROR : LogLevel.WARN;
    this.log(LogCategory.SECURITY_AUDIT, level, `🛡️ Security vulnerability found: ${vulnerability}`, {
      event: 'vulnerability_found',
      severity,
      vulnerability,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  public performanceMetric(metricName: string, value: number, unit: string, meta?: any): void {
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
  public close(): void {
    this.loggers.forEach(logger => {
      logger.close();
    });
  }
}

// Create singleton instance
export const professionalLogger = new ProfessionalLogger();

// Export convenience functions
export const testLogger = {
  performanceTest: (level: LogLevel, message: string, meta?: any) => 
    professionalLogger.performanceTest(level, message, meta),
  
  securityAudit: (level: LogLevel, message: string, meta?: any) => 
    professionalLogger.securityAudit(level, message, meta),
  
  loadTest: (level: LogLevel, message: string, meta?: any) => 
    professionalLogger.loadTest(level, message, meta),
  
  penetrationTest: (level: LogLevel, message: string, meta?: any) => 
    professionalLogger.penetrationTest(level, message, meta),
  
  testStart: (category: LogCategory, testName: string, meta?: any) => 
    professionalLogger.testStart(category, testName, meta),
  
  testComplete: (category: LogCategory, testName: string, duration: number, results?: any) => 
    professionalLogger.testComplete(category, testName, duration, results),
  
  testError: (category: LogCategory, testName: string, error: Error | string, meta?: any) => 
    professionalLogger.testError(category, testName, error, meta),
  
  securityVulnerability: (severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW', 
                         vulnerability: string, details: any) => 
    professionalLogger.securityVulnerability(severity, vulnerability, details),
  
  performanceMetric: (metricName: string, value: number, unit: string, meta?: any) => 
    professionalLogger.performanceMetric(metricName, value, unit, meta)
};

export default professionalLogger; 