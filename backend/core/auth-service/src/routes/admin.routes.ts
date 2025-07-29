import { Router } from 'express';
import { authMiddleware, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route GET /api/v1/admin/dashboard
 * @desc Get admin dashboard
 * @access Private/Admin
 */
router.get('/dashboard', authMiddleware, requireAdmin, async (req, res, next) => {
  res.status(501).json({
    success: false,
    message: 'Admin dashboard not yet implemented',
  });
});

/**
 * @route GET /api/v1/admin/users
 * @desc Get all users (Admin only)
 * @access Private/Admin
 */
router.get('/users', authMiddleware, requireAdmin, async (req, res, next) => {
  res.status(501).json({
    success: false,
    message: 'User management not yet implemented',
  });
});

export { router as adminRoutes };
