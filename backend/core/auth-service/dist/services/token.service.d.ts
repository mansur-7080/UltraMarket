export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
export declare class TokenService {
    generateTokens(userId: string): Promise<TokenPair>;
    verifyAccessToken(token: string): Promise<TokenPayload>;
    verifyRefreshToken(token: string): Promise<TokenPayload>;
    invalidateRefreshToken(token: string): Promise<void>;
    invalidateAllUserTokens(userId: string): Promise<void>;
    getTokenInfo(token: string): Promise<{
        userId: string;
        email: string;
        role: string;
        issuedAt: Date;
        expiresAt: Date;
    }>;
    cleanupExpiredTokens(): Promise<void>;
    getUserSessions(userId: string): Promise<Array<{
        id: string;
        createdAt: Date;
        expiresAt: Date;
    }>>;
    revokeSession(sessionId: string, userId: string): Promise<void>;
    generateTemporaryToken(userId: string, purpose: string, expiresIn?: string): Promise<string>;
    verifyTemporaryToken(token: string, purpose: string): Promise<any>;
}
//# sourceMappingURL=token.service.d.ts.map