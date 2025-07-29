import { UserService } from '../services/user.service';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock Prisma client
jest.mock('@prisma/client');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user with hashed password', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      const hashedPassword = 'hashedPassword123';
      const mockUser = {
        id: 'user-id-123',
        email: userData.email,
        username: userData.username,
        passwordHash: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'CUSTOMER',
        isActive: true,
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockBcrypt.hash.mockResolvedValue(hashedPassword);
      (mockPrisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.createUser(userData);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(userData.password, 12);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          username: userData.username,
          passwordHash: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        username: 'existinguser',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      const prismaError = new Error('Unique constraint failed');
      (prismaError as any).code = 'P2002';

      mockBcrypt.hash.mockResolvedValue('hashedPassword');
      (mockPrisma.user.create as jest.Mock).mockRejectedValue(prismaError);

      await expect(userService.createUser(userData)).rejects.toThrow('User already exists');
    });
  });

  describe('authenticateUser', () => {
    it('should authenticate user with correct credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = 'hashedPassword123';

      const mockUser = {
        id: 'user-id-123',
        email,
        passwordHash: hashedPassword,
        isActive: true,
        isEmailVerified: true,
      };

      const mockTokens = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValueOnce(mockTokens.accessToken);
      mockJwt.sign.mockReturnValueOnce(mockTokens.refreshToken);

      const result = await userService.authenticateUser(email, password);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toEqual({
        user: mockUser,
        tokens: mockTokens,
      });
    });

    it('should throw error for invalid credentials', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(userService.authenticateUser(email, password)).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should throw error for inactive user', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      const mockUser = {
        id: 'user-id-123',
        email,
        passwordHash: 'hashedPassword123',
        isActive: false,
        isEmailVerified: true,
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(userService.authenticateUser(email, password)).rejects.toThrow(
        'Account is inactive'
      );
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const userId = 'user-id-123';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER',
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.getUserById(userId);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null for non-existent user', async () => {
      const userId = 'non-existent-id';

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await userService.getUserById(userId);

      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user data', async () => {
      const userId = 'user-id-123';
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      const mockUpdatedUser = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        role: 'CUSTOMER',
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const result = await userService.updateUser(userId, updateData);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
      });
      expect(result).toEqual(mockUpdatedUser);
    });
  });

  describe('changePassword', () => {
    it('should change user password', async () => {
      const userId = 'user-id-123';
      const oldPassword = 'oldpassword123';
      const newPassword = 'newpassword123';
      const hashedOldPassword = 'hashedOldPassword';
      const hashedNewPassword = 'hashedNewPassword';

      const mockUser = {
        id: userId,
        passwordHash: hashedOldPassword,
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockBcrypt.hash.mockResolvedValue(hashedNewPassword);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: hashedNewPassword,
      });

      const result = await userService.changePassword(userId, oldPassword, newPassword);

      expect(mockBcrypt.compare).toHaveBeenCalledWith(oldPassword, hashedOldPassword);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { passwordHash: hashedNewPassword },
      });
      expect(result).toBe(true);
    });

    it('should throw error for incorrect old password', async () => {
      const userId = 'user-id-123';
      const oldPassword = 'wrongpassword';
      const newPassword = 'newpassword123';

      const mockUser = {
        id: userId,
        passwordHash: 'hashedOldPassword',
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false);

      await expect(userService.changePassword(userId, oldPassword, newPassword)).rejects.toThrow(
        'Invalid old password'
      );
    });
  });

  describe('deleteUser', () => {
    it('should soft delete user', async () => {
      const userId = 'user-id-123';

      (mockPrisma.user.update as jest.Mock).mockResolvedValue({ id: userId, isActive: false });

      const result = await userService.deleteUser(userId);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { isActive: false },
      });
      expect(result).toBe(true);
    });
  });

  describe('verifyEmail', () => {
    it('should verify user email', async () => {
      const userId = 'user-id-123';

      (mockPrisma.user.update as jest.Mock).mockResolvedValue({
        id: userId,
        isEmailVerified: true,
      });

      const result = await userService.verifyEmail(userId);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { isEmailVerified: true },
      });
      expect(result).toBe(true);
    });
  });
});
