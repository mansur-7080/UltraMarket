import { Request, Response, NextFunction } from 'express';
import { UserController } from '../controllers/user.controller';
import { userRepository } from '../repositories/userRepository';
import { ValidationError } from '../../../libs/shared/src/validation';
import { UserRole } from '../types/auth';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('../repositories/userRepository');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('UserController', () => {
  let userController: UserController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    userController = new UserController();
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    const validRegisterData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+1234567890',
    };

    beforeEach(() => {
      mockRequest.body = validRegisterData;
    });

    it('should register a new user successfully', async () => {
      const hashedPassword = 'hashedPassword123';
      const mockUser = {
        id: 'user-uuid',
        email: validRegisterData.email,
        username: validRegisterData.username,
        firstName: validRegisterData.firstName,
        lastName: validRegisterData.lastName,
        phoneNumber: validRegisterData.phoneNumber,
        passwordHash: hashedPassword,
        role: UserRole.CUSTOMER,
        isActive: true,
        isEmailVerified: false,
        profileImage: null,
        bio: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
        addresses: [],
      };

      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockBcrypt.hash.mockResolvedValue(hashedPassword);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);
      mockJwt.sign.mockReturnValueOnce(mockTokens.accessToken);
      mockJwt.sign.mockReturnValueOnce(mockTokens.refreshToken);

      await userController.register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(validRegisterData.password, 12);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(validRegisterData.email);
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(validRegisterData.username);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...validRegisterData,
        passwordHash: hashedPassword,
        role: UserRole.CUSTOMER,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: expect.objectContaining({
            id: mockUser.id,
            email: mockUser.email,
            username: mockUser.username,
          }),
          tokens: mockTokens,
        },
        message: 'User registered successfully',
      });
    });

    it('should return 409 if email already exists', async () => {
      const existingUser = { id: 'existing-user', email: validRegisterData.email };
      mockUserRepository.findByEmail.mockResolvedValue(existingUser as any);

      await userController.register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Email already exists',
        },
      });
    });

    it('should return 409 if username already exists', async () => {
      const existingUser = { id: 'existing-user', username: validRegisterData.username };
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(existingUser as any);

      await userController.register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Username already exists',
        },
      });
    });

    it('should return 400 for invalid email format', async () => {
      mockRequest.body = { ...validRegisterData, email: 'invalid-email' };

      await userController.register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'email',
              message: expect.stringContaining('valid email'),
            }),
          ]),
        },
      });
    });

    it('should return 400 for weak password', async () => {
      mockRequest.body = { ...validRegisterData, password: 'weak' };

      await userController.register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'password',
              message: expect.stringContaining('12 characters'),
            }),
          ]),
        },
      });
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockUserRepository.findByEmail.mockRejectedValue(dbError);

      await userController.register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });

  describe('login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'SecurePass123!',
    };

    beforeEach(() => {
      mockRequest.body = validLoginData;
    });

    it('should login user successfully', async () => {
      const mockUser = {
        id: 'user-uuid',
        email: validLoginData.email,
        passwordHash: 'hashedPassword',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.CUSTOMER,
        isActive: true,
        isEmailVerified: true,
        lastLoginAt: new Date(),
        addresses: [],
      };

      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValueOnce(mockTokens.accessToken);
      mockJwt.sign.mockReturnValueOnce(mockTokens.refreshToken);

      await userController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        validLoginData.password,
        mockUser.passwordHash
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: expect.objectContaining({
            id: mockUser.id,
            email: mockUser.email,
          }),
          tokens: mockTokens,
        },
      });
    });

    it('should return 401 for invalid email', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await userController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Invalid email or password',
        },
      });
    });

    it('should return 401 for invalid password', async () => {
      const mockUser = {
        id: 'user-uuid',
        email: validLoginData.email,
        passwordHash: 'hashedPassword',
        isActive: true,
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);
      mockBcrypt.compare.mockResolvedValue(false);

      await userController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Invalid email or password',
        },
      });
    });

    it('should return 401 for inactive user', async () => {
      const mockUser = {
        id: 'user-uuid',
        email: validLoginData.email,
        passwordHash: 'hashedPassword',
        isActive: false,
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);

      await userController.login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Account is deactivated',
        },
      });
    });

    it('should handle rate limiting', async () => {
      // Simulate multiple failed login attempts
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Call login 6 times to trigger rate limit
      for (let i = 0; i < 6; i++) {
        await userController.login(mockRequest as Request, mockResponse as Response, mockNext);
      }

      expect(mockResponse.status).toHaveBeenLastCalledWith(429);
      expect(mockResponse.json).toHaveBeenLastCalledWith({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many login attempts, please try again later',
        },
      });
    });
  });

  describe('getProfile', () => {
    it('should return user profile successfully', async () => {
      const mockUser = {
        id: 'user-uuid',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.CUSTOMER,
        isEmailVerified: true,
        addresses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.user = { userId: mockUser.id };
      mockUserRepository.findById.mockResolvedValue(mockUser as any);

      await userController.getProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
        }),
      });
    });

    it('should return 404 if user not found', async () => {
      mockRequest.user = { userId: 'non-existent-user' };
      mockUserRepository.findById.mockResolvedValue(null);

      await userController.getProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      });
    });
  });

  describe('updateProfile', () => {
    const updateData = {
      firstName: 'Jane',
      lastName: 'Smith',
      phoneNumber: '+9876543210',
    };

    beforeEach(() => {
      mockRequest.body = updateData;
      mockRequest.user = { userId: 'user-uuid' };
    });

    it('should update user profile successfully', async () => {
      const mockUpdatedUser = {
        id: 'user-uuid',
        email: 'test@example.com',
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        phoneNumber: updateData.phoneNumber,
        updatedAt: new Date(),
        addresses: [],
      };

      mockUserRepository.update.mockResolvedValue(mockUpdatedUser as any);

      await userController.updateProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockUserRepository.update).toHaveBeenCalledWith('user-uuid', updateData);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          firstName: updateData.firstName,
          lastName: updateData.lastName,
        }),
        message: 'Profile updated successfully',
      });
    });

    it('should validate phone number format', async () => {
      mockRequest.body = { ...updateData, phoneNumber: 'invalid-phone' };

      await userController.updateProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'phoneNumber',
              message: expect.stringContaining('valid phone number'),
            }),
          ]),
        },
      });
    });
  });

  describe('changePassword', () => {
    const passwordData = {
      currentPassword: 'OldPass123!',
      newPassword: 'NewSecurePass123!',
    };

    beforeEach(() => {
      mockRequest.body = passwordData;
      mockRequest.user = { userId: 'user-uuid' };
    });

    it('should change password successfully', async () => {
      const mockUser = {
        id: 'user-uuid',
        passwordHash: 'oldHashedPassword',
      };

      const newHashedPassword = 'newHashedPassword';

      mockUserRepository.findById.mockResolvedValue(mockUser as any);
      mockBcrypt.compare.mockResolvedValue(true);
      mockBcrypt.hash.mockResolvedValue(newHashedPassword);
      mockUserRepository.update.mockResolvedValue({} as any);

      await userController.changePassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        passwordData.currentPassword,
        mockUser.passwordHash
      );
      expect(mockBcrypt.hash).toHaveBeenCalledWith(passwordData.newPassword, 12);
      expect(mockUserRepository.update).toHaveBeenCalledWith('user-uuid', {
        passwordHash: newHashedPassword,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password changed successfully',
      });
    });

    it('should return 401 for incorrect current password', async () => {
      const mockUser = {
        id: 'user-uuid',
        passwordHash: 'hashedPassword',
      };

      mockUserRepository.findById.mockResolvedValue(mockUser as any);
      mockBcrypt.compare.mockResolvedValue(false);

      await userController.changePassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Current password is incorrect',
        },
      });
    });

    it('should validate new password strength', async () => {
      mockRequest.body = { ...passwordData, newPassword: 'weak' };

      await userController.changePassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'newPassword',
              message: expect.stringContaining('12 characters'),
            }),
          ]),
        },
      });
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      mockRequest.user = { userId: 'user-uuid' };
      mockRequest.headers = { authorization: 'Bearer valid-token' };

      await userController.logout(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully',
      });
    });
  });

  describe('refreshToken', () => {
    const refreshTokenData = {
      refreshToken: 'valid-refresh-token',
    };

    beforeEach(() => {
      mockRequest.body = refreshTokenData;
    });

    it('should refresh tokens successfully', async () => {
      const decodedToken = {
        userId: 'user-uuid',
        email: 'test@example.com',
        role: UserRole.CUSTOMER,
      };

      const newTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockJwt.verify.mockReturnValue(decodedToken);
      mockJwt.sign.mockReturnValueOnce(newTokens.accessToken);
      mockJwt.sign.mockReturnValueOnce(newTokens.refreshToken);

      await userController.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockJwt.verify).toHaveBeenCalledWith(
        refreshTokenData.refreshToken,
        process.env.JWT_REFRESH_SECRET
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          tokens: newTokens,
        },
      });
    });

    it('should return 401 for invalid refresh token', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await userController.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Invalid refresh token',
        },
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed JSON in request body', async () => {
      const malformedRequest = {
        body: 'invalid-json',
      };

      await userController.register(
        malformedRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('validation'),
        })
      );
    });

    it('should handle missing required fields', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        // Missing password, firstName, lastName, username
      };

      await userController.register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'password',
              message: expect.stringContaining('required'),
            }),
            expect.objectContaining({
              field: 'username',
              message: expect.stringContaining('required'),
            }),
          ]),
        },
      });
    });

    it('should handle extremely long input values', async () => {
      const longString = 'a'.repeat(1000);
      mockRequest.body = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'SecurePass123!',
        firstName: longString,
        lastName: 'Doe',
      };

      await userController.register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'firstName',
              message: expect.stringContaining('too long'),
            }),
          ]),
        },
      });
    });

    it('should handle concurrent registration attempts', async () => {
      const registerData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockRequest.body = registerData;
      mockBcrypt.hash.mockResolvedValue('hashedPassword');
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(null);

      // Simulate race condition - first call succeeds, second fails
      mockUserRepository.create
        .mockResolvedValueOnce({
          id: 'user-uuid',
          ...registerData,
          addresses: [],
        } as any)
        .mockRejectedValueOnce(new Error('Duplicate key error'));

      // First registration should succeed
      await userController.register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(201);

      // Reset mocks for second call
      jest.clearAllMocks();
      mockRequest.body = registerData;

      // Second registration should fail
      await userController.register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Duplicate key error',
        })
      );
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent requests', async () => {
      const promises = [];
      const userCount = 100;

      for (let i = 0; i < userCount; i++) {
        const req = {
          body: {
            email: `test${i}@example.com`,
            username: `testuser${i}`,
            password: 'SecurePass123!',
            firstName: 'John',
            lastName: 'Doe',
          },
        };

        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockUserRepository.findByUsername.mockResolvedValue(null);
        mockBcrypt.hash.mockResolvedValue('hashedPassword');
        mockUserRepository.create.mockResolvedValue({
          id: `user-uuid-${i}`,
          ...req.body,
          addresses: [],
        } as any);

        promises.push(userController.register(req as Request, mockResponse as Response, mockNext));
      }

      const startTime = Date.now();
      await Promise.all(promises);
      const endTime = Date.now();

      // Should complete within reasonable time (adjust based on requirements)
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds
    });
  });
});
