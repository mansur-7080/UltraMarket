import { PrismaClient, User, Address } from '@prisma/client';
import { UserRole } from '../types/auth';

const prisma = new PrismaClient();

// Type definitions
interface CreateUserData {
  email: string;
  username: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role?: UserRole;
  isActive?: boolean;
  isEmailVerified?: boolean;
  profileImage?: string;
  bio?: string;
}

interface UpdateUserData {
  email?: string;
  username?: string;
  passwordHash?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: UserRole;
  isActive?: boolean;
  isEmailVerified?: boolean;
  profileImage?: string;
  bio?: string;
  lastLoginAt?: Date;
}

interface UserWithAddresses extends User {
  addresses: Address[];
}

interface PaginatedUsers {
  users: UserWithAddresses[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FindUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'email' | 'firstName' | 'lastName';
  sortOrder?: 'asc' | 'desc';
}

// Transform user data to exclude sensitive information
const transformUser = (user: User): Omit<User, 'passwordHash'> => ({
  id: user.id,
  email: user.email,
  username: user.username,
  firstName: user.firstName,
  lastName: user.lastName,
  phoneNumber: user.phoneNumber,
  role: user.role as UserRole,
  isActive: user.isActive,
  isEmailVerified: user.isEmailVerified,
  profileImage: user.profileImage,
  bio: user.bio,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  lastLoginAt: user.lastLoginAt,
});

// User repository interface
export interface IUserRepository {
  create(user: CreateUserData): Promise<UserWithAddresses>;
  findById(id: string): Promise<UserWithAddresses | null>;
  findByEmail(email: string): Promise<UserWithAddresses | null>;
  findByUsername(username: string): Promise<UserWithAddresses | null>;
  update(id: string, data: UpdateUserData): Promise<UserWithAddresses>;
  delete(id: string): Promise<void>;
  findMany(options: FindUsersOptions): Promise<PaginatedUsers>;
  count(filters?: { isActive?: boolean; role?: UserRole }): Promise<number>;
  findByEmailOrUsername(emailOrUsername: string): Promise<UserWithAddresses | null>;
}

// User repository implementation
export class UserRepository implements IUserRepository {
  async create(userData: CreateUserData): Promise<UserWithAddresses> {
    try {
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          username: userData.username,
          passwordHash: userData.passwordHash,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phoneNumber: userData.phoneNumber || null,
          role: userData.role || UserRole.CUSTOMER,
          isActive: userData.isActive ?? true,
          isEmailVerified: userData.isEmailVerified ?? false,
          profileImage: userData.profileImage || null,
          bio: userData.bio || null,
        },
        include: {
          addresses: true,
        },
      });

      return user;
    } catch (error) {
      throw new Error(
        `Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async findById(id: string): Promise<UserWithAddresses | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          addresses: true,
        },
      });

      return user;
    } catch (error) {
      throw new Error(
        `Failed to find user by ID: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async findByEmail(email: string): Promise<UserWithAddresses | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          addresses: true,
        },
      });

      return user;
    } catch (error) {
      throw new Error(
        `Failed to find user by email: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async findByUsername(username: string): Promise<UserWithAddresses | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { username },
        include: {
          addresses: true,
        },
      });

      return user;
    } catch (error) {
      throw new Error(
        `Failed to find user by username: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async update(id: string, data: UpdateUserData): Promise<UserWithAddresses> {
    try {
      const updateData: Partial<User> = {};

      // Only include defined fields in the update
      if (data.email !== undefined) updateData.email = data.email;
      if (data.username !== undefined) updateData.username = data.username;
      if (data.passwordHash !== undefined) updateData.passwordHash = data.passwordHash;
      if (data.firstName !== undefined) updateData.firstName = data.firstName;
      if (data.lastName !== undefined) updateData.lastName = data.lastName;
      if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
      if (data.role !== undefined) updateData.role = data.role;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.isEmailVerified !== undefined) updateData.isEmailVerified = data.isEmailVerified;
      if (data.profileImage !== undefined) updateData.profileImage = data.profileImage;
      if (data.bio !== undefined) updateData.bio = data.bio;
      if (data.lastLoginAt !== undefined) updateData.lastLoginAt = data.lastLoginAt;

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        include: {
          addresses: true,
        },
      });

      return user;
    } catch (error) {
      throw new Error(
        `Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      throw new Error(
        `Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async findMany(options: FindUsersOptions): Promise<PaginatedUsers> {
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
      const where: Record<string, unknown> = {};

      // Apply filters
      if (search) {
        where['OR'] = [
          { email: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (role) where['role'] = role;
      if (isActive !== undefined) where['isActive'] = isActive;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            addresses: true,
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
      throw new Error(
        `Failed to find users: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async count(filters?: { isActive?: boolean; role?: UserRole }): Promise<number> {
    try {
      const where: Record<string, unknown> = {};

      if (filters?.isActive !== undefined) where['isActive'] = filters.isActive;
      if (filters?.role) where['role'] = filters.role;

      return await prisma.user.count({ where });
    } catch (error) {
      throw new Error(
        `Failed to count users: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async findByEmailOrUsername(emailOrUsername: string): Promise<UserWithAddresses | null> {
    try {
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
        },
        include: {
          addresses: true,
        },
      });

      return user;
    } catch (error) {
      throw new Error(
        `Failed to find user by email or username: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
