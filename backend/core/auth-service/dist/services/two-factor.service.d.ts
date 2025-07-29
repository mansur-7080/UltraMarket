interface TwoFactorMethod {
    id: string;
    type: 'TOTP' | 'SMS' | 'EMAIL';
    secret?: string;
    phone?: string;
    email?: string;
    isEnabled: boolean;
    isVerified: boolean;
    createdAt: Date;
    lastUsed?: Date;
}
declare class TwoFactorService {
    private redis;
    private config;
    constructor();
    private initializeRedis;
    generateTOTPSecret(userId: string, email: string): Promise<{
        secret: string;
        qrCode: string;
        backupCodes: string[];
    }>;
    verifyTOTP(userId: string, token: string): Promise<boolean>;
    generateSMSCode(userId: string, phone: string): Promise<string>;
    verifySMSCode(userId: string, phone: string, code: string): Promise<boolean>;
    generateEmailCode(userId: string, email: string, name: string): Promise<string>;
    verifyEmailCode(userId: string, email: string, code: string): Promise<boolean>;
    private generateBackupCodes;
    verifyBackupCode(userId: string, code: string): Promise<boolean>;
    private generateRandomCode;
    enable2FA(userId: string, method: 'TOTP' | 'SMS' | 'EMAIL', secret?: string, contact?: string): Promise<boolean>;
    disable2FA(userId: string, method: 'TOTP' | 'SMS' | 'EMAIL'): Promise<boolean>;
    is2FAEnabled(userId: string, method: 'TOTP' | 'SMS' | 'EMAIL'): Promise<boolean>;
    getUser2FAMethods(userId: string): Promise<TwoFactorMethod[]>;
    getStats(): Promise<any>;
    close(): Promise<void>;
}
export declare const twoFactorService: TwoFactorService;
export {};
//# sourceMappingURL=two-factor.service.d.ts.map