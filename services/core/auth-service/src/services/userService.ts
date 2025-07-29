import { PrismaClient, User, Prisma } from '@prisma/client';
import { logger } from '@ultramarket/shared';

/**
 * Professional database client initialization with connection pool configuration
 * and automatic retry logic for transient errors
 */
const prisma = new PrismaClient({
  log: ['error', 'warn'],
  errorFormat: 'pretty',
  // Connection pooling for production performance
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
      // Connection pooling is handled by Prisma connection string
    },
  },
  // Retry transient errors automatically
  __internal: {
    engine: {
      // Retry 3 times with exponential backoff
      retry: {
        maxRetries: 3,
        minDelay: 500,
        maxDelay: 5000,
      },
    },
  },
});

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive?: boolean;
}

export class UserService {
  /**
   * Create a new user with transaction support and proper error handling
   * @param data User data
   * @returns Created user object
   */
  async createUser(data: CreateUserData): Promise<User> {
    // Start transaction for atomicity
    return await prisma.$transaction(
      async (tx) => {
        try {
          // Validate required fields
          if (!data.email || !data.password || !data.firstName || !data.lastName) {
            throw new Error('Missing required user data');
          }

          // Create user with proper type casting for role
          const user = await tx.user.create({
            data: {
              email: data.email,
              password: data.password, // Already hashed by caller
              firstName: data.firstName,
              lastName: data.lastName,
              phone: data.phone || null,
              role: (data.role || 'user') as Prisma.UserCreateInput['role'],
              isActive: true,
              emailVerified: false,
              metadata: {}, // Initialize empty metadata object
            },
          });

          // Log success with structured data and sanitized output
          logger.info('User created successfully', {
            userId: user.id,
            email: user.email,
            role: user.role,
          });

          return user;
        } catch (error) {
          // Handle known database errors with better messages
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Unique constraint violation
            if (error.code === 'P2002') {
              const target = (error.meta?.target as string[]) || [];
              logger.warn('User creation failed - duplicate value', {
                constraint: target.join(', '),
                email: data.email,
              });
              throw new Error(`User with this ${target.join(', ')} already exists`);
            }

            // Foreign key constraint failure
            if (error.code === 'P2003') {
              logger.error('User creation failed - foreign key constraint', {
                constraint: error.meta?.field_name,
                email: data.email,
              });
              throw new Error('Invalid reference to related resource');
            }
          }

          // Log detailed error with context
          logger.error('Failed to create user', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            email: data.email,
          });

          // Rethrow with better user-facing message
          throw new Error('Failed to create user account');
        }
      },
      {
        // Transaction options
        maxWait: 5000, // Max 5s to obtain transaction
        timeout: 10000, // Max 10s for transaction to complete
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, // Standard isolation level
      }
    );
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      logger.error('Failed to find user by email', { error, email });
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error('Failed to find user by ID', { error, userId: id });
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      logger.info('User updated successfully', { userId: id });
      return user;
    } catch (error) {
      logger.error('Failed to update user', { error, userId: id });
      throw error;
    }
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      });

      logger.info('User password updated successfully', { userId: id });
    } catch (error) {
      logger.error('Failed to update user password', { error, userId: id });
      throw error;
    }
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id },
        data: {
          lastLoginAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Failed to update last login', { error, userId: id });
      throw error;
    }
  }

  /**
   * Deactivate user
   */
  async deactivateUser(id: string): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      logger.info('User deactivated successfully', { userId: id });
      return user;
    } catch (error) {
      logger.error('Failed to deactivate user', { error, userId: id });
      throw error;
    }
  }

  /**
   * Activate user
   */
  async activateUser(id: string): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          isActive: true,
          updatedAt: new Date(),
        },
      });

      logger.info('User activated successfully', { userId: id });
      return user;
    } catch (error) {
      logger.error('Failed to activate user', { error, userId: id });
      throw error;
    }
  }

  /**
   * Get all users with pagination
   */
  async getAllUsers(
    page: number = 1,
    limit: number = 10,
    role?: string
  ): Promise<{
    users: User[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const where: Prisma.UserWhereInput = {};

      if (role) {
        where.role = role;
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            lastLoginAt: true,
          },
        }),
        prisma.user.count({ where }),
      ]);

      return {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Failed to get all users', { error });
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    try {
      await prisma.user.delete({
        where: { id },
      });

      logger.info('User deleted successfully', { userId: id });
    } catch (error) {
      logger.error('Failed to delete user', { error, userId: id });
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    usersByRole: Record<string, number>;
  }> {
    try {
      const [totalUsers, activeUsers, inactiveUsers, usersByRole] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.count({ where: { isActive: false } }),
        prisma.user.groupBy({
          by: ['role'],
          _count: { role: true },
        }),
      ]);

      const roleStats: Record<string, number> = {};
      usersByRole.forEach((stat) => {
        roleStats[stat.role] = stat._count.role;
      });

      return {
        totalUsers,
        activeUsers,
        inactiveUsers,
        usersByRole: roleStats,
      };
    } catch (error) {
      logger.error('Failed to get user statistics', { error });
      throw error;
    }
  }
}
