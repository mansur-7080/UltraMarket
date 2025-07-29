import { Request, Response, NextFunction } from 'express';
export declare const securityMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const sanitizeInput: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateContentType: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const preventDuplicateRequests: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=security.middleware.d.ts.map