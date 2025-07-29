/**
 * JWT Utility Functions
 * Simple token generation and verification utilities
 */
export interface TokenPayload {
    userId: string;
    email?: string;
    role?: string;
    jti?: string;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
/**
 * Generate access and refresh tokens
 */
export declare function generateTokens(userId: string): Promise<TokenPair>;
/**
 * Verify and decode JWT token
 */
export declare function verifyToken(token: string): TokenPayload;
/**
 * Verify refresh token
 */
export declare function verifyRefreshToken(token: string): TokenPayload;
/**
 * Generate email verification token
 */
export declare function generateEmailVerificationToken(userId: string): string;
/**
 * Generate password reset token
 */
export declare function generatePasswordResetToken(userId: string): string;
/**
 * Decode token without verification (for logging purposes)
 */
export declare function decodeToken(token: string): any;
/**
 * Check if token is expired
 */
export declare function isTokenExpired(token: string): boolean;
/**
 * Get token expiration time
 */
export declare function getTokenExpiration(token: string): Date | null;
//# sourceMappingURL=jwt-utils.d.ts.map