import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
interface ProfessionalJWTPayload extends jwt.JwtPayload {
    userId: string;
    email: string;
    role: 'CUSTOMER' | 'ADMIN' | 'VENDOR' | 'MODERATOR' | 'SUPER_ADMIN';
    permissions: string[];
    sessionId: string;
    tokenType: 'access' | 'refresh';
}
declare global {
    namespace Express {
        interface Request {
            user?: ProfessionalJWTPayload;
        }
    }
}
declare class ProfessionalJWTConfig {
    private static instance;
    readonly accessSecret: string;
    readonly refreshSecret: string;
    readonly issuer: string;
    readonly audience: string;
    private constructor();
    static getInstance(): ProfessionalJWTConfig;
    private getRequiredEnvVar;
    private validateSecrets;
}
declare class AuthError extends Error {
    statusCode: number;
    constructor(message: string, statusCode?: number);
}
export declare const professionalAuthMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const professionalAuthorize: (requiredRoles: ProfessionalJWTPayload["role"][] | ProfessionalJWTPayload["role"]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const professionalRequirePermissions: (requiredPermissions: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireSuperAdmin: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireVendor: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireCustomer: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireUserManagement: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireSystemAccess: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireOrderManagement: (req: Request, res: Response, next: NextFunction) => void;
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export type { ProfessionalJWTPayload };
export { AuthError, ProfessionalJWTConfig };
//# sourceMappingURL=auth.middleware.d.ts.map