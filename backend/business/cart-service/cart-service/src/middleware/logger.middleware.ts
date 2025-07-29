import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Log request start
  logger.info(`Incoming request: ${req.method} ${req.path}`, {
    method: req.method,
    url: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.userId,
    timestamp: new Date().toISOString(),
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any) {
    const duration = Date.now() - start;

    // Log response
    logger.info(`Request completed: ${req.method} ${req.path}`, {
      method: req.method,
      url: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.userId,
      timestamp: new Date().toISOString(),
    });

    // Call original end method
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Morgan-style stream for winston
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
