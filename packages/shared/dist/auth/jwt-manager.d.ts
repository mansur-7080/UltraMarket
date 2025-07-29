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
import { JwtPayload } from 'jsonwebtoken';
export interface ProfessionalJWTConfig {
    secrets: {
        accessToken: string;
        refreshToken: string;
        verification: string;
        passwordReset: string;
    };
    expiry: {
        accessToken: string;
        refreshToken: string;
        verification: string;
        passwordReset: string;
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
export interface UltraMarketJWTPayload extends JwtPayload {
    userId: string;
    email: string;
    firstName: string;
    lastName?: string;
    role: 'user' | 'admin' | 'vendor' | 'support';
    sessionId: string;
    deviceId?: string;
    deviceType?: 'web' | 'mobile' | 'tablet';
    ipAddress?: string;
    userAgent?: string;
    permissions: string[];
    region?: string;
    language: 'uz' | 'ru' | 'en';
    timezone: string;
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
export declare class ProfessionalJWTManager {
    private static instance;
    private config;
    private blacklistedTokens;
    private activeSessions;
    private secretRotationTimer;
    private constructor();
    /**
     * Singleton pattern implementation
     */
    static getInstance(): ProfessionalJWTManager;
    /**
     * Load configuration from secure environment manager
     */
    private loadSecureConfiguration;
    /**
     * Initialize security features
     */
    private initializeSecurityFeatures;
    /**
     * Validate secret security
     */
    private validateSecretSecurity;
    /**
     * Generate professional token pair
     */
    generateTokenPair(payload: Omit<UltraMarketJWTPayload, 'iat' | 'exp' | 'iss' | 'aud' | 'sessionId' | 'tokenType' | 'issuedAt' | 'lastActivity'>, options?: {
        deviceInfo?: {
            deviceId: string;
            deviceType: 'web' | 'mobile' | 'tablet';
            userAgent?: string;
        };
        ipAddress?: string;
        audience?: keyof ProfessionalJWTConfig['audience'];
    }): Promise<TokenPair>;
    /**
     * Validate token with comprehensive security checks
     */
    validateToken(token: string, tokenType?: 'access' | 'refresh' | 'verification' | 'passwordReset', options?: {
        ipAddress?: string;
        userAgent?: string;
        deviceId?: string;
    }): Promise<TokenValidationResult>;
    /**
     * Refresh token pair
     */
    refreshTokenPair(refreshToken: string, options?: {
        ipAddress?: string;
        userAgent?: string;
        deviceId?: string;
    }): Promise<TokenPair>;
    /**
     * Generate verification token
     */
    generateVerificationToken(userId: string): Promise<string>;
    /**
     * Generate password reset token
     */
    generatePasswordResetToken(userId: string): Promise<string>;
    /**
     * Revoke token (add to blacklist)
     */
    revokeToken(token: string, reason?: string, userId?: string): Promise<void>;
    /**
     * Revoke all user sessions
     */
    revokeAllUserSessions(userId: string, reason?: string): Promise<void>;
    private getSecretForTokenType;
    private parseExpiryToMs;
    private hashToken;
    private storeSessionInfo;
    private setupSecretRotation;
    private setupSessionCleanup;
    private setupBlacklistCleanup;
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
    };
    /**
     * Health check for JWT manager
     */
    healthCheck(): Promise<{
        healthy: boolean;
        issues: string[];
        stats: ReturnType<typeof this.getStats>;
    }>;
    /**
     * Graceful shutdown
     */
    shutdown(): Promise<void>;
}
export declare const professionalJWTManager: ProfessionalJWTManager;
export declare const generateTokenPair: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => void;
export declare const validateToken: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => void;
export declare const refreshTokenPair: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => void;
export declare const generateVerificationToken: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => void;
export declare const generatePasswordResetToken: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => void;
export default professionalJWTManager;
//# sourceMappingURL=jwt-manager.d.ts.map