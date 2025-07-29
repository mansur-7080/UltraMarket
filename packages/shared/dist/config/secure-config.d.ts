/**
 * Secure Configuration Management System
 * UltraMarket E-commerce Platform
 *
 * Bu fayl barcha secrets va environment variables ni xavfsiz boshqarish uchun
 */
export declare class SecureConfigManager {
    private static instance;
    private configCache;
    private constructor();
    static getInstance(): SecureConfigManager;
    generateStrongSecret(length?: number): string;
    validateEnvironment(): void;
    getDatabaseConfig(): {
        postgres: {
            host: string;
            port: number;
            database: string;
            username: string;
            password: string;
        };
        mongodb: {
            uri: string;
        };
        redis: {
            url: string;
        };
    };
    getSecurityConfig(): {
        jwt: {
            secret: string;
            refreshSecret: string;
            expiresIn: string;
            refreshExpiresIn: string;
        };
        encryption: {
            key: string;
            algorithm: string;
        };
        session: {
            secret: string;
            name: string;
            cookie: {
                maxAge: number;
                httpOnly: boolean;
                secure: boolean;
                sameSite: "strict";
            };
        };
    };
    getPaymentConfig(): {
        click: {
            merchantId: string;
            secretKey: string;
            endpoint: string;
        };
        payme: {
            merchantId: string;
            secretKey: string;
            endpoint: string;
        };
        stripe: {
            secretKey: string | undefined;
            publishableKey: string | undefined;
        };
    };
    encryptData(data: string): string;
    decryptData(encryptedData: string): string;
}
export declare const configManager: SecureConfigManager;
export declare const generateEnvTemplate: () => string;
export declare const loadDockerSecrets: (secretName: string) => string;
export declare const loadK8sSecret: (secretName: string, namespace?: string) => string;
export declare const validateConfigHealth: () => {
    status: string;
    issues: string[];
};
//# sourceMappingURL=secure-config.d.ts.map