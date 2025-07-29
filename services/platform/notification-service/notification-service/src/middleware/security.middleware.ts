import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const securityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Remove powered-by header
  res.removeHeader('X-Powered-By');

  next();
};

export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Basic input sanitization
  const sanitizeString = (str: string): string => {
    if (typeof str !== 'string') return str;

    // Remove potentially dangerous characters
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'string') {
          sanitized[key] = sanitizeString(obj[key]);
        } else if (typeof obj[key] === 'object') {
          sanitized[key] = sanitizeObject(obj[key]);
        } else {
          sanitized[key] = obj[key];
        }
      }
    }
    return sanitized;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

export const validateContentType = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.get('Content-Type');

    if (!contentType || !contentType.includes('application/json')) {
      logger.warn('Invalid content type', {
        contentType,
        method: req.method,
        url: req.url,
        ip: req.ip,
      });

      return res.status(400).json({
        success: false,
        error: 'Content-Type must be application/json',
      });
    }
  }

  next();
};

export const preventDuplicateRequests = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.get('X-Request-ID');

  if (requestId) {
    // In a real implementation, you would check against a cache/database
    // For now, we'll just add the request ID to the request object
    (req as any).requestId = requestId;
  }

  next();
};
