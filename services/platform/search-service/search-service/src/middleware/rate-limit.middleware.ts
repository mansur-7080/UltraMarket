import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Custom key generator for rate limiting
const keyGenerator = (req: Request): string => {
  const userId = (req as any).user?.id;
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  return userId || ip;
};

// Custom error handler
const onLimitReached = (req: Request, res: Response): void => {
  res.status(429).json({
    success: false,
    error: 'Too many requests. Please try again later.',
    retryAfter: Math.round(60000 / 1000), // 1 minute
  });
};

/**
 * Rate limiting middleware for different endpoints
 */
export const rateLimitMiddleware = {
  // General search rate limiting
  search: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    keyGenerator,
    handler: onLimitReached,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many search requests',
  }),

  // Suggestions rate limiting (more restrictive)
  suggestions: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 200, // 200 requests per minute for autocomplete
    keyGenerator,
    handler: onLimitReached,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many suggestion requests',
  }),

  // Analytics rate limiting (more restrictive)
  analytics: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // 20 requests per 5 minutes
    keyGenerator,
    handler: onLimitReached,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many analytics requests',
  }),

  // Filters rate limiting
  filters: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 50, // 50 requests per minute
    keyGenerator,
    handler: onLimitReached,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many filter requests',
  }),

  // Click tracking rate limiting
  tracking: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 500, // 500 clicks per minute
    keyGenerator,
    handler: onLimitReached,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many tracking requests',
  }),

  // Indexing rate limiting (very restrictive)
  indexing: rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // 5 requests per 10 minutes
    keyGenerator,
    handler: onLimitReached,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many indexing requests',
  }),

  // Admin operations rate limiting
  admin: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per 15 minutes
    keyGenerator,
    handler: onLimitReached,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many admin requests',
  }),

  // Global rate limiting (fallback)
  global: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 1000, // 1000 requests per minute
    keyGenerator,
    handler: onLimitReached,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests',
  }),
};
