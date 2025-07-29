/**
 * Authentication Controller
 * Professional JWT-based authentication with RBAC
 */

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index';
import { AuthService } from '../services/auth.service';
import { JWTService } from '../services/jwt.service';
import { emailService } from '../services/email.service';
import { UserService } from '../services/user.service';
import {
  AuthError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../middleware/errorHandler';
import { logger } from '../utils/logger';

// Define AuthRequest type locally
interface AuthRequest extends Request {
  user?: {
    userId: string;
    id?: string; // Make id optional to match ProfessionalJWTPayload
    email: string;
    role: 'CUSTOMER' | 'ADMIN' | 'VENDOR' | 'MODERATOR' | 'SUPER_ADMIN';
    permissions: string[];
    sessionId: string;
    tokenType: 'access' | 'refresh';
  };
}

export class AuthController {
  private authService: AuthService;
  private jwtService: JWTService;
  private emailService: any;
  private userService: UserService;

  constructor() {
    this.authService = new AuthService();
    this.jwtService = new JWTService();
    this.emailService = emailService;
    this.userService = new UserService();
  }

  /**
   * Register a new user
   */
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, firstName, lastName, phone, role = 'CUSTOMER' } = req.body;

      // Check if user already exists
      const existingUser = await this.userService.getUserByEmail(email);

      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      // Create user
      const user = await this.userService.createUser({
        email,
        password,
        firstName,
        lastName,
        phone,
        role,
      });

      // Generate tokens
      const tokens = await this.jwtService.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Save refresh token
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Send welcome email
      await this.emailService.sendWelcomeEmail(email, firstName);

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
            isEmailVerified: user.isEmailVerified,
          },
          tokens,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Login user
   */
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await this.userService.getUserByEmail(email);

      if (!user) {
        throw new AuthError('Invalid credentials');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password || '');

      if (!isValidPassword) {
        throw new AuthError('Invalid credentials');
      }

      // Update last login
      await this.userService.updateLastLogin(user.id);

      // Generate tokens
      const tokens = await this.jwtService.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Save refresh token
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

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
            isEmailVerified: user.isEmailVerified,
          },
          tokens,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Logout user
   */
  logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      const userId = req.user?.userId;

      if (refreshToken) {
        // Revoke specific refresh token
        await prisma.refreshToken.deleteMany({
          where: { token: refreshToken },
        });
      } else if (userId) {
        // Revoke all user tokens
        await prisma.refreshToken.deleteMany({
          where: { userId },
        });
      }

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Refresh access token
   */
  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new ValidationError('Refresh token is required');
      }

      // Verify refresh token
      const payload = this.jwtService.verifyRefreshToken(refreshToken);

      if (!payload) {
        throw new AuthError('Invalid refresh token');
      }

      // Get user
      const user = await this.userService.getUserById(payload.userId);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Generate new tokens
      const tokens = await this.jwtService.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Save new refresh token
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: { tokens },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Forgot password
   */
  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;

      const user = await this.userService.getUserByEmail(email);

      if (!user) {
        // Don't reveal if user exists
        res.status(200).json({
          success: true,
          message: 'If the email exists, a password reset link has been sent',
        });
        return;
      }

      // Generate reset token
      const resetToken = await this.jwtService.generateResetToken(user.id);

      // Send reset email
      await this.emailService.sendPasswordResetEmail(email, user.firstName, resetToken);

      res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reset password
   */
  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        throw new ValidationError('Token and new password are required');
      }

      // Verify reset token
      const payload = this.jwtService.verifyAccessToken(token);

      if (!payload) {
        throw new AuthError('Invalid or expired reset token');
      }

      // Get user
      const user = await this.userService.getUserById(payload.userId);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Change password
      await this.userService.changePassword(user.id, newPassword);

      // Revoke all user tokens
      await prisma.refreshToken.deleteMany({
        where: { userId: user.id },
      });

      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Change password
   */
  changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AuthError('User not authenticated');
      }

      // Get user
      const user = await this.userService.getUserById(userId);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password || '');

      if (!isValidPassword) {
        throw new AuthError('Current password is incorrect');
      }

      // Change password
      await this.userService.changePassword(userId, newPassword);

      // Revoke all user tokens
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verify email
   */
  verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;

      if (!token) {
        throw new ValidationError('Verification token is required');
      }

      // Verify token
      const payload = this.jwtService.verifyAccessToken(token);

      if (!payload) {
        throw new AuthError('Invalid or expired verification token');
      }

      // Get user
      const user = await this.userService.getUserById(payload.userId);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify email
      await this.userService.verifyEmail(user.id);

      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Resend verification email
   */
  resendVerification = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new AuthError('User not authenticated');
      }

      // Get user
      const user = await this.userService.getUserById(userId);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (user.isEmailVerified) {
        throw new ValidationError('Email is already verified');
      }

      // Send verification email
      await this.emailService.sendVerificationEmail(user.email, user.firstName);

      res.status(200).json({
        success: true,
        message: 'Verification email sent',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get current user profile
   */
  getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new AuthError('User not authenticated');
      }

      // Get user
      const user = await this.userService.getUserById(userId);

      if (!user) {
        throw new NotFoundError('User not found');
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
            isEmailVerified: user.isEmailVerified,
            isPhoneVerified: user.isPhoneVerified,
            status: user.status,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
