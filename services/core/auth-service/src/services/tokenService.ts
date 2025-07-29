import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '@ultramarket/shared';

const prisma = new PrismaClient();

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
}

export class TokenService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'access-secret';
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
  }

  /**
   * Generate access token
   */
  generateAccessToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
    });
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
    });
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, this.accessTokenSecret) as TokenPayload;
    } catch (error) {
      logger.error('Access token verification failed', { error });
      return null;
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, this.refreshTokenSecret) as TokenPayload;
    } catch (error) {
      logger.error('Refresh token verification failed', { error });
      return null;
    }
  }

  /**
   * Save refresh token to database
   */
  async saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
    try {
      await prisma.refreshToken.create({
        data: {
          userId,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      logger.info('Refresh token saved successfully', { userId });
    } catch (error) {
      logger.error('Failed to save refresh token', { error, userId });
      throw error;
    }
  }

  /**
   * Find refresh token in database
   */
  async findRefreshToken(token: string): Promise<any> {
    try {
      return await prisma.refreshToken.findFirst({
        where: {
          token,
          expiresAt: {
            gt: new Date(),
          },
          isRevoked: false,
        },
      });
    } catch (error) {
      logger.error('Failed to find refresh token', { error });
      throw error;
    }
  }

  /**
   * Update refresh token
   */
  async updateRefreshToken(oldToken: string, newToken: string): Promise<void> {
    try {
      await prisma.refreshToken.updateMany({
        where: {
          token: oldToken,
        },
        data: {
          token: newToken,
          updatedAt: new Date(),
        },
      });

      logger.info('Refresh token updated successfully');
    } catch (error) {
      logger.error('Failed to update refresh token', { error });
      throw error;
    }
  }

  /**
   * Invalidate refresh token
   */
  async invalidateRefreshToken(token: string): Promise<void> {
    try {
      await prisma.refreshToken.updateMany({
        where: {
          token,
        },
        data: {
          isRevoked: true,
          updatedAt: new Date(),
        },
      });

      logger.info('Refresh token invalidated successfully');
    } catch (error) {
      logger.error('Failed to invalidate refresh token', { error });
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
        },
        data: {
          isRevoked: true,
          updatedAt: new Date(),
        },
      });

      logger.info('All user tokens invalidated successfully', { userId });
    } catch (error) {
      logger.error('Failed to invalidate all user tokens', { error, userId });
      throw error;
    }
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      logger.info('Expired tokens cleaned up', { count: result.count });
      return result.count;
    } catch (error) {
      logger.error('Failed to cleanup expired tokens', { error });
      throw error;
    }
  }

  /**
   * Get token statistics
   */
  async getTokenStats(): Promise<{
    totalTokens: number;
    activeTokens: number;
    expiredTokens: number;
    revokedTokens: number;
  }> {
    try {
      const [totalTokens, activeTokens, expiredTokens, revokedTokens] = await Promise.all([
        prisma.refreshToken.count(),
        prisma.refreshToken.count({
          where: {
            expiresAt: { gt: new Date() },
            isRevoked: false,
          },
        }),
        prisma.refreshToken.count({
          where: {
            expiresAt: { lt: new Date() },
          },
        }),
        prisma.refreshToken.count({
          where: {
            isRevoked: true,
          },
        }),
      ]);

      return {
        totalTokens,
        activeTokens,
        expiredTokens,
        revokedTokens,
      };
    } catch (error) {
      logger.error('Failed to get token statistics', { error });
      throw error;
    }
  }

  /**
   * Decode token without verification (for logging purposes)
   */
  decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      logger.error('Failed to decode token', { error });
      return null;
    }
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      logger.error('Failed to get token expiration', { error });
      return null;
    }
  }
}
