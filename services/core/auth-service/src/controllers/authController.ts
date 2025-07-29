import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '@ultramarket/shared';
import { validateRequest } from '../utils/validation'; // Local validation util
import { AuthService } from '../services/authService';
import { UserService } from '../services/userService';
import { TokenService } from '../services/tokenService';
import {
  AuthServiceError,
  ValidationError,
  ConflictError,
  AuthenticationError,
  NotFoundError,
  ErrorCode,
} from '../utils/error-handler';

const prisma = new PrismaClient();
const authService = new AuthService();
const userService = new UserService();
const tokenService = new TokenService();

export class AuthController {
  /**
   * User registration endpoint
   * POST /api/v1/auth/register
   */
  /**
   * User registration endpoint with enhanced security and error handling
   * POST /api/v1/auth/register
   */
  async register(req: Request, res: Response) {
    try {
      // Request ID for tracking this operation
      const requestId = req.id || 'unknown';

      // Validate request body with improved validation
      const validation = validateRequest(req, {
        email: { type: 'string', required: true, email: true },
        password: {
          type: 'string',
          required: true,
          minLength: 8,
          pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        }, // Stronger password requirements
        firstName: { type: 'string', required: true, minLength: 2 },
        lastName: { type: 'string', required: true, minLength: 2 },
        phone: { type: 'string', required: false },
        role: { type: 'string', required: false, enum: ['user', 'vendor', 'admin'] },
      });

      if (!validation.isValid) {
        // Use our ValidationError class with standardized format
        throw new ValidationError(
          validation.errors,
          'Registration validation failed',
          ErrorCode.VALIDATION_ERROR
        );
      }

      const { email, password, firstName, lastName, phone, role = 'user' } = req.body;

      // Check if user already exists
      const existingUser = await userService.findByEmail(email);
      if (existingUser) {
        throw new ConflictError(
          'User with this email already exists',
          ErrorCode.EMAIL_ALREADY_IN_USE,
          { email }
        );
      }

      // Use more secure hashing with higher cost factor
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user with transaction support via the improved user service
      const user = await userService.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role,
      });

      // Generate tokens with improved security
      const accessToken = tokenService.generateAccessToken(user);
      const refreshToken = tokenService.generateRefreshToken(user);

      // Save refresh token with device info for better security tracking
      const userAgent = req.headers['user-agent'] || 'unknown';
      const ipAddress = req.ip || 'unknown';
      await tokenService.saveRefreshToken(user.id, refreshToken, {
        userAgent,
        ipAddress,
        issuedAt: new Date(),
      });

      // Log successful registration with structured data
      logger.info('User registered successfully', {
        userId: user.id,
        email,
        requestId,
      });

      // Return standardized success response
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            createdAt: user.createdAt,
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '900', 10), // seconds
          },
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      });
    } catch (error) {
      // Our error handler will properly format the error response
      next(error);
    }
  }

  /**
   * User login endpoint
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response) {
    try {
      // Validate request body
      const validation = validateRequest(req, {
        email: { type: 'string', required: true, email: true },
        password: { type: 'string', required: true },
      });

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors,
        });
      }

      const { email, password } = req.body;

      // Find user
      const user = await userService.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated',
        });
      }

      // Generate tokens
      const accessToken = tokenService.generateAccessToken(user);
      const refreshToken = tokenService.generateRefreshToken(user);

      // Save refresh token
      await tokenService.saveRefreshToken(user.id, refreshToken);

      // Update last login
      await userService.updateLastLogin(user.id);

      logger.info('User logged in successfully', { userId: user.id, email });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            lastLoginAt: user.lastLoginAt,
          },
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      });
    } catch (error) {
      logger.error('Login failed', { error });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Refresh token endpoint
   * POST /api/v1/auth/refresh
   */
  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
      }

      // Verify refresh token
      const decoded = tokenService.verifyRefreshToken(refreshToken);
      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token',
        });
      }

      // Check if refresh token exists in database
      const storedToken = await tokenService.findRefreshToken(refreshToken);
      if (!storedToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token not found',
        });
      }

      // Get user
      const user = await userService.findById(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive',
        });
      }

      // Generate new tokens
      const newAccessToken = tokenService.generateAccessToken(user);
      const newRefreshToken = tokenService.generateRefreshToken(user);

      // Update refresh token
      await tokenService.updateRefreshToken(refreshToken, newRefreshToken);

      logger.info('Token refreshed successfully', { userId: user.id });

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          tokens: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          },
        },
      });
    } catch (error) {
      logger.error('Token refresh failed', { error });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Logout endpoint
   * POST /api/v1/auth/logout
   */
  async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        // Invalidate refresh token
        await tokenService.invalidateRefreshToken(refreshToken);
      }

      logger.info('User logged out successfully', { userId: req.user?.id });

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      logger.error('Logout failed', { error });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get user profile
   * GET /api/v1/auth/profile
   */
  async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const user = await userService.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLoginAt: user.lastLoginAt,
          },
        },
      });
    } catch (error) {
      logger.error('Get profile failed', { error });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Update user profile
   * PUT /api/v1/auth/profile
   */
  async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      // Validate request body
      const validation = validateRequest(req, {
        firstName: { type: 'string', required: false, minLength: 2 },
        lastName: { type: 'string', required: false, minLength: 2 },
        phone: { type: 'string', required: false },
      });

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors,
        });
      }

      const { firstName, lastName, phone } = req.body;

      const updatedUser = await userService.updateUser(userId, {
        firstName,
        lastName,
        phone,
      });

      logger.info('Profile updated successfully', { userId });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            phone: updatedUser.phone,
            role: updatedUser.role,
            updatedAt: updatedUser.updatedAt,
          },
        },
      });
    } catch (error) {
      logger.error('Update profile failed', { error });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Change password
   * PUT /api/v1/auth/change-password
   */
  async changePassword(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      // Validate request body
      const validation = validateRequest(req, {
        currentPassword: { type: 'string', required: true },
        newPassword: { type: 'string', required: true, minLength: 8 },
      });

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors,
        });
      }

      const { currentPassword, newPassword } = req.body;

      // Get user
      const user = await userService.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await userService.updatePassword(userId, hashedNewPassword);

      // Invalidate all refresh tokens
      await tokenService.invalidateAllUserTokens(userId);

      logger.info('Password changed successfully', { userId });

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      logger.error('Change password failed', { error });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}
