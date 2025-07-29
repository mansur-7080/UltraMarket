// In-memory user store for test isolation
const users = new Map();

// Mock all external dependencies FIRST
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }]),
    user: {
      findUnique: jest.fn().mockImplementation((args) => {
        const email = args.where.email;
        console.log('Mock findUnique called with email:', email);
        if (users.has(email)) {
          const user = users.get(email);
          console.log('Mock findUnique found user:', user);
          return Promise.resolve(user);
        }
        console.log('Mock findUnique no user found for email:', email);
        return Promise.resolve(null);
      }),
      create: jest.fn().mockImplementation((args) => {
        console.log('Mock create called with args:', args);
        const userData = {
          id: `test-user-id-${Date.now()}-${Math.random()}`,
          email: args.data.email,
          firstName: args.data.firstName,
          lastName: args.data.lastName,
          phone: args.data.phone || null,
          role: args.data.role || 'CUSTOMER',
          isEmailVerified: false,
          createdAt: new Date(),
          password: args.data.password,
          updatedAt: new Date(),
          status: 'ACTIVE',
        };
        users.set(userData.email, userData);
        console.log('Mock user created:', userData);
        
        if (args.select) {
          const selectedData = {};
          Object.keys(args.select).forEach(key => {
            if (args.select[key] && userData[key] !== undefined) {
              selectedData[key] = userData[key];
            }
          });
          console.log('Mock create returning selected data:', selectedData);
          return Promise.resolve(selectedData);
        }
        
        console.log('Mock create returning full user data:', userData);
        return Promise.resolve(userData);
      }),
      update: jest.fn().mockImplementation((args) => {
        const id = args.where?.id;
        if (id) {
          for (const [email, user] of users.entries()) {
            if (user.id === id) {
              const updated = { ...user, ...args.data };
              users.set(email, updated);
              return Promise.resolve(updated);
            }
          }
        }
        const email = args.where?.email;
        if (email && users.has(email)) {
          const updated = { ...users.get(email), ...args.data };
          users.set(email, updated);
          return Promise.resolve(updated);
        }
        return Promise.resolve({ ...args.data, id: id || 'test-user-id', status: 'ACTIVE' });
      }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    refreshToken: {
      create: jest.fn().mockResolvedValue({
        id: 'refresh-token-id',
        userId: 'test-user-id',
        token: 'mock-refresh-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      }),
      findUnique: jest.fn().mockResolvedValue({
        id: 'refresh-token-id',
        userId: 'test-user-id',
        token: 'mock-refresh-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      }),
      delete: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({}),
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
      }),
    },
    passwordReset: {
      create: jest.fn().mockResolvedValue({
        id: 'reset-token-id',
        userId: 'test-user-id',
        token: 'mock-reset-token',
        expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000),
        createdAt: new Date(),
      }),
      findUnique: jest.fn().mockResolvedValue({
        id: 'reset-token-id',
        userId: 'test-user-id',
        token: 'mock-reset-token',
        expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000),
        createdAt: new Date(),
      }),
      delete: jest.fn().mockResolvedValue({}),
    },
  })),
}));

// Test setup for auth-service

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

beforeEach(() => {
  users.clear();
});

// Mock console to reduce noise
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
});

console.error('JEST SETUP.JS LOADED');

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockImplementation((password, saltRounds) => {
    // Always return a valid hashed password string
    return Promise.resolve('hashed-password-123');
  }),
  compare: jest.fn().mockImplementation((password, hash) => {
    // Return true for test password combinations
    if (password === 'TestPassword123!' && (hash === 'hashed-password' || hash === 'hashed-password-123')) {
      return Promise.resolve(true);
    }
    // Also return true for any password when hash matches
    if (hash === 'hashed-password-123') {
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }),
  genSalt: jest.fn().mockResolvedValue('salt-123'),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockImplementation((payload, secret) => {
    // Create proper JWT format: header.payload.signature
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const payloadData = Buffer.from(JSON.stringify(payload)).toString('base64');
    const signature = 'mock-signature';
    const token = `${header}.${payloadData}.${signature}`;
    return token;
  }),
  verify: jest.fn().mockImplementation((token, secret, callback) => {
    // Handle callback-style verification for middleware
    if (typeof callback === 'function') {
      if (token === 'invalid-token' || token === 'invalid.jwt.token') {
        return callback(new Error('Invalid token'), null);
      }
      return callback(null, {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'CUSTOMER',
        type: 'access',
      });
    }
    
    // Handle synchronous verification
    if (token === 'invalid-token' || token === 'invalid.jwt.token') {
      throw new Error('Invalid token');
    }
    return {
      userId: 'test-user-id',
      email: 'test@example.com',
      role: 'CUSTOMER',
      type: 'access',
    };
  }),
  decode: jest.fn().mockImplementation((token) => {
    // Always return a proper decoded object for any token
    return {
      userId: 'test-user-id',
      email: 'test@example.com',
      role: 'CUSTOMER',
    };
  }),
}));

// Mock JWT service
jest.mock('../services/jwt.service', () => ({
  JWTService: jest.fn().mockImplementation(() => ({
    generateTokens: jest.fn().mockResolvedValue({
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiQ1VTVE9NRVIiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNjM5NzY5NjAwLCJleHAiOjE2Mzk3Njk2OTB9.mock-signature',
      refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiQ1VTVE9NRVIiLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6InRlc3Qtand0LWlkIiwiaWF0IjoxNjM5NzY5NjAwLCJleHAiOjE2NDA1ODU2MDB9.refresh-signature',
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

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn().mockReturnValue({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    ping: jest.fn().mockResolvedValue('PONG'),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    rPop: jest.fn().mockResolvedValue(null),
    lPush: jest.fn().mockResolvedValue(1),
    isOpen: true,
  }),
}));

// Mock email service
jest.mock('../services/email.service', () => ({
  emailService: {
    sendEmailVerification: jest.fn().mockResolvedValue(true),
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    sendPasswordReset: jest.fn().mockResolvedValue(true),
    testConnection: jest.fn().mockResolvedValue(true),
  },
}));

// Global test timeout
jest.setTimeout(60000); 