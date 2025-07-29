"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const redis_1 = require("redis");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const redis = (0, redis_1.createClient)({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});
router.get('/', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'user-service',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
    });
});
router.get('/detailed', async (req, res) => {
    const healthCheck = {
        status: 'ok',
        service: 'user-service',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        dependencies: {
            database: { status: 'unknown', latency: '0ms' },
            redis: { status: 'unknown', latency: '0ms' },
        },
    };
    let isHealthy = true;
    try {
        const dbStart = Date.now();
        await prisma.$queryRaw `SELECT 1`;
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
    try {
        const redisStart = Date.now();
        await redis.ping();
        const redisLatency = Date.now() - redisStart;
        healthCheck.dependencies.redis = {
            status: 'ok',
            latency: `${redisLatency}ms`,
        };
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
        await prisma.$queryRaw `SELECT 1`;
        await redis.ping();
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
router.get('/live', (req, res) => {
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
    });
});
exports.default = router;
//# sourceMappingURL=health.routes.js.map