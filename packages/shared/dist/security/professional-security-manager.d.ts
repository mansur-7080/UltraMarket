/**
 * 🛡️ PROFESSIONAL SECURITY MANAGER - ULTRAMARKET
 *
 * Comprehensive security implementation with industry standards
 * Replaces scattered security implementations across microservices
 *
 * @author UltraMarket Development Team
 * @version 3.0.0
 * @date 2024-12-28
 */
import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
/**
 * Professional Security Configuration Interface
 */
export interface SecurityConfig {
    rateLimit: {
        windowMs: number;
        max: number;
        message: string;
        standardHeaders: boolean;
        legacyHeaders: boolean;
    };
    cors: {
        origins: string[];
        credentials: boolean;
        methods: string[];
        allowedHeaders: string[];
    };
    helmet: {
        contentSecurityPolicy: boolean;
        crossOriginEmbedderPolicy: boolean;
        hsts: {
            maxAge: number;
            includeSubDomains: boolean;
            preload: boolean;
        };
    };
    csrf: {
        enabled: boolean;
        cookieName: string;
        headerName: string;
        secret: string;
    };
    validation: {
        maxBodySize: string;
        sanitizeInput: boolean;
        strictValidation: boolean;
    };
}
/**
 * Professional Security Manager
 */
export declare class ProfessionalSecurityManager {
    private static instance;
    private config;
    private csrfTokens;
    private constructor();
    static getInstance(config?: SecurityConfig): ProfessionalSecurityManager;
    /**
     * Get comprehensive rate limiting middleware
     */
    getRateLimitMiddleware(customOptions?: Partial<SecurityConfig['rateLimit']>): import("express-rate-limit").RateLimitRequestHandler;
    /**
     * Get comprehensive CORS middleware
     */
    getCORSMiddleware(): (req: cors.CorsRequest, res: {
        statusCode?: number | undefined;
        setHeader(key: string, value: string): any;
        end(): any;
    }, next: (err?: any) => any) => void;
    /**
     * Get comprehensive Helmet middleware for security headers
     */
    getHelmetMiddleware(): (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
    /**
     * Professional input validation middleware
     */
    getInputValidationMiddleware(): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    /**
     * Professional CSRF protection middleware
     */
    getCSRFProtectionMiddleware(): (req: Request, _res: Response, next: NextFunction) => void;
    /**
     * Generate CSRF token for session
     */
    generateCSRFToken(sessionId: string): string;
    /**
     * Validate CSRF token
     */
    private validateCSRFToken;
    /**
     * Professional email validation
     */
    validateEmail(email: string): boolean;
    /**
     * Professional phone validation (Uzbekistan format)
     */
    validatePhone(phone: string): boolean;
    /**
     * Professional password strength validation
     */
    validatePasswordStrength(password: string): {
        isValid: boolean;
        score: number;
        feedback: string[];
    };
    /**
     * Professional SQL injection detection
     */
    detectSQLInjection(input: string): boolean;
    /**
     * Professional XSS detection
     */
    detectXSS(input: string): boolean;
    /**
     * Sanitize object recursively
     */
    private sanitizeObject;
    /**
     * Sanitize individual values
     */
    private sanitizeValue;
    /**
     * Check for suspicious patterns
     */
    private containsSuspiciousPatterns;
    /**
     * Clean up expired CSRF tokens
     */
    private cleanupExpiredCSRFTokens;
    /**
     * Get enabled security features
     */
    private getEnabledFeatures;
    /**
     * Validate security configuration
     */
    private validateConfiguration;
}
/**
 * Create default security configuration
 */
export declare const createDefaultSecurityConfig: () => SecurityConfig;
export declare const professionalSecurity: ProfessionalSecurityManager;
export declare const rateLimitMiddleware: import("express-rate-limit").RateLimitRequestHandler;
export declare const corsMiddleware: (req: cors.CorsRequest, res: {
    statusCode?: number | undefined;
    setHeader(key: string, value: string): any;
    end(): any;
}, next: (err?: any) => any) => void;
export declare const helmetMiddleware: (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
export declare const inputValidationMiddleware: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const csrfProtectionMiddleware: (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=professional-security-manager.d.ts.map