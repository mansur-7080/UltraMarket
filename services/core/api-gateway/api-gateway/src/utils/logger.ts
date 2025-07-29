import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

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

// Add colors to winston
winston.addColors(colors);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;

    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += ` | ${JSON.stringify(meta)}`;
    }

    return logMessage;
  })
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;

    let logMessage = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += ` | ${JSON.stringify(meta, null, 2)}`;
    }

    return logMessage;
  })
);

// Create transports
const transports: winston.transport[] = [
  // Console transport for development
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  }),

  // File transport for all logs
  new winston.transports.File({
    filename: path.join(logsDir, 'api-gateway.log'),
    format: logFormat,
    level: 'info',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),

  // File transport for error logs
  new winston.transports.File({
    filename: path.join(logsDir, 'api-gateway-error.log'),
    format: logFormat,
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Add HTTP transport for production logging service
if (process.env.NODE_ENV === 'production' && process.env.LOG_SERVICE_URL) {
  transports.push(
    new winston.transports.Http({
      host: process.env.LOG_SERVICE_HOST || 'localhost',
      port: parseInt(process.env.LOG_SERVICE_PORT || '3000'),
      path: process.env.LOG_SERVICE_PATH || '/logs',
      level: 'error',
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Add request logging helper
export const logRequest = (req: any, res: any, responseTime?: number) => {
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
  logger.log(level, 'API Gateway Request', logData);
};

// Add error logging helper
export const logError = (error: Error, context?: any) => {
  logger.error('API Gateway Error', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    ...context,
  });
};

// Add security logging helper
export const logSecurity = (event: string, details: any) => {
  logger.warn('Security Event', {
    event,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

// Add performance logging helper
export const logPerformance = (operation: string, duration: number, details?: any) => {
  logger.info('Performance Metric', {
    operation,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

// Add service communication logging helper
export const logServiceCall = (
  service: string,
  endpoint: string,
  method: string,
  duration?: number,
  error?: Error
) => {
  const logData = {
    service,
    endpoint,
    method,
    duration: duration ? `${duration}ms` : undefined,
    timestamp: new Date().toISOString(),
  };

  if (error) {
    logger.error('Service Call Failed', {
      ...logData,
      error: error.message,
      stack: error.stack,
    });
  } else {
    logger.info('Service Call Success', logData);
  }
};

// Create stream for Morgan HTTP logging
export const logStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Export default logger
export default logger;
