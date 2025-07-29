/**
 * Authentication Controller
 * Professional JWT-based authentication with RBAC
 */

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index';
import { AuthService } from '../services/auth.service';
import { JWTService } from '../services/jwt.service';
import { EmailService } from '../services/email.service';
import {
  AuthError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

export class AuthController {
  private authService: AuthService;
  private jwtService: JWTService;
  private emailService: EmailService;

  constructor() {
    this.authService = new AuthService();
    this.jwtService = new JWTService();
    this.emailService = new EmailService();
  }

  /**
   * Register a new user
   */
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, firstName, lastName, phone, role = 'CUSTOMER' } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          role,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isEmailVerified: true,
          createdAt: true,
        },
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

      // Send verification email
      await this.emailService.sendVerificationEmail(user.email, user.firstName);

      // Log successful registration
      logger.info('User registered successfully', {
        userId: user.id,
        email: user.email,
        role: user.role,
        ip: req.ip,
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please check your email for verification.',
        data: {
          user,
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
      const { email, password, rememberMe = false } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new AuthError('Invalid email or password');
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new AuthError('Invalid email or password');
      }

      // Check if user is active
      if (user.status !== 'ACTIVE') {
        throw new AuthError('Account is not active');
      }

      // Generate tokens
      const tokens = await this.jwtService.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Save refresh token
      const expiresAt = rememberMe
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: tokens.refreshToken,
          expiresAt,
        },
      });

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Log successful login
      logger.info('User logged in successfully', {
        userId: user.id,
        email: user.email,
        ip: req.ip,
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          event: 'USER_LOGIN',
          userId: user.id,
          email: user.email,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          action: 'LOGIN',
          resource: 'AUTH',
        },
      });

      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userWithoutPassword,
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
      const refreshToken = req.body.refreshToken;

      if (refreshToken) {
        // Remove refresh token from database
        await prisma.refreshToken.deleteMany({
          where: { token: refreshToken },
        });
      }

      // Log logout
      logger.info('User logged out successfully', {
        userId: req.user?.id,
        email: req.user?.email,
        ip: req.ip,
      });

      res.json({
        success: true,
        message: 'Logout successful',
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

      // Find refresh token
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken) {
        throw new AuthError('Invalid refresh token');
      }

      // Check if token is expired
      if (storedToken.expiresAt < new Date()) {
        // Remove expired token
        await prisma.refreshToken.delete({
          where: { id: storedToken.id },
        });
        throw new AuthError('Refresh token expired');
      }

      // Generate new tokens
      const tokens = await this.jwtService.generateTokens({
        userId: storedToken.user.id,
        email: storedToken.user.email,
        role: storedToken.user.role,
      });

      // Update refresh token
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: {
          token: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      res.json({
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

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Don't reveal if user exists or not
        res.json({
          success: true,
          message: 'If an account with that email exists, we have sent a password reset link.',
        });
        return;
      }

      // Generate reset token
      const resetToken = await this.jwtService.generateResetToken(user.id);

      // Save reset token
      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      // Send reset email
      await this.emailService.sendPasswordResetEmail(user.email, user.firstName, resetToken);

      logger.info('Password reset requested', {
        userId: user.id,
        email: user.email,
        ip: req.ip,
      });

      res.json({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.',
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
      const { token, password } = req.body;

      // Find reset token
      const resetToken = await prisma.passwordReset.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!resetToken) {
        throw new AuthError('Invalid or expired reset token');
      }

      // Check if token is expired
      if (resetToken.expiresAt < new Date()) {
        await prisma.passwordReset.delete({
          where: { id: resetToken.id },
        });
        throw new AuthError('Reset token expired');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Update user password
      await prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      });

      // Remove reset token
      await prisma.passwordReset.delete({
        where: { id: resetToken.id },
      });

      // Remove all refresh tokens for this user
      await prisma.refreshToken.deleteMany({
        where: { userId: resetToken.userId },
      });

      logger.info('Password reset successfully', {
        userId: resetToken.userId,
        email: resetToken.user.email,
        ip: req.ip,
      });

      res.json({
        success: true,
        message: 'Password reset successfully. Please login with your new password.',
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
      const userId = req.user!.id;

      // Find user
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new AuthError('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      // Remove all refresh tokens for this user (force re-login)
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });

      logger.info('Password changed successfully', {
        userId,
        email: user.email,
        ip: req.ip,
      });

      res.json({
        success: true,
        message: 'Password changed successfully. Please login again.',
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

      // Find verification token
      const verification = await prisma.emailVerification.findUnique({
        where: { token },
      });

      if (!verification) {
        throw new AuthError('Invalid verification token');
      }

      // Check if token is expired
      if (verification.expiresAt < new Date()) {
        await prisma.emailVerification.delete({
          where: { id: verification.id },
        });
        throw new AuthError('Verification token expired');
      }

      // Update user email verification status
      await prisma.user.update({
        where: { id: verification.userId },
        data: { isEmailVerified: true },
      });

      // Remove verification token
      await prisma.emailVerification.delete({
        where: { id: verification.id },
      });

      logger.info('Email verified successfully', {
        userId: verification.userId,
        ip: req.ip,
      });

      res.json({
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
      const userId = req.user!.id;

      // Find user
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (user.isEmailVerified) {
        throw new ValidationError('Email is already verified');
      }

      // Remove existing verification tokens
      await prisma.emailVerification.deleteMany({
        where: { userId },
      });

      // Send new verification email
      await this.emailService.sendVerificationEmail(user.email, user.firstName);

      res.json({
        success: true,
        message: 'Verification email sent successfully',
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
      const userId = req.user!.id;

      // Find user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };
}
