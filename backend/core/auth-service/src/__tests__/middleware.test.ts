/**
 * Middleware Test Suite
 * Tests for all middleware functions
 */

import { Request, Response, NextFunction } from 'express';
import { authenticateToken, requireRole, optionalAuth } from '../middleware/authMiddleware';

describe('Middleware Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      ip: '127.0.0.1',
      get: jest.fn(),
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('authenticateToken', () => {
    it('should return 401 when no token provided', () => {
      authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access token is required',
      });
    });
  });

  describe('requireRole', () => {
    it('should return 401 when no user in request', () => {
      const middleware = requireRole(['ADMIN']);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });

    it('should return 403 when user has insufficient role', () => {
      mockRequest.user = {
        userId: 'test-user',
        email: 'test@example.com',
        role: 'CUSTOMER',
        permissions: [],
        sessionId: 'test-session',
        tokenType: 'access' as const,
      };

      const middleware = requireRole(['ADMIN']);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient permissions',
      });
    });

    it('should call next when user has required role', () => {
      mockRequest.user = {
        userId: 'test-user',
        email: 'test@example.com',
        role: 'ADMIN',
        permissions: [],
        sessionId: 'test-session',
        tokenType: 'access' as const,
      };

      const middleware = requireRole(['ADMIN']);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should call next when no token provided', () => {
      optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });
}); 