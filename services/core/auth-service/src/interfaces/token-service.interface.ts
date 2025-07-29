/**
 * UltraMarket Auth Service - Token Service Interface
 * Professional JWT token management with device tracking
 */

import { Request } from 'express';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  deviceId?: string; // For tracking the device that generated the token
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface TokenServiceInterface {
  /**
   * Generate access and refresh tokens with device tracking
   * @param userId User ID for whom to generate tokens
   * @param req Express request object for device tracking
   */
  generateTokens(userId: string, req?: Request): Promise<TokenPair>;

  /**
   * Validate access token
   * @param token JWT access token
   */
  validateAccessToken(token: string): TokenPayload | null;

  /**
   * Validate refresh token
   * @param token JWT refresh token
   */
  validateRefreshToken(token: string): TokenPayload | null;

  /**
   * Refresh token pair
   * @param refreshToken Current refresh token
   * @param req Express request for device tracking
   */
  refreshTokens(refreshToken: string, req?: Request): Promise<TokenPair>;

  /**
   * Revoke all refresh tokens for a user
   * @param userId User ID
   */
  revokeAllUserTokens(userId: string): Promise<void>;

  /**
   * Revoke a specific refresh token
   * @param refreshToken Refresh token to revoke
   */
  revokeToken(refreshToken: string): Promise<void>;

  /**
   * Find refresh token in the database
   * @param refreshToken JWT refresh token (will be hashed for lookup)
   */
  findRefreshToken(refreshToken: string): Promise<any>;

  /**
   * Get all active devices for a user
   * @param userId User ID
   */
  getUserDevices(userId: string): Promise<any[]>;

  /**
   * Revoke tokens for a specific device
   * @param userId User ID
   * @param deviceId Device ID to revoke
   */
  revokeDeviceTokens(userId: string, deviceId: string): Promise<void>;
}
