import { Request, Response, NextFunction } from 'express';
export declare const rateLimitConfigs: {
    general: {
        windowMs: number;
        max: number;
        message: {
            error: string;
            code: string;
            retryAfter: string;
        };
        standardHeaders: boolean;
        legacyHeaders: boolean;
        skipSuccessfulRequests: boolean;
        skipFailedRequests: boolean;
    };
    auth: {
        windowMs: number;
        max: number;
        message: {
            error: string;
            code: string;
            retryAfter: string;
        };
        standardHeaders: boolean;
        legacyHeaders: boolean;
        skipSuccessfulRequests: boolean;
        skipFailedRequests: boolean;
    };
    payment: {
        windowMs: number;
        max: number;
        message: {
            error: string;
            code: string;
            retryAfter: string;
        };
        standardHeaders: boolean;
        legacyHeaders: boolean;
        skipSuccessfulRequests: boolean;
        skipFailedRequests: boolean;
    };
    search: {
        windowMs: number;
        max: number;
        message: {
            error: string;
            code: string;
            retryAfter: string;
        };
        standardHeaders: boolean;
        legacyHeaders: boolean;
        skipSuccessfulRequests: boolean;
        skipFailedRequests: boolean;
    };
    admin: {
        windowMs: number;
        max: number;
        message: {
            error: string;
            code: string;
            retryAfter: string;
        };
        standardHeaders: boolean;
        legacyHeaders: boolean;
        skipSuccessfulRequests: boolean;
        skipFailedRequests: boolean;
    };
    upload: {
        windowMs: number;
        max: number;
        message: {
            error: string;
            code: string;
            retryAfter: string;
        };
        standardHeaders: boolean;
        legacyHeaders: boolean;
        skipSuccessfulRequests: boolean;
        skipFailedRequests: boolean;
    };
};
export declare const generalRateLimit: any;
export declare const authRateLimit: any;
export declare const paymentRateLimit: any;
export declare const searchRateLimit: any;
export declare const adminRateLimit: any;
export declare const uploadRateLimit: any;
export declare const dynamicRateLimit: (req: Request, res: Response, next: NextFunction) => any;
export declare const userRateLimit: any;
export declare const burstProtection: any;
declare const _default: {
    general: any;
    auth: any;
    payment: any;
    search: any;
    admin: any;
    upload: any;
    dynamic: (req: Request, res: Response, next: NextFunction) => any;
    user: any;
    burst: any;
};
export default _default;
//# sourceMappingURL=rate-limit.middleware.d.ts.map