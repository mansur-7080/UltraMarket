import Joi from 'joi';
export interface EnvironmentConfig {
    NODE_ENV: 'development' | 'production' | 'staging' | 'test';
    PORT: number;
    DATABASE_URL: string;
    POSTGRES_HOST: string;
    POSTGRES_PORT: number;
    POSTGRES_DB: string;
    POSTGRES_USER: string;
    POSTGRES_PASSWORD: string;
    MONGODB_URI: string;
    MONGODB_DB: string;
    REDIS_HOST: string;
    REDIS_PORT: number;
    REDIS_PASSWORD?: string;
    REDIS_DB: number;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_ACCESS_EXPIRES_IN: string;
    JWT_REFRESH_EXPIRES_IN: string;
    CLICK_SERVICE_ID?: string;
    CLICK_MERCHANT_ID?: string;
    CLICK_SECRET_KEY?: string;
    PAYME_MERCHANT_ID?: string;
    PAYME_SECRET_KEY?: string;
    APELSIN_MERCHANT_ID?: string;
    APELSIN_SECRET_KEY?: string;
    EMAIL_HOST: string;
    EMAIL_PORT: number;
    EMAIL_SECURE: boolean;
    EMAIL_USER: string;
    EMAIL_PASS: string;
    EMAIL_FROM: string;
    ESKIZ_API_KEY?: string;
    PLAYMOBILE_API_KEY?: string;
    CORS_ORIGIN: string;
    RATE_LIMIT_WINDOW_MS: number;
    RATE_LIMIT_MAX_REQUESTS: number;
    SENTRY_DSN?: string;
    LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
    SERVICE_NAME: string;
    APP_VERSION: string;
}
export declare class EnvironmentValidationError extends Error {
    details: Joi.ValidationError;
    constructor(message: string, details: Joi.ValidationError);
}
export declare function validateEnvironment(): EnvironmentConfig;
export declare function checkProductionReadiness(): {
    isReady: boolean;
    missingConfigs: string[];
    recommendations: string[];
};
export declare const env: EnvironmentConfig;
//# sourceMappingURL=env-validator.d.ts.map