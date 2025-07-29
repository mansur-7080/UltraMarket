/**
 * 🔐 ULTRA SECURE JWT MANAGER
 * UltraMarket E-commerce Platform
 *
 * SOLVES: All JWT security vulnerabilities and authentication issues
 *
 * Key Security Features:
 * - Unified JWT implementation across all microservices
 * - Token rotation and blacklisting
 * - Multi-factor authentication support
 * - Strong secret management with rotation
 * - Session management and monitoring
 * - Professional security audit logging
 * - TypeScript strict mode compatibility
 *
 * @author UltraMarket Security Team
 * @version 2.0.0
 * @date 2024-12-28
 */
import { EventEmitter } from 'events';
import { Request, Response, NextFunction } from 'express';
export interface JWTConfig {
    accessTokenSecret: string;
    refreshTokenSecret: string;
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
    issuer: string;
    audience: string;
    algorithm: 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512';
    enableTokenRotation: boolean;
    enableTokenBlacklisting: boolean;
    enableMFA: boolean;
    maxConcurrentSessions: number;
    sessionTimeout: number;
    secretRotationInterval: number;
}
export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
    permissions: string[];
    sessionId: string;
    deviceId?: string;
    ipAddress?: string;
    userAgent?: string;
    mfaVerified?: boolean;
    tokenVersion?: number;
    iat?: number;
    exp?: number;
    iss?: string;
    aud?: string;
    type?: 'access' | 'refresh' | 'mfa' | 'reset';
}
export interface AuthenticationResult {
    success: boolean;
    tokens?: {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        tokenType: string;
    };
    user?: {
        id: string;
        email: string;
        role: string;
        permissions: string[];
        mfaEnabled: boolean;
        lastLogin?: Date;
    };
    mfaRequired?: boolean;
    mfaQrCode?: string;
    sessionId?: string;
    error?: string;
    securityWarnings?: string[];
}
export interface SessionData {
    sessionId: string;
    userId: string;
    deviceId: string;
    ipAddress: string;
    userAgent: string;
    createdAt: Date;
    lastActivity: Date;
    isActive: boolean;
    mfaVerified: boolean;
    securityLevel: 'standard' | 'elevated' | 'restricted';
}
export interface SecurityEvent {
    type: 'login' | 'logout' | 'token_refresh' | 'mfa_setup' | 'mfa_verify' | 'suspicious_activity' | 'security_violation';
    userId: string;
    sessionId?: string;
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
    details: Record<string, any>;
    severity: 'low' | 'medium' | 'high' | 'critical';
}
/**
 * Ultra Secure JWT Manager
 * Centralized JWT security for all UltraMarket services
 */
export declare class UltraSecureJWTManager extends EventEmitter {
    private static instance;
    private config;
    private blacklistedTokens;
    private activeSessions;
    private userSessions;
    private secretVersions;
    private securityEvents;
    private metrics;
    private cleanupInterval;
    private secretRotationInterval;
    private currentSecretVersion;
    private constructor();
    /**
     * Singleton pattern - get instance
     */
    static getInstance(config?: JWTConfig): UltraSecureJWTManager;
    /**
     * Initialize JWT manager
     */
    private initialize;
    /**
     * Validate JWT configuration
     */
    private validateConfig;
    /**
     * Generate cryptographically secure token
     */
    generateTokens(payload: Omit<TokenPayload, 'iat' | 'exp' | 'iss' | 'aud'>, options?: {
        mfaRequired?: boolean;
        deviceId?: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<AuthenticationResult>;
    /**
     * Verify and validate JWT token
     */
    verifyToken(token: string, tokenType?: 'access' | 'refresh', context?: {
        ipAddress?: string;
        userAgent?: string;
    }): Promise<{
        valid: boolean;
        payload?: TokenPayload;
        error?: string;
        securityWarnings?: string[];
    }>;
    /**
     * Refresh access token using refresh token
     */
    refreshTokens(refreshToken: string, context?: {
        ipAddress?: string;
        userAgent?: string;
    }): Promise<AuthenticationResult>;
    /**
     * Blacklist a token
     */
    blacklistToken(token: string): void;
    /**
     * Revoke all user sessions
     */
    revokeUserSessions(userId: string): Promise<void>;
    /**
     * Generate MFA setup for user
     */
    generateMFASetup(userId: string, userEmail: string): Promise<string>;
    /**
     * Verify MFA token
     */
    verifyMFAToken(userId: string, token: string, secret: string): boolean;
    /**
     * Express middleware for JWT authentication
     */
    createAuthMiddleware(options?: {
        requireMFA?: boolean;
        requiredRoles?: string[];
        requiredPermissions?: string[];
    }): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get current secret (for token version support)
     */
    private getCurrentSecret;
    /**
     * Generate secure ID
     */
    private generateSecureId;
    /**
     * Get token expiration time in seconds
     */
    private getTokenExpirationTime;
    /**
     * Evict oldest session for user
     */
    private evictOldestSession;
    /**
     * Log security event
     */
    private logSecurityEvent;
    /**
     * Start cleanup interval for expired tokens and sessions
     */
    private startCleanupInterval;
    /**
     * Start secret rotation interval
     */
    private startSecretRotation;
    /**
     * Perform cleanup of expired data
     */
    private performCleanup;
    /**
     * Rotate access token secret
     */
    private rotateSecret;
    /**
     * Setup graceful shutdown
     */
    private setupGracefulShutdown;
    /**
     * Get security metrics
     */
    getMetrics(): {
        activeSessions: number;
        blacklistedTokens: number;
        secretVersions: number;
        recentSecurityEvents: SecurityEvent[];
        tokensIssued: number;
        tokensRefreshed: number;
        tokensBlacklisted: number;
        mfaVerifications: number;
        securityViolations: number;
        suspiciousActivities: number;
    };
    /**
     * Get active sessions for user
     */
    getUserSessions(userId: string): SessionData[];
}
/**
 * Production-optimized JWT configuration
 */
export declare const productionJWTConfig: JWTConfig;
/**
 * Create and export singleton instance
 */
export declare const ultraSecureJWT: UltraSecureJWTManager;
/**
 * Helper function to get JWT manager instance
 */
export declare function getJWTManager(): UltraSecureJWTManager;
/**
 * Export types for external use
 */
export type { JWTConfig as UltraJWTConfig, TokenPayload as UltraTokenPayload, AuthenticationResult as UltraAuthResult, SessionData as UltraSessionData, SecurityEvent as UltraSecurityEvent };
//# sourceMappingURL=ultra-secure-jwt-manager.d.ts.map