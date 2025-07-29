import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '@ultramarket/shared';
import { verifyAccessToken, hasRole } from '@ultramarket/shared';
import { UnauthorizedError } from '@ultramarket/shared';

// Professional authentication middleware
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authorization token required');
    }

    // Verify JWT and session
    const token = authHeader.substring(7);
    const payload = await verifyAccessToken(token);

    // Optionally: check session in Redis (if sessionId is present)
    // const sessionId = payload.sessionId;
    // if (sessionId) {
    //   const session = await cache.getJson(`session:${sessionId}`);
    //   if (!session || !session.isActive) {
    //     throw new UnauthorizedError('Session expired or invalid');
    //   }
    //   await updateSessionActivity(sessionId);
    // }

    req.user = payload;

    // Audit log (can be extended)
    // await cache.lpush(`audit:user:${payload.userId}`, JSON.stringify({
    //   event: 'AUTHENTICATED',
    //   ip: req.ip,
    //   userAgent: req.headers['user-agent'],
    //   timestamp: new Date(),
    // }));

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      res.status(401).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

// Professional RBAC authorization middleware
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }
    if (!hasRole(req.user.role, roles)) {
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }
    next();
  };
};
