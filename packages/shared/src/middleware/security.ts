/**
 * UltraMarket Security Middleware
 * Professional security middleware for Express applications
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../logging/logger';

export interface SecurityConfig {
  enableXSSProtection: boolean;
  enableContentTypeSniffing: boolean;
  enableFrameOptions: boolean;
  enableHSTS: boolean;
  enableCSP: boolean;
  enableReferrerPolicy: boolean;
}

export interface SecurityEvent {
  type: 'XSS_ATTEMPT' | 'SQL_INJECTION' | 'SUSPICIOUS_REQUEST' | 'RATE_LIMIT_EXCEEDED';
  request: {
    method: string;
    url: string;
    ip: string;
    userAgent: string;
    headers: Record<string, string>;
  };
  details: Record<string, unknown>;
  timestamp: Date;
}

// Default security configuration
const defaultSecurityConfig: SecurityConfig = {
  enableXSSProtection: true,
  enableContentTypeSniffing: true,
  enableFrameOptions: true,
  enableHSTS: true,
  enableCSP: true,
  enableReferrerPolicy: true,
};

// Security headers middleware
export function securityHeaders(
  config: Partial<SecurityConfig> = {}
): (req: Request, res: Response, next: NextFunction) => void {
  const finalConfig = { ...defaultSecurityConfig, ...config };

  return (req: Request, res: Response, next: NextFunction): void => {
    // X-XSS-Protection
    if (finalConfig.enableXSSProtection) {
      res.setHeader('X-XSS-Protection', '1; mode=block');
    }

    // X-Content-Type-Options
    if (finalConfig.enableContentTypeSniffing) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }

    // X-Frame-Options
    if (finalConfig.enableFrameOptions) {
      res.setHeader('X-Frame-Options', 'DENY');
    }

    // Strict-Transport-Security
    if (finalConfig.enableHSTS) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    // Content-Security-Policy
    if (finalConfig.enableCSP) {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
      );
    }

    // Referrer-Policy
    if (finalConfig.enableReferrerPolicy) {
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    // Remove powered-by header
    res.removeHeader('X-Powered-By');

    next();
  };
}

// XSS protection middleware
export function xssProtection(req: Request, res: Response, next: NextFunction): void {
  const suspiciousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>/gi,
  ];

  const checkForXSS = (value: string): boolean => {
    return suspiciousPatterns.some((pattern) => pattern.test(value));
  };

  const scanObject = (obj: Record<string, unknown>): boolean => {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && checkForXSS(value)) {
        return true;
      }
      if (typeof value === 'object' && value !== null) {
        if (scanObject(value as Record<string, unknown>)) {
          return true;
        }
      }
    }
    return false;
  };

  // Check request body
  if (req.body && scanObject(req.body)) {
    logSecurityEvent({
      type: 'XSS_ATTEMPT',
      request: {
        method: req.method,
        url: req.url,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || '',
        headers: req.headers as Record<string, string>,
      },
      details: { body: req.body },
      timestamp: new Date(),
    });

    res.status(400).json({
      success: false,
      message: 'Potential XSS attack detected',
      error: {
        code: 'XSS_DETECTED',
        message: 'Request contains potentially malicious content',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Check query parameters
  if (req.query && scanObject(req.query as Record<string, unknown>)) {
    logSecurityEvent({
      type: 'XSS_ATTEMPT',
      request: {
        method: req.method,
        url: req.url,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || '',
        headers: req.headers as Record<string, string>,
      },
      details: { query: req.query },
      timestamp: new Date(),
    });

    res.status(400).json({
      success: false,
      message: 'Potential XSS attack detected',
      error: {
        code: 'XSS_DETECTED',
        message: 'Request contains potentially malicious content',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  next();
}

// SQL injection protection middleware
export function sqlInjectionProtection(req: Request, res: Response, next: NextFunction): void {
  const sqlPatterns = [
    /(\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bcreate\b|\balter\b|\bexec\b|\bunion\b)/gi,
    /(\bor\b|\band\b)\s+\d+\s*=\s*\d+/gi,
    /'\s*(or|and)\s+.*?[=<>]/gi,
    /--/g,
    /\/\*.*?\*\//g,
    /;\s*(drop|delete|insert|update|create|alter)/gi,
  ];

  const checkForSQLInjection = (value: string): boolean => {
    return sqlPatterns.some((pattern) => pattern.test(value));
  };

  const scanObject = (obj: Record<string, unknown>): boolean => {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && checkForSQLInjection(value)) {
        return true;
      }
      if (typeof value === 'object' && value !== null) {
        if (scanObject(value as Record<string, unknown>)) {
          return true;
        }
      }
    }
    return false;
  };

  // Check request body
  if (req.body && scanObject(req.body)) {
    logSecurityEvent({
      type: 'SQL_INJECTION',
      request: {
        method: req.method,
        url: req.url,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || '',
        headers: req.headers as Record<string, string>,
      },
      details: { body: req.body },
      timestamp: new Date(),
    });

    res.status(400).json({
      success: false,
      message: 'Potential SQL injection detected',
      error: {
        code: 'SQL_INJECTION_DETECTED',
        message: 'Request contains potentially malicious SQL content',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Check query parameters
  if (req.query && scanObject(req.query as Record<string, unknown>)) {
    logSecurityEvent({
      type: 'SQL_INJECTION',
      request: {
        method: req.method,
        url: req.url,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || '',
        headers: req.headers as Record<string, string>,
      },
      details: { query: req.query },
      timestamp: new Date(),
    });

    res.status(400).json({
      success: false,
      message: 'Potential SQL injection detected',
      error: {
        code: 'SQL_INJECTION_DETECTED',
        message: 'Request contains potentially malicious SQL content',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  next();
}

// Request size limiter
export function requestSizeLimit(
  maxSize: number = 10 * 1024 * 1024
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.get('Content-Length') || '0', 10);

    if (contentLength > maxSize) {
      logSecurityEvent({
        type: 'SUSPICIOUS_REQUEST',
        request: {
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent') || '',
          headers: req.headers as Record<string, string>,
        },
        details: { contentLength, maxSize },
        timestamp: new Date(),
      });

      res.status(413).json({
        success: false,
        message: 'Request entity too large',
        error: {
          code: 'REQUEST_TOO_LARGE',
          message: `Request size ${contentLength} exceeds maximum allowed size ${maxSize}`,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    next();
  };
}

// IP whitelist middleware
export function ipWhitelist(
  allowedIPs: string[]
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip || 'unknown';

    if (!allowedIPs.includes(clientIP)) {
      logSecurityEvent({
        type: 'SUSPICIOUS_REQUEST',
        request: {
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent') || '',
          headers: req.headers as Record<string, string>,
        },
        details: { clientIP, allowedIPs },
        timestamp: new Date(),
      });

      res.status(403).json({
        success: false,
        message: 'Access denied',
        error: {
          code: 'IP_NOT_ALLOWED',
          message: 'Your IP address is not allowed to access this resource',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    next();
  };
}

// Request ID middleware
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const existingId = req.get('X-Request-ID');
  const requestId = existingId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);

  next();
}

// Security event logger
function logSecurityEvent(event: SecurityEvent): void {
  logger.security(event.type, {
    request: event.request,
    details: event.details,
    timestamp: event.timestamp.toISOString(),
  });
}

// Combined security middleware
export function securityMiddleware(
  config: Partial<SecurityConfig> = {}
): (req: Request, res: Response, next: NextFunction) => void {
  const securityHeadersMiddleware = securityHeaders(config);

  return (req: Request, res: Response, next: NextFunction): void => {
    // Apply security headers
    securityHeadersMiddleware(req, res, () => {
      // Apply request ID
      requestId(req, res, () => {
        // Apply XSS protection
        xssProtection(req, res, () => {
          // Apply SQL injection protection
          sqlInjectionProtection(req, res, next);
        });
      });
    });
  };
}

export default {
  securityMiddleware,
  securityHeaders,
  xssProtection,
  sqlInjectionProtection,
  requestSizeLimit,
  ipWhitelist,
  requestId,
};
