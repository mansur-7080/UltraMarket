/**
 * User Service
 * Professional user management with database operations
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@ultramarket/shared/logging/logger';

const prisma = new PrismaClient();

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  status: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  status: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a new user
 */
export async function createUser(userData: CreateUserData): Promise<User> {
  try {
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        role: userData.role,
        isEmailVerified: userData.isEmailVerified,
        isPhoneVerified: userData.isPhoneVerified,
        status: userData.status,
      },
    });

    logger.info('User created successfully', {
      userId: user.id,
      email: user.email,
      operation: 'user_creation',
    });

    return user;
  } catch (error) {
    logger.error('Failed to create user', {
      email: userData.email,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    return user;
  } catch (error) {
    logger.error('Failed to find user by email', {
      email,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Find user by ID
 */
export async function findUserById(id: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    return user;
  } catch (error) {
    logger.error('Failed to find user by ID', {
      userId: id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Update user last login
 */
export async function updateUserLastLogin(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
      },
    });

    logger.debug('User last login updated', {
      userId,
      operation: 'last_login_update',
    });
  } catch (error) {
    logger.error('Failed to update user last login', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Create refresh token
 */
export async function createRefreshToken(userId: string, token: string): Promise<void> {
  try {
    await prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    logger.debug('Refresh token created', {
      userId,
      operation: 'refresh_token_creation',
    });
  } catch (error) {
    logger.error('Failed to create refresh token', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Delete refresh token
 */
export async function deleteRefreshToken(token: string): Promise<void> {
  try {
    await prisma.refreshToken.deleteMany({
      where: { token },
    });

    logger.debug('Refresh token deleted', {
      operation: 'refresh_token_deletion',
    });
  } catch (error) {
    logger.error('Failed to delete refresh token', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Validate refresh token
 */
export async function validateRefreshToken(token: string): Promise<boolean> {
  try {
    const refreshToken = await prisma.refreshToken.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
      },
    });

    return !!refreshToken;
  } catch (error) {
    logger.error('Failed to validate refresh token', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, data: Partial<User>): Promise<User> {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    logger.info('User profile updated', {
      userId,
      operation: 'profile_update',
    });

    return user;
  } catch (error) {
    logger.error('Failed to update user profile', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Update user password
 */
export async function updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    logger.info('User password updated', {
      userId,
      operation: 'password_update',
    });
  } catch (error) {
    logger.error('Failed to update user password', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Verify user email
 */
export async function verifyUserEmail(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isEmailVerified: true,
        updatedAt: new Date(),
      },
    });

    logger.info('User email verified', {
      userId,
      operation: 'email_verification',
    });
  } catch (error) {
    logger.error('Failed to verify user email', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Verify user phone
 */
export async function verifyUserPhone(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isPhoneVerified: true,
        updatedAt: new Date(),
      },
    });

    logger.info('User phone verified', {
      userId,
      operation: 'phone_verification',
    });
  } catch (error) {
    logger.error('Failed to verify user phone', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Deactivate user account
 */
export async function deactivateUser(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'INACTIVE',
        updatedAt: new Date(),
      },
    });

    // Delete all refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    logger.info('User account deactivated', {
      userId,
      operation: 'account_deactivation',
    });
  } catch (error) {
    logger.error('Failed to deactivate user account', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Get user statistics
 */
export async function getUserStatistics(): Promise<{
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  newUsersThisMonth: number;
}> {
  try {
    const [totalUsers, activeUsers, verifiedUsers, newUsersThisMonth] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { isEmailVerified: true } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      verifiedUsers,
      newUsersThisMonth,
    };
  } catch (error) {
    logger.error('Failed to get user statistics', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Clean up expired refresh tokens
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    logger.info('Expired tokens cleaned up', {
      deletedCount: result.count,
      operation: 'token_cleanup',
    });

    return result.count;
  } catch (error) {
    logger.error('Failed to cleanup expired tokens', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
