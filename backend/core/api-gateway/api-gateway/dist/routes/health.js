"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = void 0;
const express_1 = require("express");
const metrics_1 = require("../middleware/metrics");
const router = (0, express_1.Router)();
exports.healthRoutes = router;
router.get('/', (req, res) => {
    res.json({
        status: 'OK',
        service: 'api-gateway',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development',
    });
});
router.get('/detailed', (req, res) => {
    const healthData = {
        status: 'OK',
        service: 'api-gateway',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development',
        services: {
            user: process.env.USER_SERVICE_URL || 'http://localhost:3001',
            product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
            auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3003',
            order: process.env.ORDER_SERVICE_URL || 'http://localhost:3004',
            cart: process.env.CART_SERVICE_URL || 'http://localhost:3005',
            payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3006',
            notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007',
            search: process.env.SEARCH_SERVICE_URL || 'http://localhost:3008',
            analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3009',
        },
    };
    res.json(healthData);
});
router.get('/ready', (req, res) => {
    const requiredEnvVars = ['JWT_SECRET'];
    const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
    if (missingVars.length > 0) {
        res.status(503).json({
            status: 'NOT_READY',
            message: 'Missing required environment variables',
            missing: missingVars,
            timestamp: new Date().toISOString(),
        });
        return;
    }
    res.json({
        status: 'READY',
        service: 'api-gateway',
        timestamp: new Date().toISOString(),
    });
});
router.get('/live', (req, res) => {
    res.json({
        status: 'ALIVE',
        service: 'api-gateway',
        timestamp: new Date().toISOString(),
    });
});
router.get('/metrics', metrics_1.getMetrics);
//# sourceMappingURL=health.js.map