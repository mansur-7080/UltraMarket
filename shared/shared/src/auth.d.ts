import { JwtPayload, TokenPair, UserRole } from './types';
export declare const hashPassword: (password: string) => Promise<string>;
export declare const comparePassword: (password: string, hashedPassword: string) => Promise<boolean>;
export declare const generateTokens: (payload: JwtPayload) => TokenPair;
export declare const verifyAccessToken: (token: string) => JwtPayload;
export declare const verifyRefreshToken: (token: string) => JwtPayload;
export declare const verifyToken: (token: string, secret: string) => any;
export declare const extractTokenFromHeader: (authHeader?: string) => string;
export declare const hasRole: (userRole: UserRole, requiredRoles: UserRole[]) => boolean;
export declare const isAdmin: (userRole: UserRole) => boolean;
export declare const isSeller: (userRole: UserRole) => boolean;
export declare const generateRandomToken: (length?: number) => string;
export declare const generateOTP: (length?: number) => string;
//# sourceMappingURL=auth.d.ts.map