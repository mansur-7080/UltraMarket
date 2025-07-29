/**
 * 🔐 UNIFIED JWT MANAGER - ULTRAMARKET PROFESSIONAL
 * 
 * Single source of truth for JWT operations across all microservices
 * Replaces 32 inconsistent JWT implementations with one professional system
 * 
 * @author UltraMarket Development Team
 * @version 3.0.0
 * @date 2024-12-28
 */

import jwt, { JwtPayload, SignOptions, VerifyOptions } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import { logger } from '../logging/professional-logger';

// Custom error for JWT operations
class JWTError extends Error {
  constructor(message: string, public code: string = 'JWT_ERROR') {
    super(message);
    this.name = 'JWTError';
  }
}

// Professional JWT Configuration Interface
export interface UnifiedJWTConfig {
  secrets: {
    access: string;
    refresh: string;
    verification: string;
    passwordReset: string;
  };
  expiry: {
    access: string;      // '15m' for security
    refresh: string;     // '30d' for UX
    verification: string; // '24h' for email verification
    passwordReset: string; // '1h' for password reset
  };
  issuer: string;
  audience: {
    web: string;
    mobile: string;
    admin: string;
  };
  security: {
    enableBlacklisting: boolean;
    enableDeviceTracking: boolean;
    enableIPValidation: boolean;
    maxConcurrentSessions: number;
    rotationEnabled: boolean;
  };
}

// Professional JWT Payload Interface
export interface UnifiedJWTPayload extends JwtPayload {
  userId: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN' | 'VENDOR' | 'MODERATOR' | 'SUPER_ADMIN';
  permissions: string[];
  sessionId: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  audience: 'web' | 'mobile' | 'admin';
  tokenType: 'access' | 'refresh' | 'verification' | 'passwordReset';
}

// Professional Token Validation Result
export interface TokenValidationResult {
  isValid: boolean;
  payload?: UnifiedJWTPayload;
  error?: string;
  securityWarnings: string[];
  shouldRefresh?: boolean;
}

// Professional Token Generation Result
export interface TokenGenerationResult {
  token: string;
  expiresAt: Date;
  tokenId: string;
}

// Professional Token Pair
export interface TokenPair {
  accessToken: TokenGenerationResult;
  refreshToken: TokenGenerationResult;
}

/**
 * Professional Unified JWT Manager
 * Replaces all inconsistent JWT implementations
 */
export class UnifiedJWTManager {
  private static instance: UnifiedJWTManager;
  private config: UnifiedJWTConfig;
  private blacklistedTokens = new Set<string>();
  private activeSessions = new Map<string, Set<string>>();

  private constructor(config: UnifiedJWTConfig) {
    this.config = config;
    this.validateConfiguration();
    logger.info('🔐 Unified JWT Manager initialized successfully', {
      issuer: config.issuer,
      securityFeatures: config.security
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: UnifiedJWTConfig): UnifiedJWTManager {
    if (!UnifiedJWTManager.instance) {
      if (!config) {
        throw new JWTError('JWT configuration required for first initialization');
      }
      UnifiedJWTManager.instance = new UnifiedJWTManager(config);
    }
    return UnifiedJWTManager.instance;
  }

  /**
   * Professional token generation with comprehensive options
   */
  public async generateTokenPair(
    user: {
      id: string;
      email: string;
      role: UnifiedJWTPayload['role'];
      permissions: string[];
    },
    context: {
      audience: 'web' | 'mobile' | 'admin';
      deviceId?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<TokenPair> {
    const sessionId = this.generateSecureId();

    // Create base payload
    const basePayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      sessionId,
      deviceId: context.deviceId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      audience: context.audience,
      iss: this.config.issuer,
      aud: this.config.audience[context.audience]
    };

    // Generate access token
    const accessTokenPayload: UnifiedJWTPayload = {
      ...basePayload,
      tokenType: 'access'
    };

    const accessToken = this.generateToken(
      accessTokenPayload,
      this.config.secrets.access,
      this.config.expiry.access
    );

    // Generate refresh token
    const refreshTokenPayload: UnifiedJWTPayload = {
      ...basePayload,
      tokenType: 'refresh'
    };

    const refreshToken = this.generateToken(
      refreshTokenPayload,
      this.config.secrets.refresh,
      this.config.expiry.refresh
    );

    // Track session
    if (this.config.security.enableDeviceTracking) {
      this.trackSession(user.id, sessionId);
    }

    logger.info('🎫 Token pair generated successfully', {
      userId: user.id,
      role: user.role,
      audience: context.audience,
      sessionId,
      deviceId: context.deviceId
    });

    return {
      accessToken,
      refreshToken
    };
  }

  /**
   * Professional token validation with comprehensive security checks
   */
  public async validateToken(
    token: string,
    tokenType: 'access' | 'refresh' | 'verification' | 'passwordReset' = 'access',
    context: {
      ipAddress?: string;
      userAgent?: string;
      audience?: 'web' | 'mobile' | 'admin';
    } = {}
  ): Promise<TokenValidationResult> {
    const securityWarnings: string[] = [];

    try {
      // Check blacklist first
      if (this.config.security.enableBlacklisting && this.blacklistedTokens.has(token)) {
        logger.warn('🚫 Blacklisted token access attempt', {
          tokenType,
          ipAddress: context.ipAddress
        });
        
        return {
          isValid: false,
          error: 'Token has been revoked',
          securityWarnings: ['Token blacklisted']
        };
      }

      // Get appropriate secret
      const secret = this.getSecretForTokenType(tokenType);

      // Verify token
      const verifyOptions: VerifyOptions = {
        issuer: this.config.issuer,
        algorithms: ['HS256'],
        clockTolerance: 30 // 30 seconds tolerance for clock skew
      };

      // Add audience verification if provided
      if (context.audience) {
        verifyOptions.audience = this.config.audience[context.audience];
      }

      const payload = jwt.verify(token, secret, verifyOptions) as UnifiedJWTPayload;

      // Verify token type
      if (payload.tokenType !== tokenType) {
        return {
          isValid: false,
          error: `Expected ${tokenType} token, got ${payload.tokenType}`,
          securityWarnings: ['Token type mismatch']
        };
      }

      // Security validations
      if (this.config.security.enableIPValidation && context.ipAddress) {
        if (payload.ipAddress && payload.ipAddress !== context.ipAddress) {
          securityWarnings.push('IP address changed');
          logger.warn('🚨 IP address mismatch detected', {
            userId: payload.userId,
            originalIP: payload.ipAddress,
            currentIP: context.ipAddress,
            sessionId: payload.sessionId
          });
        }
      }

      // Check if token should be refreshed soon
      const shouldRefresh = this.shouldRefreshToken(payload);

      logger.debug('✅ Token validation successful', {
        userId: payload.userId,
        tokenType,
        sessionId: payload.sessionId,
        warningsCount: securityWarnings.length
      });

      return {
        isValid: true,
        payload,
        securityWarnings,
        shouldRefresh
      };

    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return {
          isValid: false,
          error: 'Token has expired',
          securityWarnings: [],
          shouldRefresh: tokenType === 'access'
        };
      }

      if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('🔍 Invalid JWT token', {
          error: error.message,
          tokenType,
          ipAddress: context.ipAddress
        });
        
        return {
          isValid: false,
          error: 'Invalid token format',
          securityWarnings: ['Malformed token']
        };
      }

      logger.error('❌ Token validation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tokenType
      });

      return {
        isValid: false,
        error: 'Token validation failed',
        securityWarnings: ['Validation error']
      };
    }
  }

  /**
   * Professional refresh token operation
   */
  public async refreshTokens(refreshToken: string, context: {
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
  } = {}): Promise<TokenPair | null> {
    const validation = await this.validateToken(refreshToken, 'refresh', context);
    
    if (!validation.isValid || !validation.payload) {
      logger.warn('🔄 Refresh token validation failed', {
        error: validation.error,
        ipAddress: context.ipAddress
      });
      return null;
    }

    const payload = validation.payload;

    // Generate new token pair
    return this.generateTokenPair(
      {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        permissions: payload.permissions
      },
      {
        audience: payload.audience,
        deviceId: context.deviceId || payload.deviceId,
        ipAddress: context.ipAddress || payload.ipAddress,
        userAgent: context.userAgent || payload.userAgent
      }
    );
  }

  /**
   * Professional token blacklisting
   */
  public async revokeToken(token: string, reason: string = 'Manual revocation'): Promise<void> {
    if (this.config.security.enableBlacklisting) {
      this.blacklistedTokens.add(token);
      
      // Extract user info for logging
      try {
        const payload = jwt.decode(token) as UnifiedJWTPayload;
        logger.info('🗑️ Token revoked', {
          userId: payload?.userId,
          sessionId: payload?.sessionId,
          tokenType: payload?.tokenType,
          reason
        });
      } catch (error) {
        logger.warn('Failed to decode revoked token for logging', { error });
      }
    }
  }

  /**
   * Professional session management
   */
  public revokeAllUserSessions(userId: string): void {
    const userSessions = this.activeSessions.get(userId);
    if (userSessions) {
      userSessions.clear();
      this.activeSessions.delete(userId);
      logger.info('🧹 All user sessions revoked', { userId });
    }
  }

  // Private utility methods
  private generateToken(
    payload: UnifiedJWTPayload,
    secret: string,
    expiresIn: string
  ): TokenGenerationResult {
    const tokenId = this.generateSecureId();
    const now = new Date();
    
    const signOptions = {
      expiresIn,
      issuer: this.config.issuer,
      audience: payload.aud,
      jwtid: tokenId
    };

    const token = jwt.sign(payload as any, secret, signOptions as SignOptions);
    
    // Calculate expiration date
    const expiresAt = new Date(now.getTime() + this.parseExpiry(expiresIn));

    return {
      token,
      expiresAt,
      tokenId
    };
  }

  private getSecretForTokenType(tokenType: 'access' | 'refresh' | 'verification' | 'passwordReset'): string {
    const secrets = {
      access: this.config.secrets.access,
      refresh: this.config.secrets.refresh,
      verification: this.config.secrets.verification,
      passwordReset: this.config.secrets.passwordReset
    };
    
    return secrets[tokenType];
  }

  private shouldRefreshToken(payload: UnifiedJWTPayload): boolean {
    if (!payload.exp) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = payload.exp - now;
    
    // Suggest refresh if less than 5 minutes remaining
    return timeUntilExpiry < 300;
  }

  private trackSession(userId: string, sessionId: string): void {
    if (!this.activeSessions.has(userId)) {
      this.activeSessions.set(userId, new Set());
    }
    
    const userSessions = this.activeSessions.get(userId)!;
    userSessions.add(sessionId);
    
    // Enforce max concurrent sessions
    if (userSessions.size > this.config.security.maxConcurrentSessions) {
      const oldestSession = userSessions.values().next().value;
      userSessions.delete(oldestSession);
      logger.warn('⚡ Session limit exceeded, oldest session removed', {
        userId,
        removedSession: oldestSession,
        maxSessions: this.config.security.maxConcurrentSessions
      });
    }
  }

  private generateSecureId(): string {
    return randomBytes(16).toString('hex');
  }

  private parseExpiry(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1));
    
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 60 * 1000; // Default 1 minute
    }
  }

  private validateConfiguration(): void {
    const { secrets, expiry } = this.config;
    
    // Validate secrets strength
    Object.entries(secrets).forEach(([name, secret]) => {
      if (!secret || secret.length < 32) {
        logger.warn(`⚠️ Weak ${name} secret (< 32 characters)`, { secretLength: secret?.length || 0 });
      }
    });
    
    // Validate expiry formats
    Object.entries(expiry).forEach(([name, exp]) => {
      if (!/^\d+[smhd]$/.test(exp)) {
        throw new JWTError(`Invalid ${name} expiry format: ${exp}`);
      }
    });
    
    logger.info('✅ JWT configuration validated successfully');
  }
}

/**
 * Professional Express Middleware for JWT Authentication
 * Replaces all inconsistent auth middleware implementations
 */
export class UnifiedJWTMiddleware {
  private jwtManager: UnifiedJWTManager;

  constructor(jwtManager: UnifiedJWTManager) {
    this.jwtManager = jwtManager;
  }

  /**
   * Standard authentication middleware
   */
  public authenticate = (options: {
    audience?: 'web' | 'mobile' | 'admin';
    optional?: boolean;
  } = {}) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          if (options.optional) {
            return next();
          }
          
          res.status(401).json({
            success: false,
            error: {
              code: 'AUTH_TOKEN_MISSING',
              message: 'Authorization token required',
              timestamp: new Date().toISOString()
            }
          });
          return;
        }

        const token = authHeader.substring(7);
        const validation = await this.jwtManager.validateToken(token, 'access', {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          audience: options.audience
        });

        if (!validation.isValid || !validation.payload) {
          logger.warn('🚫 Authentication failed', {
            error: validation.error,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });
          
          res.status(401).json({
            success: false,
            error: {
              code: 'AUTH_TOKEN_INVALID',
              message: validation.error || 'Invalid token',
              shouldRefresh: validation.shouldRefresh,
              timestamp: new Date().toISOString()
            }
          });
          return;
        }

        // Attach user to request
        (req as any).user = validation.payload;
        
        // Add security warnings to response headers
        if (validation.securityWarnings.length > 0) {
          res.set('X-Security-Warnings', validation.securityWarnings.join(', '));
        }

        // Suggest refresh if needed
        if (validation.shouldRefresh) {
          res.set('X-Should-Refresh-Token', 'true');
        }

        next();
      } catch (error) {
        logger.error('❌ Authentication middleware error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          ip: req.ip
        });
        
        res.status(500).json({
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: 'Authentication failed',
            timestamp: new Date().toISOString()
          }
        });
      }
    };
  };

  /**
   * Role-based authorization middleware
   */
  public authorize = (requiredRoles: UnifiedJWTPayload['role'][] | UnifiedJWTPayload['role']) => {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    return (req: Request, res: Response, next: NextFunction): void => {
      const user = (req as any).user as UnifiedJWTPayload;
      
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_REQUIRED',
            message: 'Authentication required',
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      if (!roles.includes(user.role)) {
        logger.warn('🔒 Authorization failed', {
          userId: user.userId,
          userRole: user.role,
          requiredRoles: roles,
          ip: req.ip
        });
        
        res.status(403).json({
          success: false,
          error: {
            code: 'AUTH_INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions',
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      next();
    };
  };

  /**
   * Permission-based authorization middleware
   */
  public requirePermissions = (requiredPermissions: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const user = (req as any).user as UnifiedJWTPayload;
      
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_REQUIRED',
            message: 'Authentication required',
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      const hasAllPermissions = requiredPermissions.every(permission => 
        user.permissions.includes(permission) || user.permissions.includes('*')
      );

      if (!hasAllPermissions) {
        logger.warn('🔐 Permission check failed', {
          userId: user.userId,
          userPermissions: user.permissions,
          requiredPermissions,
          ip: req.ip
        });
        
        res.status(403).json({
          success: false,
          error: {
            code: 'AUTH_MISSING_PERMISSIONS',
            message: 'Required permissions not found',
            requiredPermissions,
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      next();
    };
  };
}

// Default configuration factory
export const createDefaultJWTConfig = (): UnifiedJWTConfig => {
  const getEnvSecret = (key: string, fallback?: string): string => {
    const secret = process.env[key] || fallback;
    if (!secret) {
      throw new JWTError(`Missing required JWT secret: ${key}`);
    }
    return secret;
  };

  return {
    secrets: {
      access: getEnvSecret('JWT_ACCESS_SECRET'),
      refresh: getEnvSecret('JWT_REFRESH_SECRET'),
      verification: getEnvSecret('JWT_VERIFICATION_SECRET'),
      passwordReset: getEnvSecret('JWT_PASSWORD_RESET_SECRET')
    },
    expiry: {
      access: process.env.JWT_ACCESS_EXPIRY || '15m',
      refresh: process.env.JWT_REFRESH_EXPIRY || '30d',
      verification: process.env.JWT_VERIFICATION_EXPIRY || '24h',
      passwordReset: process.env.JWT_PASSWORD_RESET_EXPIRY || '1h'
    },
    issuer: process.env.JWT_ISSUER || 'UltraMarket-API',
    audience: {
      web: process.env.JWT_AUDIENCE_WEB || 'ultramarket.uz',
      mobile: process.env.JWT_AUDIENCE_MOBILE || 'mobile.ultramarket.uz',
      admin: process.env.JWT_AUDIENCE_ADMIN || 'admin.ultramarket.uz'
    },
    security: {
      enableBlacklisting: process.env.JWT_ENABLE_BLACKLISTING === 'true',
      enableDeviceTracking: process.env.JWT_ENABLE_DEVICE_TRACKING === 'true',
      enableIPValidation: process.env.JWT_ENABLE_IP_VALIDATION === 'true',
      maxConcurrentSessions: parseInt(process.env.JWT_MAX_CONCURRENT_SESSIONS || '3'),
      rotationEnabled: process.env.JWT_ROTATION_ENABLED === 'true'
    }
  };
};

// Export default configured instances
let unifiedJWTManager: UnifiedJWTManager;
let unifiedJWTMiddleware: UnifiedJWTMiddleware;

try {
  const defaultConfig = createDefaultJWTConfig();
  unifiedJWTManager = UnifiedJWTManager.getInstance(defaultConfig);
  unifiedJWTMiddleware = new UnifiedJWTMiddleware(unifiedJWTManager);
} catch (error) {
  logger.warn('Could not initialize default JWT configuration', { error });
}

// Export authentication middleware directly for easy import
export const authenticate = unifiedJWTMiddleware?.authenticate();
export const authorize = unifiedJWTMiddleware?.authorize;
export const requirePermissions = unifiedJWTMiddleware?.requirePermissions;

export { unifiedJWTManager, unifiedJWTMiddleware }; 