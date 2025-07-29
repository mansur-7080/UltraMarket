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
    filename: path.join(logsDir, 'search-service.log'),
    format: logFormat,
    level: 'info',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),

  // File transport for error logs
  new winston.transports.File({
    filename: path.join(logsDir, 'search-service-error.log'),
    format: logFormat,
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

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
    query: req.query,
  };

  const level = res.statusCode >= 400 ? 'error' : 'info';
  logger.log(level, 'Search Service Request', logData);
};

// Add search logging helper
export const logSearch = (query: string, results: number, duration: number, filters?: any) => {
  logger.info('Search Query', {
    query,
    results,
    duration: `${duration}ms`,
    filters,
    timestamp: new Date().toISOString(),
  });
};

// Add indexing logging helper
export const logIndexing = (operation: string, document: any, success: boolean, error?: Error) => {
  const logData = {
    operation,
    documentId: document.id,
    documentType: document.type,
    success,
    timestamp: new Date().toISOString(),
  };

  if (error) {
    logger.error('Indexing Operation Failed', {
      ...logData,
      error: error.message,
      stack: error.stack,
    });
  } else {
    logger.info('Indexing Operation Success', logData);
  }
};

// Export default logger
export default logger;
