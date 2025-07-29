"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/**
 * Enhanced Product Service (Prisma Implementation)
 * Entry point for the product service
 */
const express_1 = tslib_1.__importDefault(require("express"));
const cors_1 = tslib_1.__importDefault(require("cors"));
const helmet_1 = tslib_1.__importDefault(require("helmet"));
const morgan_1 = tslib_1.__importDefault(require("morgan"));
const compression_1 = tslib_1.__importDefault(require("compression"));
const swagger_ui_express_1 = tslib_1.__importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = tslib_1.__importDefault(require("swagger-jsdoc"));
const shared_1 = require("./shared");
const product_routes_1 = tslib_1.__importDefault(require("./routes/product.routes"));
const category_routes_1 = tslib_1.__importDefault(require("./routes/category.routes"));
const health_routes_1 = tslib_1.__importDefault(require("./routes/health.routes"));
// Initialize express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Product Service API',
            version: '1.0.0',
            description: 'API documentation for the Product Service',
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: 'Development server',
            },
        ],
    },
    apis: ['./src/routes/*.ts', './src/models/*.ts'],
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(swaggerOptions);
// Middleware
app.use((0, helmet_1.default)()); // Security headers
app.use((0, cors_1.default)()); // Enable CORS
app.use((0, compression_1.default)()); // Compress responses
app.use(express_1.default.json()); // Parse JSON bodies
app.use(express_1.default.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use((0, morgan_1.default)('dev')); // HTTP request logging
// Routes
app.use('/api/products', product_routes_1.default);
app.use('/api/categories', category_routes_1.default);
app.use('/health', health_routes_1.default);
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
// Home route
app.get('/', (req, res) => {
    res.json({
        service: 'product-service',
        version: '1.0.0',
        description: 'UltraMarket product service API',
        endpoints: {
            products: '/api/products',
            categories: '/api/categories',
            health: '/health',
            docs: '/api-docs',
        },
    });
});
// Error handling middleware
app.use(shared_1.errorHandler);
// Start server
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        shared_1.logger.info(`Product service running on port ${PORT}`);
    });
}
exports.default = app;
//# sourceMappingURL=server.js.map