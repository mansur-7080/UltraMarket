/**
 * 🔒 Professional Environment Validation System
 * UltraMarket E-commerce Platform
 *
 * Bu fayl barcha environment variables ni professional tarzda validate qiladi
 * va production-ready konfiguratsiyani ta'minlaydi
 */
export interface UltraMarketEnvironmentConfig {
    NODE_ENV: 'development' | 'production' | 'staging' | 'test';
    PORT: number;
    APP_NAME: string;
    APP_URL: string;
    API_VERSION: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_ACCESS_EXPIRES_IN: string;
    JWT_REFRESH_EXPIRES_IN: string;
    ENCRYPTION_KEY: string;
    SESSION_SECRET: string;
    COOKIE_SECRET: string;
    CSRF_SECRET: string;
    DATABASE_URL: string;
    POSTGRES_HOST: string;
    POSTGRES_PORT: number;
    POSTGRES_DB: string;
    POSTGRES_USER: string;
    POSTGRES_PASSWORD: string;
    POSTGRES_SSL: boolean;
    POSTGRES_POOL_MIN: number;
    POSTGRES_POOL_MAX: number;
    MONGODB_URI: string;
    MONGODB_DB: string;
    MONGODB_USER: string;
    MONGODB_PASSWORD: string;
    REDIS_HOST: string;
    REDIS_PORT: number;
    REDIS_PASSWORD: string;
    REDIS_DB: number;
    REDIS_TTL: number;
    CLICK_MERCHANT_ID: string;
    CLICK_SERVICE_ID: string;
    CLICK_SECRET_KEY: string;
    CLICK_API_URL: string;
    PAYME_MERCHANT_ID: string;
    PAYME_SECRET_KEY: string;
    PAYME_API_URL: string;
    UZCARD_MERCHANT_ID?: string;
    UZCARD_SECRET_KEY?: string;
    UZCARD_API_URL?: string;
    ESKIZ_API_URL: string;
    ESKIZ_EMAIL: string;
    ESKIZ_PASSWORD: string;
    ESKIZ_FROM: string;
    PLAYMOBILE_API_URL?: string;
    PLAYMOBILE_LOGIN?: string;
    PLAYMOBILE_PASSWORD?: string;
    SMTP_HOST: string;
    SMTP_PORT: number;
    SMTP_SECURE: boolean;
    SMTP_USER: string;
    SMTP_PASSWORD: string;
    SMTP_FROM: string;
    CORS_ORIGIN: string;
    RATE_LIMIT_WINDOW_MS: number;
    RATE_LIMIT_MAX_REQUESTS: number;
    BCRYPT_ROUNDS: number;
    LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
    SENTRY_DSN?: string;
    PROMETHEUS_ENABLED: boolean;
    FEATURE_RECOMMENDATIONS: boolean;
    FEATURE_ANALYTICS: boolean;
    FEATURE_NOTIFICATIONS: boolean;
    FEATURE_REVIEWS: boolean;
    FEATURE_CHAT: boolean;
    DEFAULT_LANGUAGE: 'uz' | 'ru' | 'en';
    DEFAULT_CURRENCY: 'UZS' | 'USD';
    TAX_RATE: number;
    SHIPPING_COST: number;
    FREE_SHIPPING_THRESHOLD: number;
}
/**
 * 🛡️ Strong Secret Generator
 */
export declare class SecretGenerator {
    static generateStrongSecret(length?: number): string;
    static generateJWTSecret(): string;
    static generateEncryptionKey(): string;
    static isSecretStrong(secret: string): boolean;
}
/**
 * 🚨 Critical Validation Errors
 */
export declare class EnvironmentValidationError extends Error {
    readonly errors: string[];
    readonly severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    constructor(message: string, errors: string[], severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM');
}
/**
 * 🔧 Professional Environment Validator
 */
export declare class ProfessionalEnvironmentValidator {
    private config;
    private validationErrors;
    private validationWarnings;
    /**
     * Validate environment variables
     */
    validateEnvironment(): UltraMarketEnvironmentConfig;
    /**
     * Perform additional security checks
     */
    private performSecurityChecks;
    /**
     * Get validated configuration
     */
    getConfig(): UltraMarketEnvironmentConfig;
    /**
     * Generate missing secrets
     */
    generateMissingSecrets(): Record<string, string>;
    /**
     * Production readiness check
     */
    checkProductionReadiness(): {
        isReady: boolean;
        criticalIssues: string[];
        warnings: string[];
    };
}
/**
 * 🌟 Global Validator Instance
 */
export declare const environmentValidator: ProfessionalEnvironmentValidator;
/**
 * 🚀 Quick validation function
 */
export declare function validateUltraMarketEnvironment(): UltraMarketEnvironmentConfig;
/**
 * 🔑 Generate and save secrets to .env file
 */
export declare function generateAndSaveSecrets(envFilePath?: string): void;
declare const _default: {
    ProfessionalEnvironmentValidator: typeof ProfessionalEnvironmentValidator;
    SecretGenerator: typeof SecretGenerator;
    environmentValidator: ProfessionalEnvironmentValidator;
    validateUltraMarketEnvironment: typeof validateUltraMarketEnvironment;
    generateAndSaveSecrets: typeof generateAndSaveSecrets;
};
export default _default;
//# sourceMappingURL=professional-env-validator.d.ts.map