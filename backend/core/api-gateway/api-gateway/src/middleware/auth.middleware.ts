import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';
import { logger } from '../utils/logger';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  sessionId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

// JWT Authentication Middleware
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required',
        code: 'TOKEN_MISSING',
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured');
      res.status(500).json({
        success: false,
        error: 'Authentication configuration error',
      });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, jwtSecret) as any;

    // Check if token is blacklisted (call auth service)
    const isBlacklisted = await checkTokenBlacklist(token);
    if (isBlacklisted) {
      res.status(401).json({
        success: false,
        error: 'Token has been revoked',
        code: 'TOKEN_REVOKED',
      });
      return;
    }

    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
      sessionId: decoded.sessionId,
    };

    logger.info('User authenticated successfully', {
      userId: req.user.id,
      role: req.user.role,
      endpoint: req.originalUrl,
    });

    next();
  } catch (error) {
    logger.error('Authentication error:', error);

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'TOKEN_INVALID',
      });
      return;
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
      return;
    } else {
      res.status(500).json({
        success: false,
        error: 'Authentication failed',
      });
      return;
    }
  }
};

// Optional Authentication Middleware
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      next();
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as any;

    // Check if token is blacklisted
    const isBlacklisted = await checkTokenBlacklist(token);
    if (isBlacklisted) {
      next();
      return;
    }

    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
      sessionId: decoded.sessionId,
    };

    next();
  } catch (error) {
    // For optional auth, we just log the error and continue
    logger.warn('Optional authentication failed:', error);
    next();
  }
};

// Role-based Authorization Middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        code: 'INSUFFICIENT_ROLE',
      });
      return;
    }

    next();
  };
};

// Permission-based Authorization Middleware
export const requirePermission = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    const hasPermission = requiredPermissions.some((permission) =>
      req.user!.permissions.includes(permission)
    );

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: `Access denied. Required permissions: ${requiredPermissions.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSION',
      });
      return;
    }

    next();
  };
};

// Admin Authorization Middleware
export const requireAdmin = requireRole(['ADMIN', 'SUPER_ADMIN']);

// Super Admin Authorization Middleware
export const requireSuperAdmin = requireRole(['SUPER_ADMIN']);

// Self-access Authorization Middleware (user can access their own resources)
export const requireSelfAccess = (userIdParam: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    const resourceUserId = req.params[userIdParam];

    // Admin can access any resource
    if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') {
      next();
      return;
    }

    // User can only access their own resources
    if (req.user.id !== resourceUserId) {
      res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own resources',
        code: 'SELF_ACCESS_ONLY',
      });
      return;
    }

    next();
  };
};

// Check if token is blacklisted
async function checkTokenBlacklist(token: string): Promise<boolean> {
  try {
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3002';
    const response = await axios.post(
      `${authServiceUrl}/api/v1/auth/verify-token`,
      {
        token,
      },
      {
        timeout: 5000,
      }
    );

    return response.data.blacklisted === true;
  } catch (error) {
    logger.warn('Failed to check token blacklist:', error);
    // If we can't check, assume token is valid (fail open)
    return false;
  }
}

// Refresh token if needed
export const refreshTokenIfNeeded = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      next();
      return;
    }

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    // Check if token expires within 5 minutes
    const decoded = jwt.decode(token) as any;
    const now = Math.floor(Date.now() / 1000);
    const timeToExpire = decoded.exp - now;

    if (timeToExpire < 300) {
      // 5 minutes
      try {
        const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3002';
        const response = await axios.post(
          `${authServiceUrl}/api/v1/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            timeout: 5000,
          }
        );

        if (response.data.success && response.data.data.accessToken) {
          // Add new token to response headers
          res.setHeader('X-New-Token', response.data.data.accessToken);
        }
      } catch (error) {
        logger.warn('Failed to refresh token:', error);
        // Continue with existing token
      }
    }

    next();
  } catch (error) {
    logger.error('Token refresh middleware error:', error);
    next();
  }
};
