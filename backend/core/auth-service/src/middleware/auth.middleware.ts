/**
 * Professional Auth Service Middleware
 * Unified JWT handling with professional error management
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

// Professional JWT Payload Interface
interface ProfessionalJWTPayload extends jwt.JwtPayload {
  userId: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN' | 'VENDOR' | 'MODERATOR' | 'SUPER_ADMIN';
  permissions: string[];
  sessionId: string;
  tokenType: 'access' | 'refresh';
}

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      user?: ProfessionalJWTPayload;
    }
  }
}

/**
 * Professional JWT Configuration
 */
class ProfessionalJWTConfig {
  private static instance: ProfessionalJWTConfig;
  
  public readonly accessSecret: string;
  public readonly refreshSecret: string;
  public readonly issuer: string;
  public readonly audience: string;

  private constructor() {
    this.accessSecret = this.getRequiredEnvVar('JWT_ACCESS_SECRET', 'JWT_SECRET');
    this.refreshSecret = this.getRequiredEnvVar('JWT_REFRESH_SECRET', 'JWT_SECRET');
    this.issuer = process.env['JWT_ISSUER'] || 'UltraMarket-Auth';
    this.audience = process.env['JWT_AUDIENCE'] || 'ultramarket.uz';
    
    this.validateSecrets();
  }

  public static getInstance(): ProfessionalJWTConfig {
    if (!ProfessionalJWTConfig.instance) {
      ProfessionalJWTConfig.instance = new ProfessionalJWTConfig();
    }
    return ProfessionalJWTConfig.instance;
  }

  private getRequiredEnvVar(primary: string, fallback?: string): string {
    const value = process.env[primary] || (fallback ? process.env[fallback] : undefined);
    
    if (!value) {
      const envVarName = fallback ? `${primary} or ${fallback}` : primary;
      throw new Error(`🚨 CRITICAL: ${envVarName} environment variable is required`);
    }
    
    return value;
  }

  private validateSecrets(): void {
    if (this.accessSecret.length < 32) {
      logger.warn('⚠️ JWT access secret is weak (< 32 characters)', {
        length: this.accessSecret.length
      });
    }

    if (this.refreshSecret.length < 32) {
      logger.warn('⚠️ JWT refresh secret is weak (< 32 characters)', {
        length: this.refreshSecret.length
      });
    }

    logger.info('✅ JWT configuration validated', {
      issuer: this.issuer,
      audience: this.audience,
      secretsConfigured: true
    });
  }
}

/**
 * Professional Auth Error
 */
class AuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Professional Authentication Middleware
 */
export const professionalAuthMiddleware = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    // Validate authorization header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('Authorization header with Bearer token required');
    }

    const token = authHeader.substring(7).trim();
    
    if (!token) {
      throw new AuthError('JWT token is required');
    }

    const config = ProfessionalJWTConfig.getInstance();
    
    // Verify JWT token with professional options
    const verifyOptions: jwt.VerifyOptions = {
      issuer: config.issuer,
      audience: config.audience,
      algorithms: ['HS256'],
      clockTolerance: 30 // 30 seconds tolerance for clock skew
    };

    const decoded = jwt.verify(token, config.accessSecret, verifyOptions) as ProfessionalJWTPayload;

    // Validate token type
    if (decoded.tokenType && decoded.tokenType !== 'access') {
      throw new AuthError('Invalid token type for authentication');
    }

    // Validate required payload fields
    if (!decoded.userId || !decoded.email || !decoded.role) {
      throw new AuthError('Invalid token payload structure');
    }

    // Attach user to request
    req.user = decoded;

    logger.debug('✅ Authentication successful', {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      sessionId: decoded.sessionId,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    next();

  } catch (error) {
    logger.error('❌ Authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method
    });

    let statusCode = 401;
    let message = 'Authentication failed';
    let shouldRefresh = false;

    if (error instanceof jwt.TokenExpiredError) {
      message = 'Token has expired';
      shouldRefresh = true;
      logger.info('🕒 Token expired, refresh suggested', {
        ip: req.ip
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      message = 'Invalid token format';
      logger.warn('🔍 Invalid JWT token detected', {
        error: error.message,
        ip: req.ip
      });
    } else if (error instanceof AuthError) {
      statusCode = error.statusCode;
      message = error.message;
    }

    res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode === 401 ? 'AUTHENTICATION_FAILED' : 'AUTHORIZATION_FAILED',
        message,
        shouldRefresh,
        timestamp: new Date().toISOString()
      }
    });
  }
};

/**
 * Professional Role-based Authorization Middleware
 */
export const professionalAuthorize = (
  requiredRoles: ProfessionalJWTPayload['role'][] | ProfessionalJWTPayload['role']
) => {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as ProfessionalJWTPayload;
    
    if (!user) {
      logger.warn('🔒 Authorization attempted without authentication', {
        ip: req.ip,
        url: req.url
      });
      
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required for authorization',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    if (!roles.includes(user.role)) {
      logger.warn('🚫 Authorization failed - insufficient role', {
        userId: user.userId,
        userRole: user.role,
        requiredRoles: roles,
        ip: req.ip,
        url: req.url
      });
      
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient role permissions',
          requiredRoles: roles,
          userRole: user.role,
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    logger.debug('✅ Authorization successful', {
      userId: user.userId,
      role: user.role,
      requiredRoles: roles
    });

    next();
  };
};

/**
 * Professional Permission-based Authorization Middleware
 */
export const professionalRequirePermissions = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as ProfessionalJWTPayload;
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    const userPermissions = user.permissions || [];
    const hasAllPermissions = requiredPermissions.every(permission => 
      userPermissions.includes(permission) || userPermissions.includes('*')
    );

    if (!hasAllPermissions) {
      logger.warn('🔐 Permission check failed', {
        userId: user.userId,
        userPermissions,
        requiredPermissions,
        ip: req.ip
      });
      
      res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_PERMISSIONS',
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

// Professional role-specific middleware
export const requireAdmin = professionalAuthorize(['ADMIN', 'SUPER_ADMIN']);
export const requireSuperAdmin = professionalAuthorize('SUPER_ADMIN');
export const requireVendor = professionalAuthorize(['VENDOR', 'ADMIN', 'SUPER_ADMIN']);
export const requireCustomer = professionalAuthorize(['CUSTOMER', 'ADMIN', 'SUPER_ADMIN']);

// Professional permission-specific middleware
export const requireUserManagement = professionalRequirePermissions(['user:read', 'user:write']);
export const requireSystemAccess = professionalRequirePermissions(['system:admin']);
export const requireOrderManagement = professionalRequirePermissions(['order:read', 'order:write']);

// Backwards compatibility
export const authMiddleware = professionalAuthMiddleware;
export const authenticateToken = professionalAuthMiddleware;
export const requireRole = (roles: string[]) => professionalAuthorize(roles as any);

// Export types for other services
export type { ProfessionalJWTPayload };
export { AuthError, ProfessionalJWTConfig };
