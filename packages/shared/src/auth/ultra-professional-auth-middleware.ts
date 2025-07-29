/**
 * 🔐 Ultra Professional Authentication Middleware
 * UltraMarket E-commerce Platform
 * 
 * Bu fayl barcha servislar uchun unified authentication middleware
 * va professional security features ni ta'minlaydi
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { log } from '../logging/ultra-professional-logger';

/**
 * 🎯 JWT Payload Interface
 */
export interface UltraJWTPayload extends jwt.JwtPayload {
  userId: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN' | 'VENDOR' | 'MODERATOR' | 'SUPER_ADMIN';
  permissions: string[];
  sessionId: string;
  tokenType: 'access' | 'refresh';
  deviceId?: string;
  ipAddress?: string;
  issuedAt?: number;
  lastActivity?: number;
  features?: string[];
}

/**
 * 🌍 Extended Request Interface
 */
declare global {
  namespace Express {
    interface Request {
      user?: UltraJWTPayload;
      sessionId?: string;
      deviceId?: string;
      rateLimit?: {
        limit: number;
        current: number;
        remaining: number;
        resetTime: Date;
      };
    }
  }
}

/**
 * 🔧 Auth Configuration
 */
export interface UltraAuthConfig {
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  issuer: string;
  audience: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  enableRateLimit: boolean;
  rateLimitWindow: number;
  rateLimitMax: number;
  enableSessionTracking: boolean;
  enableDeviceTracking: boolean;
  maxConcurrentSessions: number;
  securityHeaders: boolean;
  enableAuditLogging: boolean;
}

/**
 * 🚨 Authentication Errors
 */
export class UltraAuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 401,
    public readonly code: string = 'AUTH_ERROR',
    public readonly details?: any
  ) {
    super(message);
    this.name = 'UltraAuthError';
  }
}

export class TokenExpiredError extends UltraAuthError {
  constructor(message: string = 'Token expired') {
    super(message, 401, 'TOKEN_EXPIRED');
  }
}

export class TokenInvalidError extends UltraAuthError {
  constructor(message: string = 'Invalid token') {
    super(message, 401, 'TOKEN_INVALID');
  }
}

export class InsufficientPermissionsError extends UltraAuthError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'INSUFFICIENT_PERMISSIONS');
  }
}

export class RateLimitExceededError extends UltraAuthError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

/**
 * 🏭 Ultra Professional Auth Manager
 */
export class UltraProfessionalAuthManager {
  private config: UltraAuthConfig;
  private blacklistedTokens: Set<string> = new Set();
  private activeSessions: Map<string, Set<string>> = new Map();
  
  constructor(config: Partial<UltraAuthConfig> = {}) {
    this.config = {
      jwtAccessSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || '',
      jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || '',
      issuer: process.env.JWT_ISSUER || 'UltraMarket',
      audience: process.env.JWT_AUDIENCE || 'ultramarket.uz',
      accessTokenExpiry: '15m',
      refreshTokenExpiry: '7d',
      enableRateLimit: true,
      rateLimitWindow: 15 * 60 * 1000, // 15 minutes
      rateLimitMax: 100,
      enableSessionTracking: true,
      enableDeviceTracking: true,
      maxConcurrentSessions: 5,
      securityHeaders: true,
      enableAuditLogging: true,
      ...config
    };
    
    this.validateConfig();
    this.startCleanupTasks();
  }
  
  /**
   * 🔍 Validate configuration
   */
  private validateConfig(): void {
    if (!this.config.jwtAccessSecret) {
      throw new Error('JWT_ACCESS_SECRET is required');
    }
    
    if (this.config.jwtAccessSecret.length < 32) {
      log.warn('JWT secret is weak (less than 32 characters)', {
        secretLength: this.config.jwtAccessSecret.length,
        service: 'auth-manager'
      });
    }
    
    if (!this.config.jwtRefreshSecret) {
      this.config.jwtRefreshSecret = this.config.jwtAccessSecret;
      log.warn('JWT_REFRESH_SECRET not set, using JWT_ACCESS_SECRET', {
        service: 'auth-manager'
      });
    }
    
    log.info('Ultra Professional Auth Manager initialized', {
      service: 'auth-manager',
      issuer: this.config.issuer,
      audience: this.config.audience,
      rateLimitEnabled: this.config.enableRateLimit,
      sessionTrackingEnabled: this.config.enableSessionTracking
    });
  }
  
  /**
   * ⏰ Start cleanup tasks
   */
  private startCleanupTasks(): void {
    // Clean up blacklisted tokens every hour
    setInterval(() => {
      this.cleanupExpiredTokens();
    }, 60 * 60 * 1000);
    
    // Clean up inactive sessions every 30 minutes
    setInterval(() => {
      this.cleanupInactiveSessions();
    }, 30 * 60 * 1000);
  }
  
  /**
   * 🧹 Clean up expired tokens
   */
  private cleanupExpiredTokens(): void {
    const expiredTokens: string[] = [];
    
    this.blacklistedTokens.forEach(token => {
      try {
        jwt.verify(token, this.config.jwtAccessSecret);
      } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
          expiredTokens.push(token);
        }
      }
    });
    
    expiredTokens.forEach(token => {
      this.blacklistedTokens.delete(token);
    });
    
    if (expiredTokens.length > 0) {
      log.info(`Cleaned up ${expiredTokens.length} expired blacklisted tokens`, {
        service: 'auth-manager',
        cleanedCount: expiredTokens.length
      });
    }
  }
  
  /**
   * 🧹 Clean up inactive sessions
   */
  private cleanupInactiveSessions(): void {
    // Implementation for session cleanup
    // This would typically involve checking last activity times
    log.debug('Session cleanup task executed', {
      service: 'auth-manager',
      activeSessions: this.activeSessions.size
    });
  }
  
  /**
   * 🔑 Generate JWT Token
   */
  public generateAccessToken(payload: Omit<UltraJWTPayload, 'iat' | 'exp' | 'iss' | 'aud'>): string {
    const tokenPayload: any = {
      ...payload,
      tokenType: 'access',
      iss: this.config.issuer,
      aud: this.config.audience
    };
    
    const token = jwt.sign(tokenPayload, this.config.jwtAccessSecret, {
      expiresIn: this.config.accessTokenExpiry,
      issuer: this.config.issuer,
      audience: this.config.audience
    });
    
    log.security('Access token generated', {
      securityEvent: 'AUTH_SUCCESS',
      riskLevel: 'LOW',
      userId: payload.userId,
      role: payload.role,
      sessionId: payload.sessionId,
      service: 'auth-manager'
    });
    
    return token;
  }
  
  /**
   * 🔄 Generate Refresh Token
   */
  public generateRefreshToken(payload: Omit<UltraJWTPayload, 'iat' | 'exp' | 'iss' | 'aud'>): string {
    const tokenPayload: any = {
      ...payload,
      tokenType: 'refresh',
      iss: this.config.issuer,
      aud: this.config.audience
    };
    
    const token = jwt.sign(tokenPayload, this.config.jwtRefreshSecret, {
      expiresIn: this.config.refreshTokenExpiry,
      issuer: this.config.issuer,
      audience: this.config.audience
    });
    
    return token;
  }
  
  /**
   * 🔍 Verify Access Token
   */
  public verifyAccessToken(token: string): UltraJWTPayload {
    if (this.blacklistedTokens.has(token)) {
      throw new TokenInvalidError('Token has been blacklisted');
    }
    
    try {
      const decoded = jwt.verify(token, this.config.jwtAccessSecret, {
        issuer: this.config.issuer,
        audience: this.config.audience
      }) as UltraJWTPayload;
      
      if (decoded.tokenType !== 'access') {
        throw new TokenInvalidError('Invalid token type');
      }
      
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        log.security('Expired token usage attempt', {
          securityEvent: 'AUTH_FAILURE',
          riskLevel: 'LOW',
          error: 'Token expired',
          service: 'auth-manager'
        } as any);
        throw new TokenExpiredError();
      } else if (error instanceof jwt.JsonWebTokenError) {
        log.security('Invalid token usage attempt', {
          securityEvent: 'AUTH_FAILURE',
          riskLevel: 'MEDIUM',
          error: error.message,
          service: 'auth-manager'
        } as any);
        throw new TokenInvalidError(error.message);
      }
      throw error;
    }
  }
  
  /**
   * 🔄 Verify Refresh Token
   */
  public verifyRefreshToken(token: string): UltraJWTPayload {
    if (this.blacklistedTokens.has(token)) {
      throw new TokenInvalidError('Refresh token has been blacklisted');
    }
    
    try {
      const decoded = jwt.verify(token, this.config.jwtRefreshSecret, {
        issuer: this.config.issuer,
        audience: this.config.audience
      }) as UltraJWTPayload;
      
      if (decoded.tokenType !== 'refresh') {
        throw new TokenInvalidError('Invalid refresh token type');
      }
      
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new TokenExpiredError('Refresh token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new TokenInvalidError(error.message);
      }
      throw error;
    }
  }
  
  /**
   * 🚫 Blacklist token
   */
  public blacklistToken(token: string): void {
    this.blacklistedTokens.add(token);
    log.security('Token blacklisted', {
      securityEvent: 'AUTH_FAILURE',
      riskLevel: 'MEDIUM',
      action: 'Token blacklisted',
      service: 'auth-manager'
    });
  }
  
  /**
   * 👥 Track session
   */
  public trackSession(userId: string, sessionId: string): void {
    if (!this.config.enableSessionTracking) return;
    
    if (!this.activeSessions.has(userId)) {
      this.activeSessions.set(userId, new Set());
    }
    
    const userSessions = this.activeSessions.get(userId)!;
    userSessions.add(sessionId);
    
    // Enforce max concurrent sessions
    if (userSessions.size > this.config.maxConcurrentSessions) {
      const sessions = Array.from(userSessions);
      const oldestSession = sessions[0];
      userSessions.delete(oldestSession);
      
      log.security('Max concurrent sessions exceeded, removed oldest session', {
        securityEvent: 'ADMIN_ACTION',
        riskLevel: 'LOW',
        userId,
        removedSessionId: oldestSession,
        activeSessions: userSessions.size,
        service: 'auth-manager'
      });
    }
  }
  
  /**
   * 🚪 Remove session
   */
  public removeSession(userId: string, sessionId: string): void {
    if (!this.config.enableSessionTracking) return;
    
    const userSessions = this.activeSessions.get(userId);
    if (userSessions) {
      userSessions.delete(sessionId);
      if (userSessions.size === 0) {
        this.activeSessions.delete(userId);
      }
    }
  }
  
  /**
   * 🔍 Check permissions
   */
  public checkPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  }
  
  /**
   * 🔍 Check role access
   */
  public checkRoleAccess(userRole: string, allowedRoles: string[]): boolean {
    return allowedRoles.includes(userRole);
  }
}

/**
 * 🌟 Global Auth Manager Instance
 */
export const ultraAuthManager = new UltraProfessionalAuthManager();

/**
 * 🛡️ Authentication Middleware
 */
export const authenticateToken = (required: boolean = true) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        if (required) {
          log.security('Missing or invalid authorization header', {
            securityEvent: 'AUTH_FAILURE',
            riskLevel: 'MEDIUM',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            url: req.originalUrl,
            service: 'auth-middleware'
          });
          
          res.status(401).json({
            success: false,
            error: 'Missing or invalid authorization header',
            code: 'MISSING_TOKEN'
          });
          return;
        } else {
          next();
          return;
        }
      }
      
      const token = authHeader.substring(7);
      const decoded = ultraAuthManager.verifyAccessToken(token);
      
      // Track session
      if (decoded.sessionId) {
        ultraAuthManager.trackSession(decoded.userId, decoded.sessionId);
      }
      
      req.user = decoded;
      req.sessionId = decoded.sessionId;
      
      log.security('Authentication successful', {
        securityEvent: 'AUTH_SUCCESS',
        riskLevel: 'LOW',
        userId: decoded.userId,
        role: decoded.role,
        sessionId: decoded.sessionId,
        ip: req.ip,
        service: 'auth-middleware'
      });
      
      next();
    } catch (error) {
      if (error instanceof UltraAuthError) {
        log.security(`Authentication failed: ${error.message}`, {
          securityEvent: 'AUTH_FAILURE',
          riskLevel: error.code === 'TOKEN_EXPIRED' ? 'LOW' : 'MEDIUM',
          error: error.message,
          code: error.code,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.originalUrl,
          service: 'auth-middleware'
        });
        
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: error.code
        });
        return;
      }
      
      log.error('Unexpected authentication error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        service: 'auth-middleware'
      });
      
      res.status(500).json({
        success: false,
        error: 'Internal authentication error',
        code: 'INTERNAL_ERROR'
      });
    }
  };
};

/**
 * 🔐 Role-based Access Control
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }
    
    if (!ultraAuthManager.checkRoleAccess(req.user.role, allowedRoles)) {
      log.security('Role access denied', {
        securityEvent: 'PERMISSION_DENIED',
        riskLevel: 'HIGH',
        userId: req.user.userId,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        ip: req.ip,
        url: req.originalUrl,
        service: 'auth-middleware'
      });
      
      res.status(403).json({
        success: false,
        error: 'Insufficient role permissions',
        code: 'INSUFFICIENT_ROLE'
      });
      return;
    }
    
    next();
  };
};

/**
 * 🔑 Permission-based Access Control
 */
export const requirePermissions = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }
    
    if (!ultraAuthManager.checkPermissions(req.user.permissions, requiredPermissions)) {
      log.security('Permission access denied', {
        securityEvent: 'PERMISSION_DENIED',
        riskLevel: 'HIGH',
        userId: req.user.userId,
        userPermissions: req.user.permissions,
        requiredPermissions,
        ip: req.ip,
        url: req.originalUrl,
        service: 'auth-middleware'
      });
      
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }
    
    next();
  };
};

/**
 * 🚦 Rate Limiting Middleware
 */
export const createRateLimiter = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
} = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 100,
    message: {
      success: false,
      error: options.message || 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      log.security('Rate limit exceeded', {
        securityEvent: 'SUSPICIOUS_ACTIVITY',
        riskLevel: 'MEDIUM',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        service: 'rate-limiter'
      });
      
      res.status(429).json({
        success: false,
        error: options.message || 'Too many requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }
  });
};

/**
 * 🛡️ Security Headers Middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
  }
  
  next();
};

/**
 * 📊 Export utilities
 */

export default {
  ultraAuthManager,
  authenticateToken,
  requireRole,
  requirePermissions,
  createRateLimiter,
  securityHeaders
}; 