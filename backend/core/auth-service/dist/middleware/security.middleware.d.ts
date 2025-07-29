import { Request, Response, NextFunction } from 'express';
export declare const ipFilter: (req: Request, res: Response, next: NextFunction) => void;
export declare const inputSanitizer: (req: Request, res: Response, next: NextFunction) => void;
export declare const advancedRateLimit: (options: {
    windowMs: number;
    maxRequests: number;
    keyGenerator?: (req: Request) => string;
}) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const requestSizeLimiter: (maxSize: string) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const securityHeaders: (req: Request, res: Response, next: NextFunction) => void;
export declare const apiKeyValidator: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const securityLogger: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=security.middleware.d.ts.map