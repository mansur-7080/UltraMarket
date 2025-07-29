import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { logger, logSecurity } from '../utils/logger';

// Rate limit configurations for different endpoint types
export const rateLimitConfigs = {
  // General API rate limit
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  // Authentication endpoints (more restrictive)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 auth requests per windowMs
    message: {
      error: 'Too many authentication attempts from this IP, please try again later.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  // Payment endpoints (very restrictive)
  payment: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 payment requests per windowMs
    message: {
      error: 'Too many payment requests from this IP, please try again later.',
      code: 'PAYMENT_RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  // Search endpoints (moderate)
  search: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 200, // limit each IP to 200 search requests per windowMs
    message: {
      error: 'Too many search requests from this IP, please try again later.',
      code: 'SEARCH_RATE_LIMIT_EXCEEDED',
      retryAfter: '5 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    skipFailedRequests: false,
  },

  // Admin endpoints (very restrictive)
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 admin requests per windowMs
    message: {
      error: 'Too many admin requests from this IP, please try again later.',
      code: 'ADMIN_RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  // File upload endpoints (very restrictive)
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // limit each IP to 20 upload requests per hour
    message: {
      error: 'Too many file upload requests from this IP, please try again later.',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      retryAfter: '1 hour',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },
};

// Create rate limiter with custom handler
const createRateLimiter = (config: any) => {
  return rateLimit({
    ...config,
    handler: (req: Request, res: Response) => {
      // Log rate limit exceeded
      logSecurity('RATE_LIMIT_EXCEEDED', {
        ip: req.ip,
        url: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent'),
        userId: (req as any).user?.id,
      });

      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        url: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent'),
        userId: (req as any).user?.id,
      });

      res.status(429).json({
        success: false,
        ...config.message,
        timestamp: new Date().toISOString(),
      });
    },
    skip: (req: Request) => {
      // Skip rate limiting for health checks
      if (req.path === '/health' || req.path === '/api/health') {
        return true;
      }

      // Skip rate limiting for trusted IPs (if configured)
      const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];
      if (trustedIPs.includes(req.ip)) {
        return true;
      }

      return false;
    },
  });
};

// Export rate limiters
export const generalRateLimit = createRateLimiter(rateLimitConfigs.general);
export const authRateLimit = createRateLimiter(rateLimitConfigs.auth);
export const paymentRateLimit = createRateLimiter(rateLimitConfigs.payment);
export const searchRateLimit = createRateLimiter(rateLimitConfigs.search);
export const adminRateLimit = createRateLimiter(rateLimitConfigs.admin);
export const uploadRateLimit = createRateLimiter(rateLimitConfigs.upload);

// Dynamic rate limiter based on endpoint
export const dynamicRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const path = req.path.toLowerCase();

  // Determine which rate limiter to use based on path
  if (path.includes('/auth/') || path.includes('/login') || path.includes('/register')) {
    return authRateLimit(req, res, next);
  }

  if (path.includes('/payment') || path.includes('/checkout')) {
    return paymentRateLimit(req, res, next);
  }

  if (path.includes('/search')) {
    return searchRateLimit(req, res, next);
  }

  if (path.includes('/admin')) {
    return adminRateLimit(req, res, next);
  }

  if (path.includes('/upload') || path.includes('/file')) {
    return uploadRateLimit(req, res, next);
  }

  // Default to general rate limit
  return generalRateLimit(req, res, next);
};

// User-specific rate limiting (for authenticated users)
export const userRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // authenticated users get higher limits
  message: {
    error: 'Too many requests, please try again later.',
    code: 'USER_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes',
  },
  keyGenerator: (req: Request) => {
    // Use user ID for authenticated users, IP for anonymous
    return (req as any).user?.id || req.ip;
  },
  handler: (req: Request, res: Response) => {
    logSecurity('USER_RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      userId: (req as any).user?.id,
    });

    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later.',
      code: 'USER_RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes',
      timestamp: new Date().toISOString(),
    });
  },
});

// Burst protection for critical endpoints
export const burstProtection = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // maximum 10 requests per minute for critical operations
  message: {
    error: 'Too many requests in a short period, please slow down.',
    code: 'BURST_LIMIT_EXCEEDED',
    retryAfter: '1 minute',
  },
  handler: (req: Request, res: Response) => {
    logSecurity('BURST_LIMIT_EXCEEDED', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      userId: (req as any).user?.id,
    });

    res.status(429).json({
      success: false,
      error: 'Too many requests in a short period, please slow down.',
      code: 'BURST_LIMIT_EXCEEDED',
      retryAfter: '1 minute',
      timestamp: new Date().toISOString(),
    });
  },
});

export default {
  general: generalRateLimit,
  auth: authRateLimit,
  payment: paymentRateLimit,
  search: searchRateLimit,
  admin: adminRateLimit,
  upload: uploadRateLimit,
  dynamic: dynamicRateLimit,
  user: userRateLimit,
  burst: burstProtection,
};
