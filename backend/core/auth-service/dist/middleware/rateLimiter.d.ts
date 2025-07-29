import { Request, Response, NextFunction } from 'express';
export declare const rateLimiter: (key: string, limit: number, window: number) => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const ipRateLimiter: (limit: number, window: number) => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const userRateLimiter: (limit: number, window: number) => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const burstRateLimiter: (limit: number, window: number) => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const apiKeyRateLimiter: (limit: number, window: number) => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const getRateLimitInfo: (key: string, identifier: string) => Promise<{
    current: number;
    ttl: number;
    key: string;
} | null>;
//# sourceMappingURL=rateLimiter.d.ts.map