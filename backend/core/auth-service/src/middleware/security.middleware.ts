import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Professional Security Middleware
 * Implements enterprise-grade security measures
 */

// IP Whitelist for admin endpoints
const ADMIN_IP_WHITELIST = process.env['ADMIN_IP_WHITELIST']?.split(',') || [
  '127.0.0.1',
  '::1',
  'localhost'
];

// Suspicious patterns for request blocking
const SUSPICIOUS_PATTERNS = [
  /<script/i,
  /javascript:/i,
  /vbscript:/i,
  /onload=/i,
  /onerror=/i,
  /eval\(/i,
  /document\./i,
  /window\./i,
  /alert\(/i,
  /confirm\(/i,
  /prompt\(/i,
  /union\s+select/i,
  /drop\s+table/i,
  /delete\s+from/i,
  /insert\s+into/i,
  /update\s+set/i,
  /exec\s*\(/i,
  /xp_cmdshell/i,
  /sp_executesql/i,
];

// Rate limiting storage
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Advanced IP filtering middleware
 */
export const ipFilter = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  
  // Log suspicious IPs
  if (!ADMIN_IP_WHITELIST.includes(clientIP)) {
    logger.warn('Non-whitelisted IP accessing admin endpoint', {
      ip: clientIP,
      path: req.path,
      userAgent: req.get('User-Agent'),
    });
  }
  
  next();
};

/**
 * Input sanitization middleware
 */
export const inputSanitizer = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      // Remove null bytes
      value = value.replace(/\0/g, '');
      
      // Check for suspicious patterns
      for (const pattern of SUSPICIOUS_PATTERNS) {
        if (pattern.test(value)) {
          logger.warn('Suspicious input detected', {
            pattern: pattern.source,
            value: value.substring(0, 100),
            ip: req.ip,
            path: req.path,
          });
          throw new Error('Suspicious input detected');
        }
      }
      
      // Trim and normalize
      value = value.trim().replace(/\s+/g, ' ');
    }
    return value;
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = Array.isArray(obj) ? [] : {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeValue(value);
      }
      return sanitized;
    }
    return sanitizeValue(obj);
  };

  try {
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }
    next();
  } catch (error) {
    logger.error('Input sanitization failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      path: req.path,
    });
    res.status(400).json({
      success: false,
      error: {
        message: 'Invalid input detected',
        code: 'INPUT_SANITIZATION_FAILED'
      }
    });
  }
};

/**
 * Advanced rate limiting middleware
 */
export const advancedRateLimit = (options: {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = options.keyGenerator ? options.keyGenerator(req) : req.ip;
    if (!key) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid request identifier',
          code: 'INVALID_REQUEST_ID'
        }
      });
    }
    
    const now = Date.now();
    const record = rateLimitStore.get(key);
    
    if (!record || now > record.resetTime) {
      // First request or window expired
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + options.windowMs
      });
    } else {
      // Increment counter
      record.count++;
      
      if (record.count > options.maxRequests) {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          path: req.path,
          count: record.count,
          limit: options.maxRequests,
        });
        
        return res.status(429).json({
          success: false,
          error: {
            message: 'Too many requests',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil((record.resetTime - now) / 1000)
          }
        });
      }
    }
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', options.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - (record?.count || 0)));
    res.setHeader('X-RateLimit-Reset', Math.ceil((record?.resetTime || now + options.windowMs) / 1000));
    
    return next();
  };
};

/**
 * Request size limiter
 */
export const requestSizeLimiter = (maxSize: string) => {
  const maxBytes = parseInt(maxSize.replace(/[^0-9]/g, '')) * 1024 * 1024; // Convert MB to bytes
  
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > maxBytes) {
      logger.warn('Request too large', {
        contentLength,
        maxBytes,
        ip: req.ip,
        path: req.path,
      });
      
      return res.status(413).json({
        success: false,
        error: {
          message: 'Request entity too large',
          code: 'REQUEST_TOO_LARGE'
        }
      });
    }
    
    return next();
  };
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  return next();
};

/**
 * API key validation middleware
 */
export const apiKeyValidator = (req: Request, res: Response, next: NextFunction) => {
  const apiKeyRequired = process.env['API_KEY_REQUIRED'] === 'true';
  const apiKeyHeader = process.env['API_KEY_HEADER'] || 'X-API-Key';
  
  if (apiKeyRequired) {
    const apiKey = req.headers[apiKeyHeader.toLowerCase()];
    
    if (!apiKey) {
      logger.warn('Missing API key', {
        ip: req.ip,
        path: req.path,
        headers: req.headers,
      });
      
      return res.status(401).json({
        success: false,
        error: {
          message: 'API key required',
          code: 'API_KEY_MISSING'
        }
      });
    }
    
    // Validate API key (implement your validation logic here)
    const validApiKeys = process.env['VALID_API_KEYS']?.split(',') || [];
    
    if (!validApiKeys.includes(apiKey as string)) {
      const apiKeyStr = apiKey as string || '';
      logger.warn('Invalid API key', {
        ip: req.ip,
        path: req.path,
        providedKey: apiKeyStr.substring(0, 8) + '...',
      });
      
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid API key',
          code: 'API_KEY_INVALID'
        }
      });
    }
  }
  
  return next();
};

/**
 * Request logging with security context
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log request with security context
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    origin: req.get('Origin'),
    timestamp: new Date().toISOString(),
    security: {
      hasApiKey: !!req.headers['x-api-key'],
      hasAuthToken: !!req.headers.authorization,
      contentType: req.get('Content-Type'),
      contentLength: req.get('Content-Length'),
    }
  });
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
  });
  
  next();
};

/**
 * Cleanup rate limit store periodically
 */
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    logger.debug(`Cleaned ${cleanedCount} expired rate limit records`);
  }
}, 60000); // Clean every minute 