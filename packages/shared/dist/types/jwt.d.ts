/**
 * JWT Token interface definitions
 */
export interface JwtAccessTokenPayload {
    userId: string;
    email?: string;
    role?: string;
    jti?: string;
    iat?: number;
    exp?: number;
}
export interface JwtRefreshTokenPayload {
    userId: string;
    jti?: string;
    iat?: number;
    exp?: number;
}
export interface JwtEmailVerificationTokenPayload {
    userId: string;
    email: string;
    purpose: 'email_verification';
    iat?: number;
    exp?: number;
}
export interface JwtPasswordResetTokenPayload {
    userId: string;
    email: string;
    purpose: 'password_reset';
    iat?: number;
    exp?: number;
}
export type JwtPayload = JwtAccessTokenPayload | JwtRefreshTokenPayload | JwtEmailVerificationTokenPayload | JwtPasswordResetTokenPayload;
//# sourceMappingURL=jwt.d.ts.map