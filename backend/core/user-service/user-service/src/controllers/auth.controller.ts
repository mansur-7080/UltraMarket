import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request } from 'express';
import { prisma, config } from '../config/database';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { EmailService } from '../services/email.service';
import { RedisService } from '../services/redis.service';

export class AuthController {
  private emailService: EmailService;
  private redisService: RedisService;

  constructor() {
    this.emailService = new EmailService();
    this.redisService = new RedisService();
  }

  /**
   * Register a new user
   */
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        throw new AppError('User with this email already exists', 400);
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          emailVerified: false,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          emailVerified: true,
          status: true,
          createdAt: true,
        },
      });

      // Generate verification token
      const verificationToken = jwt.sign(
        { userId: user.id, type: 'email_verification' },
        config.jwt.secret,
        { expiresIn: '24h' }
      );

      // Send verification email
      await this.emailService.sendVerificationEmail(user.email, verificationToken);

      // Generate access and refresh tokens
      const { accessToken, refreshToken } = this.generateTokens(user.id);

      logger.info('User registered successfully', { userId: user.id, email: user.email });

      return {
        success: true,
        message: 'User registered successfully. Please check your email for verification.',
        data: {
          user,
          accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      logger.error('Registration failed', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(credentials: { email: string; password: string }) {
    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
        include: {
          addresses: true,
          preferences: true,
        },
      });

      if (!user) {
        throw new AppError('Invalid email or password', 401);
      }

      // Check if account is active
      if (user.status !== 'ACTIVE') {
        throw new AppError('Account is deactivated', 401);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
      if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
      }

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens(user.id);

      // Store refresh token in Redis
      await this.redisService.setRefreshToken(user.id, refreshToken);

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      logger.info('User logged in successfully', { userId: user.id, email: user.email });

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            emailVerified: user.emailVerified,
            status: user.status,
            addresses: user.addresses,
            preferences: user.preferences,
          },
          accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      logger.error('Login failed', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.secret) as any;

      // Check if token is stored in Redis
      const storedToken = await this.redisService.getRefreshToken(decoded.userId);
      if (!storedToken || storedToken !== refreshToken) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(decoded.userId);

      // Update refresh token in Redis
      await this.redisService.setRefreshToken(decoded.userId, newRefreshToken);

      return {
        success: true,
        data: {
          accessToken,
          refreshToken: newRefreshToken,
        },
      };
    } catch (error) {
      logger.error('Token refresh failed', {
        error: error instanceof Error ? error.message : error,
      });
      throw new AppError('Invalid refresh token', 401);
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string) {
    try {
      // Remove refresh token from Redis
      await this.redisService.removeRefreshToken(userId);

      logger.info('User logged out successfully', { userId });

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      logger.error('Logout failed', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  /**
   * Send forgot password email
   */
  async forgotPassword(email: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Don't reveal if user exists or not
        return;
      }

      // Generate reset token
      const resetToken = jwt.sign({ userId: user.id, type: 'password_reset' }, config.jwt.secret, {
        expiresIn: '1h',
      });

      // Store reset token in Redis
      await this.redisService.setPasswordResetToken(user.id, resetToken);

      // Send reset email
      await this.emailService.sendPasswordResetEmail(email, resetToken);

      logger.info('Password reset email sent', { userId: user.id, email });

      return {
        success: true,
        message: 'Password reset email sent',
      };
    } catch (error) {
      logger.error('Forgot password failed', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string) {
    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret) as any;

      // Check if token is stored in Redis
      const storedToken = await this.redisService.getPasswordResetToken(decoded.userId);
      if (!storedToken || storedToken !== token) {
        throw new AppError('Invalid or expired reset token', 400);
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { password: hashedPassword },
      });

      // Remove reset token from Redis
      await this.redisService.removePasswordResetToken(decoded.userId);

      logger.info('Password reset successfully', { userId: decoded.userId });

      return {
        success: true,
        message: 'Password reset successfully',
      };
    } catch (error) {
      logger.error('Password reset failed', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string) {
    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret) as any;

      // Update user
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { emailVerified: true },
      });

      logger.info('Email verified successfully', { userId: decoded.userId });

      return {
        success: true,
        message: 'Email verified successfully',
      };
    } catch (error) {
      logger.error('Email verification failed', {
        error: error instanceof Error ? error.message : error,
      });
      throw new AppError('Invalid or expired verification token', 400);
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.emailVerified) {
        throw new AppError('Email already verified', 400);
      }

      // Generate new verification token
      const verificationToken = jwt.sign(
        { userId: user.id, type: 'email_verification' },
        config.jwt.secret,
        { expiresIn: '24h' }
      );

      // Send verification email
      await this.emailService.sendVerificationEmail(user.email, verificationToken);

      logger.info('Verification email resent', { userId: user.id, email: user.email });

      return {
        success: true,
        message: 'Verification email sent',
      };
    } catch (error) {
      logger.error('Resend verification failed', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          addresses: true,
          preferences: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        emailVerified: user.emailVerified,
        status: user.status,
        addresses: user.addresses,
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      logger.error('Get current user failed', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new AppError('Current password is incorrect', 400);
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      // Invalidate all refresh tokens
      await this.redisService.removeRefreshToken(userId);

      logger.info('Password changed successfully', { userId });

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      logger.error('Change password failed', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Generate access and refresh tokens
   */
  private generateTokens(userId: string) {
    const accessToken = jwt.sign({ userId, type: 'access' }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    const refreshToken = jwt.sign({ userId, type: 'refresh' }, config.jwt.secret, {
      expiresIn: config.jwt.refreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }
}
