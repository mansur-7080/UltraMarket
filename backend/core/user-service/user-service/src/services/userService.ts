import { User, UserRole, AuthProvider } from '@ultramarket/common';
import type { UserResponse } from '@ultramarket/common';
import {
  hashPassword,
  comparePassword,
  generateTokens,
  verifyRefreshToken,
  createSession,
  cache,
} from '@ultramarket/common';
import { ConflictError, NotFoundError, UnauthorizedError } from '@ultramarket/common';
import { userRepository } from '../repositories/userRepository';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { randomBytes } from 'crypto';
import { Request } from 'express';
import { comparePassword, hashPassword } from '../utils/password';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { userRepository } from '../repositories/userRepository';
import { createSession } from '../utils/session';
import { cache } from '../config/redis';
import { logger } from '@ultramarket/shared';
import { UnauthorizedError, NotFoundError, ConflictError } from '../utils/errors';
import nodemailer from 'nodemailer';

// Email service configuration
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserService {
  private emailTransporter: nodemailer.Transporter;

  constructor() {
    this.initializeEmailService();
  }

  /**
   * Initialize email service with nodemailer
   */
  private initializeEmailService(): void {
    const emailConfig: EmailConfig = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
      },
    };

    this.emailTransporter = nodemailer.createTransporter(emailConfig);
  }

  /**
   * Send email using nodemailer
   */
  private async sendEmail(to: string, subject: string, html: string, text?: string): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@ultramarket.com',
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
      };

      const info = await this.emailTransporter.sendMail(mailOptions);

      logger.info('Email sent successfully', {
        messageId: info.messageId,
        to,
        subject,
        operation: 'email_sent',
      });
    } catch (error) {
      logger.error('Failed to send email', {
        to,
        subject,
        error: error instanceof Error ? error.message : 'Unknown error',
        operation: 'email_send_failed',
      });
      throw error;
    }
  }

  /**
   * Generate email verification email
   */
  private generateEmailVerificationTemplate(
    userName: string,
    verificationUrl: string
  ): EmailTemplate {
    return {
      subject: 'UltraMarket - Email tasdiqlash',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1890ff;">UltraMarket</h2>
          <h3>Salom ${userName}!</h3>
          <p>UltraMarket platformasiga xush kelibsiz!</p>
          <p>Email manzilingizni tasdiqlash uchun quyidagi tugmani bosing:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #1890ff; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Email tasdiqlash
            </a>
          </div>
          <p>Bu havola 24 soat amal qiladi.</p>
          <p>Agar siz bu xabar yuborishni so'ramagansiz, uni e'tiborsiz qoldiring.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            Bu xabar UltraMarket platformasi tomonidan avtomatik yuborilgan.
          </p>
        </div>
      `,
      text: `
        UltraMarket - Email tasdiqlash
        
        Salom ${userName}!
        
        UltraMarket platformasiga xush kelibsiz!
        Email manzilingizni tasdiqlash uchun quyidagi havolani oching:
        
        ${verificationUrl}
        
        Bu havola 24 soat amal qiladi.
        
        Agar siz bu xabar yuborishni so'ramagansiz, uni e'tiborsiz qoldiring.
      `,
    };
  }

  /**
   * Generate password reset email
   */
  private generatePasswordResetTemplate(userName: string, resetUrl: string): EmailTemplate {
    return {
      subject: 'UltraMarket - Parolni tiklash',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1890ff;">UltraMarket</h2>
          <h3>Salom ${userName}!</h3>
          <p>Parolingizni tiklash so'rovi qabul qilindi.</p>
          <p>Yangi parol o'rnatish uchun quyidagi tugmani bosing:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #1890ff; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Parolni tiklash
            </a>
          </div>
          <p>Bu havola 1 soat amal qiladi.</p>
          <p>Agar siz parolni tiklashni so'ramagansiz, uni e'tiborsiz qoldiring.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            Bu xabar UltraMarket platformasi tomonidan avtomatik yuborilgan.
          </p>
        </div>
      `,
      text: `
        UltraMarket - Parolni tiklash
        
        Salom ${userName}!
        
        Parolingizni tiklash so'rovi qabul qilindi.
        Yangi parol o'rnatish uchun quyidagi havolani oching:
        
        ${resetUrl}
        
        Bu havola 1 soat amal qiladi.
        
        Agar siz parolni tiklashni so'ramagansiz, uni e'tiborsiz qoldiring.
      `,
    };
  }

  async registerUser(userData: CreateUserData) {
    // Check if user already exists
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create user
    const createdUser = await userRepository.create({
      ...userData,
      passwordHash: hashedPassword,
    });

    // Generate email verification token
    const verificationToken = randomBytes(32).toString('hex');
    await cache.setex(`email_verify:${verificationToken}`, 24 * 60 * 60, createdUser.id); // 24h expiry

    // Send email verification
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    const emailTemplate = this.generateEmailVerificationTemplate(
      createdUser.firstName,
      verificationUrl
    );

    await this.sendEmail(
      createdUser.email,
      emailTemplate.subject,
      emailTemplate.html,
      emailTemplate.text
    );

    logger.info('Email verification sent', {
      userId: createdUser.id,
      email: createdUser.email,
      operation: 'email_verification_sent',
    });

    const tokens = await generateTokens({
      userId: createdUser.id,
      email: createdUser.email,
      role: createdUser.role,
    });

    const { passwordHash, ...userWithoutPassword } = createdUser;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  async loginUser(email: string, password: string, req?: Request) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Update last login
    await userRepository.updateLastLogin(user.id);

    // Create session (deviceInfo and ip can be extracted from req)
    if (req) {
      await createSession(
        user.id,
        { userAgent: String(req.headers['user-agent'] || 'Unknown') },
        req.ip || ''
      );
    }

    const tokens = await generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      // sessionId: session?.sessionId,
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
      // sessionId: session?.sessionId,
    };
  }

  async getUserById(userId: string): Promise<UserResponse> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUser(userId: string, updateData: UpdateUserData): Promise<UserResponse> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updatedUser = await userRepository.update(userId, updateData);
    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async deleteUser(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    await userRepository.delete(userId);
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = verifyRefreshToken(refreshToken);

      const user = await userRepository.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Optionally: check session in Redis
      // const session = await cache.getJson(`session:${decoded.sessionId}`);
      // if (!session || !session.isActive) {
      //   throw new UnauthorizedError('Session expired or invalid');
      // }

      const tokens = await generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
        // sessionId: decoded.sessionId,
      });

      return tokens;
    } catch (error) {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  async logoutUser(userId: string, accessToken?: string, sessionId?: string) {
    // Verify user exists
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Blacklist access token (if provided)
    if (accessToken) {
      // Blacklist for the remaining TTL (example: 15 min)
      await cache.setex(`blacklist:${accessToken}`, 15 * 60, '1');
    }

    // Remove session from Redis (if provided)
    if (sessionId) {
      await cache.del(`session:${sessionId}`);
      await cache.srem(`user_sessions:${userId}`, sessionId);
    }

    // Optionally: remove all refresh tokens for user
    // await cache.del(`user_sessions:${userId}`);
  }

  async verifyEmail(token: string) {
    // 1. Find userId by token in Redis
    const userId = await cache.get(`email_verify:${token}`);
    if (!userId) {
      throw new UnauthorizedError('Invalid or expired verification token');
    }
    // 2. Update user isEmailVerified
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    if (user.isEmailVerified) {
      throw new ConflictError('Email already verified');
    }
    await userRepository.update(userId, { isEmailVerified: true });
    // 3. Remove token from Redis
    await cache.del(`email_verify:${token}`);
    return true;
  }

  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not
      return;
    }

    // Generate password reset token
    const resetToken = randomBytes(32).toString('hex');
    await cache.setex(`reset_password:${resetToken}`, 60 * 60, user.id); // 1h expiry

    // Send password reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const emailTemplate = this.generatePasswordResetTemplate(user.firstName, resetUrl);

    await this.sendEmail(user.email, emailTemplate.subject, emailTemplate.html, emailTemplate.text);

    logger.info('Password reset email sent', {
      userId: user.id,
      email: user.email,
      operation: 'password_reset_sent',
    });
  }

  async resetPassword(token: string, newPassword: string) {
    // 1. Find userId by token in Redis
    const userId = await cache.get(`reset_password:${token}`);
    if (!userId) {
      throw new UnauthorizedError('Invalid or expired reset token');
    }
    // 2. Hash new password
    const hashedPassword = await hashPassword(newPassword);
    // 3. Update user password
    await userRepository.update(userId, { passwordHash: hashedPassword });
    // 4. Invalidate token
    await cache.del(`reset_password:${token}`);
    return true;
  }
}

export const userService = new UserService();
