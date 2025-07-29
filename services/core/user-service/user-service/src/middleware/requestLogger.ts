import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Request logger middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const { method, originalUrl, ip, headers } = req;

  // Log request
  logger.info('Incoming request', {
    method,
    url: originalUrl,
    ip,
    userAgent: headers['user-agent'],
    timestamp: new Date().toISOString(),
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any) {
    const duration = Date.now() - start;
    const { statusCode } = res;

    // Log response
    logger.info('Request completed', {
      method,
      url: originalUrl,
      statusCode,
      duration: `${duration}ms`,
      ip,
      timestamp: new Date().toISOString(),
    });

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Performance monitoring middleware
export const performanceMonitor = (req: Request, res: Response, next: NextFunction): void => {
  const start = process.hrtime();

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1000000;

    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode,
      });
    }

    // Log performance metrics
    logger.debug('Request performance', {
      method: req.method,
      url: req.originalUrl,
      duration: `${duration.toFixed(2)}ms`,
      statusCode: res.statusCode,
    });
  });

  next();
};

// Security logging middleware
export const securityLogger = (req: Request, res: Response, next: NextFunction): void => {
  const { method, originalUrl, ip, headers } = req;

  // Log potential security events
  const suspiciousPatterns = [
    /\.\.\//, // Directory traversal
    /<script>/i, // XSS attempts
    /union\s+select/i, // SQL injection
    /eval\(/i, // Code injection
  ];

  const userAgent = headers['user-agent'] || '';
  const isSuspicious = suspiciousPatterns.some(
    (pattern) => pattern.test(originalUrl) || pattern.test(userAgent)
  );

  if (isSuspicious) {
    logger.warn('Suspicious request detected', {
      method,
      url: originalUrl,
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
    });
  }

  next();
};
