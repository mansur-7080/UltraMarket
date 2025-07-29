"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const environment_1 = require("@ultramarket/shared/validation/environment");
const logger_1 = require("@ultramarket/shared/logging/logger");
const error_handler_1 = require("@ultramarket/shared/middleware/error-handler");
const security_1 = require("@ultramarket/shared/middleware/security");
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const database_1 = require("./config/database");
(0, environment_1.validateEnvironmentOnStartup)('product-service');
const app = (0, express_1.default)();
const PORT = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 3003;
const HOST = process.env['HOST'] ?? 'localhost';
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, cors_1.default)({
    origin: process.env['CORS_ORIGIN'] ?? '*',
    credentials: true,
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] ?? '900000', 10),
    max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] ?? '1000', 10),
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, security_1.securityMiddleware)());
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'product-service',
        timestamp: new Date().toISOString(),
        version: process.env['APP_VERSION'] ?? '1.0.0',
    });
});
app.use('/api/v1/products', product_routes_1.default);
app.use('/api/v1/categories', category_routes_1.default);
app.use(error_handler_1.errorHandler);
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl,
    });
});
async function startServer() {
    try {
        await (0, database_1.connectDatabase)();
        app.listen(PORT, HOST, () => {
            logger_1.logger.info('Product service started successfully', {
                port: PORT,
                host: HOST,
                environment: process.env['NODE_ENV'] ?? 'development',
            });
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start product service', { error });
        process.exit(1);
    }
}
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger_1.logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});
startServer();
exports.default = app;
//# sourceMappingURL=index.js.map