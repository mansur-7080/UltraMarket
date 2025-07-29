/**
 * UltraMarket Auth Service - User Service
 * Professional user management business logic
 */

import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  password: string;
  role: UserRole;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class UserService {
  constructor() {
    logger.debug('User Service initialized');
  }

  /**
   * Create a new user
   */
  async createUser(data: CreateUserData): Promise<User> {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 12);

      const user = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          role: data.role || 'CUSTOMER',
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          password: true,
          role: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info('User created successfully', {
        userId: user.id,
        email: user.email,
        operation: 'create_user',
      });

      return user;
    } catch (error: any) {
      logger.error('Failed to create user', {
        error: error.message,
        email: data.email,
        operation: 'create_user',
      });

      // Handle unique constraint violations
      if (error.code === 'P2002') {
        const target = error.meta?.target as string[];
        if (target?.includes('email')) {
          throw new Error('User with this email already exists');
        }
      }

      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          password: true,
          role: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return user;
    } catch (error) {
      logger.error('Failed to get user by ID', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        operation: 'get_user_by_id',
      });
      return null;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          password: true,
          role: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return user;
    } catch (error) {
      logger.error('Failed to get user by email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email,
        operation: 'get_user_by_email',
      });
      return null;
    }
  }

  /**
   * Update user
   */
  async updateUser(userId: string, data: UpdateUserData): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          password: true,
          role: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info('User updated successfully', {
        userId,
        operation: 'update_user',
      });

      return user;
    } catch (error) {
      logger.error('Failed to update user', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        operation: 'update_user',
      });
      throw error;
    }
  }

  /**
   * Update user status
   */
  async updateUserStatus(userId: string, status: UserStatus): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          status,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          password: true,
          role: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info('User status updated', {
        userId,
        status,
        operation: 'update_user_status',
      });

      return user;
    } catch (error) {
      logger.error('Failed to update user status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        status,
        operation: 'update_user_status',
      });
      throw error;
    }
  }

  /**
   * Update last login time
   */
  async updateLastLogin(userId: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        },
      });

      logger.debug('Last login time updated', {
        userId,
        operation: 'update_last_login',
      });
    } catch (error) {
      logger.error('Failed to update last login time', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        operation: 'update_last_login',
      });
    }
  }

  /**
   * Verify user email
   */
  async verifyEmail(userId: string): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          isEmailVerified: true,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          password: true,
          role: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info('User email verified', {
        userId,
        operation: 'verify_email',
      });

      return user;
    } catch (error) {
      logger.error('Failed to verify user email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        operation: 'verify_email',
      });
      throw error;
    }
  }

  /**
   * Verify user phone
   */
  async verifyPhone(userId: string): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          isPhoneVerified: true,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          password: true,
          role: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info('User phone verified', {
        userId,
        operation: 'verify_phone',
      });

      return user;
    } catch (error) {
      logger.error('Failed to verify user phone', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        operation: 'verify_phone',
      });
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, newPassword: string): Promise<void> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      });

      logger.info('User password changed', {
        userId,
        operation: 'change_password',
      });
    } catch (error) {
      logger.error('Failed to change user password', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        operation: 'change_password',
      });
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      await prisma.user.delete({
        where: { id: userId },
      });

      logger.info('User deleted', {
        userId,
        operation: 'delete_user',
      });
    } catch (error) {
      logger.error('Failed to delete user', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        operation: 'delete_user',
      });
      throw error;
    }
  }
}
