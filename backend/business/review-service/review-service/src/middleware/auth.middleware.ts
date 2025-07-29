import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        verified: boolean;
        permissions?: string[];
      };
    }
  }
}

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
  verified: boolean;
  permissions?: string[];
  iat?: number;
  exp?: number;
}

/**
 * Authentication middleware
 * Verifies JWT token and adds user info to request
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET environment variable is not set');
      throw new Error('Server configuration error');
    }

    // Verify token
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Check if user is verified
    if (!decoded.verified) {
      throw new UnauthorizedError('Account not verified');
    }

    // Add user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      verified: decoded.verified,
      permissions: decoded.permissions || [],
    };

    logger.info('User authenticated successfully', {
      userId: decoded.id,
      email: decoded.email,
      role: decoded.role,
      route: req.path,
    });

    next();
  } catch (error) {
    logger.error('Authentication error:', error);

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: 'INVALID_TOKEN',
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expired',
        error: 'TOKEN_EXPIRED',
      });
      return;
    }

    if (error instanceof UnauthorizedError) {
      res.status(401).json({
        success: false,
        message: error.message,
        error: 'UNAUTHORIZED',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: 'AUTH_ERROR',
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user info to request if token is provided, but doesn't require it
 */
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      next();
      return;
    }

    const token = authHeader.substring(7);

    if (!token) {
      next();
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET environment variable is not set');
      next();
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Add user info to request if token is valid
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      verified: decoded.verified,
      permissions: decoded.permissions || [],
    };

    logger.info('Optional authentication successful', {
      userId: decoded.id,
      email: decoded.email,
      role: decoded.role,
      route: req.path,
    });

    next();
  } catch (error) {
    // For optional auth, continue without authentication on error
    logger.warn('Optional authentication failed:', error);
    next();
  }
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (allowedRoles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      if (!roles.includes(req.user.role)) {
        throw new ForbiddenError(`Access denied. Required role: ${roles.join(' or ')}`);
      }

      logger.info('Role authorization successful', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        route: req.path,
      });

      next();
    } catch (error) {
      logger.error('Role authorization error:', error);

      if (error instanceof UnauthorizedError) {
        res.status(401).json({
          success: false,
          message: error.message,
          error: 'UNAUTHORIZED',
        });
        return;
      }

      if (error instanceof ForbiddenError) {
        res.status(403).json({
          success: false,
          message: error.message,
          error: 'FORBIDDEN',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Authorization failed',
        error: 'AUTH_ERROR',
      });
    }
  };
};

/**
 * Permission-based authorization middleware
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const userPermissions = req.user.permissions || [];

      if (!userPermissions.includes(permission)) {
        throw new ForbiddenError(`Access denied. Required permission: ${permission}`);
      }

      logger.info('Permission authorization successful', {
        userId: req.user.id,
        userPermissions,
        requiredPermission: permission,
        route: req.path,
      });

      next();
    } catch (error) {
      logger.error('Permission authorization error:', error);

      if (error instanceof UnauthorizedError) {
        res.status(401).json({
          success: false,
          message: error.message,
          error: 'UNAUTHORIZED',
        });
        return;
      }

      if (error instanceof ForbiddenError) {
        res.status(403).json({
          success: false,
          message: error.message,
          error: 'FORBIDDEN',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Authorization failed',
        error: 'AUTH_ERROR',
      });
    }
  };
};

/**
 * Admin authorization middleware
 */
export const requireAdmin = requireRole(['admin', 'super_admin']);

/**
 * Moderator authorization middleware
 */
export const requireModerator = requireRole(['admin', 'super_admin', 'moderator']);

/**
 * Verified user middleware
 */
export const requireVerified = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!req.user.verified) {
      throw new ForbiddenError('Account verification required');
    }

    logger.info('Verification check successful', {
      userId: req.user.id,
      verified: req.user.verified,
      route: req.path,
    });

    next();
  } catch (error) {
    logger.error('Verification check error:', error);

    if (error instanceof UnauthorizedError) {
      res.status(401).json({
        success: false,
        message: error.message,
        error: 'UNAUTHORIZED',
      });
      return;
    }

    if (error instanceof ForbiddenError) {
      res.status(403).json({
        success: false,
        message: error.message,
        error: 'FORBIDDEN',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Verification check failed',
      error: 'AUTH_ERROR',
    });
  }
};

/**
 * Rate limiting for authenticated users
 */
export const rateLimitByUser = (maxRequests: number, windowMs: number) => {
  const userRequestCounts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        next();
        return;
      }

      const now = Date.now();
      const userKey = `user:${userId}`;
      const userData = userRequestCounts.get(userKey);

      if (!userData || now > userData.resetTime) {
        // Reset or initialize counter
        userRequestCounts.set(userKey, {
          count: 1,
          resetTime: now + windowMs,
        });
        next();
        return;
      }

      if (userData.count >= maxRequests) {
        logger.warn('Rate limit exceeded for user', {
          userId,
          count: userData.count,
          maxRequests,
          route: req.path,
        });

        res.status(429).json({
          success: false,
          message: 'Rate limit exceeded',
          error: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((userData.resetTime - now) / 1000),
        });
        return;
      }

      // Increment counter
      userData.count++;
      userRequestCounts.set(userKey, userData);

      next();
    } catch (error) {
      logger.error('Rate limiting error:', error);
      next(); // Continue on error
    }
  };
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Remove sensitive headers
  res.removeHeader('X-Powered-By');

  next();
};

export default authMiddleware;
