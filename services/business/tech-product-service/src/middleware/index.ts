import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../../../../libs/shared/src/utils/logger-replacement';

const winston = createLogger('tech-product-service');

// Logger middleware
export const logger = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const userAgent = req.get('User-Agent') || 'Unknown';

  winston.info('HTTP Request', {
    timestamp,
    method,
    url,
    userAgent,
    service: 'tech-product-service'
  });

  next();
};

// Error handler middleware
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  winston.error('HTTP Request Error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    service: 'tech-product-service'
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: isDevelopment ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString(),
    service: 'tech-product-service',
  });
};
