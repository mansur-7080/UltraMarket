export interface JWTConfig {
    accessSecret: string;
    refreshSecret: string;
    accessExpiresIn: string;
    refreshExpiresIn: string;
    issuer: string;
    audience: string;
}
export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
    permissions: string[];
    sessionId: string;
    iat?: number;
    exp?: number;
    iss?: string;
    aud?: string;
}
export interface RefreshTokenPayload {
    userId: string;
    sessionId: string;
    tokenVersion: number;
    iat?: number;
    exp?: number;
}
export declare class JWTService {
    private config;
    private blacklistedTokens;
    constructor(config?: Partial<JWTConfig>);
    /**
     * Generate cryptographically secure secret
     */
    private generateSecureSecret;
    /**
     * Validate JWT secrets strength
     */
    private validateSecrets;
    /**
     * Generate access token
     */
    generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'>): string;
    /**
     * Generate refresh token
     */
    generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string;
    /**
     * Verify access token
     */
    verifyAccessToken(token: string): JWTPayload;
    /**
     * Verify refresh token
     */
    verifyRefreshToken(token: string): RefreshTokenPayload;
    /**
     * Decode token without verification (for debugging)
     */
    decodeToken(token: string): JWTPayload | null;
    /**
     * Blacklist token
     */
    blacklistToken(token: string): void;
    /**
     * Check if token is blacklisted
     */
    isTokenBlacklisted(token: string): boolean;
    /**
     * Generate token pair
     */
    generateTokenPair(userPayload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'>): {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    };
    /**
     * Refresh access token
     */
    refreshAccessToken(refreshToken: string): {
        accessToken: string;
        expiresIn: number;
    };
    /**
     * Parse expiration time string to seconds
     */
    private parseExpirationTime;
    /**
     * Hash token for logging (security)
     */
    private hashToken;
    /**
     * Get token expiration date
     */
    getTokenExpiration(token: string): Date | null;
    /**
     * Check if token is expired
     */
    isTokenExpired(token: string): boolean;
    /**
     * Generate secure session ID
     */
    generateSessionId(): string;
    /**
     * Clean up expired blacklisted tokens (should be called periodically)
     */
    cleanupBlacklistedTokens(): void;
}
export declare const jwtService: JWTService;
export declare const jwtMiddleware: (req: any, res: any, next: any) => any;
export declare const optionalJwtMiddleware: (req: any, _res: any, next: any) => any;
export default jwtService;
//# sourceMappingURL=jwt.d.ts.map