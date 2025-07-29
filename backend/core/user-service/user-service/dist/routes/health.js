"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const dbStatus = await (0, database_1.testConnection)();
        const healthStatus = {
            service: 'UltraMarket User Service',
            version: '1.0.0',
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            checks: {
                database: dbStatus ? 'healthy' : 'unhealthy',
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
            },
        };
        const statusCode = dbStatus ? 200 : 503;
        res.status(statusCode).json(healthStatus);
    }
    catch (error) {
        res.status(503).json({
            service: 'UltraMarket User Service',
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        });
    }
});
router.get('/ready', async (req, res) => {
    try {
        const dbStatus = await (0, database_1.testConnection)();
        if (dbStatus) {
            res.status(200).json({
                status: 'ready',
                timestamp: new Date().toISOString(),
            });
        }
        else {
            res.status(503).json({
                status: 'not ready',
                timestamp: new Date().toISOString(),
            });
        }
    }
    catch (error) {
        res.status(503).json({
            status: 'not ready',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        });
    }
});
router.get('/live', (req, res) => {
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
router.get('/metrics', (req, res) => {
    const metrics = {
        process_cpu_usage: process.cpuUsage(),
        process_memory_usage: process.memoryUsage(),
        process_uptime: process.uptime(),
        node_version: process.version,
        node_platform: process.platform,
        node_arch: process.arch,
        environment: process.env.NODE_ENV || 'development',
        pid: process.pid,
        timestamp: new Date().toISOString(),
    };
    res.status(200).json(metrics);
});
exports.default = router;
//# sourceMappingURL=health.js.map