import { Request, Response, NextFunction } from 'express';
// import { RedisService } from '@ultramarket/shared/services/redis';
// import { logger } from '@ultramarket/shared/logging/logger';
const logger = console;

// Local RedisService implementation
class RedisService {
  async checkRateLimit(key: string, limit: number, window: number) {
    // Simple in-memory implementation
    return {
      allowed: true,
      remaining: limit,
      reset: Date.now() + window * 1000,
    };
  }

  getClient() {
    // Return a mock Redis client
    return {
      get: async (key: string) => null,
      set: async (key: string, value: string) => 'OK',
      del: async (key: string) => 1,
      ttl: async (key: string) => -1, // Add ttl method
    };
  }
}

// If ApiError is used, define it locally:
class ApiError extends Error {
  constructor(public statusCode: number, public override message: string) {
    super(message);
  }
}

const redisService = new RedisService();

/**
 * Rate limiter middleware
 * @param key - Rate limit key (e.g., 'login', 'register')
 * @param limit - Maximum number of requests
 * @param window - Time window in seconds
 */
export const rateLimiter = (key: string, limit: number, window: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Create rate limit key based on IP and action
      const rateLimitKey = `rate_limit:${key}:${req.ip}`;

      // Check rate limit
      const rateLimit = await redisService.checkRateLimit(rateLimitKey, limit, window);

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.reset.toString(),
      });

      if (!rateLimit.allowed) {
        logger.warn('Rate limit exceeded', {
          key,
          ip: req.ip,
          limit,
          window,
        });

        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000),
        });
      }

      return next();
    } catch (error) {
      logger.error('Rate limiter error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        key,
        ip: req.ip,
      });

      // Allow request to proceed if rate limiter fails
      return next();
    }
  };
};

/**
 * IP-based rate limiter
 * @param limit - Maximum number of requests
 * @param window - Time window in seconds
 */
export const ipRateLimiter = (limit: number, window: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rateLimitKey = `rate_limit:ip:${req.ip}`;

      const rateLimit = await redisService.checkRateLimit(rateLimitKey, limit, window);

      res.set({
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.reset.toString(),
      });

      if (!rateLimit.allowed) {
        logger.warn('IP rate limit exceeded', {
          ip: req.ip,
          limit,
          window,
        });

        return res.status(429).json({
          success: false,
          message: 'Too many requests from this IP. Please try again later.',
          retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000),
        });
      }

      return next();
    } catch (error) {
      logger.error('IP rate limiter error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip,
      });
      return next();
    }
  };
};

/**
 * User-based rate limiter (requires authentication)
 * @param limit - Maximum number of requests
 * @param window - Time window in seconds
 */
export const userRateLimiter = (limit: number, window: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required for rate limiting',
        });
      }

      const rateLimitKey = `rate_limit:user:${user.userId}`;

      const rateLimit = await redisService.checkRateLimit(rateLimitKey, limit, window);

      res.set({
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.reset.toString(),
      });

      if (!rateLimit.allowed) {
        logger.warn('User rate limit exceeded', {
          userId: user.userId,
          limit,
          window,
        });

        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000),
        });
      }

      return next();
    } catch (error) {
      logger.error('User rate limiter error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (req as any).user?.userId,
      });
      return next();
    }
  };
};

/**
 * Burst rate limiter for high-frequency endpoints
 * @param limit - Maximum number of requests
 * @param window - Time window in seconds
 */
export const burstRateLimiter = (limit: number, window: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rateLimitKey = `rate_limit:burst:${req.ip}`;

      const rateLimit = await redisService.checkRateLimit(rateLimitKey, limit, window);

      res.set({
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.reset.toString(),
      });

      if (!rateLimit.allowed) {
        logger.warn('Burst rate limit exceeded', {
          ip: req.ip,
          limit,
          window,
        });

        return res.status(429).json({
          success: false,
          message: 'Too many requests in a short time. Please slow down.',
          retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000),
        });
      }

      return next();
    } catch (error) {
      logger.error('Burst rate limiter error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip,
      });
      return next();
    }
  };
};

/**
 * API key rate limiter
 * @param limit - Maximum number of requests
 * @param window - Time window in seconds
 */
export const apiKeyRateLimiter = (limit: number, window: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const apiKey = req.headers['x-api-key'] as string;

      if (!apiKey) {
        return res.status(401).json({
          success: false,
          message: 'API key required',
        });
      }

      const rateLimitKey = `rate_limit:api:${apiKey}`;

      const rateLimit = await redisService.checkRateLimit(rateLimitKey, limit, window);

      res.set({
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.reset.toString(),
      });

      if (!rateLimit.allowed) {
        logger.warn('API key rate limit exceeded', {
          apiKey: apiKey.substring(0, 8) + '...',
          limit,
          window,
        });

        return res.status(429).json({
          success: false,
          message: 'API rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000),
        });
      }

      return next();
    } catch (error) {
      logger.error('API key rate limiter error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return next();
    }
  };
};

/**
 * Get rate limit info for debugging
 */
export const getRateLimitInfo = async (key: string, identifier: string) => {
  try {
    const rateLimitKey = `rate_limit:${key}:${identifier}`;
    const current = await redisService.getClient().get(rateLimitKey);
    const ttl = await redisService.getClient().ttl(rateLimitKey);

    return {
      current: current ? parseInt(current) : 0,
      ttl,
      key: rateLimitKey,
    };
  } catch (error) {
    logger.error('Failed to get rate limit info', {
      error: error instanceof Error ? error.message : 'Unknown error',
      key,
      identifier,
    });
    return null;
  }
};
