export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
}
export interface User {
    id: string;
    email: string;
    role: string;
}
export declare class TokenService {
    private readonly accessTokenSecret;
    private readonly refreshTokenSecret;
    private readonly accessTokenExpiry;
    private readonly refreshTokenExpiry;
    constructor();
    generateAccessToken(user: User): string;
    generateRefreshToken(user: User): string;
    verifyAccessToken(token: string): TokenPayload | null;
    verifyRefreshToken(token: string): TokenPayload | null;
    saveRefreshToken(userId: string, refreshToken: string): Promise<void>;
    findRefreshToken(token: string): Promise<any>;
    updateRefreshToken(oldToken: string, newToken: string): Promise<void>;
    invalidateRefreshToken(token: string): Promise<void>;
    invalidateAllUserTokens(userId: string): Promise<void>;
    cleanupExpiredTokens(): Promise<number>;
    getTokenStats(): Promise<{
        totalTokens: number;
        activeTokens: number;
        expiredTokens: number;
        revokedTokens: number;
    }>;
    decodeToken(token: string): any;
    getTokenExpiration(token: string): Date | null;
}
//# sourceMappingURL=tokenService.d.ts.map