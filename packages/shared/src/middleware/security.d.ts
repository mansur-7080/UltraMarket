/**
 * UltraMarket Security Middleware
 * Professional security middleware for Express applications
 */
import { Request, Response, NextFunction } from 'express';
export interface SecurityConfig {
    enableXSSProtection: boolean;
    enableContentTypeSniffing: boolean;
    enableFrameOptions: boolean;
    enableHSTS: boolean;
    enableCSP: boolean;
    enableReferrerPolicy: boolean;
}
export interface SecurityEvent {
    type: 'XSS_ATTEMPT' | 'SQL_INJECTION' | 'SUSPICIOUS_REQUEST' | 'RATE_LIMIT_EXCEEDED';
    request: {
        method: string;
        url: string;
        ip: string;
        userAgent: string;
        headers: Record<string, string>;
    };
    details: Record<string, unknown>;
    timestamp: Date;
}
export declare function securityHeaders(config?: Partial<SecurityConfig>): (req: Request, res: Response, next: NextFunction) => void;
export declare function xssProtection(req: Request, res: Response, next: NextFunction): void;
export declare function sqlInjectionProtection(req: Request, res: Response, next: NextFunction): void;
export declare function requestSizeLimit(maxSize?: number): (req: Request, res: Response, next: NextFunction) => void;
export declare function ipWhitelist(allowedIPs: string[]): (req: Request, res: Response, next: NextFunction) => void;
export declare function requestId(req: Request, res: Response, next: NextFunction): void;
export declare function securityMiddleware(config?: Partial<SecurityConfig>): (req: Request, res: Response, next: NextFunction) => void;
declare const _default: {
    securityMiddleware: typeof securityMiddleware;
    securityHeaders: typeof securityHeaders;
    xssProtection: typeof xssProtection;
    sqlInjectionProtection: typeof sqlInjectionProtection;
    requestSizeLimit: typeof requestSizeLimit;
    ipWhitelist: typeof ipWhitelist;
    requestId: typeof requestId;
};
export default _default;
//# sourceMappingURL=security.d.ts.map