export declare enum UserRole {
    CUSTOMER = "CUSTOMER",
    SELLER = "SELLER",
    ADMIN = "ADMIN",
    SUPER_ADMIN = "SUPER_ADMIN"
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export interface JWTPayload {
    userId: string;
    email: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}
export interface LoginCredentials {
    email: string;
    password: string;
}
export interface RegisterData {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
}
export interface ResetPasswordData {
    token: string;
    newPassword: string;
}
export interface ChangePasswordData {
    currentPassword: string;
    newPassword: string;
}
export interface AuthResponse {
    user: {
        id: string;
        email: string;
        username: string;
        firstName: string;
        lastName: string;
        role: UserRole;
        isEmailVerified: boolean;
    };
    tokens: AuthTokens;
}
export interface SessionData {
    userId: string;
    email: string;
    role: UserRole;
    sessionId: string;
    expiresAt: Date;
}
export interface RefreshTokenData {
    userId: string;
    tokenId: string;
    expiresAt: Date;
}
export interface EmailVerificationData {
    userId: string;
    token: string;
    expiresAt: Date;
}
export interface PasswordResetData {
    userId: string;
    token: string;
    expiresAt: Date;
}
//# sourceMappingURL=auth.d.ts.map