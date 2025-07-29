import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  logger.info(`Incoming request: ${req.method} ${req.path}`, {
    method: req.method,
    url: req.path,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any) {
    const duration = Date.now() - start;
    logger.info(`Request completed: ${req.method} ${req.path}`, {
      method: req.method,
      url: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};
