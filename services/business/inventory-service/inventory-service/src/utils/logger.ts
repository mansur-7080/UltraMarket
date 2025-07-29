import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';
const nodeEnv = process.env.NODE_ENV || 'development';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Create logger instance
export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  defaultMeta: {
    service: 'inventory-service',
    environment: nodeEnv,
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),

    // File transport for production
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],

  // Handle exceptions
  exceptionHandlers: [new winston.transports.File({ filename: 'logs/exceptions.log' })],

  // Handle rejections
  rejectionHandlers: [new winston.transports.File({ filename: 'logs/rejections.log' })],
});

// Create logs directory if it doesn't exist
import { mkdirSync } from 'fs';
import { dirname } from 'path';

try {
  mkdirSync(dirname('logs/combined.log'), { recursive: true });
} catch (error) {
  // Directory might already exist
}

export default logger;
