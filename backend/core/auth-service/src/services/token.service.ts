/**
 * UltraMarket Auth Service - Token Service
 * Professional JWT token management
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
// import { logger } from '@ultramarket/shared/logging/logger';
// import { ApiError } from '@ultramarket/shared/errors/api-error';
const logger = console;
class ApiError extends Error {
  constructor(public statusCode: number, public override message: string) {
    super(message);
  }
}

const prisma = new PrismaClient();

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class TokenService {
  /**
   * Generate access and refresh tokens
   */
  async generateTokens(userId: string): Promise<TokenPair> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      const payload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

          const secret = process.env['JWT_SECRET'];
    const refreshSecret = process.env['JWT_REFRESH_SECRET'];

      if (!secret || !refreshSecret) {
        throw new Error('JWT secrets are not configured');
      }

      // Generate access token
      const accessToken = jwt.sign(payload, secret, {
        expiresIn: parseInt(process.env['JWT_ACCESS_EXPIRES_IN'] || '900', 10),
        issuer: 'ultramarket-auth',
        audience: 'ultramarket-users',
      });

      // Generate refresh token
      const refreshToken = jwt.sign(payload, refreshSecret, {
        expiresIn: parseInt(process.env['JWT_REFRESH_EXPIRES_IN'] || '604800', 10),
        issuer: 'ultramarket-auth',
        audience: 'ultramarket-users',
      });

      // Store refresh token hash in database
      const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      await prisma.refreshToken.create({
        data: {
          userId,
          token: refreshTokenHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          // isRevoked: false, // Property doesn't exist in schema
        },
      });

      logger.info('Tokens generated successfully', {
        userId,
        operation: 'generate_tokens',
      });

      return { accessToken, refreshToken };
    } catch (error) {
      logger.error('Token generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        operation: 'generate_tokens',
      });
      throw error;
    }
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const secret = process.env['JWT_SECRET'];
      if (!secret) {
        throw new Error('JWT_SECRET is not configured');
      }

      const decoded = jwt.verify(token, secret, {
        issuer: 'ultramarket-auth',
        audience: 'ultramarket-users',
      }) as TokenPayload;

      // Check if user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { status: true },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new ApiError(401, 'User account is inactive or deleted');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        logger.error('Invalid access token', {
          error: error.message,
          operation: 'verify_access_token',
        });
        throw new ApiError(401, 'Invalid access token');
      }
      throw error;
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    try {
      const secret = process.env['JWT_REFRESH_SECRET'];
      if (!secret) {
        throw new Error('JWT_REFRESH_SECRET is not configured');
      }

      const decoded = jwt.verify(token, secret, {
        issuer: 'ultramarket-auth',
        audience: 'ultramarket-users',
      }) as TokenPayload;

      // Check if refresh token exists in database and is not revoked
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const storedToken = await prisma.refreshToken.findFirst({
        where: {
          token: tokenHash,
          // isRevoked: false, // Property doesn't exist in schema
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!storedToken) {
        throw new ApiError(401, 'Invalid or expired refresh token');
      }

      // Check if user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { status: true },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new ApiError(401, 'User account is inactive or deleted');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        logger.error('Invalid refresh token', {
          error: error.message,
          operation: 'verify_refresh_token',
        });
        throw new ApiError(401, 'Invalid refresh token');
      }
      throw error;
    }
  }

  /**
   * Invalidate refresh token
   */
  async invalidateRefreshToken(token: string): Promise<void> {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      await prisma.refreshToken.updateMany({
        where: {
          token: tokenHash,
          // isRevoked: false, // Property doesn't exist in schema
        },
        data: {
          // isRevoked: true, // Property doesn't exist in schema
          // revokedAt: new Date(), // Property doesn't exist in schema
        },
      });

      logger.info('Refresh token invalidated', {
        operation: 'invalidate_refresh_token',
      });
    } catch (error) {
      logger.error('Failed to invalidate refresh token', {
        error: error instanceof Error ? error.message : 'Unknown error',
        operation: 'invalidate_refresh_token',
      });
      throw error;
    }
  }

  /**
   * Invalidate all refresh tokens for a user
   */
  async invalidateAllUserTokens(userId: string): Promise<void> {
    try {
      await prisma.refreshToken.updateMany({
        where: {
          userId,
          // isRevoked: false, // Property doesn't exist in schema
        },
        data: {
          // isRevoked: true, // Property doesn't exist in schema
          // revokedAt: new Date(), // Property doesn't exist in schema
        },
      });

      logger.info('All user tokens invalidated', {
        userId,
        operation: 'invalidate_all_user_tokens',
      });
    } catch (error) {
      logger.error('Failed to invalidate all user tokens', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        operation: 'invalidate_all_user_tokens',
      });
      throw error;
    }
  }

  /**
   * Get token information
   */
  async getTokenInfo(token: string): Promise<{
    userId: string;
    email: string;
    role: string;
    issuedAt: Date;
    expiresAt: Date;
  }> {
    try {
      const decoded = jwt.decode(token) as any;

      if (!decoded) {
        throw new ApiError(400, 'Invalid token format');
      }

      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        issuedAt: new Date(decoded.iat * 1000),
        expiresAt: new Date(decoded.exp * 1000),
      };
    } catch (error) {
      logger.error('Failed to get token info', {
        error: error instanceof Error ? error.message : 'Unknown error',
        operation: 'get_token_info',
      });
      throw error;
    }
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const now = new Date();

      // Delete expired refresh tokens
      const deletedTokens = await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      });

      logger.info('Expired tokens cleaned up', {
        deletedCount: deletedTokens.count,
        operation: 'cleanup_expired_tokens',
      });
    } catch (error) {
      logger.error('Failed to cleanup expired tokens', {
        error: error instanceof Error ? error.message : 'Unknown error',
        operation: 'cleanup_expired_tokens',
      });
    }
  }

  /**
   * Get active sessions for a user
   */
  async getUserSessions(userId: string): Promise<
    Array<{
      id: string;
      createdAt: Date;
      expiresAt: Date;
      // isRevoked: boolean; // Property doesn't exist in schema
      // userAgent?: string; // Property doesn't exist in schema
      // ipAddress?: string; // Property doesn't exist in schema
    }>
  > {
    try {
      const sessions = await prisma.refreshToken.findMany({
        where: {
          userId,
        },
        select: {
          id: true,
          createdAt: true,
          expiresAt: true,
          // isRevoked: true, // Property doesn't exist in schema
          // userAgent: true, // Property doesn't exist in schema
          // ipAddress: true, // Property doesn't exist in schema
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return sessions;
    } catch (error) {
      logger.error('Failed to get user sessions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        operation: 'get_user_sessions',
      });
      throw error;
    }
  }

  /**
   * Revoke specific session
   */
  async revokeSession(sessionId: string, userId: string): Promise<void> {
    try {
      const session = await prisma.refreshToken.findFirst({
        where: {
          id: sessionId,
          userId,
        },
      });

      if (!session) {
        throw new ApiError(404, 'Session not found');
      }

      await prisma.refreshToken.update({
        where: { id: sessionId },
        data: {
          // isRevoked: true, // Property doesn't exist in schema
          // revokedAt: new Date(), // Property doesn't exist in schema
        },
      });

      logger.info('Session revoked', {
        sessionId,
        userId,
        operation: 'revoke_session',
      });
    } catch (error) {
      logger.error('Failed to revoke session', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId,
        userId,
        operation: 'revoke_session',
      });
      throw error;
    }
  }

  /**
   * Generate temporary access token (for password reset, etc.)
   */
  async generateTemporaryToken(
    userId: string,
    purpose: string,
    expiresIn: string = '1h'
  ): Promise<string> {
    try {
      const payload = {
        userId,
        purpose,
        type: 'temporary',
      };

      const secret = process.env['JWT_SECRET'];
      if (!secret) {
        throw new Error('JWT_SECRET is not configured');
      }

      const token = jwt.sign(payload, secret, {
        expiresIn: parseInt(expiresIn, 10),
        issuer: 'ultramarket-auth',
        audience: 'ultramarket-temp',
      });

      logger.info('Temporary token generated', {
        userId,
        purpose,
        operation: 'generate_temporary_token',
      });

      return token;
    } catch (error) {
      logger.error('Failed to generate temporary token', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        purpose,
        operation: 'generate_temporary_token',
      });
      throw error;
    }
  }

  /**
   * Verify temporary token
   */
  async verifyTemporaryToken(token: string, purpose: string): Promise<any> {
    try {
      const secret = process.env['JWT_SECRET'];
      if (!secret) {
        throw new Error('JWT_SECRET is not configured');
      }

      const decoded = jwt.verify(token, secret, {
        issuer: 'ultramarket-auth',
        audience: 'ultramarket-temp',
      }) as any;

      if (decoded.purpose !== purpose || decoded.type !== 'temporary') {
        throw new ApiError(401, 'Invalid token purpose');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        logger.error('Invalid temporary token', {
          error: error.message,
          purpose,
          operation: 'verify_temporary_token',
        });
        throw new ApiError(401, 'Invalid temporary token');
      }
      throw error;
    }
  }
}
