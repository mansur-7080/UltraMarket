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
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const moderation_routes_1 = __importDefault(require("./routes/moderation.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const health_routes_1 = __importDefault(require("./routes/health.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const logger_middleware_1 = require("./middleware/logger.middleware");
const security_middleware_1 = require("./middleware/security.middleware");
const logger_1 = require("./utils/logger");
const env_validation_1 = require("./config/env.validation");
const swagger_1 = require("./config/swagger");
const database_1 = require("./config/database");
dotenv_1.default.config();
(0, env_validation_1.validateEnv)();
const app = (0, express_1.default)();
const PORT = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 3010;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env['ALLOWED_ORIGINS']?.split(',') || ['http://localhost:3000'],
    credentials: true,
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, compression_1.default)());
app.use(logger_middleware_1.requestLogger);
app.use(security_middleware_1.securityMiddleware);
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'review-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
app.use('/api/v1/reviews', review_routes_1.default);
app.use('/api/v1/moderation', moderation_routes_1.default);
app.use('/api/v1/analytics', analytics_routes_1.default);
app.use('/api/v1/health', health_routes_1.default);
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl,
    });
});
app.use(error_middleware_1.errorHandler);
const gracefulShutdown = (signal) => {
    logger_1.logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
        logger_1.logger.info('HTTP server closed');
        mongoose_1.default.connection.close(false, () => {
            logger_1.logger.info('MongoDB connection closed');
            process.exit(0);
        });
    });
    setTimeout(() => {
        logger_1.logger.error('Forced shutdown after 10 seconds');
        process.exit(1);
    }, 10000);
};
const server = app.listen(PORT, async () => {
    try {
        await (0, database_1.connectDB)();
        logger_1.logger.info(`🚀 Review Service running on port ${PORT}`);
        logger_1.logger.info(`📍 Environment: ${process.env['NODE_ENV'] || 'development'}`);
        logger_1.logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
        logger_1.logger.info(`🔗 Health check: http://localhost:${PORT}/api/v1/health`);
        logger_1.logger.info(`⭐ Reviews: http://localhost:${PORT}/api/v1/reviews`);
        logger_1.logger.info(`🛡️ Moderation: http://localhost:${PORT}/api/v1/moderation`);
        logger_1.logger.info(`📊 Analytics: http://localhost:${PORT}/api/v1/analytics`);
        logger_1.logger.info(`💾 Database: MongoDB Connected`);
    }
    catch (error) {
        logger_1.logger.error('Failed to start Review Service:', error);
        process.exit(1);
    }
});
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
exports.default = app;
//# sourceMappingURL=index.js.map