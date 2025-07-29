"use strict";
/**
 * 🏥 Ultra Professional Health Monitoring System
 * UltraMarket E-commerce Platform
 *
 * Bu fayl comprehensive health checks, metrics collection va
 * system monitoring ni ta'minlaydi
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthSetup = exports.ultraHealthMonitor = exports.UltraProfessionalHealthMonitor = void 0;
const tslib_1 = require("tslib");
const os_1 = tslib_1.__importDefault(require("os"));
const perf_hooks_1 = require("perf_hooks");
/**
 * 🏭 Ultra Professional Health Monitor
 */
class UltraProfessionalHealthMonitor {
    healthChecks = new Map();
    metrics = {
        requests: {
            total: 0,
            successful: 0,
            failed: 0,
            averageResponseTime: 0,
            p95ResponseTime: 0,
            p99ResponseTime: 0
        },
        endpoints: new Map(),
        errors: []
    };
    responseTimes = [];
    isMonitoring = false;
    monitoringInterval = null;
    // private lastHealthCheck: Date = new Date(); // Unused variable removed
    constructor() {
        this.setupDefaultHealthChecks();
    }
    /**
     * 🔧 Setup default health checks
     */
    setupDefaultHealthChecks() {
        // System health check
        this.addHealthCheck({
            name: 'system',
            check: this.checkSystemHealth.bind(this),
            interval: 30000, // 30 seconds
            timeout: 5000,
            retries: 3,
            critical: true
        });
        // Memory health check
        this.addHealthCheck({
            name: 'memory',
            check: this.checkMemoryHealth.bind(this),
            interval: 60000, // 1 minute
            timeout: 1000,
            retries: 1,
            critical: false
        });
        // Disk space health check
        this.addHealthCheck({
            name: 'disk',
            check: this.checkDiskHealth.bind(this),
            interval: 300000, // 5 minutes
            timeout: 5000,
            retries: 2,
            critical: false
        });
    }
    /**
     * ➕ Add health check
     */
    addHealthCheck(config) {
        this.healthChecks.set(config.name, config);
    }
    /**
     * ➖ Remove health check
     */
    removeHealthCheck(name) {
        this.healthChecks.delete(name);
    }
    /**
     * 🚀 Start monitoring
     */
    startMonitoring() {
        if (this.isMonitoring) {
            console.log('🏥 Health monitoring is already running');
            return;
        }
        this.isMonitoring = true;
        console.log('🚀 Starting Ultra Professional Health Monitor');
        // Run initial health checks
        this.runAllHealthChecks();
        // Setup periodic monitoring
        this.monitoringInterval = setInterval(() => {
            this.runAllHealthChecks();
            this.cleanupOldMetrics();
        }, 30000); // Every 30 seconds
        // Setup graceful shutdown
        process.on('SIGTERM', () => this.stopMonitoring());
        process.on('SIGINT', () => this.stopMonitoring());
    }
    /**
     * 🛑 Stop monitoring
     */
    stopMonitoring() {
        if (!this.isMonitoring) {
            return;
        }
        this.isMonitoring = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        console.log('🛑 Health monitoring stopped');
    }
    /**
     * 🔍 Run all health checks
     */
    async runAllHealthChecks() {
        const checks = Array.from(this.healthChecks.values());
        const results = await Promise.allSettled(checks.map(check => this.runHealthCheck(check)));
        const failedChecks = results
            .map((result, index) => ({ result, check: checks[index] }))
            .filter(({ result }) => result.status === 'rejected')
            .map(({ check }) => check.name);
        if (failedChecks.length > 0) {
            console.warn(`⚠️ Health checks failed: ${failedChecks.join(', ')}`);
        }
        // this.lastHealthCheck = new Date(); // Removed unused variable reference
    }
    /**
     * 🔍 Run single health check
     */
    async runHealthCheck(config) {
        const startTime = perf_hooks_1.performance.now();
        let attempts = 0;
        while (attempts < config.retries) {
            try {
                const result = await Promise.race([
                    config.check(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), config.timeout))
                ]);
                return {
                    ...result,
                    responseTime: perf_hooks_1.performance.now() - startTime
                };
            }
            catch (error) {
                attempts++;
                if (attempts >= config.retries) {
                    return {
                        status: 'unhealthy',
                        responseTime: perf_hooks_1.performance.now() - startTime,
                        timestamp: new Date().toISOString(),
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                }
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        return {
            status: 'unknown',
            responseTime: perf_hooks_1.performance.now() - startTime,
            timestamp: new Date().toISOString(),
            error: 'All retries failed'
        };
    }
    /**
     * 🖥️ Check system health
     */
    async checkSystemHealth() {
        const startTime = perf_hooks_1.performance.now();
        try {
            const loadAverage = os_1.default.loadavg();
            const cpuCount = os_1.default.cpus().length;
            const memoryUsage = process.memoryUsage();
            const totalMemory = os_1.default.totalmem();
            const freeMemory = os_1.default.freemem();
            // Check CPU load
            const cpuLoad = loadAverage[0] / cpuCount;
            // Check memory usage
            const memoryUsagePercent = (totalMemory - freeMemory) / totalMemory;
            let status = 'healthy';
            const details = {
                cpuLoad,
                memoryUsagePercent,
                loadAverage,
                memoryUsage,
                uptime: process.uptime()
            };
            if (cpuLoad > 0.8 || memoryUsagePercent > 0.9) {
                status = 'degraded';
            }
            if (cpuLoad > 0.95 || memoryUsagePercent > 0.95) {
                status = 'unhealthy';
            }
            return {
                status,
                responseTime: perf_hooks_1.performance.now() - startTime,
                timestamp: new Date().toISOString(),
                details
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                responseTime: perf_hooks_1.performance.now() - startTime,
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'System check failed'
            };
        }
    }
    /**
     * 💾 Check memory health
     */
    async checkMemoryHealth() {
        const startTime = perf_hooks_1.performance.now();
        try {
            const memoryUsage = process.memoryUsage();
            const totalMemory = os_1.default.totalmem();
            const heapUsedPercent = memoryUsage.heapUsed / memoryUsage.heapTotal;
            const rssUsagePercent = memoryUsage.rss / totalMemory;
            let status = 'healthy';
            if (heapUsedPercent > 0.8 || rssUsagePercent > 0.1) {
                status = 'degraded';
            }
            if (heapUsedPercent > 0.9 || rssUsagePercent > 0.15) {
                status = 'unhealthy';
            }
            return {
                status,
                responseTime: perf_hooks_1.performance.now() - startTime,
                timestamp: new Date().toISOString(),
                details: {
                    memoryUsage,
                    heapUsedPercent,
                    rssUsagePercent
                }
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                responseTime: perf_hooks_1.performance.now() - startTime,
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Memory check failed'
            };
        }
    }
    /**
     * 💿 Check disk health
     */
    async checkDiskHealth() {
        const startTime = perf_hooks_1.performance.now();
        try {
            // const stats = fs.statSync('.'); // Unused variable removed
            const diskUsage = await this.getDiskUsage('.');
            let status = 'healthy';
            if (diskUsage.usagePercent > 0.8) {
                status = 'degraded';
            }
            if (diskUsage.usagePercent > 0.9) {
                status = 'unhealthy';
            }
            return {
                status,
                responseTime: perf_hooks_1.performance.now() - startTime,
                timestamp: new Date().toISOString(),
                details: diskUsage
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                responseTime: perf_hooks_1.performance.now() - startTime,
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Disk check failed'
            };
        }
    }
    /**
     * 💿 Get disk usage
     */
    async getDiskUsage(path) {
        return new Promise((resolve) => {
            // Simplified disk usage check
            // const stats = fs.statSync(path); // Unused variable removed
            resolve({
                path,
                usagePercent: 0.1, // Placeholder - would need platform-specific implementation
                freeSpace: 1000000000,
                totalSpace: 10000000000
            });
        });
    }
    /**
     * 📊 Create metrics middleware
     */
    createMetricsMiddleware() {
        return (req, res, next) => {
            const startTime = perf_hooks_1.performance.now();
            const endpoint = `${req.method} ${req.route?.path || req.path}`;
            // Track request
            this.metrics.requests.total++;
            // Override res.end to capture metrics
            const originalEnd = res.end;
            const monitor = this; // Capture this reference
            res.end = function (...args) {
                const responseTime = perf_hooks_1.performance.now() - startTime;
                // Update metrics
                if (res.statusCode >= 200 && res.statusCode < 400) {
                    monitor.metrics.requests.successful++;
                }
                else {
                    monitor.metrics.requests.failed++;
                    monitor.metrics.errors.push({
                        timestamp: new Date().toISOString(),
                        error: `HTTP ${res.statusCode}`,
                        endpoint,
                        statusCode: res.statusCode
                    });
                }
                // Track response times
                monitor.responseTimes.push(responseTime);
                if (monitor.responseTimes.length > 1000) {
                    monitor.responseTimes = monitor.responseTimes.slice(-1000); // Keep last 1000
                }
                // Update endpoint metrics
                const endpointMetrics = monitor.metrics.endpoints.get(endpoint) || {
                    count: 0,
                    averageTime: 0,
                    errors: 0
                };
                endpointMetrics.count++;
                endpointMetrics.averageTime =
                    (endpointMetrics.averageTime * (endpointMetrics.count - 1) + responseTime) /
                        endpointMetrics.count;
                if (res.statusCode >= 400) {
                    endpointMetrics.errors++;
                }
                monitor.metrics.endpoints.set(endpoint, endpointMetrics);
                // Call original end
                return originalEnd.apply(this, args);
            };
            next();
        };
    }
    /**
     * 📊 Get system metrics
     */
    getSystemMetrics() {
        const now = new Date().toISOString();
        // Calculate performance metrics
        const sortedTimes = [...this.responseTimes].sort((a, b) => a - b);
        const p95Index = Math.floor(sortedTimes.length * 0.95);
        const p99Index = Math.floor(sortedTimes.length * 0.99);
        this.metrics.requests.averageResponseTime =
            this.responseTimes.length > 0
                ? this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length
                : 0;
        this.metrics.requests.p95ResponseTime = sortedTimes[p95Index] || 0;
        this.metrics.requests.p99ResponseTime = sortedTimes[p99Index] || 0;
        return {
            timestamp: now,
            system: {
                uptime: os_1.default.uptime(),
                platform: os_1.default.platform(),
                arch: os_1.default.arch(),
                nodeVersion: process.version,
                totalMemory: os_1.default.totalmem(),
                freeMemory: os_1.default.freemem(),
                loadAverage: os_1.default.loadavg(),
                cpuUsage: os_1.default.loadavg()[0] / os_1.default.cpus().length
            },
            application: {
                processUptime: process.uptime(),
                processMemory: process.memoryUsage(),
                processCpuUsage: process.cpuUsage(),
                pid: process.pid,
                version: process.env.APP_VERSION || '1.0.0',
                environment: process.env.NODE_ENV || 'development'
            },
            database: {
                postgres: { status: 'unknown', responseTime: 0, timestamp: now },
                mongodb: { status: 'unknown', responseTime: 0, timestamp: now },
                redis: { status: 'unknown', responseTime: 0, timestamp: now }
            },
            external: {
                paymentGateways: {},
                emailService: { status: 'unknown', responseTime: 0, timestamp: now },
                smsService: { status: 'unknown', responseTime: 0, timestamp: now }
            },
            performance: {
                responseTime: this.metrics.requests.averageResponseTime,
                throughput: this.metrics.requests.total,
                errorRate: this.metrics.requests.total > 0
                    ? this.metrics.requests.failed / this.metrics.requests.total
                    : 0,
                activeConnections: 0 // Would need connection tracking
            }
        };
    }
    /**
     * 🏥 Create health check endpoint
     */
    createHealthEndpoint() {
        return async (req, res) => {
            const detailed = req.query.detailed === 'true';
            const startTime = perf_hooks_1.performance.now();
            try {
                const healthResults = new Map();
                // Run all health checks
                for (const [name, config] of this.healthChecks) {
                    const result = await this.runHealthCheck(config);
                    healthResults.set(name, result);
                }
                // Determine overall status
                let overallStatus = 'healthy';
                for (const result of healthResults.values()) {
                    if (result.status === 'unhealthy') {
                        overallStatus = 'unhealthy';
                        break;
                    }
                    else if (result.status === 'degraded') {
                        overallStatus = 'degraded';
                    }
                }
                const response = {
                    status: overallStatus,
                    timestamp: new Date().toISOString(),
                    responseTime: perf_hooks_1.performance.now() - startTime,
                    checks: Object.fromEntries(healthResults)
                };
                if (detailed) {
                    response.metrics = this.getSystemMetrics();
                }
                const statusCode = overallStatus === 'healthy' ? 200 :
                    overallStatus === 'degraded' ? 200 : 503;
                res.status(statusCode).json(response);
            }
            catch (error) {
                res.status(503).json({
                    status: 'unhealthy',
                    timestamp: new Date().toISOString(),
                    responseTime: perf_hooks_1.performance.now() - startTime,
                    error: error instanceof Error ? error.message : 'Health check failed'
                });
            }
        };
    }
    /**
     * 📊 Create metrics endpoint
     */
    createMetricsEndpoint() {
        return (req, res) => {
            const metrics = this.getSystemMetrics();
            res.json(metrics);
        };
    }
    /**
     * 🧹 Cleanup old metrics
     */
    cleanupOldMetrics() {
        const maxErrors = 1000;
        if (this.metrics.errors.length > maxErrors) {
            this.metrics.errors = this.metrics.errors.slice(-maxErrors);
        }
        // Clean up old response times
        if (this.responseTimes.length > 10000) {
            this.responseTimes = this.responseTimes.slice(-1000);
        }
    }
    /**
     * 📈 Get performance summary
     */
    getPerformanceSummary() {
        return {
            totalRequests: this.metrics.requests.total,
            successfulRequests: this.metrics.requests.successful,
            failedRequests: this.metrics.requests.failed,
            averageResponseTime: this.metrics.requests.averageResponseTime,
            errorRate: this.metrics.requests.total > 0
                ? (this.metrics.requests.failed / this.metrics.requests.total * 100).toFixed(2) + '%'
                : '0%',
            topEndpoints: Array.from(this.metrics.endpoints.entries())
                .sort(([, a], [, b]) => b.count - a.count)
                .slice(0, 10),
            recentErrors: this.metrics.errors.slice(-10)
        };
    }
}
exports.UltraProfessionalHealthMonitor = UltraProfessionalHealthMonitor;
/**
 * 🌟 Global health monitor instance
 */
exports.ultraHealthMonitor = new UltraProfessionalHealthMonitor();
/**
 * 🚀 Quick setup functions
 */
exports.healthSetup = {
    start: () => exports.ultraHealthMonitor.startMonitoring(),
    stop: () => exports.ultraHealthMonitor.stopMonitoring(),
    middleware: () => exports.ultraHealthMonitor.createMetricsMiddleware(),
    healthEndpoint: () => exports.ultraHealthMonitor.createHealthEndpoint(),
    metricsEndpoint: () => exports.ultraHealthMonitor.createMetricsEndpoint()
};
exports.default = {
    UltraProfessionalHealthMonitor,
    ultraHealthMonitor: exports.ultraHealthMonitor,
    healthSetup: exports.healthSetup
};
//# sourceMappingURL=ultra-professional-health-monitor.js.map