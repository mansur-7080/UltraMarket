/**
 * 🔐 ULTRA PROFESSIONAL JWT SECURITY MANAGER
 * UltraMarket E-commerce Platform
 *
 * Professional JWT implementation with:
 * - Strong cryptographic security
 * - Token rotation and blacklisting
 * - Device tracking and IP validation
 * - Security audit logging
 * - O'zbekiston compliance features
 *
 * @author UltraMarket Security Team
 * @version 3.0.0
 * @date 2024-12-28
 */
import { Redis } from 'ioredis';
import { Request, Response, NextFunction } from 'express';
export interface UltraJWTPayload {
    userId: string;
    email: string;
    role: 'user' | 'admin' | 'moderator' | 'vendor';
    permissions: string[];
    sessionId: string;
    deviceId: string;
    ipAddress: string;
    userAgent: string;
    issuedAt: number;
    expiresAt: number;
    audience: 'web' | 'mobile' | 'admin' | 'api';
    region?: 'UZ' | 'RU' | 'EN';
    phoneVerified: boolean;
    emailVerified: boolean;
    twoFactorEnabled: boolean;
    lastLoginAt: number;
    securityVersion: number;
}
export interface JWTSecurityOptions {
    algorithm: 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512';
    issuer: string;
    audience: string[];
    expiresIn: string;
    notBefore?: string;
    clockTolerance?: number;
    secretRotationDays: number;
    maxConcurrentSessions: number;
    enableDeviceTracking: boolean;
    enableIPValidation: boolean;
    enableAuditLogging: boolean;
    enableTokenRotation: boolean;
}
export interface DeviceInfo {
    deviceId: string;
    userAgent: string;
    ipAddress: string;
    location?: {
        country: string;
        city: string;
        region: string;
    };
    firstSeen: Date;
    lastSeen: Date;
    isActive: boolean;
    isTrusted: boolean;
    sessionCount: number;
}
export interface SecurityEvent {
    eventType: 'LOGIN' | 'LOGOUT' | 'TOKEN_REFRESH' | 'SUSPICIOUS_ACTIVITY' | 'DEVICE_CHANGE' | 'IP_CHANGE';
    userId: string;
    deviceId: string;
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    metadata?: Record<string, any>;
}
export interface JWTValidationResult {
    isValid: boolean;
    payload?: UltraJWTPayload;
    error?: string;
    shouldRefresh: boolean;
    securityWarnings: string[];
    trustScore: number;
}
/**
 * Ultra Professional JWT Security Manager
 */
export declare class UltraProfessionalJWTManager {
    private accessTokenSecret;
    private refreshTokenSecret;
    private options;
    private redis;
    private blacklistPrefix;
    private devicePrefix;
    private sessionPrefix;
    private securityEventPrefix;
    constructor(accessSecret: string, refreshSecret: string, options?: Partial<JWTSecurityOptions>, redisClient?: Redis);
    /**
     * Validate secret strength (Critical Security Function)
     */
    private validateSecretStrength;
    /**
     * Generate access token with comprehensive security
     */
    generateAccessToken(payload: Omit<UltraJWTPayload, 'issuedAt' | 'expiresAt' | 'sessionId'>, options?: {
        audience?: string;
        expiresIn?: string;
        deviceInfo?: Partial<DeviceInfo>;
    }): Promise<{
        token: string;
        sessionId: string;
        expiresAt: Date;
    }>;
    /**
     * Generate refresh token with rotation support
     */
    generateRefreshToken(userId: string, sessionId: string, deviceId: string): Promise<{
        token: string;
        expiresAt: Date;
    }>;
    /**
     * Validate token with comprehensive security checks
     */
    validateToken(token: string, type?: 'access' | 'refresh', context?: {
        ipAddress?: string;
        userAgent?: string;
        audience?: string;
    }): Promise<JWTValidationResult>;
    /**
     * Perform comprehensive security checks
     */
    private performSecurityChecks;
    /**
     * Revoke token (add to blacklist)
     */
    revokeToken(token: string, reason?: string): Promise<void>;
    /**
     * Revoke all user sessions
     */
    revokeAllUserSessions(userId: string, reason?: string): Promise<void>;
    /**
     * Check if token is blacklisted
     */
    private isTokenBlacklisted;
    /**
     * Check if session is valid
     */
    private isSessionValid;
    /**
     * Store session information
     */
    private storeSessionInfo;
    /**
     * Track device information
     */
    private trackDevice;
    /**
     * Get active session count for user
     */
    private getActiveSessionCount;
    /**
     * Log security events
     */
    private logSecurityEvent;
    /**
     * Parse expiration string to milliseconds
     */
    private parseExpirationToMs;
    /**
     * Cleanup expired sessions and blacklisted tokens
     */
    cleanup(): Promise<void>;
    /**
     * Get comprehensive security report for user
     */
    getSecurityReport(userId: string): Promise<{
        activeSessions: number;
        registeredDevices: DeviceInfo[];
        recentSecurityEvents: SecurityEvent[];
        riskScore: number;
    }>;
}
/**
 * Express.js middleware for JWT authentication
 */
export declare const createJWTMiddleware: (jwtManager: UltraProfessionalJWTManager) => (options?: {
    audience?: string;
    required?: boolean;
    roles?: string[];
}) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const jwtManager: UltraProfessionalJWTManager;
export declare const jwtMiddleware: (options?: {
    audience?: string;
    required?: boolean;
    roles?: string[];
}) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=ultra-professional-jwt-manager.d.ts.map