import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Auth status check
router.get('/status', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({
    authenticated: true,
    user: req.user,
    timestamp: new Date().toISOString(),
  });
});

// Token validation
router.post('/validate', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({
    valid: true,
    user: req.user,
    timestamp: new Date().toISOString(),
  });
});

// Logout (client-side token invalidation)
router.post('/logout', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({
    message: 'Logged out successfully',
    timestamp: new Date().toISOString(),
  });
});

export { router as authRoutes };
