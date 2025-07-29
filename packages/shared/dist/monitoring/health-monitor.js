"use strict";
/**
 * Professional Health Monitoring System
 * Comprehensive health checks and monitoring for UltraMarket microservices
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthMonitor = void 0;
exports.createDatabaseHealthCheck = createDatabaseHealthCheck;
exports.createHttpHealthCheck = createHttpHealthCheck;
exports.createRedisHealthCheck = createRedisHealthCheck;
const events_1 = require("events");
const perf_hooks_1 = require("perf_hooks");
// =================== SIMPLE LOGGER ===================
const logger = {
    info: (message, meta) => {
        console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : '');
    },
    error: (message, meta) => {
        console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta) : '');
    },
    warn: (message, meta) => {
        console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : '');
    },
};
// =================== HEALTH MONITOR CLASS ===================
class HealthMonitor extends events_1.EventEmitter {
    config;
    checks = new Map();
    results = new Map();
    intervals = new Map();
    startTime = new Date();
    metrics = {
        totalChecks: 0,
        failedChecks: 0,
        averageResponseTime: 0,
        lastHealthy: null,
    };
    constructor(config) {
        super();
        this.config = config;
        this.setupDefaultChecks();
    }
    /**
     * Setup default health checks
     */
    setupDefaultChecks() {
        // Memory usage check
        this.addCheck({
            name: 'memory',
            check: this.checkMemoryUsage.bind(this),
            interval: 30000, // 30 seconds
            timeout: 5000,
            critical: true,
        });
        // CPU usage check
        this.addCheck({
            name: 'cpu',
            check: this.checkCpuUsage.bind(this),
            interval: 30000,
            timeout: 5000,
            critical: true,
        });
        // Disk space check
        this.addCheck({
            name: 'disk',
            check: this.checkDiskSpace.bind(this),
            interval: 60000, // 1 minute
            timeout: 10000,
            critical: false,
        });
        // Event loop lag check
        this.addCheck({
            name: 'eventloop',
            check: this.checkEventLoop.bind(this),
            interval: 15000, // 15 seconds
            timeout: 5000,
            critical: true,
        });
    }
    /**
     * Add a health check
     */
    addCheck(config) {
        this.checks.set(config.name, config);
        // Start periodic check if interval is specified
        if (config.interval) {
            this.startPeriodicCheck(config);
        }
        logger.info(`Health check added: ${config.name}`, {
            service: this.config.serviceName,
            check: config.name,
            interval: config.interval,
            critical: config.critical,
        });
    }
    /**
     * Remove a health check
     */
    removeCheck(name) {
        this.checks.delete(name);
        this.results.delete(name);
        const interval = this.intervals.get(name);
        if (interval) {
            clearInterval(interval);
            this.intervals.delete(name);
        }
        logger.info(`Health check removed: ${name}`, {
            service: this.config.serviceName,
            check: name,
        });
    }
    /**
     * Start periodic health check
     */
    startPeriodicCheck(config) {
        const interval = setInterval(async () => {
            await this.runCheck(config.name);
        }, config.interval || this.config.interval);
        this.intervals.set(config.name, interval);
    }
    /**
     * Run a specific health check
     */
    async runCheck(name) {
        const config = this.checks.get(name);
        if (!config) {
            throw new Error(`Health check not found: ${name}`);
        }
        const startTime = perf_hooks_1.performance.now();
        let result;
        try {
            const checkResult = await this.executeWithTimeout(config.check(), config.timeout || this.config.timeout);
            const responseTime = perf_hooks_1.performance.now() - startTime;
            if (typeof checkResult === 'boolean') {
                result = {
                    name,
                    status: checkResult ? 'healthy' : 'unhealthy',
                    responseTime,
                    timestamp: new Date(),
                };
            }
            else {
                result = {
                    ...checkResult,
                    name,
                    responseTime,
                    timestamp: new Date(),
                };
            }
            this.metrics.totalChecks++;
            this.updateAverageResponseTime(responseTime);
            if (result.status === 'healthy') {
                this.metrics.lastHealthy = new Date();
            }
            else {
                this.metrics.failedChecks++;
                if (config.critical) {
                    this.emit('critical-failure', result);
                }
            }
        }
        catch (error) {
            const responseTime = perf_hooks_1.performance.now() - startTime;
            result = {
                name,
                status: 'unhealthy',
                responseTime,
                timestamp: new Date(),
                error: error instanceof Error ? error.message : String(error),
            };
            this.metrics.totalChecks++;
            this.metrics.failedChecks++;
            this.updateAverageResponseTime(responseTime);
            if (config.critical) {
                this.emit('critical-failure', result);
            }
        }
        this.results.set(name, result);
        this.emit('check-complete', result);
        // Log result
        logger.info(`Health check completed: ${name}`, {
            service: this.config.serviceName,
            check: name,
            status: result.status,
            responseTime: result.responseTime,
            error: result.error,
        });
        return result;
    }
    /**
     * Run all health checks
     */
    async runAllChecks() {
        const checkNames = Array.from(this.checks.keys());
        const results = await Promise.allSettled(checkNames.map((name) => this.runCheck(name)));
        return results.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            }
            else {
                return {
                    name: checkNames[index],
                    status: 'unhealthy',
                    responseTime: 0,
                    timestamp: new Date(),
                    error: result.reason instanceof Error ? result.reason.message : String(result.reason),
                };
            }
        });
    }
    /**
     * Get current service health status
     */
    getServiceHealth() {
        const checks = Array.from(this.results.values());
        const overallStatus = this.calculateOverallStatus(checks);
        const uptime = Date.now() - this.startTime.getTime();
        return {
            serviceName: this.config.serviceName,
            version: this.config.version,
            status: overallStatus,
            uptime,
            responseTime: this.metrics.averageResponseTime,
            lastCheck: new Date(),
            checks,
            metadata: {
                totalChecks: this.metrics.totalChecks,
                failedChecks: this.metrics.failedChecks,
                successRate: this.calculateSuccessRate(),
                lastHealthy: this.metrics.lastHealthy,
                startTime: this.startTime,
                memoryUsage: process.memoryUsage(),
                cpuUsage: process.cpuUsage(),
            },
        };
    }
    /**
     * Calculate overall service status
     */
    calculateOverallStatus(checks) {
        if (checks.length === 0) {
            return 'unhealthy';
        }
        const criticalChecks = checks.filter((check) => {
            const config = this.checks.get(check.name);
            return config?.critical;
        });
        const unhealthyChecks = checks.filter((check) => check.status === 'unhealthy');
        const degradedChecks = checks.filter((check) => check.status === 'degraded');
        // If any critical check is unhealthy, service is unhealthy
        if (criticalChecks.some((check) => check.status === 'unhealthy')) {
            return 'unhealthy';
        }
        // If more than 50% of checks are unhealthy, service is unhealthy
        if (unhealthyChecks.length > checks.length / 2) {
            return 'unhealthy';
        }
        // If any checks are degraded or some are unhealthy, service is degraded
        if (degradedChecks.length > 0 || unhealthyChecks.length > 0) {
            return 'degraded';
        }
        return 'healthy';
    }
    /**
     * Calculate success rate
     */
    calculateSuccessRate() {
        if (this.metrics.totalChecks === 0) {
            return 0;
        }
        return (((this.metrics.totalChecks - this.metrics.failedChecks) / this.metrics.totalChecks) * 100);
    }
    /**
     * Update average response time
     */
    updateAverageResponseTime(responseTime) {
        if (this.metrics.totalChecks === 1) {
            this.metrics.averageResponseTime = responseTime;
        }
        else {
            this.metrics.averageResponseTime =
                (this.metrics.averageResponseTime * (this.metrics.totalChecks - 1) + responseTime) /
                    this.metrics.totalChecks;
        }
    }
    /**
     * Execute function with timeout
     */
    async executeWithTimeout(promise, timeout) {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Health check timeout')), timeout);
        });
        return Promise.race([promise, timeoutPromise]);
    }
    // =================== DEFAULT HEALTH CHECKS ===================
    /**
     * Check memory usage
     */
    async checkMemoryUsage() {
        const memoryUsage = process.memoryUsage();
        const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
        const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
        const memoryUsagePercent = (heapUsedMB / heapTotalMB) * 100;
        let status;
        if (memoryUsagePercent > this.config.alertThresholds.memoryUsage) {
            status = 'unhealthy';
        }
        else if (memoryUsagePercent > this.config.alertThresholds.memoryUsage * 0.8) {
            status = 'degraded';
        }
        else {
            status = 'healthy';
        }
        return {
            name: 'memory',
            status,
            responseTime: 0,
            timestamp: new Date(),
            details: {
                heapUsed: `${heapUsedMB.toFixed(2)} MB`,
                heapTotal: `${heapTotalMB.toFixed(2)} MB`,
                usagePercent: `${memoryUsagePercent.toFixed(2)}%`,
                rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
                external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`,
            },
        };
    }
    /**
     * Check CPU usage
     */
    async checkCpuUsage() {
        const startUsage = process.cpuUsage();
        // Wait 100ms to measure CPU usage
        await new Promise((resolve) => setTimeout(resolve, 100));
        const endUsage = process.cpuUsage(startUsage);
        const totalUsage = (endUsage.user + endUsage.system) / 1000; // Convert to milliseconds
        const cpuPercent = (totalUsage / 100) * 100; // Approximate CPU percentage
        let status;
        if (cpuPercent > this.config.alertThresholds.cpuUsage) {
            status = 'unhealthy';
        }
        else if (cpuPercent > this.config.alertThresholds.cpuUsage * 0.8) {
            status = 'degraded';
        }
        else {
            status = 'healthy';
        }
        return {
            name: 'cpu',
            status,
            responseTime: 0,
            timestamp: new Date(),
            details: {
                user: `${(endUsage.user / 1000).toFixed(2)} ms`,
                system: `${(endUsage.system / 1000).toFixed(2)} ms`,
                total: `${totalUsage.toFixed(2)} ms`,
                percent: `${cpuPercent.toFixed(2)}%`,
            },
        };
    }
    /**
     * Check disk space
     */
    async checkDiskSpace() {
        try {
            const { execSync } = require('child_process');
            const output = execSync('df -h /', { encoding: 'utf-8' });
            const lines = output.trim().split('\n');
            const data = lines[1].split(/\s+/);
            const usagePercent = parseInt(data[4].replace('%', ''));
            let status;
            if (usagePercent > 90) {
                status = 'unhealthy';
            }
            else if (usagePercent > 80) {
                status = 'degraded';
            }
            else {
                status = 'healthy';
            }
            return {
                name: 'disk',
                status,
                responseTime: 0,
                timestamp: new Date(),
                details: {
                    filesystem: data[0],
                    size: data[1],
                    used: data[2],
                    available: data[3],
                    usagePercent: `${usagePercent}%`,
                    mountPoint: data[5],
                },
            };
        }
        catch (error) {
            return {
                name: 'disk',
                status: 'unhealthy',
                responseTime: 0,
                timestamp: new Date(),
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    /**
     * Check event loop lag
     */
    async checkEventLoop() {
        const start = perf_hooks_1.performance.now();
        await new Promise((resolve) => setImmediate(resolve));
        const lag = perf_hooks_1.performance.now() - start;
        let status;
        if (lag > 100) {
            // 100ms lag is concerning
            status = 'unhealthy';
        }
        else if (lag > 50) {
            // 50ms lag is degraded
            status = 'degraded';
        }
        else {
            status = 'healthy';
        }
        return {
            name: 'eventloop',
            status,
            responseTime: 0,
            timestamp: new Date(),
            details: {
                lag: `${lag.toFixed(2)} ms`,
                threshold: '50 ms (degraded), 100 ms (unhealthy)',
            },
        };
    }
    /**
     * Start monitoring
     */
    start() {
        logger.info(`Health monitoring started for ${this.config.serviceName}`, {
            service: this.config.serviceName,
            version: this.config.version,
            checks: Array.from(this.checks.keys()),
        });
        this.emit('monitoring-started');
    }
    /**
     * Stop monitoring
     */
    stop() {
        // Clear all intervals
        this.intervals.forEach((interval) => clearInterval(interval));
        this.intervals.clear();
        logger.info(`Health monitoring stopped for ${this.config.serviceName}`, {
            service: this.config.serviceName,
            totalChecks: this.metrics.totalChecks,
            failedChecks: this.metrics.failedChecks,
            successRate: this.calculateSuccessRate(),
        });
        this.emit('monitoring-stopped');
    }
}
exports.HealthMonitor = HealthMonitor;
// =================== UTILITY FUNCTIONS ===================
/**
 * Create a database health check
 */
function createDatabaseHealthCheck(name, connectionCheck, options = {}) {
    return {
        name,
        check: async () => {
            try {
                const isConnected = await connectionCheck();
                return {
                    name,
                    status: isConnected ? 'healthy' : 'unhealthy',
                    responseTime: 0,
                    timestamp: new Date(),
                    details: {
                        connection: isConnected ? 'connected' : 'disconnected',
                    },
                };
            }
            catch (error) {
                return {
                    name,
                    status: 'unhealthy',
                    responseTime: 0,
                    timestamp: new Date(),
                    error: error instanceof Error ? error.message : String(error),
                };
            }
        },
        interval: 30000,
        timeout: 5000,
        critical: true,
        ...options,
    };
}
/**
 * Create an HTTP service health check
 */
function createHttpHealthCheck(name, url, options = {}) {
    return {
        name,
        check: async () => {
            try {
                const startTime = perf_hooks_1.performance.now();
                const response = await fetch(url, {
                    method: 'GET',
                    headers: { 'User-Agent': 'UltraMarket-HealthCheck/1.0' },
                });
                const responseTime = perf_hooks_1.performance.now() - startTime;
                const status = response.ok ? 'healthy' : 'unhealthy';
                return {
                    name,
                    status,
                    responseTime,
                    timestamp: new Date(),
                    details: {
                        url,
                        statusCode: response.status,
                        statusText: response.statusText,
                        responseTime: `${responseTime.toFixed(2)} ms`,
                    },
                };
            }
            catch (error) {
                return {
                    name,
                    status: 'unhealthy',
                    responseTime: 0,
                    timestamp: new Date(),
                    error: error instanceof Error ? error.message : String(error),
                };
            }
        },
        interval: 30000,
        timeout: 10000,
        critical: false,
        ...options,
    };
}
/**
 * Create a Redis health check
 */
function createRedisHealthCheck(name, redisClient, options = {}) {
    return {
        name,
        check: async () => {
            try {
                const startTime = perf_hooks_1.performance.now();
                await redisClient.ping();
                const responseTime = perf_hooks_1.performance.now() - startTime;
                return {
                    name,
                    status: 'healthy',
                    responseTime,
                    timestamp: new Date(),
                    details: {
                        connection: 'connected',
                        responseTime: `${responseTime.toFixed(2)} ms`,
                    },
                };
            }
            catch (error) {
                return {
                    name,
                    status: 'unhealthy',
                    responseTime: 0,
                    timestamp: new Date(),
                    error: error instanceof Error ? error.message : String(error),
                };
            }
        },
        interval: 30000,
        timeout: 5000,
        critical: true,
        ...options,
    };
}
// =================== EXPORT ===================
exports.default = {
    HealthMonitor,
    createDatabaseHealthCheck,
    createHttpHealthCheck,
    createRedisHealthCheck,
};
//# sourceMappingURL=health-monitor.js.map