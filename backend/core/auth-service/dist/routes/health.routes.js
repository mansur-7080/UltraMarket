"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = void 0;
const express_1 = require("express");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
const redis_1 = require("redis");
const prisma = new client_1.PrismaClient();
const redis = (0, redis_1.createClient)({
    url: process.env['REDIS_URL'] || 'redis://localhost:6379'
});
const email_service_1 = require("../services/email.service");
const os_1 = __importDefault(require("os"));
const router = (0, express_1.Router)();
exports.healthRoutes = router;
router.get('/', async (req, res) => {
    const startTime = Date.now();
    try {
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'auth-service',
            version: process.env['npm_package_version'] || '1.0.0',
            uptime: process.uptime(),
            environment: process.env['NODE_ENV'] || 'development',
            checks: {
                database: { status: 'unhealthy' },
                redis: { status: 'unhealthy' },
                email: { status: 'unhealthy' },
                memory: { status: 'healthy', usage: 0 },
                cpu: { status: 'healthy', usage: 0 },
            },
            performance: {
                memoryUsage: process.memoryUsage(),
                cpuUsage: process.cpuUsage(),
                loadAverage: os_1.default.loadavg(),
            },
            security: {
                rateLimitActive: true,
                corsEnabled: true,
                helmetEnabled: true,
                sslEnabled: process.env['NODE_ENV'] === 'production',
            },
        };
        try {
            const dbStartTime = Date.now();
            await prisma.$queryRaw `SELECT 1`;
            const dbResponseTime = Date.now() - dbStartTime;
            healthStatus.checks.database = {
                status: 'healthy',
                responseTime: dbResponseTime,
            };
        }
        catch (error) {
            logger_1.logger.error('Database health check failed:', error);
            healthStatus.checks.database.status = 'unhealthy';
            healthStatus.status = 'degraded';
        }
        try {
            const redisStartTime = Date.now();
            if (redis.isOpen) {
                await redis.ping();
                const redisResponseTime = Date.now() - redisStartTime;
                healthStatus.checks.redis = {
                    status: 'healthy',
                    responseTime: redisResponseTime,
                };
            }
            else {
                await redis.connect();
                await redis.ping();
                const redisResponseTime = Date.now() - redisStartTime;
                healthStatus.checks.redis = {
                    status: 'healthy',
                    responseTime: redisResponseTime,
                };
            }
        }
        catch (error) {
            logger_1.logger.error('Redis health check failed:', error);
            healthStatus.checks.redis.status = 'unhealthy';
            healthStatus.status = 'degraded';
        }
        try {
            const emailTest = await email_service_1.emailService.testConnection();
            healthStatus.checks.email = {
                status: emailTest ? 'healthy' : 'unhealthy',
                provider: process.env['EMAIL_SERVICE'] || 'mock',
            };
            if (!emailTest) {
                healthStatus.status = 'degraded';
            }
        }
        catch (error) {
            logger_1.logger.error('Email service health check failed:', error);
            healthStatus.checks.email.status = 'unhealthy';
            healthStatus.status = 'degraded';
        }
        const memoryUsage = process.memoryUsage();
        const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
        healthStatus.checks.memory = {
            status: memoryUsagePercent < 90 ? 'healthy' : 'unhealthy',
            usage: memoryUsagePercent,
        };
        if (memoryUsagePercent > 90) {
            healthStatus.status = 'degraded';
        }
        const cpuUsage = process.cpuUsage();
        const cpuUsagePercent = (cpuUsage.user + cpuUsage.system) / 1000000;
        healthStatus.checks.cpu = {
            status: cpuUsagePercent < 100 ? 'healthy' : 'unhealthy',
            usage: cpuUsagePercent,
        };
        if (cpuUsagePercent > 100) {
            healthStatus.status = 'degraded';
        }
        const unhealthyChecks = Object.values(healthStatus.checks).filter(check => check.status === 'unhealthy').length;
        if (unhealthyChecks > 0) {
            healthStatus.status = unhealthyChecks > 2 ? 'unhealthy' : 'degraded';
        }
        const responseTime = Date.now() - startTime;
        logger_1.logger.info('Health check completed', {
            status: healthStatus.status,
            responseTime,
            checks: healthStatus.checks,
        });
        res.status(healthStatus.status === 'unhealthy' ? 503 : 200).json(healthStatus);
    }
    catch (error) {
        logger_1.logger.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            service: 'auth-service',
            error: 'Health check failed',
        });
    }
});
router.get('/detailed', async (req, res) => {
    try {
        const detailedHealth = {
            service: 'auth-service',
            timestamp: new Date().toISOString(),
            version: process.env['npm_package_version'] || '1.0.0',
            environment: process.env['NODE_ENV'] || 'development',
            uptime: process.uptime(),
            system: {
                platform: process.platform,
                arch: process.arch,
                nodeVersion: process.version,
                pid: process.pid,
                memoryUsage: process.memoryUsage(),
                cpuUsage: process.cpuUsage(),
                loadAverage: os_1.default.loadavg(),
                totalMemory: os_1.default.totalmem(),
                freeMemory: os_1.default.freemem(),
                cpuCount: os_1.default.cpus().length,
            },
            database: {
                status: 'unknown',
                connectionPool: {
                    total: 0,
                    idle: 0,
                    active: 0,
                },
                queries: {
                    total: 0,
                    slow: 0,
                    errors: 0,
                },
            },
            redis: {
                status: 'unknown',
                connected: false,
                memoryUsage: 0,
                keyspace: {},
            },
            application: {
                requests: {
                    total: 0,
                    successful: 0,
                    failed: 0,
                    averageResponseTime: 0,
                },
                errors: {
                    total: 0,
                    byType: {},
                },
                rateLimiting: {
                    blocked: 0,
                    allowed: 0,
                },
            },
            security: {
                rateLimitActive: true,
                corsEnabled: true,
                helmetEnabled: true,
                sslEnabled: process.env['NODE_ENV'] === 'production',
                jwtSecretsConfigured: !!(process.env['JWT_SECRET'] && process.env['JWT_REFRESH_SECRET']),
                sessionSecretConfigured: !!process.env['SESSION_SECRET'],
            },
        };
        try {
            const dbStartTime = Date.now();
            await prisma.$queryRaw `SELECT 1`;
            const dbResponseTime = Date.now() - dbStartTime;
            detailedHealth.database.status = 'healthy';
            detailedHealth.database.queries.total++;
            if (dbResponseTime > 1000) {
                detailedHealth.database.queries.slow++;
            }
        }
        catch (error) {
            detailedHealth.database.status = 'unhealthy';
            detailedHealth.database.queries.errors++;
        }
        try {
            const redisStartTime = Date.now();
            await redis.ping();
            const redisResponseTime = Date.now() - redisStartTime;
            detailedHealth.redis.status = 'healthy';
            detailedHealth.redis.connected = true;
        }
        catch (error) {
            detailedHealth.redis.status = 'unhealthy';
            detailedHealth.redis.connected = false;
        }
        res.json(detailedHealth);
    }
    catch (error) {
        logger_1.logger.error('Detailed health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            error: 'Detailed health check failed',
            timestamp: new Date().toISOString(),
        });
    }
});
router.get('/ready', async (req, res) => {
    try {
        const checks = {
            database: false,
            redis: false,
            email: false,
        };
        try {
            await prisma.$queryRaw `SELECT 1`;
            checks.database = true;
        }
        catch (error) {
            logger_1.logger.error('Database readiness check failed:', error);
        }
        try {
            await redis.ping();
            checks.redis = true;
        }
        catch (error) {
            logger_1.logger.error('Redis readiness check failed:', error);
        }
        try {
            const emailTest = await email_service_1.emailService.testConnection();
            checks.email = emailTest;
        }
        catch (error) {
            logger_1.logger.error('Email service readiness check failed:', error);
        }
        const isReady = checks.database && checks.redis;
        if (isReady) {
            res.status(200).json({
                status: 'ready',
                timestamp: new Date().toISOString(),
                checks,
            });
        }
        else {
            res.status(503).json({
                status: 'not ready',
                timestamp: new Date().toISOString(),
                checks,
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Readiness check failed:', error);
        res.status(503).json({
            status: 'not ready',
            error: 'Readiness check failed',
            timestamp: new Date().toISOString(),
        });
    }
});
router.get('/live', (req, res) => {
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
    });
});
router.get('/metrics', (req, res) => {
    const metrics = {
        process_uptime_seconds: process.uptime(),
        process_memory_heap_used_bytes: process.memoryUsage().heapUsed,
        process_memory_heap_total_bytes: process.memoryUsage().heapTotal,
        process_memory_rss_bytes: process.memoryUsage().rss,
        process_cpu_user_seconds_total: process.cpuUsage().user / 1000000,
        process_cpu_system_seconds_total: process.cpuUsage().system / 1000000,
        http_requests_total: 0,
        http_request_duration_seconds: 0,
        http_requests_in_flight: 0,
        http_requests_failed_total: 0,
        database_connections_total: 0,
        database_queries_total: 0,
        database_queries_duration_seconds: 0,
        redis_connections_total: 0,
        redis_commands_total: 0,
        redis_commands_duration_seconds: 0,
        security_rate_limit_blocked_total: 0,
        security_authentication_failures_total: 0,
        security_authorization_failures_total: 0,
    };
    const prometheusMetrics = Object.entries(metrics)
        .map(([key, value]) => `# HELP ${key} ${key.replace(/_/g, ' ')}`)
        .join('\n') + '\n' +
        Object.entries(metrics)
            .map(([key, value]) => `${key} ${value}`)
            .join('\n');
    res.setHeader('Content-Type', 'text/plain');
    res.send(prometheusMetrics);
});
//# sourceMappingURL=health.routes.js.map