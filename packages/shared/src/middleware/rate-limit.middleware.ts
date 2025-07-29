import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { RateLimitError } from '../errors/AppError';
import { logger } from '../logging/logger';

// Rate limit configuration interface
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
  headers?: boolean;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
  store?: RateLimitStore;
}

// Rate limit store interface
export interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<{ totalHits: number; timeToExpire: number }>;
  decrement(key: string): Promise<void>;
  resetKey(key: string): Promise<void>;
}

// Redis-based rate limit store
export class RedisRateLimitStore implements RateLimitStore {
  private redis: Redis;
  private prefix: string;

  constructor(redisInstance?: Redis, prefix: string = 'rl:') {
    this.redis =
      redisInstance ||
      new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });
    this.prefix = prefix;
  }

  async increment(
    key: string,
    windowMs: number
  ): Promise<{ totalHits: number; timeToExpire: number }> {
    const redisKey = `${this.prefix}${key}`;
    const multi = this.redis.multi();

    multi.incr(redisKey);
    multi.expire(redisKey, Math.ceil(windowMs / 1000));
    multi.ttl(redisKey);

    const results = await multi.exec();

    if (!results) {
      throw new Error('Redis transaction failed');
    }

    const totalHits = results[0][1] as number;
    const timeToExpire = (results[2][1] as number) * 1000; // Convert to milliseconds

    return { totalHits, timeToExpire };
  }

  async decrement(key: string): Promise<void> {
    const redisKey = `${this.prefix}${key}`;
    await this.redis.decr(redisKey);
  }

  async resetKey(key: string): Promise<void> {
    const redisKey = `${this.prefix}${key}`;
    await this.redis.del(redisKey);
  }
}

// Memory-based rate limit store (for development/testing)
export class MemoryRateLimitStore implements RateLimitStore {
  private store: Map<string, { count: number; resetTime: number }> = new Map();

  async increment(
    key: string,
    windowMs: number
  ): Promise<{ totalHits: number; timeToExpire: number }> {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now > record.resetTime) {
      const newRecord = { count: 1, resetTime: now + windowMs };
      this.store.set(key, newRecord);
      return { totalHits: 1, timeToExpire: windowMs };
    }

    record.count++;
    this.store.set(key, record);

    return {
      totalHits: record.count,
      timeToExpire: record.resetTime - now,
    };
  }

  async decrement(key: string): Promise<void> {
    const record = this.store.get(key);
    if (record && record.count > 0) {
      record.count--;
      this.store.set(key, record);
    }
  }

  async resetKey(key: string): Promise<void> {
    this.store.delete(key);
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

// Default key generator
const defaultKeyGenerator = (req: Request): string => {
  return req.ip || req.connection.remoteAddress || 'unknown';
};

// Rate limit middleware factory
export const createRateLimit = (config: RateLimitConfig) => {
  const {
    windowMs,
    maxRequests,
    keyGenerator = defaultKeyGenerator,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    message = 'Too many requests, please try again later',
    headers = true,
    standardHeaders = true,
    legacyHeaders = false,
    store = new RedisRateLimitStore(),
  } = config;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = keyGenerator(req);

      // Check if we should skip this request
      if (skipSuccessfulRequests && res.statusCode < 400) {
        return next();
      }

      if (skipFailedRequests && res.statusCode >= 400) {
        return next();
      }

      const { totalHits, timeToExpire } = await store.increment(key, windowMs);

      // Add headers if enabled
      if (headers) {
        if (standardHeaders) {
          res.set('RateLimit-Limit', maxRequests.toString());
          res.set('RateLimit-Remaining', Math.max(0, maxRequests - totalHits).toString());
          res.set('RateLimit-Reset', new Date(Date.now() + timeToExpire).toISOString());
        }

        if (legacyHeaders) {
          res.set('X-RateLimit-Limit', maxRequests.toString());
          res.set('X-RateLimit-Remaining', Math.max(0, maxRequests - totalHits).toString());
          res.set('X-RateLimit-Reset', Math.ceil((Date.now() + timeToExpire) / 1000).toString());
        }
      }

      // Check if limit exceeded
      if (totalHits > maxRequests) {
        logger.warn('Rate limit exceeded', {
          key,
          totalHits,
          maxRequests,
          windowMs,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.url,
          method: req.method,
          userId: req.user?.userId,
        });

        // Add retry-after header
        res.set('Retry-After', Math.ceil(timeToExpire / 1000).toString());

        throw new RateLimitError(message, {
          limit: maxRequests,
          current: totalHits,
          retryAfter: Math.ceil(timeToExpire / 1000),
        });
      }

      logger.debug('Rate limit check passed', {
        key,
        totalHits,
        maxRequests,
        remaining: maxRequests - totalHits,
      });

      next();
    } catch (error) {
      if (error instanceof RateLimitError) {
        return res.status(error.statusCode).json(error.toJSON());
      }

      logger.error('Rate limit middleware error', error);

      // If rate limiting fails, we should not block the request
      // unless it's a critical error
      next();
    }
  };
};

// Predefined rate limit configurations
export const rateLimitConfigs = {
  // General API rate limit
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests from this IP, please try again later',
  },

  // Strict rate limit for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later',
    keyGenerator: (req: Request) => `auth:${req.ip}:${req.body?.email || 'unknown'}`,
  },

  // Password reset rate limit
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many password reset attempts, please try again later',
    keyGenerator: (req: Request) => `pwd-reset:${req.ip}:${req.body?.email || 'unknown'}`,
  },

  // Registration rate limit
  registration: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many registration attempts, please try again later',
    keyGenerator: (req: Request) => `register:${req.ip}`,
  },

  // API key rate limit (higher limit for authenticated users)
  apiKey: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 1000,
    message: 'API rate limit exceeded',
    keyGenerator: (req: Request) => `api:${req.user?.userId || req.ip}`,
  },

  // File upload rate limit
  fileUpload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    message: 'Too many file uploads, please try again later',
    keyGenerator: (req: Request) => `upload:${req.user?.userId || req.ip}`,
  },

  // Search rate limit
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Too many search requests, please slow down',
    keyGenerator: (req: Request) => `search:${req.user?.userId || req.ip}`,
  },

  // Payment rate limit
  payment: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: 'Too many payment attempts, please try again later',
    keyGenerator: (req: Request) => `payment:${req.user?.userId || req.ip}`,
  },

  // Admin endpoints rate limit
  admin: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 200,
    message: 'Admin rate limit exceeded',
    keyGenerator: (req: Request) => `admin:${req.user?.userId || req.ip}`,
  },
};

// Pre-configured rate limit middlewares
export const rateLimitMiddlewares = {
  general: createRateLimit(rateLimitConfigs.general),
  auth: createRateLimit(rateLimitConfigs.auth),
  passwordReset: createRateLimit(rateLimitConfigs.passwordReset),
  registration: createRateLimit(rateLimitConfigs.registration),
  apiKey: createRateLimit(rateLimitConfigs.apiKey),
  fileUpload: createRateLimit(rateLimitConfigs.fileUpload),
  search: createRateLimit(rateLimitConfigs.search),
  payment: createRateLimit(rateLimitConfigs.payment),
  admin: createRateLimit(rateLimitConfigs.admin),
};

// Dynamic rate limit based on user role
export const createDynamicRateLimit = (configs: Record<string, RateLimitConfig>) => {
  const middlewares = Object.entries(configs).reduce(
    (acc, [role, config]) => {
      acc[role] = createRateLimit(config);
      return acc;
    },
    {} as Record<string, any>
  );

  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role || 'guest';
    const middleware = middlewares[userRole] || middlewares.guest;

    if (!middleware) {
      logger.warn('No rate limit configuration for role', { role: userRole });
      return next();
    }

    return middleware(req, res, next);
  };
};

// Rate limit bypass for trusted IPs
export const createTrustedIPBypass = (trustedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress;

    if (clientIP && trustedIPs.includes(clientIP)) {
      logger.debug('Rate limit bypassed for trusted IP', { ip: clientIP });
      return next();
    }

    next();
  };
};

// Export default rate limit middleware
export default createRateLimit;
