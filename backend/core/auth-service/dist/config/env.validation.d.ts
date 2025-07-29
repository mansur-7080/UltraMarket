interface EnvironmentConfig {
    NODE_ENV: string;
    PORT: number;
    DATABASE_URL: string;
    REDIS_URL: string;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_ACCESS_SECRET: string;
    JWT_ACCESS_EXPIRES_IN: string;
    JWT_REFRESH_EXPIRES_IN: string;
    CORS_ORIGIN: string;
    LOG_LEVEL: string;
    EMAIL_SERVICE: string;
    EMAIL_HOST: string;
    EMAIL_PORT: number;
    EMAIL_USER: string;
    EMAIL_PASS: string;
    SMS_SERVICE: string;
    SMS_API_KEY: string;
    RATE_LIMIT_WINDOW_MS: number;
    RATE_LIMIT_MAX_REQUESTS: number;
    SESSION_SECRET: string;
    ENCRYPTION_KEY: string;
}
export declare function validateEnv(): EnvironmentConfig;
export {};
//# sourceMappingURL=env.validation.d.ts.map