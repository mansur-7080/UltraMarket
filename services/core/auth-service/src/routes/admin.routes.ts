import { Router } from 'express';
import { authMiddleware, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route GET /api/v1/admin/users
 * @desc Get all users
 * @access Private/Admin
 */
router.get('/users', authMiddleware, requireAdmin, async (req, res, next) => {
  res.status(501).json({
    success: false,
    message: 'Admin user management not yet implemented',
  });
});

/**
 * @route GET /api/v1/admin/stats
 * @desc Get system statistics
 * @access Private/Admin
 */
router.get('/stats', authMiddleware, requireAdmin, async (req, res, next) => {
  res.status(501).json({
    success: false,
    message: 'Admin statistics not yet implemented',
  });
});

export { router as adminRoutes };
