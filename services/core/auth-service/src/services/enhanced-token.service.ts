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

// Initialize Prisma client
const prisma = new PrismaClient();

export class TokenService implements TokenServiceInterface {
  /**
   * Generate access and refresh tokens with device tracking
   */
  async generateTokens(userId: string, req?: Request): Promise<TokenPair> {
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
        throw new NotFoundError('User not found');
      }

      // Get device information for tracking if request is provided
      let deviceId: string | undefined;

      if (req) {
        const deviceInfo = extractDeviceInfo(req);
        deviceId = deviceInfo.deviceId;

        // Store or update device information
        await this.storeDeviceInfo(userId, deviceInfo);
      }

      const payload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        deviceId,
      };

      const secret = process.env.JWT_SECRET;
      const refreshSecret = process.env.JWT_REFRESH_SECRET;

      if (!secret || !refreshSecret) {
        throw new AuthError('JWT secrets are not configured');
      }

      // Generate access token
      const accessOptions: SignOptions = {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        issuer: 'ultramarket-auth',
        audience: 'ultramarket-users',
      };
      const accessToken = jwt.sign(payload, secret, accessOptions);

      // Generate refresh token
      const refreshOptions: SignOptions = {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        issuer: 'ultramarket-auth',
        audience: 'ultramarket-users',
      };
      const refreshToken = jwt.sign(payload, refreshSecret, refreshOptions);

      // Store refresh token hash in database
      const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      await prisma.refreshToken.create({
        data: {
          userId,
          token: refreshTokenHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          isRevoked: false,
          deviceId: deviceId || null,
          userAgent: req?.headers['user-agent'] || null,
          ip: req?.ip || null,
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
        error: error.message,
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
      const existingDevice = await prisma.userDevice.findFirst({
        where: {
          userId,
          deviceId: deviceInfo.deviceId,
        },
      });

      if (existingDevice) {
        // Update existing device info
        await prisma.userDevice.update({
          where: { id: existingDevice.id },
          data: {
            lastAccessed: new Date(),
            browser: deviceInfo.browser.name,
            browserVersion: deviceInfo.browser.version,
            os: deviceInfo.os.name,
            osVersion: deviceInfo.os.version,
            device: deviceInfo.device.model || 'unknown',
            ip: deviceInfo.ip,
          },
        });
      } else {
        // Create new device entry
        await prisma.userDevice.create({
          data: {
            userId,
            deviceId: deviceInfo.deviceId,
            userAgent: deviceInfo.userAgent,
            browser: deviceInfo.browser.name,
            browserVersion: deviceInfo.browser.version,
            os: deviceInfo.os.name,
            osVersion: deviceInfo.os.version,
            device: deviceInfo.device.model || 'unknown',
            ip: deviceInfo.ip,
            lastAccessed: new Date(),
            isTrusted: false, // New devices are not trusted by default
          },
        });

        // If this is a new device, log it for security monitoring
        logger.info('User logged in from a new device', {
          userId,
          deviceId: deviceInfo.deviceId,
          browser: deviceInfo.browser.name,
          os: deviceInfo.os.name,
          ip: deviceInfo.ip,
        });
      }
    } catch (error) {
      // Log error but don't fail token generation if device tracking fails
      logger.error('Failed to store device information', {
        error: error.message,
        userId,
      });
    }
  }

  /**
   * Validate access token
   */
  validateAccessToken(token: string): TokenPayload | null {
    try {
      const secret = process.env.JWT_SECRET;

      if (!secret) {
        throw new AuthError('JWT secret is not configured');
      }

      const payload = jwt.verify(token, secret) as TokenPayload;
      return payload;
    } catch (error) {
      logger.debug('Access token validation failed', {
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Validate refresh token
   */
  validateRefreshToken(token: string): TokenPayload | null {
    try {
      const refreshSecret = process.env.JWT_REFRESH_SECRET;

      if (!refreshSecret) {
        throw new AuthError('JWT refresh secret is not configured');
      }

      const payload = jwt.verify(token, refreshSecret) as TokenPayload;
      return payload;
    } catch (error) {
      logger.debug('Refresh token validation failed', {
        error: error.message,
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
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      await prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
      });

      logger.info('All user tokens revoked', {
        userId,
      });
    } catch (error) {
      logger.error('Failed to revoke all user tokens', {
        error: error.message,
        userId,
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

      await prisma.refreshToken.updateMany({
        where: { token: refreshTokenHash },
        data: { isRevoked: true },
      });

      logger.debug('Token revoked successfully');
    } catch (error) {
      logger.error('Failed to revoke token', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Find refresh token in the database
   */
  async findRefreshToken(refreshToken: string): Promise<any> {
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    return prisma.refreshToken.findFirst({
      where: { token: refreshTokenHash },
    });
  }

  /**
   * Get all active devices for a user
   */
  async getUserDevices(userId: string): Promise<any[]> {
    try {
      const devices = await prisma.userDevice.findMany({
        where: { userId },
        orderBy: { lastAccessed: 'desc' },
      });

      return devices;
    } catch (error) {
      logger.error('Failed to get user devices', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Revoke tokens for a specific device
   */
  async revokeDeviceTokens(userId: string, deviceId: string): Promise<void> {
    try {
      // Revoke all tokens for this device
      await prisma.refreshToken.updateMany({
        where: {
          userId,
          deviceId,
        },
        data: { isRevoked: true },
      });

      logger.info('Device tokens revoked', {
        userId,
        deviceId,
      });
    } catch (error) {
      logger.error('Failed to revoke device tokens', {
        error: error.message,
        userId,
        deviceId,
      });
      throw error;
    }
  }
}
