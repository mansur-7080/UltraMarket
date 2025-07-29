"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = require("express");
const mongoose_1 = tslib_1.__importDefault(require("mongoose"));
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Basic health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 service:
 *                   type: string
 *                   example: product-service
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 */
router.get('/', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'product-service',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
    });
});
/**
 * @swagger
 * /api/v1/health/detailed:
 *   get:
 *     summary: Detailed health check with dependencies
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service and dependencies are healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 service:
 *                   type: string
 *                   example: product-service
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 dependencies:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: ok
 *                         latency:
 *                           type: string
 *                           example: 2ms
 *       503:
 *         description: Service or dependencies are unhealthy
 */
router.get('/detailed', async (req, res) => {
    const healthCheck = {
        status: 'ok',
        service: 'product-service',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        dependencies: {
            database: { status: 'unknown', latency: '0ms' },
        },
    };
    let isHealthy = true;
    try {
        // Check MongoDB connection
        const dbStart = Date.now();
        await mongoose_1.default.connection.db.admin().ping();
        const dbLatency = Date.now() - dbStart;
        healthCheck.dependencies.database = {
            status: 'ok',
            latency: `${dbLatency}ms`,
        };
    }
    catch (error) {
        logger_1.logger.error('Database health check failed:', error);
        healthCheck.dependencies.database = {
            status: 'error',
            latency: '0ms',
        };
        isHealthy = false;
    }
    if (!isHealthy) {
        healthCheck.status = 'degraded';
        res.status(503).json(healthCheck);
    }
    else {
        res.status(200).json(healthCheck);
    }
});
/**
 * @swagger
 * /api/v1/health/ready:
 *   get:
 *     summary: Readiness probe
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready to accept requests
 *       503:
 *         description: Service is not ready
 */
router.get('/ready', async (req, res) => {
    try {
        // Check if service can handle requests
        await mongoose_1.default.connection.db.admin().ping();
        res.status(200).json({
            status: 'ready',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('Readiness check failed:', error);
        res.status(503).json({
            status: 'not ready',
            timestamp: new Date().toISOString(),
        });
    }
});
/**
 * @swagger
 * /api/v1/health/live:
 *   get:
 *     summary: Liveness probe
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 */
router.get('/live', (req, res) => {
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
    });
});
exports.default = router;
//# sourceMappingURL=health.routes.js.map