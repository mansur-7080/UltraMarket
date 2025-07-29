export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
}
export interface Tokens {
    accessToken: string;
    refreshToken: string;
}
export declare class JWTService {
    private readonly accessTokenSecret;
    private readonly refreshTokenSecret;
    private readonly accessTokenExpiry;
    private readonly refreshTokenExpiry;
    constructor();
    generateTokens(payload: TokenPayload): Promise<Tokens>;
    verifyAccessToken(token: string): TokenPayload | null;
    verifyRefreshToken(token: string): TokenPayload | null;
    generateResetToken(userId: string): Promise<string>;
    generateVerificationToken(userId: string): Promise<string>;
    decodeToken(token: string): any;
    getTokenExpiration(token: string): Date | null;
    isTokenExpired(token: string): boolean;
}
//# sourceMappingURL=jwt.service.d.ts.map