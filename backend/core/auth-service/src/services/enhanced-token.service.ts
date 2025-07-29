/**
 * UltraMarket Auth Service - Enhanced Token Service
 * Professional JWT token management with device tracking
 */

import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { Request } from 'express';
import { logger } from '../utils/logger';
import {
  TokenPayload,
  TokenPair,
  TokenServiceInterface,
} from '../interfaces/token-service.interface';
import { extractDeviceInfo } from '../utils/device-tracking';
import { AuthError, NotFoundError, UnauthorizedError } from '../utils/error-handler';
import { randomBytes } from 'crypto';

// Initialize Prisma client
const prisma = new PrismaClient();

export class TokenService implements TokenServiceInterface {
  /**
   * Generate tokens for user
   */
  async generateTokens(userId: string, req?: Request): Promise<TokenPair> {
    try {
      const deviceId = req?.headers['x-device-id'] as string;
      const userAgent = req?.headers['user-agent'] as string;
      const ip = req?.ip || req?.connection?.remoteAddress;

      // Generate tokens
      const accessToken = jwt.sign(
        {
          userId,
          type: 'access',
          jti: randomBytes(16).toString('hex'),
        },
        process.env['JWT_SECRET'] || 'fallback-secret',
        {
          expiresIn: '15m',
          issuer: 'ultramarket-auth',
          audience: 'ultramarket-api',
        }
      );

      const refreshToken = jwt.sign(
        {
          userId,
          type: 'refresh',
          jti: randomBytes(16).toString('hex'),
        },
        process.env['JWT_REFRESH_SECRET'] || 'fallback-refresh-secret',
        {
          expiresIn: '7d',
          issuer: 'ultramarket-auth',
          audience: 'ultramarket-api',
        }
      );

      // Hash refresh token for storage
      const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      // Store refresh token in database
      await prisma.refreshToken.create({
        data: {
          userId,
          token: refreshTokenHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      logger.info('Tokens generated successfully', {
        userId,
        operation: 'generate_tokens',
        deviceId,
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
   * Store or update device information
   */
  private async storeDeviceInfo(userId: string, deviceInfo: any): Promise<void> {
    try {
      // Check if device already exists
      const existingDevice = await prisma.refreshToken.findFirst({
        where: {
          userId,
        },
      });

      if (existingDevice) {
        // Update existing device info
        await prisma.refreshToken.update({
          where: { id: existingDevice.id },
          data: {
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
        });
      } else {
        // Create new device entry
        await prisma.refreshToken.create({
          data: {
            userId,
            token: crypto.randomBytes(32).toString('hex'),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
        });

        // If this is a new device, log it for security monitoring
        logger.info('User logged in from a new device', {
          userId,
          deviceId: deviceInfo.deviceId,
          browser: deviceInfo.browser?.name,
          os: deviceInfo.os?.name,
          ip: deviceInfo.ip,
        });
      }
    } catch (error) {
      // Log error but don't fail token generation if device tracking fails
      logger.error('Failed to store device information', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
    }
  }

  /**
   * Validate access token
   */
  validateAccessToken(token: string): TokenPayload | null {
    try {
      const secret = process.env['JWT_SECRET'];

      if (!secret) {
        throw new AuthError('JWT secret is not configured');
      }

      const payload = jwt.verify(token, secret) as TokenPayload;
      return payload;
    } catch (error) {
      logger.debug('Access token validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Validate refresh token
   */
  validateRefreshToken(token: string): TokenPayload | null {
    try {
      const refreshSecret = process.env['JWT_REFRESH_SECRET'];

      if (!refreshSecret) {
        throw new AuthError('JWT refresh secret is not configured');
      }

      const payload = jwt.verify(token, refreshSecret) as TokenPayload;
      return payload;
    } catch (error) {
      logger.debug('Refresh token validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Refresh token pair
   */
  async refreshTokens(refreshToken: string, req?: Request): Promise<TokenPair> {
    try {
      // Validate refresh token
      const payload = this.validateRefreshToken(refreshToken);

      if (!payload) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Check if token is in database and not revoked
      const tokenFromDb = await this.findRefreshToken(refreshToken);

      if (!tokenFromDb || tokenFromDb.isRevoked) {
        throw new UnauthorizedError('Refresh token is invalid or has been revoked');
      }

      // Check if token has expired
      if (tokenFromDb.expiresAt < new Date()) {
        throw new UnauthorizedError('Refresh token has expired');
      }

      // Revoke the old token
      await this.revokeToken(refreshToken);

      // Generate new tokens
      const newTokens = await this.generateTokens(payload.userId, req);

      return newTokens;
    } catch (error) {
      logger.error('Token refresh failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      // Delete all refresh tokens for the user
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });

      logger.info('All user tokens revoked', {
        userId,
        operation: 'revoke_all_tokens',
      });
    } catch (error) {
      logger.error('Failed to revoke all user tokens', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        operation: 'revoke_all_tokens',
      });
      throw error;
    }
  }

  /**
   * Revoke a specific refresh token
   */
  async revokeToken(refreshToken: string): Promise<void> {
    try {
      const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      // Delete the specific refresh token
      await prisma.refreshToken.deleteMany({
        where: { token: refreshTokenHash },
      });

      logger.info('Token revoked successfully', {
        operation: 'revoke_token',
      });
    } catch (error) {
      logger.error('Failed to revoke token', {
        error: error instanceof Error ? error.message : 'Unknown error',
        operation: 'revoke_token',
      });
      throw error;
    }
  }

  /**
   * Find refresh token in database
   */
  async findRefreshToken(refreshToken: string): Promise<any> {
    try {
      const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      return await prisma.refreshToken.findFirst({
        where: { token: refreshTokenHash },
        include: { user: true },
      });
    } catch (error) {
      logger.error('Failed to find refresh token', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Get user's active devices
   */
  async getUserDevices(userId: string): Promise<any[]> {
    try {
      // Get all active refresh tokens for the user
      const tokens = await prisma.refreshToken.findMany({
        where: {
          userId,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return tokens.map((token) => ({
        id: token.id,
        createdAt: token.createdAt,
        expiresAt: token.expiresAt,
        user: token.user,
      }));
    } catch (error) {
      logger.error('Failed to get user devices', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      return [];
    }
  }

  /**
   * Revoke tokens for a specific device
   */
  async revokeDeviceTokens(userId: string, deviceId: string): Promise<void> {
    try {
      // Delete all refresh tokens for the user (since we don't have device-specific tracking)
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });

      logger.info('Device tokens revoked', {
        userId,
        deviceId,
        operation: 'revoke_device_tokens',
      });
    } catch (error) {
      logger.error('Failed to revoke device tokens', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        deviceId,
        operation: 'revoke_device_tokens',
      });
      throw error;
    }
  }
}
