// Test setup for auth-service
import { jest } from '@jest/globals';

// Set test environment
process.env['NODE_ENV'] = 'test';
process.env['PORT'] = '3002';
process.env['JWT_ACCESS_SECRET'] = 'test-access-secret';
process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret';
process.env['JWT_ACCESS_EXPIRES_IN'] = '15m';
process.env['JWT_REFRESH_EXPIRES_IN'] = '7d';
process.env['CORS_ORIGIN'] = 'http://localhost:3000';
process.env['LOG_LEVEL'] = 'error';
process.env['RATE_LIMIT_WINDOW_MS'] = '900000';
process.env['RATE_LIMIT_MAX_REQUESTS'] = '100';
process.env['RATE_LIMIT_AUTH_WINDOW_MS'] = '900000';
process.env['RATE_LIMIT_AUTH_MAX_REQUESTS'] = '5';
process.env['EMAIL_SERVICE'] = 'test';
process.env['EMAIL_HOST'] = 'localhost';
process.env['EMAIL_PORT'] = '587';
process.env['EMAIL_USER'] = 'test@example.com';
process.env['EMAIL_PASS'] = 'test-password';

// Global mock for @prisma/client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }] as any),
    user: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER',
        isEmailVerified: false,
        createdAt: new Date(),
        password: 'hashed-password',
      } as any),
      create: jest.fn().mockResolvedValue({
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER',
        isEmailVerified: false,
        createdAt: new Date(),
        password: 'hashed-password',
      } as any),
      update: jest.fn().mockResolvedValue({
        id: 'test-user-id',
        lastLoginAt: new Date(),
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER',
        isEmailVerified: false,
        createdAt: new Date(),
        password: 'hashed-password',
      } as any),
      findMany: jest.fn().mockResolvedValue([] as any),
    },
    refreshToken: {
      create: jest.fn().mockResolvedValue({
        id: 'refresh-token-id',
        userId: 'test-user-id',
        token: 'mock-refresh-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      } as any),
      findUnique: jest.fn().mockResolvedValue({
        id: 'refresh-token-id',
        userId: 'test-user-id',
        token: 'mock-refresh-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      } as any),
      delete: jest.fn().mockResolvedValue({} as any),
      deleteMany: jest.fn().mockResolvedValue({} as any),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({
        id: 'audit-log-id',
        userId: 'test-user-id',
        action: 'LOGIN',
        details: 'User logged in',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        createdAt: new Date(),
      } as any),
    },
    passwordReset: {
      create: jest.fn().mockResolvedValue({
        id: 'reset-token-id',
        userId: 'test-user-id',
        token: 'mock-reset-token',
        expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000),
        createdAt: new Date(),
      } as any),
      findUnique: jest.fn().mockResolvedValue({
        id: 'reset-token-id',
        userId: 'test-user-id',
        token: 'mock-reset-token',
        expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000),
        createdAt: new Date(),
      } as any),
      delete: jest.fn().mockResolvedValue({} as any),
    },
  })),
}));

// Mock database-setup
jest.mock('../config/database-setup', () => {
  const mockPrisma = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }] as any),
    user: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER',
        isEmailVerified: false,
        createdAt: new Date(),
        password: 'hashed-password',
      } as any),
      create: jest.fn().mockResolvedValue({
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER',
        isEmailVerified: false,
        createdAt: new Date(),
        password: 'hashed-password',
      } as any),
      update: jest.fn().mockResolvedValue({
        id: 'test-user-id',
        lastLoginAt: new Date(),
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER',
        isEmailVerified: false,
        createdAt: new Date(),
        password: 'hashed-password',
      } as any),
      findMany: jest.fn().mockResolvedValue([] as any),
    },
    refreshToken: {
      create: jest.fn().mockResolvedValue({
        id: 'refresh-token-id',
        userId: 'test-user-id',
        token: 'mock-refresh-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      } as any),
      findUnique: jest.fn().mockResolvedValue({
        id: 'refresh-token-id',
        userId: 'test-user-id',
        token: 'mock-refresh-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      } as any),
      delete: jest.fn().mockResolvedValue({} as any),
      deleteMany: jest.fn().mockResolvedValue({} as any),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({
        id: 'audit-log-id',
        userId: 'test-user-id',
        action: 'LOGIN',
        details: 'User logged in',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        createdAt: new Date(),
      } as any),
    },
    passwordReset: {
      create: jest.fn().mockResolvedValue({
        id: 'reset-token-id',
        userId: 'test-user-id',
        token: 'mock-reset-token',
        expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000),
        createdAt: new Date(),
      } as any),
      findUnique: jest.fn().mockResolvedValue({
        id: 'reset-token-id',
        userId: 'test-user-id',
        token: 'mock-reset-token',
        expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000),
        createdAt: new Date(),
      } as any),
      delete: jest.fn().mockResolvedValue({} as any),
    },
  };

  return {
    databaseManager: {
      getClient: jest.fn().mockReturnValue(mockPrisma),
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      healthCheck: jest.fn().mockResolvedValue({ status: 'healthy' }),
      getStats: jest.fn().mockResolvedValue({ connections: 1 }),
    },
    prisma: mockPrisma,
  };
});

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password-123'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('salt-123'),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token-123'),
  verify: jest.fn().mockReturnValue({
    userId: 'test-user-id',
    email: 'test@example.com',
    role: 'CUSTOMER',
  }),
  decode: jest.fn().mockReturnValue({
    userId: 'test-user-id',
    email: 'test@example.com',
    role: 'CUSTOMER',
  }),
}));

// Mock emailService
jest.mock('../services/email.service', () => ({
  emailService: {
    sendEmailVerification: jest.fn().mockResolvedValue(true),
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    sendPasswordReset: jest.fn().mockResolvedValue(true),
    testConnection: jest.fn().mockResolvedValue(true),
  },
}));

// Mock auth.controller to override its prisma import
jest.mock('../controllers/auth.controller', () => {
  const originalModule = jest.requireActual('../controllers/auth.controller');
  const mockPrisma = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }] as any),
    user: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER',
        isEmailVerified: false,
        createdAt: new Date(),
        password: 'hashed-password',
      } as any),
      create: jest.fn().mockResolvedValue({
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER',
        isEmailVerified: false,
        createdAt: new Date(),
        password: 'hashed-password',
      } as any),
      update: jest.fn().mockResolvedValue({
        id: 'test-user-id',
        lastLoginAt: new Date(),
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER',
        isEmailVerified: false,
        createdAt: new Date(),
        password: 'hashed-password',
      } as any),
      findMany: jest.fn().mockResolvedValue([] as any),
    },
    refreshToken: {
      create: jest.fn().mockResolvedValue({
        id: 'refresh-token-id',
        userId: 'test-user-id',
        token: 'mock-refresh-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      } as any),
      findUnique: jest.fn().mockResolvedValue({
        id: 'refresh-token-id',
        userId: 'test-user-id',
        token: 'mock-refresh-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      } as any),
      delete: jest.fn().mockResolvedValue({} as any),
      deleteMany: jest.fn().mockResolvedValue({} as any),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({
        id: 'audit-log-id',
        userId: 'test-user-id',
        action: 'LOGIN',
        details: 'User logged in',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        createdAt: new Date(),
      } as any),
    },
    passwordReset: {
      create: jest.fn().mockResolvedValue({
        id: 'reset-token-id',
        userId: 'test-user-id',
        token: 'mock-reset-token',
        expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000),
        createdAt: new Date(),
      } as any),
      findUnique: jest.fn().mockResolvedValue({
        id: 'reset-token-id',
        userId: 'test-user-id',
        token: 'mock-reset-token',
        expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000),
        createdAt: new Date(),
      } as any),
      delete: jest.fn().mockResolvedValue({} as any),
    },
  };

  return {
    ...originalModule,
    prisma: mockPrisma,
  };
});

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn().mockReturnValue({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    ping: jest.fn().mockResolvedValue('PONG'),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    isOpen: true,
  }),
}));

// Mock JWTService
jest.mock('../services/jwt.service', () => ({
  JWTService: jest.fn().mockImplementation(() => ({
    generateTokens: jest.fn().mockResolvedValue({
      accessToken: 'mock-access-token-123',
      refreshToken: 'mock-refresh-token-123',
    }),
    verifyAccessToken: jest.fn().mockReturnValue({
      userId: 'test-user-id',
      email: 'test@example.com',
      role: 'CUSTOMER',
    }),
    verifyRefreshToken: jest.fn().mockReturnValue({
      userId: 'test-user-id',
      email: 'test@example.com',
      role: 'CUSTOMER',
    }),
  })),
}));

// Mock AuthService
jest.mock('../services/auth.service', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    validateUser: jest.fn().mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'CUSTOMER',
    }),
    createUser: jest.fn().mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'CUSTOMER',
    }),
  })),
}));

// Global test timeout
jest.setTimeout(30000); 