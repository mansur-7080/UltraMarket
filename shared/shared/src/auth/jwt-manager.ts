/**
 * 🔐 PROFESSIONAL JWT MANAGER - UltraMarket
 * 
 * Secure, scalable JWT token management with O'zbekiston compliance
 * Advanced security features, monitoring, va performance optimization
 * 
 * @author UltraMarket Development Team
 * @version 2.0.0 
 * @date 2024-12-28
 */

import jwt, { JwtPayload, SignOptions, VerifyOptions } from 'jsonwebtoken';
import * as crypto from 'crypto';
import { logger, createLogger } from '../logging/professional-logger';
import { secureEnvManager } from '../config/secure-environment-manager';
import { 
  ApplicationError, 
  ErrorCodes, 
  createAuthError,
  asyncHandler 
} from '../errors/unified-error-handler';

// JWT service logger
const jwtLogger = createLogger('professional-jwt-manager');

// JWT configuration interface with O'zbekiston compliance
export interface ProfessionalJWTConfig {
  secrets: {
    accessToken: string;
    refreshToken: string;
    verification: string;
    passwordReset: string;
  };
  expiry: {
    accessToken: string;   // 15m for security
    refreshToken: string;  // 30d for user experience  
    verification: string;  // 24h for email verification
    passwordReset: string; // 1h for password reset
  };
  issuer: string;
  audience: {
    web: string;
    mobile: string; 
    admin: string;
  };
  algorithm: 'RS256' | 'HS256';
  security: {
    enableRotation: boolean;
    enableBlacklisting: boolean;
    enableDeviceTracking: boolean;
    enableIPValidation: boolean;
    maxConcurrentSessions: number;
    requireSecureCookies: boolean;
  };
  compliance: {
    enableAuditLogging: boolean;
    dataRetentionDays: number;
    enableGDPRCompliance: boolean;
  };
}

// Enhanced JWT payload for O'zbekiston market
export interface UltraMarketJWTPayload extends JwtPayload {
  // User information
  userId: string;
  email: string;
  firstName: string;
  lastName?: string;
  role: 'user' | 'admin' | 'vendor' | 'support';
  
  // Session information
  sessionId: string;
  deviceId?: string;
  deviceType?: 'web' | 'mobile' | 'tablet';
  
  // Security information
  ipAddress?: string;
  userAgent?: string;
  
  // Permissions and access
  permissions: string[];
  
  // O'zbekistan specific
  region?: string; // Toshkent, Samarqand, etc.
  language: 'uz' | 'ru' | 'en';
  timezone: string; // Asia/Tashkent
  
  // Token metadata
  tokenType: 'access' | 'refresh' | 'verification' | 'passwordReset';
  issuedAt: number;
  lastActivity: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: Date;
  refreshTokenExpiry: Date;
  sessionId: string;
}

export interface TokenValidationResult {
  isValid: boolean;
  payload?: UltraMarketJWTPayload;
  error?: string;
  shouldRefresh?: boolean;
  securityWarnings?: string[];
}

export interface SessionInfo {
  sessionId: string;
  userId: string;
  deviceId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
}

/**
 * Professional JWT Manager with O'zbekiston compliance
 */
export class ProfessionalJWTManager {
  private static instance: ProfessionalJWTManager;
  private config: ProfessionalJWTConfig;
  private blacklistedTokens = new Set<string>();
  private activeSessions = new Map<string, SessionInfo>();
  private secretRotationTimer: NodeJS.Timeout | null = null;
  
  private constructor() {
    this.config = this.loadSecureConfiguration();
    this.initializeSecurityFeatures();
    
    jwtLogger.info('🔐 Professional JWT Manager initialized', {
      issuer: this.config.issuer,
      algorithm: this.config.algorithm,
      securityFeaturesEnabled: {
        rotation: this.config.security.enableRotation,
        blacklisting: this.config.security.enableBlacklisting,
        deviceTracking: this.config.security.enableDeviceTracking,
        ipValidation: this.config.security.enableIPValidation
      }
    });
  }
  
  /**
   * Singleton pattern implementation
   */
  public static getInstance(): ProfessionalJWTManager {
    if (!ProfessionalJWTManager.instance) {
      ProfessionalJWTManager.instance = new ProfessionalJWTManager();
    }
    return ProfessionalJWTManager.instance;
  }
  
  /**
   * Load configuration from secure environment manager
   */
  private loadSecureConfiguration(): ProfessionalJWTConfig {
    try {
      const config: ProfessionalJWTConfig = {
        secrets: {
          accessToken: secureEnvManager.getConfig('JWT_ACCESS_SECRET') || 
                      secureEnvManager.generateBase64Secret(64),
          refreshToken: secureEnvManager.getConfig('JWT_REFRESH_SECRET') || 
                       secureEnvManager.generateBase64Secret(64),
          verification: secureEnvManager.getConfig('JWT_VERIFICATION_SECRET') || 
                       secureEnvManager.generateBase64Secret(64),
          passwordReset: secureEnvManager.getConfig('JWT_PASSWORD_RESET_SECRET') || 
                        secureEnvManager.generateBase64Secret(64)
        },
        expiry: {
          accessToken: secureEnvManager.getConfig('JWT_ACCESS_EXPIRY', '15m'),
          refreshToken: secureEnvManager.getConfig('JWT_REFRESH_EXPIRY', '30d'),
          verification: secureEnvManager.getConfig('JWT_VERIFICATION_EXPIRY', '24h'),
          passwordReset: secureEnvManager.getConfig('JWT_PASSWORD_RESET_EXPIRY', '1h')
        },
        issuer: secureEnvManager.getConfig('JWT_ISSUER', 'UltraMarket-Uzbekistan'),
        audience: {
          web: secureEnvManager.getConfig('JWT_AUDIENCE_WEB', 'ultramarket.uz'),
          mobile: secureEnvManager.getConfig('JWT_AUDIENCE_MOBILE', 'ultramarket-mobile.uz'),
          admin: secureEnvManager.getConfig('JWT_AUDIENCE_ADMIN', 'admin.ultramarket.uz')
        },
        algorithm: (secureEnvManager.getConfig('JWT_ALGORITHM', 'HS256') as 'HS256' | 'RS256'),
        security: {
          enableRotation: secureEnvManager.getConfig('JWT_ENABLE_ROTATION', 'true') === 'true',
          enableBlacklisting: secureEnvManager.getConfig('JWT_ENABLE_BLACKLISTING', 'true') === 'true',
          enableDeviceTracking: secureEnvManager.getConfig('JWT_ENABLE_DEVICE_TRACKING', 'true') === 'true',
          enableIPValidation: secureEnvManager.getConfig('JWT_ENABLE_IP_VALIDATION', 'false') === 'true',
          maxConcurrentSessions: parseInt(secureEnvManager.getConfig('JWT_MAX_CONCURRENT_SESSIONS', '5')),
          requireSecureCookies: secureEnvManager.getConfig('JWT_REQUIRE_SECURE_COOKIES', 'true') === 'true'
        },
        compliance: {
          enableAuditLogging: secureEnvManager.getConfig('JWT_ENABLE_AUDIT_LOGGING', 'true') === 'true',
          dataRetentionDays: parseInt(secureEnvManager.getConfig('JWT_DATA_RETENTION_DAYS', '90')),
          enableGDPRCompliance: secureEnvManager.getConfig('JWT_ENABLE_GDPR', 'true') === 'true'
        }
      };
      
      // Validate secret strengths
      this.validateSecretSecurity(config.secrets);
      
      return config;
    } catch (error) {
      jwtLogger.error('❌ Failed to load JWT configuration', error);
      throw new ApplicationError(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'JWT konfiguratsiyasi yuklanmadi',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }
  
  /**
   * Initialize security features
   */
  private initializeSecurityFeatures(): void {
    // Setup secret rotation if enabled
    if (this.config.security.enableRotation) {
      this.setupSecretRotation();
    }
    
    // Setup session cleanup
    this.setupSessionCleanup();
    
    // Setup blacklist cleanup
    if (this.config.security.enableBlacklisting) {
      this.setupBlacklistCleanup();
    }
  }
  
  /**
   * Validate secret security
   */
  private validateSecretSecurity(secrets: ProfessionalJWTConfig['secrets']): void {
    const secretChecks = Object.entries(secrets);
    
    for (const [name, secret] of secretChecks) {
      if (!secret || secret.length < 64) {
        jwtLogger.warn(`⚠️ ${name} secret is weak (< 64 characters)`, {
          secretName: name,
          length: secret?.length || 0
        });
      }
      
      // Check for weak patterns
      const weakPatterns = ['test', 'dev', 'demo', '123', 'secret', 'password', 'ultramarket'];
      const hasWeakPattern = weakPatterns.some(pattern => 
        secret?.toLowerCase().includes(pattern)
      );
      
      if (hasWeakPattern) {
        jwtLogger.warn(`🚨 ${name} secret contains weak patterns`, {
          secretName: name
        });
      }
    }
  }
  
  /**
   * Generate professional token pair
   */
  async generateTokenPair(
    payload: Omit<UltraMarketJWTPayload, 'iat' | 'exp' | 'iss' | 'aud' | 'sessionId' | 'tokenType' | 'issuedAt' | 'lastActivity'>,
    options: {
      deviceInfo?: {
        deviceId: string;
        deviceType: 'web' | 'mobile' | 'tablet';
        userAgent?: string;
      };
      ipAddress?: string;
      audience?: keyof ProfessionalJWTConfig['audience'];
    } = {}
  ): Promise<TokenPair> {
    const startTime = Date.now();
    
    try {
      const sessionId = crypto.randomUUID();
      const now = Date.now();
      
      // Enhanced payload with security info
      const basePayload: UltraMarketJWTPayload = {
        ...payload,
        sessionId,
        deviceId: options.deviceInfo?.deviceId,
        deviceType: options.deviceInfo?.deviceType || 'web',
        ipAddress: options.ipAddress,
        userAgent: options.deviceInfo?.userAgent,
        issuedAt: now,
        lastActivity: now,
        tokenType: 'access' // Will be overridden for refresh token
      };
      
      const audience = options.audience ? this.config.audience[options.audience] : this.config.audience.web;
      
      // Access token
      const accessTokenOptions: SignOptions = {
        expiresIn: this.config.expiry.accessToken,
        issuer: this.config.issuer,
        audience: audience,
        algorithm: this.config.algorithm,
        jwtid: crypto.randomUUID()
      };
      
      const accessToken = jwt.sign(
        basePayload,
        this.config.secrets.accessToken,
        accessTokenOptions
      );
      
      // Refresh token (minimal payload for security)
      const refreshTokenPayload = {
        userId: payload.userId,
        sessionId,
        tokenType: 'refresh' as const,
        issuedAt: now,
        deviceId: options.deviceInfo?.deviceId
      };
      
      const refreshTokenOptions: SignOptions = {
        expiresIn: this.config.expiry.refreshToken,
        issuer: this.config.issuer,
        audience: `${audience}-refresh`,
        algorithm: this.config.algorithm,
        jwtid: crypto.randomUUID()
      };
      
      const refreshToken = jwt.sign(
        refreshTokenPayload,
        this.config.secrets.refreshToken,
        refreshTokenOptions
      );
      
      // Calculate expiry dates
      const accessTokenExpiry = new Date(now + this.parseExpiryToMs(this.config.expiry.accessToken));
      const refreshTokenExpiry = new Date(now + this.parseExpiryToMs(this.config.expiry.refreshToken));
      
      // Store session info
      if (this.config.security.enableDeviceTracking && options.deviceInfo) {
        this.storeSessionInfo({
          sessionId,
          userId: payload.userId,
          deviceId: options.deviceInfo.deviceId,
          ipAddress: options.ipAddress || 'unknown',
          userAgent: options.deviceInfo.userAgent || 'unknown',
          createdAt: new Date(now),
          lastActivity: new Date(now),
          isActive: true
        });
      }
      
      const duration = Date.now() - startTime;
      jwtLogger.info('✅ Token pair generated successfully', {
        userId: payload.userId,
        sessionId,
        deviceType: options.deviceInfo?.deviceType || 'web',
        audience,
        duration: `${duration}ms`
      });
      
      // Audit logging
      if (this.config.compliance.enableAuditLogging) {
        jwtLogger.auth('Token pair generated', payload.userId, {
          sessionId,
          deviceInfo: options.deviceInfo,
          ipAddress: options.ipAddress
        });
      }
      
      return {
        accessToken,
        refreshToken,
        accessTokenExpiry,
        refreshTokenExpiry,
        sessionId
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      jwtLogger.error('❌ Failed to generate token pair', error, {
        userId: payload.userId,
        duration: `${duration}ms`
      });
      
      throw new ApplicationError(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Token yaratib bo\'lmadi',
        { 
          originalError: error instanceof Error ? error.message : 'Unknown error',
          userId: payload.userId
        }
      );
    }
  }
  
  /**
   * Validate token with comprehensive security checks
   */
  async validateToken(
    token: string,
    tokenType: 'access' | 'refresh' | 'verification' | 'passwordReset' = 'access',
    options: {
      ipAddress?: string;
      userAgent?: string;
      deviceId?: string;
    } = {}
  ): Promise<TokenValidationResult> {
    const startTime = Date.now();
    
    try {
      // Check blacklist first
      if (this.config.security.enableBlacklisting && this.blacklistedTokens.has(token)) {
        jwtLogger.warn('🚫 Blacklisted token usage attempted', {
          tokenType,
          ipAddress: options.ipAddress
        });
        
        return {
          isValid: false,
          error: 'Token blacklisted',
          securityWarnings: ['Token has been revoked']
        };
      }
      
      // Select appropriate secret
      const secret = this.getSecretForTokenType(tokenType);
      
      // Verify token
      const verifyOptions: VerifyOptions = {
        issuer: this.config.issuer,
        algorithms: [this.config.algorithm],
        clockTolerance: 30 // 30 seconds tolerance
      };
      
      const decoded = jwt.verify(token, secret, verifyOptions) as UltraMarketJWTPayload;
      const securityWarnings: string[] = [];
      
      // Security validations
      if (this.config.security.enableIPValidation && options.ipAddress) {
        if (decoded.ipAddress && decoded.ipAddress !== options.ipAddress) {
          securityWarnings.push('IP address changed');
          jwtLogger.security('IP address mismatch detected', 'medium', {
            userId: decoded.userId,
            originalIP: decoded.ipAddress,
            currentIP: options.ipAddress,
            sessionId: decoded.sessionId
          });
        }
      }
      
      // Device validation
      if (this.config.security.enableDeviceTracking && options.deviceId) {
        if (decoded.deviceId && decoded.deviceId !== options.deviceId) {
          securityWarnings.push('Device changed');
          jwtLogger.security('Device change detected', 'medium', {
            userId: decoded.userId,
            originalDevice: decoded.deviceId,
            currentDevice: options.deviceId,
            sessionId: decoded.sessionId
          });
        }
      }
      
      // Session validation
      if (this.config.security.enableDeviceTracking) {
        const sessionInfo = this.activeSessions.get(decoded.sessionId);
        if (sessionInfo && !sessionInfo.isActive) {
          return {
            isValid: false,
            error: 'Session terminated',
            securityWarnings: ['Session has been terminated']
          };
        }
      }
      
      // Check if token should be refreshed (within 5 minutes of expiry)
      const shouldRefresh = decoded.exp && (decoded.exp * 1000 - Date.now()) < 5 * 60 * 1000;
      
      const duration = Date.now() - startTime;
      jwtLogger.debug('✅ Token validated successfully', {
        userId: decoded.userId,
        tokenType,
        sessionId: decoded.sessionId,
        warningsCount: securityWarnings.length,
        duration: `${duration}ms`
      });
      
      return {
        isValid: true,
        payload: decoded,
        shouldRefresh,
        securityWarnings: securityWarnings.length > 0 ? securityWarnings : undefined
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error instanceof jwt.TokenExpiredError) {
        jwtLogger.info('⏰ Token expired', {
          tokenType,
          expiredAt: error.expiredAt,
          duration: `${duration}ms`
        });
        
        return {
          isValid: false,
          error: 'Token expired',
          shouldRefresh: tokenType === 'access'
        };
      }
      
      if (error instanceof jwt.JsonWebTokenError) {
        jwtLogger.warn('⚠️ Invalid token format', {
          tokenType,
          error: error.message,
          duration: `${duration}ms`
        });
        
        return {
          isValid: false,
          error: 'Invalid token'
        };
      }
      
      jwtLogger.error('❌ Token validation failed', error, {
        tokenType,
        duration: `${duration}ms`
      });
      
      return {
        isValid: false,
        error: 'Token validation failed'
      };
    }
  }
  
  /**
   * Refresh token pair
   */
  async refreshTokenPair(
    refreshToken: string,
    options: {
      ipAddress?: string;
      userAgent?: string;
      deviceId?: string;
    } = {}
  ): Promise<TokenPair> {
    try {
      // Validate refresh token
      const validationResult = await this.validateToken(refreshToken, 'refresh', options);
      
      if (!validationResult.isValid || !validationResult.payload) {
        throw new ApplicationError(
          ErrorCodes.TOKEN_INVALID,
          'Refresh token noto\'g\'ri',
          { error: validationResult.error }
        );
      }
      
      const payload = validationResult.payload;
      
      // Get user info for new token (simplified - in real app, query database)
      const newTokenPayload: Omit<UltraMarketJWTPayload, 'iat' | 'exp' | 'iss' | 'aud' | 'sessionId' | 'tokenType' | 'issuedAt' | 'lastActivity'> = {
        userId: payload.userId,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        role: payload.role,
        permissions: payload.permissions,
        region: payload.region,
        language: payload.language,
        timezone: payload.timezone
      };
      
      // Blacklist old refresh token
      if (this.config.security.enableBlacklisting) {
        this.blacklistedTokens.add(refreshToken);
      }
      
      // Generate new token pair
      const newTokenPair = await this.generateTokenPair(newTokenPayload, {
        deviceInfo: {
          deviceId: payload.deviceId || crypto.randomUUID(),
          deviceType: payload.deviceType || 'web',
          userAgent: options.userAgent
        },
        ipAddress: options.ipAddress
      });
      
      jwtLogger.info('🔄 Token pair refreshed', {
        userId: payload.userId,
        oldSessionId: payload.sessionId,
        newSessionId: newTokenPair.sessionId
      });
      
      return newTokenPair;
      
    } catch (error) {
      jwtLogger.error('❌ Failed to refresh token pair', error);
      
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      throw new ApplicationError(
        ErrorCodes.TOKEN_INVALID,
        'Tokenni yangilab bo\'lmadi',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }
  
  /**
   * Generate verification token
   */
  async generateVerificationToken(userId: string): Promise<string> {
    try {
      const payload = {
        userId,
        tokenType: 'verification' as const,
        issuedAt: Date.now()
      };
      
      const options: SignOptions = {
        expiresIn: this.config.expiry.verification,
        issuer: this.config.issuer,
        audience: `${this.config.audience.web}-verification`,
        algorithm: this.config.algorithm,
        jwtid: crypto.randomUUID()
      };
      
      const token = jwt.sign(payload, this.config.secrets.verification, options);
      
      jwtLogger.info('📧 Verification token generated', { userId });
      
      return token;
      
    } catch (error) {
      jwtLogger.error('❌ Failed to generate verification token', error, { userId });
      throw new ApplicationError(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Tasdiqlash tokeni yaratib bo\'lmadi'
      );
    }
  }
  
  /**
   * Generate password reset token
   */
  async generatePasswordResetToken(userId: string): Promise<string> {
    try {
      const payload = {
        userId,
        tokenType: 'passwordReset' as const,
        issuedAt: Date.now()
      };
      
      const options: SignOptions = {
        expiresIn: this.config.expiry.passwordReset,
        issuer: this.config.issuer,
        audience: `${this.config.audience.web}-password-reset`,
        algorithm: this.config.algorithm,
        jwtid: crypto.randomUUID()
      };
      
      const token = jwt.sign(payload, this.config.secrets.passwordReset, options);
      
      jwtLogger.info('🔐 Password reset token generated', { userId });
      
      return token;
      
    } catch (error) {
      jwtLogger.error('❌ Failed to generate password reset token', error, { userId });
      throw new ApplicationError(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Parol tiklash tokeni yaratib bo\'lmadi'
      );
    }
  }
  
  /**
   * Revoke token (add to blacklist)
   */
  async revokeToken(
    token: string, 
    reason: string = 'Manual revocation',
    userId?: string
  ): Promise<void> {
    if (!this.config.security.enableBlacklisting) {
      jwtLogger.warn('Token blacklisting is disabled');
      return;
    }
    
    this.blacklistedTokens.add(token);
    
    jwtLogger.info('🚫 Token revoked', {
      userId,
      reason,
      tokenHash: this.hashToken(token).substring(0, 16)
    });
    
    // Audit logging
    if (this.config.compliance.enableAuditLogging) {
      jwtLogger.security('Token revoked', 'medium', {
        userId,
        reason,
        revokedAt: new Date().toISOString()
      });
    }
  }
  
  /**
   * Revoke all user sessions
   */
  async revokeAllUserSessions(userId: string, reason: string = 'Security revocation'): Promise<void> {
    let revokedCount = 0;
    
    // Revoke active sessions
    for (const [sessionId, sessionInfo] of this.activeSessions.entries()) {
      if (sessionInfo.userId === userId && sessionInfo.isActive) {
        sessionInfo.isActive = false;
        revokedCount++;
      }
    }
    
    jwtLogger.info('🚫 All user sessions revoked', {
      userId,
      revokedCount,
      reason
    });
    
    // Audit logging
    if (this.config.compliance.enableAuditLogging) {
      jwtLogger.security('All user sessions revoked', 'high', {
        userId,
        revokedCount,
        reason,
        revokedAt: new Date().toISOString()
      });
    }
  }
  
  // Helper methods
  private getSecretForTokenType(tokenType: 'access' | 'refresh' | 'verification' | 'passwordReset'): string {
    switch (tokenType) {
      case 'access': return this.config.secrets.accessToken;
      case 'refresh': return this.config.secrets.refreshToken;
      case 'verification': return this.config.secrets.verification;
      case 'passwordReset': return this.config.secrets.passwordReset;
    }
  }
  
  private parseExpiryToMs(expiry: string): number {
    // Simple parser - in production, use library like ms
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 15 * 60 * 1000; // Default 15 minutes
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 15 * 60 * 1000;
    }
  }
  
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
  
  private storeSessionInfo(sessionInfo: SessionInfo): void {
    // Check max concurrent sessions
    const userSessions = Array.from(this.activeSessions.values())
      .filter(session => session.userId === sessionInfo.userId && session.isActive);
    
    if (userSessions.length >= this.config.security.maxConcurrentSessions) {
      // Deactivate oldest session
      userSessions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const oldestSession = userSessions[0];
      oldestSession.isActive = false;
      
      jwtLogger.info('👥 Max concurrent sessions reached, oldest session deactivated', {
        userId: sessionInfo.userId,
        deactivatedSessionId: oldestSession.sessionId,
        newSessionId: sessionInfo.sessionId
      });
    }
    
    this.activeSessions.set(sessionInfo.sessionId, sessionInfo);
  }
  
  private setupSecretRotation(): void {
    // Rotate secrets monthly
    const rotationInterval = 30 * 24 * 60 * 60 * 1000; // 30 days
    
    this.secretRotationTimer = setInterval(() => {
      jwtLogger.info('🔄 Secret rotation triggered (placeholder)');
      // In production, implement proper secret rotation
    }, rotationInterval);
  }
  
  private setupSessionCleanup(): void {
    // Clean up expired sessions every hour
    const cleanupInterval = 60 * 60 * 1000; // 1 hour
    
    setInterval(() => {
      const before = this.activeSessions.size;
      const now = Date.now();
      const maxInactivity = 24 * 60 * 60 * 1000; // 24 hours
      
      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (now - session.lastActivity.getTime() > maxInactivity) {
          this.activeSessions.delete(sessionId);
        }
      }
      
      const after = this.activeSessions.size;
      if (before !== after) {
        jwtLogger.info('🧹 Session cleanup completed', {
          before,
          after,
          cleaned: before - after
        });
      }
    }, cleanupInterval);
  }
  
  private setupBlacklistCleanup(): void {
    // Clean up expired blacklisted tokens every 6 hours
    const cleanupInterval = 6 * 60 * 60 * 1000; // 6 hours
    
    setInterval(() => {
      // In production, implement proper blacklist cleanup with token expiry tracking
      jwtLogger.debug('🧹 Blacklist cleanup (placeholder)');
    }, cleanupInterval);
  }
  
  /**
   * Get JWT manager statistics
   */
  getStats(): {
    activeSessions: number;
    blacklistedTokens: number;
    config: {
      algorithm: string;
      issuer: string;
      securityFeatures: Record<string, boolean>;
    };
  } {
    return {
      activeSessions: this.activeSessions.size,
      blacklistedTokens: this.blacklistedTokens.size,
      config: {
        algorithm: this.config.algorithm,
        issuer: this.config.issuer,
        securityFeatures: {
          rotation: this.config.security.enableRotation,
          blacklisting: this.config.security.enableBlacklisting,
          deviceTracking: this.config.security.enableDeviceTracking,
          ipValidation: this.config.security.enableIPValidation
        }
      }
    };
  }
  
  /**
   * Health check for JWT manager
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    issues: string[];
    stats: ReturnType<typeof this.getStats>;
  }> {
    const issues: string[] = [];
    
    // Check secret strengths
    Object.entries(this.config.secrets).forEach(([name, secret]) => {
      if (!secret || secret.length < 64) {
        issues.push(`${name} secret is weak`);
      }
    });
    
    // Check session count
    if (this.activeSessions.size > 10000) {
      issues.push('High number of active sessions');
    }
    
    // Check blacklist size
    if (this.blacklistedTokens.size > 50000) {
      issues.push('Large blacklist size');
    }
    
    return {
      healthy: issues.length === 0,
      issues,
      stats: this.getStats()
    };
  }
  
  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    jwtLogger.info('🛑 Shutting down JWT manager...');
    
    if (this.secretRotationTimer) {
      clearInterval(this.secretRotationTimer);
    }
    
    this.activeSessions.clear();
    this.blacklistedTokens.clear();
    
    jwtLogger.info('✅ JWT manager shutdown complete');
  }
}

// Export singleton instance and factory functions
export const professionalJWTManager = ProfessionalJWTManager.getInstance();

// Wrapped async functions for easy usage
export const generateTokenPair = asyncHandler(
  async (payload: Parameters<typeof professionalJWTManager.generateTokenPair>[0], options?: Parameters<typeof professionalJWTManager.generateTokenPair>[1]) =>
    professionalJWTManager.generateTokenPair(payload, options)
);

export const validateToken = asyncHandler(
  async (token: string, tokenType?: Parameters<typeof professionalJWTManager.validateToken>[1], options?: Parameters<typeof professionalJWTManager.validateToken>[2]) =>
    professionalJWTManager.validateToken(token, tokenType, options)
);

export const refreshTokenPair = asyncHandler(
  async (refreshToken: string, options?: Parameters<typeof professionalJWTManager.refreshTokenPair>[1]) =>
    professionalJWTManager.refreshTokenPair(refreshToken, options)
);

export const generateVerificationToken = asyncHandler(
  async (userId: string) => professionalJWTManager.generateVerificationToken(userId)
);

export const generatePasswordResetToken = asyncHandler(
  async (userId: string) => professionalJWTManager.generatePasswordResetToken(userId)
);

export default professionalJWTManager;
