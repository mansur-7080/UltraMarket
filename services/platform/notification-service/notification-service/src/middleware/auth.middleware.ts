import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.',
      });
    }

    // CRITICAL SECURITY FIX: Remove default insecure JWT secret
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is required');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error',
      });
    }
    const decoded = jwt.verify(token, jwtSecret) as any;

    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    logger.error('Authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      token: req.header('Authorization')?.substring(0, 20) + '...',
    });

    res.status(401).json({
      success: false,
      error: 'Invalid token.',
    });
  }
};

export const optionalAuthMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return next();
    }

    // CRITICAL SECURITY FIX: Remove default insecure JWT secret
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is required');
      return next();
    }
    const decoded = jwt.verify(token, jwtSecret) as any;

    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions.',
      });
    }

    next();
  };
};
