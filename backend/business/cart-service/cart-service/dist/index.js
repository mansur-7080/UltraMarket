"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const swaggerUi = require('swagger-ui-express');
const cart_routes_1 = __importDefault(require("./routes/cart.routes"));
const health_routes_1 = __importDefault(require("./routes/health.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const logger_middleware_1 = require("./middleware/logger.middleware");
const security_middleware_1 = require("./middleware/security.middleware");
const logger_1 = require("./utils/logger");
const env_validation_1 = require("./config/env.validation");
const swagger_1 = require("./config/swagger");
const redis_1 = require("./config/redis");
dotenv_1.default.config();
(0, env_validation_1.validateEnv)();
const app = (0, express_1.default)();
const PORT = process.env['PORT'] || 3004;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env['ALLOWED_ORIGINS']?.split(',') || ['http://localhost:3000'],
    credentials: true,
}));
app.use((0, compression_1.default)());
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 2000,
    message: {
        error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
app.use(security_middleware_1.securityMiddleware);
app.use(express_1.default.json({ limit: '1mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '1mb' }));
app.use(logger_middleware_1.requestLogger);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swagger_1.swaggerSpec));
app.use('/api/v1/health', health_routes_1.default);
app.use('/api/v1/cart', cart_routes_1.default);
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
    });
});
app.use(error_middleware_1.errorHandler);
const gracefulShutdown = async (signal) => {
    logger_1.logger.info(`Received ${signal}. Starting graceful shutdown...`);
    server.close(() => {
        logger_1.logger.info('HTTP server closed.');
    });
    try {
        const redis = (0, redis_1.getRedisClient)();
        await redis.quit();
        logger_1.logger.info('Redis connection closed.');
        process.exit(0);
    }
    catch (error) {
        logger_1.logger.error('Error during graceful shutdown:', error);
        process.exit(1);
    }
};
const server = app.listen(PORT, async () => {
    try {
        const redis = (0, redis_1.getRedisClient)();
        await redis.ping();
        logger_1.logger.info(`🚀 Cart Service running on port ${PORT}`);
        logger_1.logger.info(`📍 Environment: ${process.env['NODE_ENV'] || 'development'}`);
        logger_1.logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
        logger_1.logger.info(`🔗 Health check: http://localhost:${PORT}/api/v1/health`);
        logger_1.logger.info(`🔴 Redis: Connected`);
    }
    catch (error) {
        logger_1.logger.error('Failed to start Cart Service:', error);
        process.exit(1);
    }
});
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=index.js.map