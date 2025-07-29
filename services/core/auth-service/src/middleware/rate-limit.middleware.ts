/**
 * UltraMarket Auth Service - Rate Limiting Middleware
 * Professional rate limiting for API protection
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@ultramarket/shared/errors/api-error';
import { logger } from '@ultramarket/shared/logging/logger';

// Simple in-memory store for rate limiting
// In production, use Redis for distributed rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware
 * Limits requests per IP address
 */
export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const clientId = getClientId(req);
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 100; // Max requests per window

    // Get current rate limit data
    const currentData = rateLimitStore.get(clientId);

    if (!currentData || now > currentData.resetTime) {
      // First request or window expired
      rateLimitStore.set(clientId, {
        count: 1,
        resetTime: now + windowMs,
      });
    } else {
      // Check if limit exceeded
      if (currentData.count >= maxRequests) {
        logger.warn('Rate limit exceeded', {
          clientId,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          operation: 'rate_limit_middleware',
        });

        throw new ApiError(429, 'Too many requests. Please try again later.');
      }

      // Increment count
      currentData.count++;
      rateLimitStore.set(clientId, currentData);
    }

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': Math.max(0, maxRequests - (currentData?.count || 0)).toString(),
      'X-RateLimit-Reset': new Date(now + windowMs).toISOString(),
    });

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      logger.error('Rate limiting error', {
        error: error.message,
        operation: 'rate_limit_middleware',
      });
      next(new ApiError(500, 'Rate limiting error'));
    }
  }
}

/**
 * Stricter rate limiting for authentication endpoints
 */
export function authRateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const clientId = getClientId(req);
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 5; // Stricter limit for auth endpoints

    // Get current rate limit data
    const currentData = rateLimitStore.get(`auth_${clientId}`);

    if (!currentData || now > currentData.resetTime) {
      // First request or window expired
      rateLimitStore.set(`auth_${clientId}`, {
        count: 1,
        resetTime: now + windowMs,
      });
    } else {
      // Check if limit exceeded
      if (currentData.count >= maxRequests) {
        logger.warn('Auth rate limit exceeded', {
          clientId,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          operation: 'auth_rate_limit_middleware',
        });

        throw new ApiError(429, 'Too many authentication attempts. Please try again later.');
      }

      // Increment count
      currentData.count++;
      rateLimitStore.set(`auth_${clientId}`, currentData);
    }

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': Math.max(0, maxRequests - (currentData?.count || 0)).toString(),
      'X-RateLimit-Reset': new Date(now + windowMs).toISOString(),
    });

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      logger.error('Auth rate limiting error', {
        error: error.message,
        operation: 'auth_rate_limit_middleware',
      });
      next(new ApiError(500, 'Rate limiting error'));
    }
  }
}

/**
 * Rate limiting for password reset endpoints
 */
export function passwordResetRateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const clientId = getClientId(req);
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour
    const maxRequests = 3; // Very strict limit for password reset

    // Get current rate limit data
    const currentData = rateLimitStore.get(`password_reset_${clientId}`);

    if (!currentData || now > currentData.resetTime) {
      // First request or window expired
      rateLimitStore.set(`password_reset_${clientId}`, {
        count: 1,
        resetTime: now + windowMs,
      });
    } else {
      // Check if limit exceeded
      if (currentData.count >= maxRequests) {
        logger.warn('Password reset rate limit exceeded', {
          clientId,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          operation: 'password_reset_rate_limit_middleware',
        });

        throw new ApiError(429, 'Too many password reset attempts. Please try again later.');
      }

      // Increment count
      currentData.count++;
      rateLimitStore.set(`password_reset_${clientId}`, currentData);
    }

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': Math.max(0, maxRequests - (currentData?.count || 0)).toString(),
      'X-RateLimit-Reset': new Date(now + windowMs).toISOString(),
    });

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      logger.error('Password reset rate limiting error', {
        error: error.message,
        operation: 'password_reset_rate_limit_middleware',
      });
      next(new ApiError(500, 'Rate limiting error'));
    }
  }
}

/**
 * Get client identifier for rate limiting
 */
function getClientId(req: Request): string {
  // Use IP address as primary identifier
  const ip = req.ip || req.connection.remoteAddress || 'unknown';

  // Add user agent for additional uniqueness
  const userAgent = req.get('User-Agent') || 'unknown';

  // Create a hash of IP + User Agent
  return Buffer.from(`${ip}-${userAgent}`).toString('base64');
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();

  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up expired entries every 15 minutes
setInterval(cleanupRateLimitStore, 15 * 60 * 1000);
