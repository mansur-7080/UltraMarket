import { Request, Response, NextFunction } from 'express';
export declare function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare function authRateLimitMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare function passwordResetRateLimitMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare function cleanupRateLimitStore(): void;
//# sourceMappingURL=rate-limit.middleware.d.ts.map