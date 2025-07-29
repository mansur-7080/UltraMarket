/**
 * Environment Variable Encryption & Security System
 * UltraMarket E-commerce Platform
 *
 * Bu fayl hardcoded secrets va environment variables ni xavfsiz boshqarish uchun
 */
export interface SecureEnvConfig {
    encryptionKey: string;
    envFilePath: string;
    requiredVars: string[];
    optionalVars: string[];
    validationRules: ValidationRules;
}
export interface ValidationRules {
    [key: string]: {
        minLength?: number;
        maxLength?: number;
        pattern?: RegExp;
        required?: boolean;
        type?: 'string' | 'number' | 'boolean' | 'url' | 'email';
    };
}
export declare class SecureEnvironmentManager {
    private config;
    private encryptedVars;
    private decryptedCache;
    private algorithm;
    constructor(config: SecureEnvConfig);
    encryptEnvironmentVar(key: string, value: string): Promise<string>;
    decryptEnvironmentVar(key: string, encryptedValue: string): Promise<string>;
    loadSecureEnvironment(): Promise<SecureEnvironment>;
    generateSecureTemplate(): Promise<string>;
    rotateSecrets(secretsToRotate: string[]): Promise<SecretRotationResult>;
    private validateEncryptionKey;
    private processEnvVar;
    private assignToCategory;
    private validateVarValue;
    private validateEnvironment;
    private createSecretsBackup;
    private generateNewSecret;
    private isValidUrl;
    private isValidEmail;
}
export interface SecureEnvironment {
    database: Record<string, any>;
    security: Record<string, any>;
    external: Record<string, any>;
    system: Record<string, any>;
    uzbekistan: Record<string, any>;
}
export interface SecretRotationResult {
    successful: Array<{
        name: string;
        rotatedAt: string;
        encrypted: string;
    }>;
    failed: Array<{
        name: string;
        error: string;
    }>;
    backupCreated: boolean;
}
export default SecureEnvironmentManager;
/**
 * USAGE EXAMPLES:
 *
 * // Initialize secure environment manager
 * const envManager = new SecureEnvironmentManager({
 *   encryptionKey: process.env.MASTER_ENCRYPTION_KEY!,
 *   envFilePath: '.env.production',
 *   requiredVars: ['JWT_SECRET', 'POSTGRES_PASSWORD', 'ENCRYPTION_KEY'],
 *   optionalVars: ['REDIS_PASSWORD', 'SMTP_PASSWORD'],
 *   validationRules: {
 *     JWT_SECRET: { minLength: 64, required: true },
 *     POSTGRES_PASSWORD: { minLength: 16, required: true }
 *   }
 * });
 *
 * // Load secure environment
 * const env = await envManager.loadSecureEnvironment();
 *
 * // Encrypt a secret
 * const encrypted = await envManager.encryptEnvironmentVar('NEW_SECRET', 'secret_value');
 *
 * // Rotate secrets
 * const rotationResult = await envManager.rotateSecrets(['JWT_SECRET', 'ENCRYPTION_KEY']);
 */ 
//# sourceMappingURL=environment-encryption.d.ts.map