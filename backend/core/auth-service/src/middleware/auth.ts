import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
// import { logger } from '@ultramarket/shared/logging/logger';
// import { getJWTManager } from '@ultramarket/shared/auth/jwt-manager';

// Local logger implementation
const logger = console;

// Local JWT manager implementation
const getJWTManager = () => ({
  verifyToken: async (token: string, type: string) => {
    const secret = process.env['JWT_SECRET'] || 'fallback-secret';
    return jwt.verify(token, secret) as any;
  }
});

/**
 * Authenticate JWT token middleware
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
      });
    }

    const jwtManager = getJWTManager();
    const decoded = await jwtManager.verifyToken(token, 'access');

    // Add user info to request
    (req as any).user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions,
      sessionId: decoded.sessionId,
      deviceId: decoded.deviceId,
      ipAddress: decoded.ipAddress,
      userAgent: decoded.userAgent,
    };

    return next();
  } catch (error) {
    logger.error('Token authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

/**
 * Require specific role middleware
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    return next();
  };
};

/**
 * Require specific permission middleware
 */
export const requirePermission = (permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Super admin has all permissions
    if (user.role === 'SUPER_ADMIN') {
      return next();
    }

    // Check if user has required permissions
    const hasPermission = permissions.some(
      (permission) => user.permissions.includes(permission) || user.permissions.includes('*')
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Doesn't fail if no token is provided
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    const jwtManager = getJWTManager();
    const decoded = await jwtManager.verifyToken(token, 'access');

    // Add user info to request
    (req as any).user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions,
      sessionId: decoded.sessionId,
      deviceId: decoded.deviceId,
      ipAddress: decoded.ipAddress,
      userAgent: decoded.userAgent,
    };

    next();
  } catch (error) {
    // Don't fail for optional auth, just continue without user
    logger.debug('Optional authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next();
  }
};

/**
 * Validate token without adding to request
 */
export const validateToken = async (token: string): Promise<any> => {
  try {
    const jwtManager = getJWTManager();
    return await jwtManager.verifyToken(token, 'access');
  } catch (error) {
    throw new Error('Invalid token');
  }
};
