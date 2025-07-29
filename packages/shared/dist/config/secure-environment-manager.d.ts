/**
 * 🔒 SECURE ENVIRONMENT MANAGER - UltraMarket
 *
 * Barcha hardcoded credentials va environment variables ni xavfsiz boshqarish
 * Professional secrets management system
 *
 * @author UltraMarket Development Team
 * @version 2.0.0
 * @date 2024-12-28
 */
import { z } from 'zod';
declare const DatabaseConfigSchema: z.ZodObject<{
    POSTGRES_HOST: z.ZodString;
    POSTGRES_PORT: z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>;
    POSTGRES_DB: z.ZodString;
    POSTGRES_USER: z.ZodString;
    POSTGRES_PASSWORD: z.ZodString;
    MONGODB_URI: z.ZodString;
    MONGODB_PASSWORD: z.ZodString;
    REDIS_HOST: z.ZodString;
    REDIS_PORT: z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>;
    REDIS_PASSWORD: z.ZodString;
}, z.core.$strip>;
declare const SecurityConfigSchema: z.ZodObject<{
    JWT_ACCESS_SECRET: z.ZodString;
    JWT_REFRESH_SECRET: z.ZodString;
    JWT_VERIFICATION_SECRET: z.ZodString;
    ENCRYPTION_KEY: z.ZodString;
    SESSION_SECRET: z.ZodString;
    BCRYPT_SALT_ROUNDS: z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>;
}, z.core.$strip>;
declare const ExternalServicesSchema: z.ZodObject<{
    CLICK_MERCHANT_ID: z.ZodString;
    CLICK_SECRET_KEY: z.ZodString;
    PAYME_MERCHANT_ID: z.ZodString;
    PAYME_SECRET_KEY: z.ZodString;
    UZCARD_MERCHANT_ID: z.ZodOptional<z.ZodString>;
    UZCARD_SECRET_KEY: z.ZodOptional<z.ZodString>;
    ESKIZ_EMAIL: z.ZodString;
    ESKIZ_PASSWORD: z.ZodString;
    PLAYMOBILE_LOGIN: z.ZodOptional<z.ZodString>;
    PLAYMOBILE_PASSWORD: z.ZodOptional<z.ZodString>;
    SENDGRID_API_KEY: z.ZodOptional<z.ZodString>;
    SMTP_HOST: z.ZodOptional<z.ZodString>;
    SMTP_PORT: z.ZodOptional<z.ZodString>;
    SMTP_USER: z.ZodOptional<z.ZodString>;
    SMTP_PASSWORD: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export interface SecureEnvironmentConfig {
    database: z.infer<typeof DatabaseConfigSchema>;
    security: z.infer<typeof SecurityConfigSchema>;
    externalServices: Partial<z.infer<typeof ExternalServicesSchema>>;
}
export interface SecretGenerationOptions {
    length: number;
    includeSymbols?: boolean;
    includeNumbers?: boolean;
    includeUppercase?: boolean;
    includeLowercase?: boolean;
}
export interface EnvironmentValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    config?: SecureEnvironmentConfig;
}
/**
 * Professional Secure Environment Manager
 */
export declare class SecureEnvironmentManager {
    private static instance;
    private configCache;
    private isProduction;
    private constructor();
    static getInstance(): SecureEnvironmentManager;
    /**
     * Generate cryptographically secure random secret
     */
    generateSecureSecret(options?: SecretGenerationOptions): string;
    /**
     * Generate base64 encoded secure secret
     */
    generateBase64Secret(byteLength?: number): string;
    /**
     * Generate secure password with specific requirements
     */
    generateSecurePassword(length?: number): string;
    /**
     * Generate complete environment configuration
     */
    generateCompleteEnvironment(): Record<string, string>;
    /**
     * Validate environment configuration
     */
    validateEnvironment(): EnvironmentValidationResult;
    /**
     * Production-specific security validations
     */
    private validateProductionSecurity;
    /**
     * Generate secure .env file
     */
    generateEnvFile(outputPath?: string): Promise<void>;
    /**
     * Load and validate environment from file
     */
    loadEnvironmentFromFile(filePath: string): Promise<EnvironmentValidationResult>;
    /**
     * Get configuration value with caching
     */
    getConfig<T>(key: string, defaultValue?: T): T;
    /**
     * Clear configuration cache
     */
    clearCache(): void;
    /**
     * Check if running in production mode
     */
    isProductionMode(): boolean;
}
export declare const secureEnvManager: SecureEnvironmentManager;
export declare const generateSecrets: () => Record<string, string>;
export declare const validateEnv: () => EnvironmentValidationResult;
export declare const createEnvFile: (path?: string) => Promise<void>;
export declare const environmentValidationMiddleware: (req: any, res: any, next: any) => any;
export default secureEnvManager;
//# sourceMappingURL=secure-environment-manager.d.ts.map