import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { logger } from '../logging/logger';
import { AppError } from '../errors/AppError';

// JWT Configuration interface
export interface JWTConfig {
  accessSecret: string;
  refreshSecret: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
  issuer: string;
  audience: string;
}

// JWT Payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  sessionId: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

// Refresh Token interface
export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

// JWT Service class
export class JWTService {
  private config: JWTConfig;
  private blacklistedTokens: Set<string> = new Set();

  constructor(config?: Partial<JWTConfig>) {
    this.config = {
      accessSecret: config?.accessSecret || this.generateSecureSecret(),
      refreshSecret: config?.refreshSecret || this.generateSecureSecret(),
      accessExpiresIn: config?.accessExpiresIn || '15m',
      refreshExpiresIn: config?.refreshExpiresIn || '7d',
      issuer: config?.issuer || 'ultramarket.uz',
      audience: config?.audience || 'ultramarket-api',
    };

    this.validateSecrets();
  }

  /**
   * Generate cryptographically secure secret
   */
  private generateSecureSecret(length: number = 64): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Validate JWT secrets strength
   */
  private validateSecrets(): void {
    const minLength = 32;
    const weakPatterns = [
      'secret',
      'password',
      'key',
      'jwt',
      'token',
      'ultramarket',
      'admin',
      'user',
      '123456',
    ];

    [this.config.accessSecret, this.config.refreshSecret].forEach((secret, index) => {
      const secretName = index === 0 ? 'Access Secret' : 'Refresh Secret';

      if (secret.length < minLength) {
        throw new AppError(
          `${secretName} must be at least ${minLength} characters long`,
          500,
          true,
          'WEAK_JWT_SECRET'
        );
      }

      const lowerSecret = secret.toLowerCase();
      const hasWeakPattern = weakPatterns.some((pattern) => lowerSecret.includes(pattern));

      if (hasWeakPattern) {
        logger.warn(`${secretName} contains weak patterns`, {
          secretName,
          event: 'jwt_weak_secret',
        });
      }
    });

    logger.info('JWT secrets validated successfully');
  }

  /**
   * Generate access token
   */
  generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'>): string {
    try {
      const tokenPayload: JWTPayload = {
        ...payload,
        iss: this.config.issuer,
        aud: this.config.audience,
      };

      const token = jwt.sign(tokenPayload, this.config.accessSecret, {
        expiresIn: this.config.accessExpiresIn,
        algorithm: 'HS256',
      });

      logger.info('Access token generated', {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        sessionId: payload.sessionId,
      });

      return token;
    } catch (error) {
      logger.error('Failed to generate access token', error);
      throw new AppError('Token generation failed', 500, true, 'TOKEN_GENERATION_ERROR');
    }
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string {
    try {
      const token = jwt.sign(payload, this.config.refreshSecret, {
        expiresIn: this.config.refreshExpiresIn,
        algorithm: 'HS256',
      });

      logger.info('Refresh token generated', {
        userId: payload.userId,
        sessionId: payload.sessionId,
        tokenVersion: payload.tokenVersion,
      });

      return token;
    } catch (error) {
      logger.error('Failed to generate refresh token', error);
      throw new AppError(
        'Refresh token generation failed',
        500,
        true,
        'REFRESH_TOKEN_GENERATION_ERROR'
      );
    }
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): JWTPayload {
    try {
      if (this.blacklistedTokens.has(token)) {
        throw new AppError('Token has been blacklisted', 401, true, 'TOKEN_BLACKLISTED');
      }

      const decoded = jwt.verify(token, this.config.accessSecret, {
        algorithms: ['HS256'],
        issuer: this.config.issuer,
        audience: this.config.audience,
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Token has expired', 401, true, 'TOKEN_EXPIRED');
      }

      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid token', 401, true, 'INVALID_TOKEN');
      }

      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Token verification failed', error);
      throw new AppError('Token verification failed', 401, true, 'TOKEN_VERIFICATION_ERROR');
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      if (this.blacklistedTokens.has(token)) {
        throw new AppError(
          'Refresh token has been blacklisted',
          401,
          true,
          'REFRESH_TOKEN_BLACKLISTED'
        );
      }

      const decoded = jwt.verify(token, this.config.refreshSecret, {
        algorithms: ['HS256'],
      }) as RefreshTokenPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Refresh token has expired', 401, true, 'REFRESH_TOKEN_EXPIRED');
      }

      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid refresh token', 401, true, 'INVALID_REFRESH_TOKEN');
      }

      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Refresh token verification failed', error);
      throw new AppError(
        'Refresh token verification failed',
        401,
        true,
        'REFRESH_TOKEN_VERIFICATION_ERROR'
      );
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch (error) {
      logger.error('Token decode failed', error);
      return null;
    }
  }

  /**
   * Blacklist token
   */
  blacklistToken(token: string): void {
    this.blacklistedTokens.add(token);
    logger.info('Token blacklisted', { tokenHash: this.hashToken(token) });
  }

  /**
   * Check if token is blacklisted
   */
  isTokenBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }

  /**
   * Generate token pair
   */
  generateTokenPair(userPayload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'>): {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  } {
    const accessToken = this.generateAccessToken(userPayload);
    const refreshToken = this.generateRefreshToken({
      userId: userPayload.userId,
      sessionId: userPayload.sessionId,
      tokenVersion: 1,
    });

    // Calculate expiration time in seconds
    const expiresIn = this.parseExpirationTime(this.config.accessExpiresIn);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Refresh access token
   */
  refreshAccessToken(refreshToken: string): {
    accessToken: string;
    expiresIn: number;
  } {
    const refreshPayload = this.verifyRefreshToken(refreshToken);

    // Here you would typically fetch user data from database
    // For now, we'll create a minimal payload
    const userPayload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'> = {
      userId: refreshPayload.userId,
      email: '', // Should be fetched from database
      role: '', // Should be fetched from database
      permissions: [], // Should be fetched from database
      sessionId: refreshPayload.sessionId,
    };

    const accessToken = this.generateAccessToken(userPayload);
    const expiresIn = this.parseExpirationTime(this.config.accessExpiresIn);

    return {
      accessToken,
      expiresIn,
    };
  }

  /**
   * Parse expiration time string to seconds
   */
  private parseExpirationTime(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new AppError('Invalid expiration time format', 500, true, 'INVALID_EXPIRATION_FORMAT');
    }

    const [, value, unit] = match;
    const numValue = parseInt(value, 10);

    switch (unit) {
      case 's':
        return numValue;
      case 'm':
        return numValue * 60;
      case 'h':
        return numValue * 3600;
      case 'd':
        return numValue * 86400;
      default:
        throw new AppError('Invalid expiration time unit', 500, true, 'INVALID_EXPIRATION_UNIT');
    }
  }

  /**
   * Hash token for logging (security)
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex').substring(0, 16);
  }

  /**
   * Get token expiration date
   */
  getTokenExpiration(token: string): Date | null {
    try {
      const decoded = this.decodeToken(token);
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return true;
    return expiration < new Date();
  }

  /**
   * Generate secure session ID
   */
  generateSessionId(): string {
    return crypto.randomUUID();
  }

  /**
   * Clean up expired blacklisted tokens (should be called periodically)
   */
  cleanupBlacklistedTokens(): void {
    const expiredTokens: string[] = [];

    for (const token of this.blacklistedTokens) {
      if (this.isTokenExpired(token)) {
        expiredTokens.push(token);
      }
    }

    expiredTokens.forEach((token) => this.blacklistedTokens.delete(token));

    logger.info('Cleaned up expired blacklisted tokens', {
      cleanedCount: expiredTokens.length,
      remainingCount: this.blacklistedTokens.size,
    });
  }
}

// Default JWT service instance
export const jwtService = new JWTService({
  accessSecret: process.env.JWT_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
});

// JWT Middleware for Express
export const jwtMiddleware = (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(
        'Authorization header missing or invalid',
        401,
        true,
        'MISSING_AUTH_HEADER'
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const payload = jwtService.verifyAccessToken(token);

    req.user = payload;
    req.token = token;

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    }

    logger.error('JWT middleware error', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
};

// Optional JWT Middleware (doesn't fail if token is missing)
export const optionalJwtMiddleware = (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const payload = jwtService.verifyAccessToken(token);

    req.user = payload;
    req.token = token;

    next();
  } catch (error) {
    // Log error but don't fail the request
    logger.warn('Optional JWT middleware error', error);
    next();
  }
};

export default jwtService;
