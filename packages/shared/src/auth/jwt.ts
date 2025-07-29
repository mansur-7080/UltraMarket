import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../logging/logger';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  type?: string;
  permissions?: string[];
  sessionId?: string;
  tokenType?: 'access' | 'refresh';
}

export interface AuthenticatedRequest extends Request {
  user: JWTPayload;
}

/**
 * Validate JWT token middleware
 */
import { env } from '../config/env-validator';

// Fallback values for environment variables
const JWT_SECRET = env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_ACCESS_EXPIRES_IN = env.JWT_ACCESS_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = env.JWT_REFRESH_EXPIRES_IN || '7d';

export const validateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access token required',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // JWT_SECRET is guaranteed to exist and be valid due to env validation
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'ultramarket',
      audience: 'ultramarket-users'
    }) as JWTPayload;

    // Add user info to request
    (req as AuthenticatedRequest).user = decoded;

    next();
  } catch (error) {
    logger.error('Token validation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Token validation error',
      });
    }
  }
};

/**
 * Generate access token
 */
export const generateAccessToken = (payload: Omit<JWTPayload, 'type'>): string => {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_ACCESS_EXPIRES_IN,
    issuer: 'ultramarket',
    audience: 'ultramarket-users'
  });
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId, type: 'refresh' }, JWT_REFRESH_SECRET, { 
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'ultramarket',
    audience: 'ultramarket-users'
  });
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): { userId: string; type: string } => {
  return jwt.verify(token, JWT_REFRESH_SECRET, {
    issuer: 'ultramarket',
    audience: 'ultramarket-users'
  }) as { userId: string; type: string };
};

/**
 * Role-based access control middleware
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user || !roles.includes(user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

/**
 * Admin-only middleware
 */
export const requireAdmin = requireRole(['ADMIN', 'SUPER_ADMIN']);

/**
 * User or admin middleware
 */
export const requireUserOrAdmin = requireRole(['USER', 'ADMIN', 'SUPER_ADMIN']);
