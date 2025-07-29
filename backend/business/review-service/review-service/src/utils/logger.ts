import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which logs to print in console based on the current environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Create custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, service = 'review-service', ...args } = info;
    const ts = (timestamp as string).slice(0, 19).replace('T', ' ');
    return `${ts} [${service}] ${level}: ${message} ${
      Object.keys(args).length ? JSON.stringify(args, null, 2) : ''
    }`;
  })
);

// Create custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    level: level(),
    format: consoleFormat,
  }),

  // File transport for all logs
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'review-service.log'),
    level: 'info',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),

  // File transport for error logs
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'review-service-error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'review-service' },
  transports,
});

// Create a stream object with a 'write' function that will be used by Morgan
const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper functions for structured logging
const logWithContext = (level: string, message: string, context?: any) => {
  logger.log(level, message, context);
};

const logError = (message: string, error?: Error, context?: any) => {
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

const logInfo = (message: string, context?: any) => {
  logger.info(message, context);
};

const logWarn = (message: string, context?: any) => {
  logger.warn(message, context);
};

const logDebug = (message: string, context?: any) => {
  logger.debug(message, context);
};

const logHttp = (message: string, context?: any) => {
  logger.http(message, context);
};

// Performance logging
const logPerformance = (operation: string, startTime: number, context?: any) => {
  const duration = Date.now() - startTime;
  logger.info(`Performance: ${operation} completed in ${duration}ms`, {
    operation,
    duration,
    ...context,
  });
};

// Business logic logging
const logBusinessEvent = (event: string, data?: any) => {
  logger.info(`Business Event: ${event}`, {
    event,
    data,
    timestamp: new Date().toISOString(),
  });
};

// Security logging
const logSecurityEvent = (event: string, userId?: string, ip?: string, details?: any) => {
  logger.warn(`Security Event: ${event}`, {
    event,
    userId,
    ip,
    details,
    timestamp: new Date().toISOString(),
  });
};

// Export the logger and helper functions
export {
  logger,
  stream,
  logWithContext,
  logError,
  logInfo,
  logWarn,
  logDebug,
  logHttp,
  logPerformance,
  logBusinessEvent,
  logSecurityEvent,
};

export default logger;
