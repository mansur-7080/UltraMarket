"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productionConfig = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
exports.productionConfig = {
    server: {
        port: parseInt(process.env['PORT'] || '3001'),
        host: process.env['HOST'] || '0.0.0.0',
        environment: process.env['NODE_ENV'] || 'production',
        cors: {
            origin: process.env['CORS_ORIGIN']?.split(',') || ['https://ultramarket.com', 'https://admin.ultramarket.com'],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Requested-With'],
            exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
            maxAge: 86400
        }
    },
    database: {
        url: process.env['DATABASE_URL'] || 'postgresql://ultramarket:ultramarket123@localhost:5432/ultramarket_auth',
        pool: {
            min: parseInt(process.env['DB_POOL_MIN'] || '2'),
            max: parseInt(process.env['DB_POOL_MAX'] || '10'),
            acquireTimeoutMillis: parseInt(process.env['DB_ACQUIRE_TIMEOUT'] || '30000'),
            createTimeoutMillis: parseInt(process.env['DB_CREATE_TIMEOUT'] || '30000'),
            destroyTimeoutMillis: parseInt(process.env['DB_DESTROY_TIMEOUT'] || '5000'),
            idleTimeoutMillis: parseInt(process.env['DB_IDLE_TIMEOUT'] || '30000'),
            reapIntervalMillis: parseInt(process.env['DB_REAP_INTERVAL'] || '1000'),
            createRetryIntervalMillis: parseInt(process.env['DB_CREATE_RETRY_INTERVAL'] || '200')
        }
    },
    redis: {
        url: process.env['REDIS_URL'] || 'redis://localhost:6379',
        password: process.env['REDIS_PASSWORD'],
        db: parseInt(process.env['REDIS_DB'] || '0'),
        keyPrefix: process.env['REDIS_KEY_PREFIX'] || 'auth:',
        retryDelayOnFailover: parseInt(process.env['REDIS_RETRY_DELAY'] || '100'),
        maxRetriesPerRequest: parseInt(process.env['REDIS_MAX_RETRIES'] || '3'),
        enableReadyCheck: true,
        maxMemoryPolicy: process.env['REDIS_MAX_MEMORY_POLICY'] || 'allkeys-lru'
    },
    jwt: {
        accessSecret: process.env['JWT_ACCESS_SECRET'] || 'your-super-secret-access-key-256-bits-long',
        refreshSecret: process.env['JWT_REFRESH_SECRET'] || 'your-super-secret-refresh-key-256-bits-long',
        accessExpiresIn: process.env['JWT_ACCESS_EXPIRES_IN'] || '15m',
        refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
        issuer: process.env['JWT_ISSUER'] || 'ultramarket-auth',
        audience: process.env['JWT_AUDIENCE'] || 'ultramarket-users'
    },
    security: {
        bcryptRounds: parseInt(process.env['BCRYPT_ROUNDS'] || '12'),
        rateLimit: {
            windowMs: parseInt(process.env['RATE_LIMIT_WINDOW'] || '900000'),
            maxRequests: parseInt(process.env['RATE_LIMIT_MAX'] || '100'),
            skipSuccessfulRequests: false,
            skipFailedRequests: false
        },
        session: {
            secret: process.env['SESSION_SECRET'] || 'your-super-secret-session-key',
            cookie: {
                secure: process.env['NODE_ENV'] === 'production',
                httpOnly: true,
                sameSite: 'strict',
                maxAge: parseInt(process.env['SESSION_MAX_AGE'] || '86400000')
            }
        },
        compression: {
            level: parseInt(process.env['COMPRESSION_LEVEL'] || '6'),
            threshold: parseInt(process.env['COMPRESSION_THRESHOLD'] || '1024')
        },
        requestSizeLimit: process.env['REQUEST_SIZE_LIMIT'] || '10mb',
        helmet: {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'"],
                    fontSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"]
                }
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            }
        }
    },
    email: {
        provider: process.env['EMAIL_PROVIDER'] || 'gmail',
        from: process.env['EMAIL_FROM'] || 'noreply@ultramarket.com',
        replyTo: process.env['EMAIL_REPLY_TO'] || 'support@ultramarket.com',
        gmail: {
            user: process.env['GMAIL_USER'],
            password: process.env['GMAIL_PASSWORD']
        },
        sendgrid: {
            apiKey: process.env['SENDGRID_API_KEY']
        },
        mailgun: {
            apiKey: process.env['MAILGUN_API_KEY'],
            domain: process.env['MAILGUN_DOMAIN']
        },
        aws: {
            accessKeyId: process.env['AWS_ACCESS_KEY_ID'],
            secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY'],
            region: process.env['AWS_REGION'] || 'us-east-1'
        }
    },
    logging: {
        level: process.env['LOG_LEVEL'] || 'info',
        format: process.env['LOG_FORMAT'] || 'json',
        transports: {
            console: {
                enabled: process.env['LOG_CONSOLE_ENABLED'] !== 'false',
                level: process.env['LOG_CONSOLE_LEVEL'] || 'info'
            },
            file: {
                enabled: process.env['LOG_FILE_ENABLED'] !== 'false',
                level: process.env['LOG_FILE_LEVEL'] || 'warn',
                filename: process.env['LOG_FILE_PATH'] || './logs/auth-service.log',
                maxSize: process.env['LOG_FILE_MAX_SIZE'] || '20m',
                maxFiles: process.env['LOG_FILE_MAX_FILES'] || '14'
            },
            error: {
                enabled: process.env['LOG_ERROR_ENABLED'] !== 'false',
                filename: process.env['LOG_ERROR_FILE_PATH'] || './logs/auth-service-error.log',
                maxSize: process.env['LOG_ERROR_MAX_SIZE'] || '20m',
                maxFiles: process.env['LOG_ERROR_MAX_FILES'] || '30'
            }
        }
    },
    monitoring: {
        metrics: {
            enabled: process.env['METRICS_ENABLED'] !== 'false',
            port: parseInt(process.env['METRICS_PORT'] || '9090'),
            path: process.env['METRICS_PATH'] || '/metrics'
        },
        health: {
            enabled: process.env['HEALTH_CHECK_ENABLED'] !== 'false',
            path: process.env['HEALTH_CHECK_PATH'] || '/health',
            timeout: parseInt(process.env['HEALTH_CHECK_TIMEOUT'] || '5000')
        },
        tracing: {
            enabled: process.env['TRACING_ENABLED'] === 'true',
            jaeger: {
                host: process.env['JAEGER_HOST'] || 'localhost',
                port: parseInt(process.env['JAEGER_PORT'] || '6832')
            }
        }
    },
    api: {
        version: process.env['API_VERSION'] || 'v1',
        prefix: process.env['API_PREFIX'] || '/api',
        docs: {
            enabled: process.env['API_DOCS_ENABLED'] !== 'false',
            path: process.env['API_DOCS_PATH'] || '/docs',
            title: process.env['API_DOCS_TITLE'] || 'UltraMarket Auth API',
            description: process.env['API_DOCS_DESCRIPTION'] || 'Professional Authentication Service API',
            version: process.env['API_DOCS_VERSION'] || '1.0.0'
        },
        rateLimit: {
            enabled: process.env['API_RATE_LIMIT_ENABLED'] !== 'false',
            windowMs: parseInt(process.env['API_RATE_LIMIT_WINDOW'] || '900000'),
            maxRequests: parseInt(process.env['API_RATE_LIMIT_MAX'] || '100')
        }
    },
    features: {
        emailVerification: process.env['FEATURE_EMAIL_VERIFICATION'] !== 'false',
        phoneVerification: process.env['FEATURE_PHONE_VERIFICATION'] === 'true',
        twoFactorAuth: process.env['FEATURE_2FA'] === 'true',
        socialLogin: process.env['FEATURE_SOCIAL_LOGIN'] === 'true',
        passwordHistory: process.env['FEATURE_PASSWORD_HISTORY'] === 'true',
        accountLockout: process.env['FEATURE_ACCOUNT_LOCKOUT'] !== 'false',
        sessionManagement: process.env['FEATURE_SESSION_MANAGEMENT'] !== 'false',
        compression: process.env['COMPRESSION_ENABLED'] !== 'false',
        requestSizeLimit: process.env['REQUEST_SIZE_LIMIT_ENABLED'] !== 'false',
        ipFilter: process.env['IP_FILTER_ENABLED'] === 'true',
        apiKeyValidation: process.env['API_KEY_REQUIRED'] === 'true',
        gracefulShutdownTimeout: parseInt(process.env['GRACEFUL_SHUTDOWN_TIMEOUT'] || '30000')
    }
};
exports.default = exports.productionConfig;
//# sourceMappingURL=production.config.js.map