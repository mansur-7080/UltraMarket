/**
 * Authentication Routes
 * Professional API routes with comprehensive error handling
 */

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/authMiddleware';
// import { validateBody } from '../middleware/validationMiddleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../schemas/auth.schemas';

const router = Router();
const authController = new AuthController();

/**
 * @route POST /api/v1/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', /* validateBody(registerSchema), */ authController.register);

/**
 * @route POST /api/v1/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', /* validateBody(loginSchema), */ authController.login);

/**
 * @route POST /api/v1/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout', authenticateToken, authController.logout);

/**
 * @route POST /api/v1/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh', /* validateBody(refreshTokenSchema), */ authController.refreshToken);

/**
 * @route POST /api/v1/auth/forgot-password
 * @desc Send password reset email
 * @access Public
 */
router.post(
  '/forgot-password',
  /* validateBody(forgotPasswordSchema), */
  authController.forgotPassword
);

/**
 * @route POST /api/v1/auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post('/reset-password', /* validateBody(resetPasswordSchema), */ authController.resetPassword);

/**
 * @route POST /api/v1/auth/change-password
 * @desc Change user password
 * @access Private
 */
router.post(
  '/change-password',
  authenticateToken,
  /* validateBody(changePasswordSchema), */
  authController.changePassword
);

/**
 * @route POST /api/v1/auth/verify-email
 * @desc Verify user email
 * @access Public
 */
router.post('/verify-email', authController.verifyEmail);

/**
 * @route POST /api/v1/auth/resend-verification
 * @desc Resend email verification
 * @access Private
 */
router.post('/resend-verification', authenticateToken, authController.resendVerification);

/**
 * @route GET /api/v1/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', authenticateToken, authController.getProfile);

export { router as authRoutes };
