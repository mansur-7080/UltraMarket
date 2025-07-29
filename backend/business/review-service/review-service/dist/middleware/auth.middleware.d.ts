import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: string;
                verified: boolean;
                permissions?: string[];
            };
        }
    }
}
export interface JWTPayload {
    id: string;
    email: string;
    role: string;
    verified: boolean;
    permissions?: string[];
    iat?: number;
    exp?: number;
}
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuthMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (allowedRoles: string | string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const requirePermission: (permission: string) => (req: Request, res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireModerator: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireVerified: (req: Request, res: Response, next: NextFunction) => void;
export declare const rateLimitByUser: (maxRequests: number, windowMs: number) => (req: Request, res: Response, next: NextFunction) => void;
export declare const securityHeaders: (req: Request, res: Response, next: NextFunction) => void;
export default authMiddleware;
//# sourceMappingURL=auth.middleware.d.ts.map