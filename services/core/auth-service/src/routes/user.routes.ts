import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware, requireAdmin } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { updateProfileSchema } from '../schemas/auth.schemas';

const router = Router();
const authController = new AuthController();

/**
 * @route GET /api/v1/users/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', authMiddleware, authController.getProfile);

/**
 * @route PUT /api/v1/users/profile
 * @desc Update user profile
 * @access Private
 */
router.put(
  '/profile',
  authMiddleware,
  validateRequest(updateProfileSchema),
  async (req, res, next) => {
    // This would be implemented in a UserController
    // For now, redirect to auth controller
    res.status(501).json({
      success: false,
      message: 'Profile update not yet implemented',
    });
  }
);

/**
 * @route GET /api/v1/users
 * @desc Get all users (Admin only)
 * @access Private/Admin
 */
router.get('/', authMiddleware, requireAdmin, async (req, res, next) => {
  res.status(501).json({
    success: false,
    message: 'User list not yet implemented',
  });
});

export { router as userRoutes };
