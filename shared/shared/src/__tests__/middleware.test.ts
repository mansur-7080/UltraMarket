import { Request, Response, NextFunction } from 'express';
import {
  authenticate,
  authorize,
  requireAdmin,
  validateRequest,
  errorHandler,
  requestLogger,
  securityHeaders,
  requestId,
} from '../middleware';
import { UnauthorizedError, ForbiddenError, ValidationError } from '../errors';
import { UserRole } from '../types';
import Joi from 'joi';

// Mock JWT functions
jest.mock('../auth', () => ({
  verifyAccessToken: jest.fn(),
  extractTokenFromHeader: jest.fn(),
  hasRole: jest.fn(),
}));

const { verifyAccessToken, extractTokenFromHeader, hasRole } = require('../auth');

describe('Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      url: '/test',
      method: 'GET',
      ip: '127.0.0.1',
      body: {},
      get: jest.fn(),
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('authenticate', () => {
    it('should authenticate valid token', async () => {
      const mockPayload = { userId: '123', role: UserRole.CUSTOMER };
      extractTokenFromHeader.mockReturnValue('valid-token');
      verifyAccessToken.mockReturnValue(mockPayload);

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(extractTokenFromHeader).toHaveBeenCalledWith(undefined);
      expect(verifyAccessToken).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle missing token', async () => {
      extractTokenFromHeader.mockReturnValue(null);
      verifyAccessToken.mockImplementation(() => {
        throw new Error('No token');
      });

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should handle invalid token', async () => {
      extractTokenFromHeader.mockReturnValue('invalid-token');
      verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  describe('authorize', () => {
    it('should authorize user with required role', () => {
      mockRequest.user = { userId: '123', email: 'admin@test.com', role: UserRole.ADMIN };
      hasRole.mockReturnValue(true);

      const middleware = authorize([UserRole.ADMIN]);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(hasRole).toHaveBeenCalledWith(UserRole.ADMIN, [UserRole.ADMIN]);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject user without required role', () => {
      mockRequest.user = { userId: '123', email: 'customer@test.com', role: UserRole.CUSTOMER };
      hasRole.mockReturnValue(false);

      const middleware = authorize([UserRole.ADMIN]);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should reject unauthenticated user', () => {
      const middleware = authorize([UserRole.ADMIN]);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  describe('requireAdmin', () => {
    it('should allow admin user', () => {
      mockRequest.user = { userId: '123', email: 'admin@test.com', role: UserRole.ADMIN };

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow super admin user', () => {
      mockRequest.user = {
        userId: '123',
        email: 'superadmin@test.com',
        role: UserRole.SUPER_ADMIN,
      };

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject customer user', () => {
      mockRequest.user = { userId: '123', email: 'customer@test.com', role: UserRole.CUSTOMER };

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should reject unauthenticated user', () => {
      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  describe('validateRequest', () => {
    it('should validate request body', () => {
      const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required(),
      });

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject invalid request body', () => {
      const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required(),
      });

      mockRequest.body = {
        email: 'invalid-email',
        password: 'short',
      };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('errorHandler', () => {
    it('should handle known errors', () => {
      const error = new UnauthorizedError('Authentication required');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
        code: undefined,
      });
    });

    it('should handle validation errors', () => {
      const error = new ValidationError({
        email: ['Email is required'],
      });

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: { email: ['Email is required'] },
      });
    });

    it('should handle Prisma errors', () => {
      const error = new Error('Database error');
      (error as any).code = 'P2002';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Resource already exists',
        code: 'DUPLICATE_ENTRY',
      });
    });

    it('should handle unknown errors in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Unknown error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
    });

    it('should handle unknown errors in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Unknown error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Unknown error',
        stack: error.stack,
      });
    });
  });

  describe('requestLogger', () => {
    it('should log request information', () => {
      const startTime = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(startTime);

      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();

      // Simulate response finish
      const finishListeners = (mockResponse as any).listeners('finish');
      if (finishListeners.length > 0) {
        finishListeners[0]();
      }
    });
  });

  describe('securityHeaders', () => {
    it('should set security headers', () => {
      securityHeaders(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains'
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Security-Policy',
        "default-src 'self'"
      );
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requestId', () => {
    it('should generate request ID if not present', () => {
      requestId(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.headers!['x-request-id']).toBeDefined();
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Request-ID',
        mockRequest.headers!['x-request-id']
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should use existing request ID', () => {
      const existingId = 'existing-request-id';
      mockRequest.headers!['x-request-id'] = existingId;

      requestId(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.headers!['x-request-id']).toBe(existingId);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-ID', existingId);
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
