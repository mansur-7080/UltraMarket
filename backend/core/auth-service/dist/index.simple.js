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
const logger_1 = require("./utils/logger");
const auth_routes_1 = require("./routes/auth.routes");
const health_routes_1 = require("./routes/health.routes");
const security_middleware_1 = require("./middleware/security.middleware");
const email_service_1 = require("./services/email.service");
const prisma = new client_1.PrismaClient({
    log: ['warn', 'error']
});
const redis = (0, redis_1.createClient)({
    url: process.env['REDIS_URL'] || 'redis://localhost:6379',
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
const app = (0, express_1.default)();
if (process.env['NODE_ENV'] === 'production') {
    app.set('trust proxy', 1);
}
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env['CORS_ORIGIN']?.split(',') || ['http://localhost:3000'],
    credentials: true
}));
app.use((0, compression_1.default)());
app.use(security_middleware_1.inputSanitizer);
app.use(security_middleware_1.securityLogger);
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
            userAgent: req.get('User-Agent')
        });
    });
    next();
});
app.use('/health', health_routes_1.healthRoutes);
app.use('/api/v1/auth', auth_routes_1.authRoutes);
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
    const isDevelopment = process.env['NODE_ENV'] === 'development';
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
        const port = parseInt(process.env['PORT'] || '3001');
        const host = process.env['HOST'] || '0.0.0.0';
        app.listen(port, host, () => {
            logger_1.logger.info(`🚀 Auth Service started successfully!`);
            logger_1.logger.info(`📍 Environment: ${process.env['NODE_ENV'] || 'development'}`);
            logger_1.logger.info(`🌐 Server: http://${host}:${port}`);
            logger_1.logger.info(`💚 Health Check: http://${host}:${port}/health`);
            logger_1.logger.info(`👤 Process ID: ${process.pid}`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to initialize connections', { error });
        process.exit(1);
    }
};
initializeConnections();
//# sourceMappingURL=index.simple.js.map