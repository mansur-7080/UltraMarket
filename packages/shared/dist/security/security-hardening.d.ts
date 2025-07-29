import { Request, Response, NextFunction } from 'express';
export declare const rateLimitConfigs: {
    general: import("express-rate-limit").RateLimitRequestHandler;
    auth: import("express-rate-limit").RateLimitRequestHandler;
    fileUpload: import("express-rate-limit").RateLimitRequestHandler;
};
export declare const securityHeaders: (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
export declare class SecurityValidator {
    static isValidEmail(email: string): boolean;
    static isValidUzbekPhone(phone: string): boolean;
    static isStrongPassword(password: string): boolean;
    static sanitizeString(input: string): string;
}
export declare class SecurityAudit {
    static logSecurityEvent(event: string, details: Record<string, any>): void;
    static logAuthAttempt(email: string, ip: string, success: boolean): void;
    static logSuspiciousActivity(description: string, ip: string): void;
}
export declare class SecurityCrypto {
    static hashPassword(password: string): Promise<string>;
    static verifyPassword(password: string, hash: string): Promise<boolean>;
    static generateSecureToken(length?: number): string;
    static generateApiKey(): string;
}
export declare const sqlInjectionProtection: (req: Request, res: Response, next: NextFunction) => void;
export declare const xssProtection: (req: Request, res: Response, next: NextFunction) => void;
export declare const securityMiddleware: {
    rateLimit: {
        general: import("express-rate-limit").RateLimitRequestHandler;
        auth: import("express-rate-limit").RateLimitRequestHandler;
        fileUpload: import("express-rate-limit").RateLimitRequestHandler;
    };
    headers: (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
    sqlInjectionProtection: (req: Request, res: Response, next: NextFunction) => void;
    xssProtection: (req: Request, res: Response, next: NextFunction) => void;
};
//# sourceMappingURL=security-hardening.d.ts.map