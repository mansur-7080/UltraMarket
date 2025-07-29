/**
 * JWT Utility Functions
 * Simple token generation and verification utilities
 */

import jwt from 'jsonwebtoken';
import { logger } from '../logging/logger';

export interface TokenPayload {
  userId: string;
  email?: string;
  role?: string;
  jti?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate access and refresh tokens
 */
export async function generateTokens(userId: string): Promise<TokenPair> {
  try {
    const jti = generateTokenId();

    // Generate access token (15 minutes)
    const accessToken = jwt.sign(
      {
        userId,
        jti,
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
      },
      process.env.JWT_ACCESS_SECRET!,
      {
        expiresIn: '15m',
        issuer: 'ultramarket',
        audience: 'ultramarket-users',
      }
    );

    // Generate refresh token (7 days)
    const refreshToken = jwt.sign(
      {
        userId,
        jti,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
      },
      process.env.JWT_REFRESH_SECRET!,
      {
        expiresIn: '7d',
        issuer: 'ultramarket',
        audience: 'ultramarket-users',
      }
    );

    logger.info('Tokens generated successfully', { userId, jti });

    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    logger.error('Token generation failed', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Token generation failed');
  }
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!, {
      issuer: 'ultramarket',
      audience: 'ultramarket-users',
    }) as TokenPayload;

    return decoded;
  } catch (error) {
    logger.error('Token verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Invalid token');
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!, {
      issuer: 'ultramarket',
      audience: 'ultramarket-users',
    }) as TokenPayload;

    return decoded;
  } catch (error) {
    logger.error('Refresh token verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Invalid refresh token');
  }
}

/**
 * Generate email verification token
 */
export function generateEmailVerificationToken(userId: string): string {
  return jwt.sign(
    {
      userId,
      type: 'email_verification',
      iat: Math.floor(Date.now() / 1000),
    },
    process.env.JWT_EMAIL_VERIFICATION_SECRET!,
    {
      expiresIn: '24h',
      issuer: 'ultramarket',
      audience: 'ultramarket-users',
    }
  );
}

/**
 * Generate password reset token
 */
export function generatePasswordResetToken(userId: string): string {
  return jwt.sign(
    {
      userId,
      type: 'password_reset',
      iat: Math.floor(Date.now() / 1000),
    },
    process.env.JWT_PASSWORD_RESET_SECRET!,
    {
      expiresIn: '1h',
      issuer: 'ultramarket',
      audience: 'ultramarket-users',
    }
  );
}

/**
 * Generate unique token ID
 */
function generateTokenId(): string {
  return require('crypto').randomBytes(32).toString('hex');
}

/**
 * Decode token without verification (for logging purposes)
 */
export function decodeToken(token: string): any {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error('Token decode failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return true;
    }
    return Date.now() >= decoded.exp * 1000;
  } catch (error) {
    return true;
  }
}

/**
 * Get token expiration time
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return null;
    }
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
}
