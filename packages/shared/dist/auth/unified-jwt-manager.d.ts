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
import { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
export interface UnifiedJWTConfig {
    secrets: {
        access: string;
        refresh: string;
        verification: string;
        passwordReset: string;
    };
    expiry: {
        access: string;
        refresh: string;
        verification: string;
        passwordReset: string;
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
export interface TokenValidationResult {
    isValid: boolean;
    payload?: UnifiedJWTPayload;
    error?: string;
    securityWarnings: string[];
    shouldRefresh?: boolean;
}
export interface TokenGenerationResult {
    token: string;
    expiresAt: Date;
    tokenId: string;
}
export interface TokenPair {
    accessToken: TokenGenerationResult;
    refreshToken: TokenGenerationResult;
}
/**
 * Professional Unified JWT Manager
 * Replaces all inconsistent JWT implementations
 */
export declare class UnifiedJWTManager {
    private static instance;
    private config;
    private blacklistedTokens;
    private activeSessions;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(config?: UnifiedJWTConfig): UnifiedJWTManager;
    /**
     * Professional token generation with comprehensive options
     */
    generateTokenPair(user: {
        id: string;
        email: string;
        role: UnifiedJWTPayload['role'];
        permissions: string[];
    }, context: {
        audience: 'web' | 'mobile' | 'admin';
        deviceId?: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<TokenPair>;
    /**
     * Professional token validation with comprehensive security checks
     */
    validateToken(token: string, tokenType?: 'access' | 'refresh' | 'verification' | 'passwordReset', context?: {
        ipAddress?: string;
        userAgent?: string;
        audience?: 'web' | 'mobile' | 'admin';
    }): Promise<TokenValidationResult>;
    /**
     * Professional refresh token operation
     */
    refreshTokens(refreshToken: string, context?: {
        ipAddress?: string;
        userAgent?: string;
        deviceId?: string;
    }): Promise<TokenPair | null>;
    /**
     * Professional token blacklisting
     */
    revokeToken(token: string, reason?: string): Promise<void>;
    /**
     * Professional session management
     */
    revokeAllUserSessions(userId: string): void;
    private generateToken;
    private getSecretForTokenType;
    private shouldRefreshToken;
    private trackSession;
    private generateSecureId;
    private parseExpiry;
    private validateConfiguration;
}
/**
 * Professional Express Middleware for JWT Authentication
 * Replaces all inconsistent auth middleware implementations
 */
export declare class UnifiedJWTMiddleware {
    private jwtManager;
    constructor(jwtManager: UnifiedJWTManager);
    /**
     * Standard authentication middleware
     */
    authenticate: (options?: {
        audience?: "web" | "mobile" | "admin";
        optional?: boolean;
    }) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Role-based authorization middleware
     */
    authorize: (requiredRoles: UnifiedJWTPayload["role"][] | UnifiedJWTPayload["role"]) => (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Permission-based authorization middleware
     */
    requirePermissions: (requiredPermissions: string[]) => (req: Request, res: Response, next: NextFunction) => void;
}
export declare const createDefaultJWTConfig: () => UnifiedJWTConfig;
declare let unifiedJWTManager: UnifiedJWTManager;
declare let unifiedJWTMiddleware: UnifiedJWTMiddleware;
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const authorize: (requiredRoles: UnifiedJWTPayload["role"][] | UnifiedJWTPayload["role"]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const requirePermissions: (requiredPermissions: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export { unifiedJWTManager, unifiedJWTMiddleware };
//# sourceMappingURL=unified-jwt-manager.d.ts.map