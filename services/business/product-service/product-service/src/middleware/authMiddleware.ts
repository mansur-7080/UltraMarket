import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader } from '@ultramarket/shared/auth';
import { UnauthorizedError } from '@ultramarket/shared/errors';
import { logger } from '@ultramarket/shared/logging/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    logger.info('Token authenticated successfully', {
      userId: payload.userId,
      email: payload.email,
      operation: 'token_authentication',
    });

    next();
  } catch (error) {
    logger.error('Token authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      operation: 'token_authentication',
    });

    next(new UnauthorizedError('Invalid or expired token'));
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Insufficient permissions', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        operation: 'role_check',
      });

      return next(new UnauthorizedError('Insufficient permissions'));
    }

    next();
  };
};

export const requireAdmin = requireRole(['ADMIN', 'SUPER_ADMIN']);
export const requireSeller = requireRole(['SELLER', 'ADMIN', 'SUPER_ADMIN']);
