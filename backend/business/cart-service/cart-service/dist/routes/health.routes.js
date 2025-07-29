"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const redis_1 = require("../config/redis");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
router.get('/', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'cart-service',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
    });
});
router.get('/detailed', async (req, res) => {
    const healthCheck = {
        status: 'ok',
        service: 'cart-service',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        dependencies: {
            redis: { status: 'unknown', latency: '0ms' },
        },
        features: [
            'cart_persistence',
            'session_management',
            'product_validation',
            'price_calculation',
            'guest_cart_sync',
            'saved_for_later',
        ],
    };
    let isHealthy = true;
    try {
        const redisStart = Date.now();
        const pingResult = await redis_1.redisUtils.ping();
        const redisLatency = Date.now() - redisStart;
        if (pingResult) {
            healthCheck.dependencies.redis = {
                status: 'ok',
                latency: `${redisLatency}ms`,
            };
        }
        else {
            healthCheck.dependencies.redis = {
                status: 'error',
                latency: '0ms',
            };
            isHealthy = false;
        }
    }
    catch (error) {
        logger_1.logger.error('Redis health check failed:', error);
        healthCheck.dependencies.redis = {
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
router.get('/ready', async (req, res) => {
    try {
        const isRedisReady = await redis_1.redisUtils.ping();
        if (isRedisReady) {
            res.status(200).json({
                status: 'ready',
                timestamp: new Date().toISOString(),
            });
        }
        else {
            res.status(503).json({
                status: 'not ready',
                reason: 'Redis not available',
                timestamp: new Date().toISOString(),
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Readiness check failed:', error);
        res.status(503).json({
            status: 'not ready',
            reason: 'Internal error',
            timestamp: new Date().toISOString(),
        });
    }
});
router.get('/live', (req, res) => {
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
    });
});
exports.default = router;
//# sourceMappingURL=health.routes.js.map