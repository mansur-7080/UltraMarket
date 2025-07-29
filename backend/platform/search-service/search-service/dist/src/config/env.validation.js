"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvConfig = exports.validateEnv = void 0;
const joi_1 = __importDefault(require("joi"));
const logger_1 = require("../utils/logger");
const envSchema = joi_1.default.object({
    NODE_ENV: joi_1.default.string().valid('development', 'production', 'test').default('development'),
    PORT: joi_1.default.number().port().default(3007),
    HOST: joi_1.default.string().default('localhost'),
    ALLOWED_ORIGINS: joi_1.default.string().default('http://localhost:3000'),
    JWT_SECRET: joi_1.default.string().required().messages({
        'any.required': 'JWT_SECRET is required for authentication',
    }),
    ELASTICSEARCH_NODE: joi_1.default.string().uri().default('http://localhost:9200'),
    ELASTICSEARCH_USERNAME: joi_1.default.string().optional(),
    ELASTICSEARCH_PASSWORD: joi_1.default.string().optional(),
    ELASTICSEARCH_INDEX_PREFIX: joi_1.default.string().default('ultramarket'),
    REDIS_URL: joi_1.default.string().uri().default('redis://localhost:6379'),
    REDIS_PASSWORD: joi_1.default.string().optional(),
    PRODUCT_SERVICE_URL: joi_1.default.string().uri().default('http://localhost:3003'),
    USER_SERVICE_URL: joi_1.default.string().uri().default('http://localhost:3001'),
    SEARCH_MAX_RESULTS: joi_1.default.number().integer().min(1).max(1000).default(100),
    SEARCH_DEFAULT_SIZE: joi_1.default.number().integer().min(1).max(100).default(20),
    SEARCH_TIMEOUT: joi_1.default.number().integer().min(1000).max(30000).default(5000),
    INDEX_BATCH_SIZE: joi_1.default.number().integer().min(1).max(1000).default(100),
    INDEX_REFRESH_INTERVAL: joi_1.default.string().default('1s'),
    CACHE_TTL: joi_1.default.number().integer().min(60).max(86400).default(3600),
    CACHE_MAX_SIZE: joi_1.default.number().integer().min(100).max(10000).default(1000),
    RATE_LIMIT_WINDOW_MS: joi_1.default.number().integer().min(60000).default(300000),
    RATE_LIMIT_MAX_REQUESTS: joi_1.default.number().integer().min(100).default(1000),
    LOG_LEVEL: joi_1.default.string().valid('error', 'warn', 'info', 'http', 'debug').default('info'),
    LOG_SERVICE_URL: joi_1.default.string().uri().optional(),
    LOG_SERVICE_HOST: joi_1.default.string().optional(),
    LOG_SERVICE_PORT: joi_1.default.number().port().optional(),
    LOG_SERVICE_PATH: joi_1.default.string().optional(),
    TRUSTED_IPS: joi_1.default.string().optional(),
    API_KEY_HEADER: joi_1.default.string().default('X-API-Key'),
    ADMIN_API_KEY: joi_1.default.string().optional(),
    METRICS_ENABLED: joi_1.default.boolean().default(true),
    HEALTH_CHECK_INTERVAL: joi_1.default.number().integer().min(5000).default(30000),
    MAX_CONCURRENT_SEARCHES: joi_1.default.number().integer().min(1).max(100).default(10),
    SEARCH_QUEUE_SIZE: joi_1.default.number().integer().min(10).max(1000).default(100),
    ENABLE_SEARCH_ANALYTICS: joi_1.default.boolean().default(true),
    ENABLE_AUTOCOMPLETE: joi_1.default.boolean().default(true),
    ENABLE_SPELL_CHECK: joi_1.default.boolean().default(true),
    ENABLE_SEARCH_SUGGESTIONS: joi_1.default.boolean().default(true),
    ENABLE_FACETED_SEARCH: joi_1.default.boolean().default(true),
}).unknown(true);
const validateEnv = () => {
    const { error, value } = envSchema.validate(process.env, {
        abortEarly: false,
        stripUnknown: false,
    });
    if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        logger_1.logger.error('Environment validation failed:', {
            errors: errorMessages,
            invalidKeys: error.details.map((detail) => detail.path.join('.')),
        });
        console.error('❌ Environment validation failed:');
        errorMessages.forEach((message) => console.error(`  - ${message}`));
        process.exit(1);
    }
    Object.assign(process.env, value);
    logger_1.logger.info('Environment validation successful', {
        nodeEnv: process.env['NODE_ENV'],
        port: process.env['PORT'],
        elasticsearchNode: process.env['ELASTICSEARCH_NODE'],
        redisUrl: process.env['REDIS_URL'],
        logLevel: process.env['LOG_LEVEL'],
    });
};
exports.validateEnv = validateEnv;
const getEnvConfig = () => {
    return {
        server: {
            nodeEnv: process.env['NODE_ENV'],
            port: parseInt(process.env['PORT'] || '3007'),
            host: process.env['HOST'],
        },
        cors: {
            allowedOrigins: process.env['ALLOWED_ORIGINS']?.split(',') || ['http://localhost:3000'],
        },
        jwt: {
            secret: process.env['JWT_SECRET'],
        },
        elasticsearch: {
            node: process.env['ELASTICSEARCH_NODE'],
            username: process.env['ELASTICSEARCH_USERNAME'],
            password: process.env['ELASTICSEARCH_PASSWORD'],
            indexPrefix: process.env['ELASTICSEARCH_INDEX_PREFIX'],
        },
        redis: {
            url: process.env['REDIS_URL'],
            password: process.env['REDIS_PASSWORD'],
        },
        services: {
            productService: process.env['PRODUCT_SERVICE_URL'],
            userService: process.env['USER_SERVICE_URL'],
        },
        search: {
            maxResults: parseInt(process.env['SEARCH_MAX_RESULTS'] || '100'),
            defaultSize: parseInt(process.env['SEARCH_DEFAULT_SIZE'] || '20'),
            timeout: parseInt(process.env['SEARCH_TIMEOUT'] || '5000'),
        },
        indexing: {
            batchSize: parseInt(process.env['INDEX_BATCH_SIZE'] || '100'),
            refreshInterval: process.env['INDEX_REFRESH_INTERVAL'],
        },
        cache: {
            ttl: parseInt(process.env['CACHE_TTL'] || '3600'),
            maxSize: parseInt(process.env['CACHE_MAX_SIZE'] || '1000'),
        },
        rateLimit: {
            windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '300000'),
            maxRequests: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '1000'),
        },
        logging: {
            level: process.env['LOG_LEVEL'],
            serviceUrl: process.env['LOG_SERVICE_URL'],
            serviceHost: process.env['LOG_SERVICE_HOST'],
            servicePort: process.env['LOG_SERVICE_PORT']
                ? parseInt(process.env['LOG_SERVICE_PORT'])
                : undefined,
            servicePath: process.env['LOG_SERVICE_PATH'],
        },
        security: {
            trustedIps: process.env['TRUSTED_IPS']?.split(',') || [],
            apiKeyHeader: process.env['API_KEY_HEADER'],
            adminApiKey: process.env['ADMIN_API_KEY'],
        },
        monitoring: {
            metricsEnabled: process.env['METRICS_ENABLED'] === 'true',
            healthCheckInterval: parseInt(process.env['HEALTH_CHECK_INTERVAL'] || '30000'),
        },
        performance: {
            maxConcurrentSearches: parseInt(process.env['MAX_CONCURRENT_SEARCHES'] || '10'),
            searchQueueSize: parseInt(process.env['SEARCH_QUEUE_SIZE'] || '100'),
        },
        features: {
            searchAnalytics: process.env['ENABLE_SEARCH_ANALYTICS'] === 'true',
            autocomplete: process.env['ENABLE_AUTOCOMPLETE'] === 'true',
            spellCheck: process.env['ENABLE_SPELL_CHECK'] === 'true',
            searchSuggestions: process.env['ENABLE_SEARCH_SUGGESTIONS'] === 'true',
            facetedSearch: process.env['ENABLE_FACETED_SEARCH'] === 'true',
        },
    };
};
exports.getEnvConfig = getEnvConfig;
//# sourceMappingURL=env.validation.js.map