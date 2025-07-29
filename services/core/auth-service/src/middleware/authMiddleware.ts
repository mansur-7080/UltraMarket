import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '@ultramarket/shared';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * Middleware to authenticate JWT access token
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
    }

    const accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'access-secret';

    jwt.verify(token, accessTokenSecret, (err: any, decoded: any) => {
      if (err) {
        logger.warn('Token verification failed', { error: err.message });
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired token',
        });
      }

      req.user = decoded;
      next();
    });
  } catch (error) {
    logger.error('Authentication middleware error', { error });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      if (!roles.includes(req.user.role)) {
        logger.warn('Access denied: Insufficient role', {
          userId: req.user.userId,
          userRole: req.user.role,
          requiredRoles: roles,
        });
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
        });
      }

      next();
    } catch (error) {
      logger.error('Role check middleware error', { error });
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = requireRole(['admin']);

/**
 * Middleware to check if user is vendor or admin
 */
export const requireVendorOrAdmin = requireRole(['vendor', 'admin']);

/**
 * Middleware to check if user is authenticated (optional)
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'access-secret';

      jwt.verify(token, accessTokenSecret, (err: any, decoded: any) => {
        if (!err) {
          req.user = decoded;
        }
        next();
      });
    } else {
      next();
    }
  } catch (error) {
    logger.error('Optional auth middleware error', { error });
    next();
  }
};

/**
 * Middleware to rate limit authentication attempts
 */
export const authRateLimit = (req: Request, res: Response, next: NextFunction) => {
  // This would typically use Redis or a similar store
  // For now, we'll just pass through
  next();
};

/**
 * Middleware to log authentication attempts
 */
export const logAuthAttempt = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    const method = req.method;
    const path = req.path;
    const ip = req.ip || req.connection.remoteAddress;

    logger.info('Authentication attempt', {
      method,
      path,
      status,
      duration,
      ip,
      userAgent: req.get('User-Agent'),
    });
  });

  next();
};

/**
 * Middleware to validate token format
 */
export const validateTokenFormat = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token format. Use Bearer token.',
    });
  }

  next();
};

/**
 * Middleware to check token expiration
 */
export const checkTokenExpiration = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        const expirationTime = decoded.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();

        if (currentTime >= expirationTime) {
          return res.status(401).json({
            success: false,
            message: 'Token has expired',
          });
        }
      }
    }

    next();
  } catch (error) {
    logger.error('Token expiration check error', { error });
    next();
  }
};
