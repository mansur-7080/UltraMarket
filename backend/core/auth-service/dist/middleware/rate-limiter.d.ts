import { Request, Response, NextFunction } from 'express';
interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    keyGenerator?: (req: Request) => string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
}
export declare class RateLimiter {
    private config;
    constructor(config: RateLimitConfig);
    checkLimit(req: Request, key: string, maxRequests: number, windowMs: number): Promise<void>;
    getRateLimitInfo(req: Request, key: string): {
        remaining: number;
        reset: number;
        total: number;
    };
    resetLimit(req: Request, key: string): void;
    cleanup(): void;
}
export declare const rateLimiter: RateLimiter;
export declare function rateLimitMiddleware(config?: Partial<RateLimitConfig>): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare function authRateLimit(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare function registrationRateLimit(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare function passwordResetRateLimit(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare function loginRateLimit(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=rate-limiter.d.ts.map