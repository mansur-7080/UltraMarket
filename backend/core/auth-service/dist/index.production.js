"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const redis_1 = require("redis");
const client_1 = require("@prisma/client");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const cluster_1 = __importDefault(require("cluster"));
const os_1 = __importDefault(require("os"));
const logger_1 = require("./utils/logger");
const production_config_1 = __importDefault(require("./config/production.config"));
const auth_routes_1 = require("./routes/auth.routes");
const user_routes_1 = require("./routes/user.routes");
const admin_routes_1 = require("./routes/admin.routes");
const health_routes_1 = require("./routes/health.routes");
const security_middleware_1 = require("./middleware/security.middleware");
const email_service_1 = require("./services/email.service");
const prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: production_config_1.default.database.url
        }
    },
    log: production_config_1.default.logging.level === 'debug' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error']
});
const redis = (0, redis_1.createClient)({
    url: production_config_1.default.redis.url,
    password: production_config_1.default.redis.password,
    database: production_config_1.default.redis.db,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                logger_1.logger.error('Redis connection failed after 10 retries');
                return new Error('Redis connection failed');
            }
            return Math.min(retries * 100, 3000);
        }
    }
});
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: production_config_1.default.api.docs.title,
            description: production_config_1.default.api.docs.description,
            version: production_config_1.default.api.docs.version,
            contact: {
                name: 'UltraMarket Support',
                email: 'support@ultramarket.com'
            }
        },
        servers: [
            {
                url: `http://localhost:${production_config_1.default.server.port}`,
                description: 'Development server'
            },
            {
                url: 'https://api.ultramarket.com',
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                },
                apiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-API-Key'
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(swaggerOptions);
if (cluster_1.default.isPrimary && production_config_1.default.server.environment === 'production') {
    const numCPUs = os_1.default.cpus().length;
    logger_1.logger.info(`Master process ${process.pid} is running`);
    logger_1.logger.info(`Starting ${numCPUs} workers`);
    for (let i = 0; i < numCPUs; i++) {
        cluster_1.default.fork();
    }
    cluster_1.default.on('exit', (worker, code, signal) => {
        logger_1.logger.warn(`Worker ${worker.process.pid} died. Restarting...`);
        cluster_1.default.fork();
    });
    cluster_1.default.on('online', (worker) => {
        logger_1.logger.info(`Worker ${worker.process.pid} is online`);
    });
}
else {
    const app = (0, express_1.default)();
    if (production_config_1.default.server.environment === 'production') {
        app.set('trust proxy', 1);
    }
    app.use((0, helmet_1.default)(production_config_1.default.security.helmet));
    app.use((0, cors_1.default)(production_config_1.default.server.cors));
    if (production_config_1.default.features.compression) {
        app.use((0, compression_1.default)({
            level: production_config_1.default.security.compression?.level || 6,
            threshold: production_config_1.default.security.compression?.threshold || 1024,
            filter: (req, res) => {
                if (req.headers['x-no-compression']) {
                    return false;
                }
                return compression_1.default.filter(req, res);
            }
        }));
    }
    if (production_config_1.default.features.requestSizeLimit) {
        app.use((0, security_middleware_1.requestSizeLimiter)(production_config_1.default.security.requestSizeLimit || '10mb'));
    }
    if (production_config_1.default.features.ipFilter) {
        app.use(security_middleware_1.ipFilter);
    }
    app.use(security_middleware_1.inputSanitizer);
    app.use(security_middleware_1.securityLogger);
    if (production_config_1.default.api.rateLimit.enabled) {
        app.use((0, security_middleware_1.advancedRateLimit)({
            windowMs: production_config_1.default.api.rateLimit.windowMs,
            maxRequests: production_config_1.default.api.rateLimit.maxRequests
        }));
    }
    if (production_config_1.default.features.apiKeyValidation) {
        app.use(security_middleware_1.apiKeyValidator);
    }
    app.use(security_middleware_1.securityHeaders);
    app.use(express_1.default.json({
        limit: '10mb',
        verify: (req, res, buf) => {
            try {
                JSON.parse(buf.toString());
            }
            catch (e) {
                throw new Error('Invalid JSON');
            }
        }
    }));
    app.use(express_1.default.urlencoded({
        extended: true,
        limit: '10mb'
    }));
    app.use((req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            logger_1.logger.info('Request processed', {
                method: req.method,
                url: req.url,
                status: res.statusCode,
                duration: `${duration}ms`,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                contentLength: res.get('Content-Length')
            });
        });
        next();
    });
    app.use('/health', health_routes_1.healthRoutes);
    if (production_config_1.default.api.docs.enabled) {
        app.use(production_config_1.default.api.docs.path, swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec, {
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: production_config_1.default.api.docs.title
        }));
    }
    app.use(`/${production_config_1.default.api.prefix}/${production_config_1.default.api.version}/auth`, auth_routes_1.authRoutes);
    app.use(`/${production_config_1.default.api.prefix}/${production_config_1.default.api.version}/users`, user_routes_1.userRoutes);
    app.use(`/${production_config_1.default.api.prefix}/${production_config_1.default.api.version}/admin`, admin_routes_1.adminRoutes);
    app.use('*', (req, res) => {
        logger_1.logger.warn('Route not found', {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip
        });
        res.status(404).json({
            success: false,
            error: {
                message: 'Route not found',
                code: 'ROUTE_NOT_FOUND',
                path: req.originalUrl
            }
        });
    });
    app.use((error, req, res, next) => {
        logger_1.logger.error('Unhandled error', {
            error: error.message,
            stack: error.stack,
            method: req.method,
            url: req.url,
            ip: req.ip
        });
        const isDevelopment = production_config_1.default.server.environment === 'development';
        res.status(500).json({
            success: false,
            error: {
                message: isDevelopment ? error.message : 'Internal server error',
                code: 'INTERNAL_SERVER_ERROR',
                ...(isDevelopment && { stack: error.stack })
            }
        });
    });
    const gracefulShutdown = async (signal) => {
        logger_1.logger.info(`Received ${signal}. Starting graceful shutdown...`);
        const server = app.listen(production_config_1.default.server.port, production_config_1.default.server.host, () => {
            logger_1.logger.info(`Auth Service running on ${production_config_1.default.server.host}:${production_config_1.default.server.port}`);
        });
        server.close(async () => {
            logger_1.logger.info('HTTP server closed');
            try {
                await prisma.$disconnect();
                logger_1.logger.info('Database connections closed');
                await redis.quit();
                logger_1.logger.info('Redis connections closed');
                await email_service_1.emailService.close();
                logger_1.logger.info('Email service connections closed');
                logger_1.logger.info('Graceful shutdown completed');
                process.exit(0);
            }
            catch (error) {
                logger_1.logger.error('Error during graceful shutdown', { error });
                process.exit(1);
            }
        });
        setTimeout(() => {
            logger_1.logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, production_config_1.default.features.gracefulShutdownTimeout || 30000);
    };
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('uncaughtException', (error) => {
        logger_1.logger.error('Uncaught Exception', { error });
        process.exit(1);
    });
    process.on('unhandledRejection', (reason, promise) => {
        logger_1.logger.error('Unhandled Rejection', { reason, promise });
        process.exit(1);
    });
    const initializeConnections = async () => {
        try {
            await prisma.$connect();
            logger_1.logger.info('Database connected successfully');
            await redis.connect();
            logger_1.logger.info('Redis connected successfully');
            await email_service_1.emailService.testConnection();
            logger_1.logger.info('Email service connected successfully');
            const server = app.listen(production_config_1.default.server.port, production_config_1.default.server.host, () => {
                logger_1.logger.info(`🚀 Auth Service started successfully!`);
                logger_1.logger.info(`📍 Environment: ${production_config_1.default.server.environment}`);
                logger_1.logger.info(`🌐 Server: http://${production_config_1.default.server.host}:${production_config_1.default.server.port}`);
                logger_1.logger.info(`📚 API Docs: http://${production_config_1.default.server.host}:${production_config_1.default.server.port}${production_config_1.default.api.docs.path}`);
                logger_1.logger.info(`💚 Health Check: http://${production_config_1.default.server.host}:${production_config_1.default.server.port}/health`);
                logger_1.logger.info(`📊 Metrics: http://${production_config_1.default.server.host}:${production_config_1.default.server.port}/health/metrics`);
                logger_1.logger.info(`👤 Process ID: ${process.pid}`);
                logger_1.logger.info(`🔄 Worker: ${cluster_1.default.isWorker ? 'Yes' : 'No'}`);
            });
            server.on('error', (error) => {
                logger_1.logger.error('Server error', { error });
                process.exit(1);
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize connections', { error });
            process.exit(1);
        }
    };
    initializeConnections();
}
//# sourceMappingURL=index.production.js.map