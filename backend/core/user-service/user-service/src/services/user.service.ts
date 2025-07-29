import bcrypt from 'bcryptjs';
import { PrismaClient, User, UserRole, Prisma } from '@prisma/client';
import { createClient } from 'redis';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
} from '../middleware/error.middleware';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Connect to Redis
redis.connect().catch((err) => {
  logger.error('Redis connection failed:', err);
});

// Types
export interface CreateUserData {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role?: UserRole;
  isActive?: boolean;
  isEmailVerified?: boolean;
  bio?: string;
  profileImage?: string;
}

export interface UpdateUserData {
  username?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  bio?: string;
  profileImage?: string;
}

export interface AdminUpdateUserData extends UpdateUserData {
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  isEmailVerified?: boolean;
}

// Use Prisma generated types
export type UserWithAddresses = Prisma.UserGetPayload<{
  include: { addresses: true };
}>;

export interface PaginatedUsers {
  users: UserWithAddresses[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FindUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'email' | 'firstName' | 'lastName';
  sortOrder?: 'asc' | 'desc';
}

export class UserService {
  /**
   * Create a new user
   */
  async createUser(userData: CreateUserData): Promise<UserWithAddresses> {
    try {
      // Check if email already exists
      const existingEmail = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingEmail) {
        throw new ConflictError('Email already exists');
      }

      // Check if username already exists
      const existingUsername = await prisma.user.findUnique({
        where: { username: userData.username },
      });

      if (existingUsername) {
        throw new ConflictError('Username already exists');
      }

      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          username: userData.username,
          passwordHash,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phoneNumber: userData.phoneNumber,
          role: userData.role || UserRole.CUSTOMER,
          isActive: userData.isActive ?? true,
          isEmailVerified: userData.isEmailVerified ?? false,
          bio: userData.bio,
          profileImage: userData.profileImage,
        },
        include: {
          addresses: true,
        },
      });

      logger.info('User created successfully', {
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      });

      return user;
    } catch (error) {
      logger.error('Failed to create user:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserWithAddresses> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          addresses: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return user;
    } catch (error) {
      logger.error('Failed to get user by ID:', error);
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<UserWithAddresses> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          addresses: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return user;
    } catch (error) {
      logger.error('Failed to get user by email:', error);
      throw error;
    }
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<UserWithAddresses> {
    try {
      const user = await prisma.user.findUnique({
        where: { username },
        include: {
          addresses: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return user;
    } catch (error) {
      logger.error('Failed to get user by username:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(userId: string, updateData: UpdateUserData): Promise<UserWithAddresses> {
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      // Check if username is being updated and already exists
      if (updateData.username && updateData.username !== existingUser.username) {
        const existingUsername = await prisma.user.findUnique({
          where: { username: updateData.username },
        });

        if (existingUsername) {
          throw new ConflictError('Username already exists');
        }
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: {
          addresses: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      logger.info('User updated successfully', {
        userId: updatedUser.id,
        email: updatedUser.email,
        changes: Object.keys(updateData),
      });

      return updatedUser;
    } catch (error) {
      logger.error('Failed to update user:', error);
      throw error;
    }
  }

  /**
   * Admin update user (can update more fields)
   */
  async adminUpdateUser(
    userId: string,
    updateData: AdminUpdateUserData
  ): Promise<UserWithAddresses> {
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      // Check if email is being updated and already exists
      if (updateData.email && updateData.email !== existingUser.email) {
        const existingEmail = await prisma.user.findUnique({
          where: { email: updateData.email },
        });

        if (existingEmail) {
          throw new ConflictError('Email already exists');
        }
      }

      // Check if username is being updated and already exists
      if (updateData.username && updateData.username !== existingUser.username) {
        const existingUsername = await prisma.user.findUnique({
          where: { username: updateData.username },
        });

        if (existingUsername) {
          throw new ConflictError('Username already exists');
        }
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: {
          addresses: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      logger.info('User updated by admin successfully', {
        userId: updatedUser.id,
        email: updatedUser.email,
        changes: Object.keys(updateData),
      });

      return updatedUser;
    } catch (error) {
      logger.error('Failed to admin update user:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      // Get user with password hash
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, passwordHash: true },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      });

      logger.info('Password changed successfully', { userId });
    } catch (error) {
      logger.error('Failed to change password:', error);
      throw error;
    }
  }

  /**
   * Update user email
   */
  async updateEmail(
    userId: string,
    newEmail: string,
    password: string
  ): Promise<UserWithAddresses> {
    try {
      // Get user with password hash
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, passwordHash: true },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Password is incorrect');
      }

      // Check if new email already exists
      const existingEmail = await prisma.user.findUnique({
        where: { email: newEmail },
      });

      if (existingEmail) {
        throw new ConflictError('Email already exists');
      }

      // Update email and mark as unverified
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          email: newEmail,
          isEmailVerified: false,
        },
        include: {
          addresses: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      logger.info('Email updated successfully', {
        userId,
        oldEmail: user.email,
        newEmail,
      });

      return updatedUser;
    } catch (error) {
      logger.error('Failed to update email:', error);
      throw error;
    }
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Soft delete user
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      });

      logger.info('User deleted successfully', { userId, email: user.email });
    } catch (error) {
      logger.error('Failed to delete user:', error);
      throw error;
    }
  }

  /**
   * Get users with pagination and filtering
   */
  async getUsers(options: FindUsersOptions): Promise<PaginatedUsers> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        role,
        isActive,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;

      const skip = (page - 1) * limit;
      const where: any = {};

      // Apply filters
      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (role) where.role = role;
      if (isActive !== undefined) where.isActive = isActive;

      // Get users and total count
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            addresses: {
              where: { isActive: true },
              orderBy: { createdAt: 'desc' },
            },
          },
        }),
        prisma.user.count({ where }),
      ]);

      return {
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Failed to get users:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    verified: number;
    unverified: number;
    byRole: Record<UserRole, number>;
  }> {
    try {
      const [
        total,
        active,
        inactive,
        verified,
        unverified,
        customers,
        sellers,
        admins,
        superAdmins,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.count({ where: { isActive: false } }),
        prisma.user.count({ where: { isEmailVerified: true } }),
        prisma.user.count({ where: { isEmailVerified: false } }),
        prisma.user.count({ where: { role: UserRole.CUSTOMER } }),
        prisma.user.count({ where: { role: UserRole.SELLER } }),
        prisma.user.count({ where: { role: UserRole.ADMIN } }),
        prisma.user.count({ where: { role: UserRole.SUPER_ADMIN } }),
      ]);

      return {
        total,
        active,
        inactive,
        verified,
        unverified,
        byRole: {
          CUSTOMER: customers,
          SELLER: sellers,
          ADMIN: admins,
          SUPER_ADMIN: superAdmins,
        },
      };
    } catch (error) {
      logger.error('Failed to get user stats:', error);
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
        data: { lastLoginAt: new Date() },
      });
    } catch (error) {
      logger.error('Failed to update last login:', error);
      throw error;
    }
  }

  /**
   * Check if user exists
   */
  async userExists(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      return !!user;
    } catch (error) {
      logger.error('Failed to check if user exists:', error);
      throw error;
    }
  }

  /**
   * Transform user data to exclude sensitive information
   */
  transformUser(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Transform user with addresses to exclude sensitive information
   */
  transformUserWithAddresses(user: UserWithAddresses): Omit<UserWithAddresses, 'passwordHash'> {
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export const userService = new UserService();
