export declare const productionConfig: {
    server: {
        port: number;
        host: string;
        environment: string;
        cors: {
            origin: string[];
            credentials: boolean;
            methods: string[];
            allowedHeaders: string[];
            exposedHeaders: string[];
            maxAge: number;
        };
    };
    database: {
        url: string;
        pool: {
            min: number;
            max: number;
            acquireTimeoutMillis: number;
            createTimeoutMillis: number;
            destroyTimeoutMillis: number;
            idleTimeoutMillis: number;
            reapIntervalMillis: number;
            createRetryIntervalMillis: number;
        };
    };
    redis: {
        url: string;
        password: string | undefined;
        db: number;
        keyPrefix: string;
        retryDelayOnFailover: number;
        maxRetriesPerRequest: number;
        enableReadyCheck: boolean;
        maxMemoryPolicy: string;
    };
    jwt: {
        accessSecret: string;
        refreshSecret: string;
        accessExpiresIn: string;
        refreshExpiresIn: string;
        issuer: string;
        audience: string;
    };
    security: {
        bcryptRounds: number;
        rateLimit: {
            windowMs: number;
            maxRequests: number;
            skipSuccessfulRequests: boolean;
            skipFailedRequests: boolean;
        };
        session: {
            secret: string;
            cookie: {
                secure: boolean;
                httpOnly: boolean;
                sameSite: "strict";
                maxAge: number;
            };
        };
        compression: {
            level: number;
            threshold: number;
        };
        requestSizeLimit: string;
        helmet: {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: string[];
                    styleSrc: string[];
                    scriptSrc: string[];
                    imgSrc: string[];
                    connectSrc: string[];
                    fontSrc: string[];
                    objectSrc: string[];
                    mediaSrc: string[];
                    frameSrc: string[];
                };
            };
            hsts: {
                maxAge: number;
                includeSubDomains: boolean;
                preload: boolean;
            };
        };
    };
    email: {
        provider: string;
        from: string;
        replyTo: string;
        gmail: {
            user: string | undefined;
            password: string | undefined;
        };
        sendgrid: {
            apiKey: string | undefined;
        };
        mailgun: {
            apiKey: string | undefined;
            domain: string | undefined;
        };
        aws: {
            accessKeyId: string | undefined;
            secretAccessKey: string | undefined;
            region: string;
        };
    };
    logging: {
        level: string;
        format: string;
        transports: {
            console: {
                enabled: boolean;
                level: string;
            };
            file: {
                enabled: boolean;
                level: string;
                filename: string;
                maxSize: string;
                maxFiles: string;
            };
            error: {
                enabled: boolean;
                filename: string;
                maxSize: string;
                maxFiles: string;
            };
        };
    };
    monitoring: {
        metrics: {
            enabled: boolean;
            port: number;
            path: string;
        };
        health: {
            enabled: boolean;
            path: string;
            timeout: number;
        };
        tracing: {
            enabled: boolean;
            jaeger: {
                host: string;
                port: number;
            };
        };
    };
    api: {
        version: string;
        prefix: string;
        docs: {
            enabled: boolean;
            path: string;
            title: string;
            description: string;
            version: string;
        };
        rateLimit: {
            enabled: boolean;
            windowMs: number;
            maxRequests: number;
        };
    };
    features: {
        emailVerification: boolean;
        phoneVerification: boolean;
        twoFactorAuth: boolean;
        socialLogin: boolean;
        passwordHistory: boolean;
        accountLockout: boolean;
        sessionManagement: boolean;
        compression: boolean;
        requestSizeLimit: boolean;
        ipFilter: boolean;
        apiKeyValidation: boolean;
        gracefulShutdownTimeout: number;
    };
};
export default productionConfig;
//# sourceMappingURL=production.config.d.ts.map