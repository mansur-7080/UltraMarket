import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Security middleware
export const securityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');

  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Log suspicious activity
  const suspiciousPatterns = [
    /script/i,
    /javascript/i,
    /vbscript/i,
    /onload/i,
    /onerror/i,
    /eval/i,
    /expression/i,
    /alert/i,
    /document\.cookie/i,
    /window\.location/i,
  ];

  const requestData = JSON.stringify({
    url: req.url,
    body: req.body,
    query: req.query,
    headers: req.headers,
  });

  const isSuspicious = suspiciousPatterns.some((pattern) => pattern.test(requestData));

  if (isSuspicious) {
    logger.warn('Suspicious request detected', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
      body: req.body,
      query: req.query,
      timestamp: new Date().toISOString(),
    });
  }

  next();
};
