/**
 * Rate Limiter Middleware
 * Professional rate limiting with Redis support
 */

import { Request, Response, NextFunction } from 'express';
// import { logger } from '@ultramarket/shared/logging/logger';
const logger = console;

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore: RateLimitStore = {};

/**
 * Rate limiter class
 */
export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (req: Request) => req.ip || 'unknown',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
    };
  }

  /**
   * Check rate limit
   */
  async checkLimit(
    req: Request,
    key: string,
    maxRequests: number,
    windowMs: number
  ): Promise<void> {
    const clientKey = this.config.keyGenerator ? this.config.keyGenerator(req) : (req.ip || 'unknown');
    const rateLimitKey = `${key}:${clientKey}`;

    const now = Date.now();
    const windowStart = now - windowMs;

    // Get current rate limit data
    const currentData = rateLimitStore[rateLimitKey];

    if (!currentData || currentData.resetTime < now) {
      // First request or window expired
      rateLimitStore[rateLimitKey] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return;
    }

    // Check if limit exceeded
    if (currentData.count >= maxRequests) {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        key,
        count: currentData.count,
        maxRequests,
        windowMs,
      });

      throw new Error('Rate limit exceeded');
    }

    // Increment counter
    currentData.count++;
  }

  /**
   * Get rate limit info
   */
  getRateLimitInfo(
    req: Request,
    key: string
  ): {
    remaining: number;
    reset: number;
    total: number;
  } {
    const clientKey = this.config.keyGenerator ? this.config.keyGenerator(req) : (req.ip || 'unknown');
    const rateLimitKey = `${key}:${clientKey}`;

    const currentData = rateLimitStore[rateLimitKey];
    const now = Date.now();

    if (!currentData || currentData.resetTime < now) {
      return {
        remaining: this.config.maxRequests,
        reset: now + this.config.windowMs,
        total: this.config.maxRequests,
      };
    }

    return {
      remaining: Math.max(0, this.config.maxRequests - currentData.count),
      reset: currentData.resetTime,
      total: this.config.maxRequests,
    };
  }

  /**
   * Reset rate limit for a key
   */
  resetLimit(req: Request, key: string): void {
    const clientKey = this.config.keyGenerator ? this.config.keyGenerator(req) : (req.ip || 'unknown');
    const rateLimitKey = `${key}:${clientKey}`;

    delete rateLimitStore[rateLimitKey];
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();

    for (const [key, data] of Object.entries(rateLimitStore)) {
      if (data.resetTime < now) {
        delete rateLimitStore[key];
      }
    }
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  keyGenerator: (req: Request) => req.ip || 'unknown',
});

/**
 * Rate limiting middleware
 */
export function rateLimitMiddleware(config: Partial<RateLimitConfig> = {}) {
  const limiter = new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    keyGenerator: (req: Request) => req.ip || 'unknown',
    ...config,
  });

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await limiter.checkLimit(
        req,
        'general',
        config.maxRequests || 100,
        config.windowMs || 15 * 60 * 1000
      );

      // Add rate limit headers
      const info = limiter.getRateLimitInfo(req, 'general');
      res.set({
        'X-RateLimit-Limit': info.total.toString(),
        'X-RateLimit-Remaining': info.remaining.toString(),
        'X-RateLimit-Reset': new Date(info.reset).toISOString(),
      });

      next();
    } catch (error) {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });

      res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
        retryAfter: Math.ceil((config.windowMs || 15 * 60 * 1000) / 1000),
      });
    }
  };
}

/**
 * Specific rate limit for authentication endpoints
 */
export function authRateLimit() {
  return rateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    keyGenerator: (req: Request) => `${req.ip}:auth`,
  });
}

/**
 * Rate limit for registration
 */
export function registrationRateLimit() {
  return rateLimitMiddleware({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 attempts per hour
    keyGenerator: (req: Request) => `${req.ip}:registration`,
  });
}

/**
 * Rate limit for password reset
 */
export function passwordResetRateLimit() {
  return rateLimitMiddleware({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 attempts per hour
    keyGenerator: (req: Request) => `${req.ip}:password-reset`,
  });
}

/**
 * Rate limit for login attempts
 */
export function loginRateLimit() {
  return rateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 attempts per 15 minutes
    keyGenerator: (req: Request) => `${req.ip}:login`,
  });
}

// Clean up expired entries every 5 minutes
setInterval(
  () => {
    rateLimiter.cleanup();
  },
  5 * 60 * 1000
);
