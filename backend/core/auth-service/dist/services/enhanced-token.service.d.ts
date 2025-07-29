import { Request } from 'express';
import { TokenPayload, TokenPair, TokenServiceInterface } from '../interfaces/token-service.interface';
export declare class TokenService implements TokenServiceInterface {
    generateTokens(userId: string, req?: Request): Promise<TokenPair>;
    private storeDeviceInfo;
    validateAccessToken(token: string): TokenPayload | null;
    validateRefreshToken(token: string): TokenPayload | null;
    refreshTokens(refreshToken: string, req?: Request): Promise<TokenPair>;
    revokeAllUserTokens(userId: string): Promise<void>;
    revokeToken(refreshToken: string): Promise<void>;
    findRefreshToken(refreshToken: string): Promise<any>;
    getUserDevices(userId: string): Promise<any[]>;
    revokeDeviceTokens(userId: string, deviceId: string): Promise<void>;
}
//# sourceMappingURL=enhanced-token.service.d.ts.map