/**
 * 🛡️ SECURITY MANAGER - UltraMarket
 * 
 * Professional security management system
 * JWT authentication, authorization, and security monitoring
 * 
 * @author UltraMarket Development Team
 * @version 3.0.0
 * @date 2024-12-28
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { getValidatedEnv } from '../config/environment-validator';
import { createError, ErrorCodes } from '../errors/unified-error-handler';

// User roles
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  VENDOR = 'vendor',
  SUPPORT = 'support'
}

// Permission levels
export enum Permission {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  ADMIN = 'admin'
}

// User interface
export interface User {
  id: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  lastLogin?: Date;
  loginAttempts: number;
  lockedUntil?: Date;
}

// JWT payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  iat: number;
  exp: number;
  jti: string;
}

// Security event interface
export interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'failed_login' | 'permission_denied' | 'suspicious_activity';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  details: Record<string, any>;
}

/**
 * Security Manager Class
 */
export class SecurityManager {
  private static instance: SecurityManager | null = null;
  private blacklistedTokens: Set<string> = new Set();
  private securityEvents: SecurityEvent[] = [];
  private loginAttempts: Map<string, { count: number; lastAttempt: Date; lockedUntil?: Date }> = new Map();
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly MAX_SECURITY_EVENTS = 1000;

  private constructor() {}

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  /**
   * Generate JWT token
   */
  public generateToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
      jti: crypto.randomBytes(16).toString('hex')
    };

    return jwt.sign(payload, getValidatedEnv().JWT_SECRET, {
      algorithm: 'HS256',
      issuer: 'ultramarket',
      audience: 'ultramarket-users'
    });
  }

  /**
   * Generate refresh token
   */
  public generateRefreshToken(userId: string): string {
    const payload = {
      userId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
      jti: crypto.randomBytes(16).toString('hex')
    };

    return jwt.sign(payload, getValidatedEnv().JWT_REFRESH_SECRET, {
      algorithm: 'HS256',
      issuer: 'ultramarket',
      audience: 'ultramarket-refresh'
    });
  }

  /**
   * Verify JWT token
   */
  public verifyToken(token: string): JWTPayload {
    try {
      // Check if token is blacklisted
      if (this.blacklistedTokens.has(token)) {
        throw createError.authentication('Token has been revoked');
      }

      const decoded = jwt.verify(token, getValidatedEnv().JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: 'ultramarket',
        audience: 'ultramarket-users'
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw createError.authentication('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw createError.authentication('Token expired');
      }
      throw error;
    }
  }

  /**
   * Verify refresh token
   */
  public verifyRefreshToken(token: string): { userId: string } {
    try {
      const decoded = jwt.verify(token, getValidatedEnv().JWT_REFRESH_SECRET, {
        algorithms: ['HS256'],
        issuer: 'ultramarket',
        audience: 'ultramarket-refresh'
      }) as { userId: string; type: string };

      if (decoded.type !== 'refresh') {
        throw createError.authentication('Invalid refresh token');
      }

      return { userId: decoded.userId };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw createError.authentication('Invalid refresh token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw createError.authentication('Refresh token expired');
      }
      throw error;
    }
  }

  /**
   * Hash password
   */
  public async hashPassword(password: string): Promise<string> {
    const saltRounds = getValidatedEnv().BCRYPT_ROUNDS;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password
   */
  public async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Check if user is locked
   */
  public isUserLocked(email: string): boolean {
    const attempts = this.loginAttempts.get(email);
    if (!attempts) return false;

    if (attempts.lockedUntil && attempts.lockedUntil > new Date()) {
      return true;
    }

    // Clear lock if expired
    if (attempts.lockedUntil && attempts.lockedUntil <= new Date()) {
      this.loginAttempts.delete(email);
      return false;
    }

    return false;
  }

  /**
   * Record failed login attempt
   */
  public recordFailedLogin(email: string, ipAddress: string, userAgent: string): void {
    const attempts = this.loginAttempts.get(email) || { count: 0, lastAttempt: new Date() };
    attempts.count++;
    attempts.lastAttempt = new Date();

    if (attempts.count >= this.MAX_LOGIN_ATTEMPTS) {
      attempts.lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION);
    }

    this.loginAttempts.set(email, attempts);

    // Record security event
    this.recordSecurityEvent({
      type: 'failed_login',
      ipAddress,
      userAgent,
      details: { email, attemptCount: attempts.count }
    });
  }

  /**
   * Clear login attempts
   */
  public clearLoginAttempts(email: string): void {
    this.loginAttempts.delete(email);
  }

  /**
   * Record security event
   */
  public recordSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      id: crypto.randomBytes(16).toString('hex'),
      timestamp: new Date()
    };

    this.securityEvents.push(securityEvent);

    // Keep only recent events
    if (this.securityEvents.length > this.MAX_SECURITY_EVENTS) {
      this.securityEvents.shift();
    }
  }

  /**
   * Blacklist token
   */
  public blacklistToken(token: string): void {
    this.blacklistedTokens.add(token);
  }

  /**
   * Check if user has permission
   */
  public hasPermission(userPermissions: Permission[], requiredPermission: Permission): boolean {
    return userPermissions.includes(requiredPermission) || userPermissions.includes(Permission.ADMIN);
  }

  /**
   * Check if user has role
   */
  public hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
    const roleHierarchy = {
      [UserRole.USER]: 1,
      [UserRole.VENDOR]: 2,
      [UserRole.SUPPORT]: 3,
      [UserRole.MODERATOR]: 4,
      [UserRole.ADMIN]: 5
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  /**
   * Get security statistics
   */
  public getSecurityStats(): {
    totalEvents: number;
    recentEvents: SecurityEvent[];
    lockedAccounts: number;
    blacklistedTokens: number;
    loginAttempts: Record<string, any>;
  } {
    const recentEvents = this.securityEvents.filter(
      event => event.timestamp.getTime() > Date.now() - (60 * 60 * 1000) // Last hour
    );

    const lockedAccounts = Array.from(this.loginAttempts.values()).filter(
      attempts => attempts.lockedUntil && attempts.lockedUntil > new Date()
    ).length;

    return {
      totalEvents: this.securityEvents.length,
      recentEvents,
      lockedAccounts,
      blacklistedTokens: this.blacklistedTokens.size,
      loginAttempts: Object.fromEntries(this.loginAttempts)
    };
  }

  /**
   * Clean up expired data
   */
  public cleanup(): void {
    // Remove expired blacklisted tokens (simplified - in production use Redis)
    if (this.blacklistedTokens.size > 10000) {
      this.blacklistedTokens.clear();
    }

    // Remove old security events
    const oneDayAgo = new Date(Date.now() - (24 * 60 * 60 * 1000));
    this.securityEvents = this.securityEvents.filter(event => event.timestamp > oneDayAgo);

    // Remove expired login attempts
    for (const [email, attempts] of this.loginAttempts.entries()) {
      if (attempts.lockedUntil && attempts.lockedUntil <= new Date()) {
        this.loginAttempts.delete(email);
      }
    }
  }
}

// Export singleton instance
export const securityManager = SecurityManager.getInstance();

/**
 * Authentication middleware
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw createError.authentication('Access token required');
    }

    const decoded = securityManager.verifyToken(token);
    (req as any).user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (requiredRole: UserRole) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = (req as any).user;
      if (!user) {
        throw createError.authentication('Authentication required');
      }

      if (!securityManager.hasRole(user.role, requiredRole)) {
        securityManager.recordSecurityEvent({
          type: 'permission_denied',
          userId: user.userId,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent') || '',
          details: { requiredRole, userRole: user.role }
        });

        throw createError.validation('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Permission-based authorization middleware
 */
export const requirePermission = (requiredPermission: Permission) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = (req as any).user;
      if (!user) {
        throw createError.authentication('Authentication required');
      }

      if (!securityManager.hasPermission(user.permissions, requiredPermission)) {
        securityManager.recordSecurityEvent({
          type: 'permission_denied',
          userId: user.userId,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent') || '',
          details: { requiredPermission, userPermissions: user.permissions }
        });

        throw createError.validation('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Rate limiting middleware
 */
export const rateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    const userRequests = requests.get(key);
    if (!userRequests || userRequests.resetTime < now) {
      requests.set(key, { count: 1, resetTime: now + windowMs });
    } else {
      userRequests.count++;
      if (userRequests.count > maxRequests) {
        securityManager.recordSecurityEvent({
          type: 'suspicious_activity',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent') || '',
          details: { type: 'rate_limit_exceeded', requests: userRequests.count }
        });

        throw createError.validation('Rate limit exceeded');
      }
    }

    next();
  };
}; 