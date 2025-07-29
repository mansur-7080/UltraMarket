import { Request } from 'express';
export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
    deviceId?: string;
    iat?: number;
    exp?: number;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
export interface TokenServiceInterface {
    generateTokens(userId: string, req?: Request): Promise<TokenPair>;
    validateAccessToken(token: string): TokenPayload | null;
    validateRefreshToken(token: string): TokenPayload | null;
    refreshTokens(refreshToken: string, req?: Request): Promise<TokenPair>;
    revokeAllUserTokens(userId: string): Promise<void>;
    revokeToken(refreshToken: string): Promise<void>;
    findRefreshToken(refreshToken: string): Promise<any>;
    getUserDevices(userId: string): Promise<any[]>;
    revokeDeviceTokens(userId: string, deviceId: string): Promise<void>;
}
//# sourceMappingURL=token-service.interface.d.ts.map