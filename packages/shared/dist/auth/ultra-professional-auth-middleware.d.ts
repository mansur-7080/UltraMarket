/**
 * 🔐 Ultra Professional Authentication Middleware
 * UltraMarket E-commerce Platform
 *
 * Bu fayl barcha servislar uchun unified authentication middleware
 * va professional security features ni ta'minlaydi
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
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
export declare class UltraAuthError extends Error {
    readonly statusCode: number;
    readonly code: string;
    readonly details?: any | undefined;
    constructor(message: string, statusCode?: number, code?: string, details?: any | undefined);
}
export declare class TokenExpiredError extends UltraAuthError {
    constructor(message?: string);
}
export declare class TokenInvalidError extends UltraAuthError {
    constructor(message?: string);
}
export declare class InsufficientPermissionsError extends UltraAuthError {
    constructor(message?: string);
}
export declare class RateLimitExceededError extends UltraAuthError {
    constructor(message?: string);
}
/**
 * 🏭 Ultra Professional Auth Manager
 */
export declare class UltraProfessionalAuthManager {
    private config;
    private blacklistedTokens;
    private activeSessions;
    constructor(config?: Partial<UltraAuthConfig>);
    /**
     * 🔍 Validate configuration
     */
    private validateConfig;
    /**
     * ⏰ Start cleanup tasks
     */
    private startCleanupTasks;
    /**
     * 🧹 Clean up expired tokens
     */
    private cleanupExpiredTokens;
    /**
     * 🧹 Clean up inactive sessions
     */
    private cleanupInactiveSessions;
    /**
     * 🔑 Generate JWT Token
     */
    generateAccessToken(payload: Omit<UltraJWTPayload, 'iat' | 'exp' | 'iss' | 'aud'>): string;
    /**
     * 🔄 Generate Refresh Token
     */
    generateRefreshToken(payload: Omit<UltraJWTPayload, 'iat' | 'exp' | 'iss' | 'aud'>): string;
    /**
     * 🔍 Verify Access Token
     */
    verifyAccessToken(token: string): UltraJWTPayload;
    /**
     * 🔄 Verify Refresh Token
     */
    verifyRefreshToken(token: string): UltraJWTPayload;
    /**
     * 🚫 Blacklist token
     */
    blacklistToken(token: string): void;
    /**
     * 👥 Track session
     */
    trackSession(userId: string, sessionId: string): void;
    /**
     * 🚪 Remove session
     */
    removeSession(userId: string, sessionId: string): void;
    /**
     * 🔍 Check permissions
     */
    checkPermissions(userPermissions: string[], requiredPermissions: string[]): boolean;
    /**
     * 🔍 Check role access
     */
    checkRoleAccess(userRole: string, allowedRoles: string[]): boolean;
}
/**
 * 🌟 Global Auth Manager Instance
 */
export declare const ultraAuthManager: UltraProfessionalAuthManager;
/**
 * 🛡️ Authentication Middleware
 */
export declare const authenticateToken: (required?: boolean) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * 🔐 Role-based Access Control
 */
export declare const requireRole: (allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * 🔑 Permission-based Access Control
 */
export declare const requirePermissions: (requiredPermissions: string[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * 🚦 Rate Limiting Middleware
 */
export declare const createRateLimiter: (options?: {
    windowMs?: number;
    max?: number;
    message?: string;
}) => import("express-rate-limit").RateLimitRequestHandler;
/**
 * 🛡️ Security Headers Middleware
 */
export declare const securityHeaders: (req: Request, res: Response, next: NextFunction) => void;
/**
 * 📊 Export utilities
 */
declare const _default: {
    ultraAuthManager: UltraProfessionalAuthManager;
    authenticateToken: (required?: boolean) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
    requireRole: (allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
    requirePermissions: (requiredPermissions: string[]) => (req: Request, res: Response, next: NextFunction) => void;
    createRateLimiter: (options?: {
        windowMs?: number;
        max?: number;
        message?: string;
    }) => import("express-rate-limit").RateLimitRequestHandler;
    securityHeaders: (req: Request, res: Response, next: NextFunction) => void;
};
export default _default;
//# sourceMappingURL=ultra-professional-auth-middleware.d.ts.map