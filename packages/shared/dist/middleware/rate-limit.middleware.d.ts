import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    keyGenerator?: (req: Request) => string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    message?: string;
    headers?: boolean;
    standardHeaders?: boolean;
    legacyHeaders?: boolean;
    store?: RateLimitStore;
}
export interface RateLimitStore {
    increment(key: string, windowMs: number): Promise<{
        totalHits: number;
        timeToExpire: number;
    }>;
    decrement(key: string): Promise<void>;
    resetKey(key: string): Promise<void>;
}
export declare class RedisRateLimitStore implements RateLimitStore {
    private redis;
    private prefix;
    constructor(redisInstance?: Redis, prefix?: string);
    increment(key: string, windowMs: number): Promise<{
        totalHits: number;
        timeToExpire: number;
    }>;
    decrement(key: string): Promise<void>;
    resetKey(key: string): Promise<void>;
}
export declare class MemoryRateLimitStore implements RateLimitStore {
    private store;
    increment(key: string, windowMs: number): Promise<{
        totalHits: number;
        timeToExpire: number;
    }>;
    decrement(key: string): Promise<void>;
    resetKey(key: string): Promise<void>;
    cleanup(): void;
}
export declare const createRateLimit: (config: RateLimitConfig) => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const rateLimitConfigs: {
    general: {
        windowMs: number;
        maxRequests: number;
        message: string;
    };
    auth: {
        windowMs: number;
        maxRequests: number;
        message: string;
        keyGenerator: (req: Request) => string;
    };
    passwordReset: {
        windowMs: number;
        maxRequests: number;
        message: string;
        keyGenerator: (req: Request) => string;
    };
    registration: {
        windowMs: number;
        maxRequests: number;
        message: string;
        keyGenerator: (req: Request) => string;
    };
    apiKey: {
        windowMs: number;
        maxRequests: number;
        message: string;
        keyGenerator: (req: Request) => string;
    };
    fileUpload: {
        windowMs: number;
        maxRequests: number;
        message: string;
        keyGenerator: (req: Request) => string;
    };
    search: {
        windowMs: number;
        maxRequests: number;
        message: string;
        keyGenerator: (req: Request) => string;
    };
    payment: {
        windowMs: number;
        maxRequests: number;
        message: string;
        keyGenerator: (req: Request) => string;
    };
    admin: {
        windowMs: number;
        maxRequests: number;
        message: string;
        keyGenerator: (req: Request) => string;
    };
};
export declare const rateLimitMiddlewares: {
    general: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    auth: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    passwordReset: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    registration: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    apiKey: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    fileUpload: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    search: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    payment: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    admin: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
};
export declare const createDynamicRateLimit: (configs: Record<string, RateLimitConfig>) => (req: Request, res: Response, next: NextFunction) => any;
export declare const createTrustedIPBypass: (trustedIPs: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export default createRateLimit;
//# sourceMappingURL=rate-limit.middleware.d.ts.map