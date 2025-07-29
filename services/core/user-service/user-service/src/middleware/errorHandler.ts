import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (error: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    operation: 'error_handler',
  });

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env['NODE_ENV'] === 'development' ? error.message : 'Something went wrong',
  });
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      operation: 'request_log',
    });
  });

  next();
};
