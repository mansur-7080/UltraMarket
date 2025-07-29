import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../index';

// Mock Prisma client
jest.mock('@prisma/client');
jest.mock('@shared/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
} as any;

(PrismaClient as jest.Mock).mockImplementation(() => mockPrisma);

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+1234567890',
    };

    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CUSTOMER',
        isEmailVerified: false,
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const response = await request(app).post('/api/auth/register').send(validUserData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('should return 409 if user already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      const response = await request(app).post('/api/auth/register').send(validUserData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_EXISTS');
    });

    it('should return 400 for invalid email', async () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };

      const response = await request(app).post('/api/auth/register').send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for weak password', async () => {
      const invalidData = { ...validUserData, password: '123' };

      const response = await request(app).post('/api/auth/register').send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = { email: 'test@example.com' };

      const response = await request(app).post('/api/auth/register').send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'TestPassword123!',
    };

    it('should login user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('TestPassword123!', 12),
        firstName: 'John',
        lastName: 'Doe',
        role: 'CUSTOMER',
        isActive: true,
        isEmailVerified: false,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const response = await request(app).post('/api/auth/login').send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('should return 401 for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app).post('/api/auth/login').send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for incorrect password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('DifferentPassword123!', 12),
        isActive: true,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app).post('/api/auth/login').send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for inactive user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('TestPassword123!', 12),
        isActive: false,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app).post('/api/auth/login').send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ACCOUNT_DISABLED');
    });

    it('should return 400 for invalid email format', async () => {
      const invalidData = { ...loginData, email: 'invalid-email' };

      const response = await request(app).post('/api/auth/login').send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'CUSTOMER',
      };

      const refreshToken = jwt.sign(
        { userId: 'user-123', email: 'test@example.com', type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || 'test-secret',
        { expiresIn: '7d' }
      );

      const mockTokenRecord = {
        id: 'token-123',
        token: refreshToken,
        user: mockUser,
      };

      mockPrisma.refreshToken.findFirst.mockResolvedValue(mockTokenRecord);
      mockPrisma.refreshToken.delete.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const response = await request(app).post('/api/auth/refresh').send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app).post('/api/auth/refresh').send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should return 401 for invalid refresh token', async () => {
      mockPrisma.refreshToken.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: 'some-refresh-token' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    });

    it('should logout successfully even without refresh token', async () => {
      const response = await request(app).post('/api/auth/logout').send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/auth/verify', () => {
    it('should verify valid token successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CUSTOMER',
        isActive: true,
      };

      const accessToken = jwt.sign(
        { userId: 'user-123', email: 'test@example.com', role: 'CUSTOMER' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '15m' }
      );

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/verify')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should return 401 for missing authorization header', async () => {
      const response = await request(app).post('/api/auth/verify');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should return 401 for invalid token format', async () => {
      const response = await request(app)
        .post('/api/auth/verify')
        .set('Authorization', 'Invalid token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for inactive user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        isActive: false,
      };

      const accessToken = jwt.sign({ userId: 'user-123' }, process.env.JWT_SECRET || 'test-secret');

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/verify')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_USER');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
      expect(response.body.service).toBe('auth-service');
      expect(response.body.version).toBe('1.0.0');
    });
  });

  describe('Rate limiting', () => {
    it('should apply rate limiting to login endpoint', async () => {
      // Mock user for login attempts
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
      };

      // Make multiple requests to trigger rate limit
      const requests = Array(6)
        .fill(null)
        .map(() => request(app).post('/api/auth/login').send(loginData));

      const responses = await Promise.all(requests);

      // At least one should be rate limited
      const rateLimitedResponse = responses.find((res) => res.status === 429);
      expect(rateLimitedResponse).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'TestPassword123!',
      });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
    });

    it('should return 404 for unknown endpoints', async () => {
      const response = await request(app).get('/api/auth/unknown');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });
});
