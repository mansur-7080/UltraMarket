import { Request, Response, NextFunction } from 'express';
export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
    type?: string;
    permissions?: string[];
    sessionId?: string;
    tokenType?: 'access' | 'refresh';
}
export interface AuthenticatedRequest extends Request {
    user: JWTPayload;
}
export declare const validateToken: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Generate access token
 */
export declare const generateAccessToken: (payload: Omit<JWTPayload, "type">) => string;
/**
 * Generate refresh token
 */
export declare const generateRefreshToken: (userId: string) => string;
/**
 * Verify refresh token
 */
export declare const verifyRefreshToken: (token: string) => {
    userId: string;
    type: string;
};
/**
 * Role-based access control middleware
 */
export declare const requireRole: (roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Admin-only middleware
 */
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
/**
 * User or admin middleware
 */
export declare const requireUserOrAdmin: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=jwt.d.ts.map