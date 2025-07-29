/**
 * Authentication Controller
 * Professional JWT-based authentication with RBAC
 */

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

// Use a singleton pattern for Prisma client
const prisma = new PrismaClient();

// Debug log to check if mock is working
console.log('Prisma client created:', typeof prisma);
console.log('Prisma user methods:', Object.keys(prisma.user || {}));
console.log('Prisma client constructor called');
import { AuthService } from '../services/auth.service';
import { JWTService } from '../services/jwt.service';
import { emailService } from '../services/email.service';
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

  constructor() {
    this.authService = new AuthService();
    this.jwtService = new JWTService();
    this.emailService = emailService;
  }

  /**
   * Register a new user
   */
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, firstName, lastName, phone, role = 'CUSTOMER' } = req.body;

      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        throw new ValidationError('Email, password, first name, and last name are required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new ValidationError('Invalid email format');
      }

      // Validate password strength
      if (password.length < 8) {
        throw new ValidationError('Password must be at least 8 characters long');
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      console.log('Creating user with data:', { email: email.toLowerCase(), firstName, lastName, role: 'CUSTOMER' });
      console.log('Prisma user.create method:', typeof prisma.user.create);
      console.log('Prisma user.create is function:', typeof prisma.user.create === 'function');
      console.log('Prisma user.create is mocked:', (prisma.user.create as any)._isMockFunction);
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          role: 'CUSTOMER',
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
      console.log('User created result:', user);
      console.log('User type:', typeof user);
      console.log('User keys:', user ? Object.keys(user) : 'user is null/undefined');

      // Check if user was created successfully
      if (!user || !user.id) {
        console.log('User creation failed - user object:', user);
        throw new Error('Failed to create user - user object is undefined or missing id');
      }

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

      // Send verification email (optional - can be disabled in production)
      try {
        await this.emailService.sendEmailVerification(user.email, user.firstName);
      } catch (emailError) {
        logger.warn('Failed to send verification email', { 
          error: emailError instanceof Error ? emailError.message : 'Unknown error',
          email: user.email 
        });
      }

      // Log successful registration
      logger.info('User registered successfully', {
        userId: user.id,
        email: user.email,
        role: user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
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
      logger.error('Registration failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: req.body.email,
        ip: req.ip,
      });
      next(error);
    }
  };

  /**
   * Login user
   */
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, rememberMe = false } = req.body;

      // Validate required fields
      if (!email || !password) {
        throw new ValidationError('Email and password are required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new ValidationError('Invalid email format');
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        logger.warn('Login attempt with non-existent email', {
          email: email.toLowerCase(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });
        throw new AuthError('Invalid email or password');
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        logger.warn('Login attempt with wrong password', {
          email: user.email,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });
        throw new AuthError('Invalid email or password');
      }

      // Check if user is active
      if (user.status !== 'ACTIVE') {
        logger.warn('Login attempt for inactive account', {
          email: user.email,
          status: user.status,
          ip: req.ip,
        });
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
      try {
      await prisma.auditLog.create({
        data: {
          event: 'USER_LOGIN',
          userId: user.id,
          email: user.email,
            ipAddress: req.ip || null,
            userAgent: req.get('User-Agent') || null,
          action: 'LOGIN',
          resource: 'AUTH',
            details: {
              rememberMe,
              loginTime: new Date().toISOString(),
            },
        },
      });
      } catch (auditError) {
        logger.warn('Failed to create audit log', {
          error: auditError instanceof Error ? auditError.message : 'Unknown error',
          userId: user.id,
        });
      }

      const { password: _, ...userWithoutPassword } = user;

      logger.info('User logged in successfully', {
        userId: user.id,
        email: user.email,
        role: user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userWithoutPassword,
          tokens,
        },
      });
    } catch (error) {
      logger.error('Login failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: req.body.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
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
      await this.emailService.sendPasswordReset(user.email, resetToken, user.firstName);

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
      if (!req.user?.id) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      const { currentPassword, newPassword } = req.body;

      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          password: true,
          email: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new ValidationError('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id: req.user.id },
        data: { password: hashedNewPassword },
      });

      // Invalidate all refresh tokens
      if (req.user.userId) {
        await prisma.refreshToken.deleteMany({
          where: { userId: req.user.userId },
        });
      }

      logger.info('Password changed successfully', { userId: user.id });

      return res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      return next(error);
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

      return res.json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Resend verification email
   */
  resendVerification = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          isEmailVerified: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (user.isEmailVerified) {
        throw new ValidationError('Email is already verified');
      }

      // Delete existing verification tokens
      if (req.user.userId) {
        await prisma.emailVerification.deleteMany({
          where: { userId: req.user.userId },
        });
      }

      // Send verification email
      await this.emailService.sendVerificationEmail(user.email, user.id);

      logger.info('Verification email resent', { userId: user.id });

      return res.status(200).json({
        success: true,
        message: 'Verification email sent successfully',
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Get current user profile
   */
  getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      return next(error);
    }
  };
}
