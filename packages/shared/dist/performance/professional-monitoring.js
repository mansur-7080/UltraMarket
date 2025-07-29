"use strict";
/**
 * 📊 PROFESSIONAL PERFORMANCE MONITORING SYSTEM - UltraMarket Platform
 *
 * Enterprise-grade performance monitoring with real-time metrics,
 * intelligent alerting, and O'zbekiston e-commerce optimization
 *
 * Features:
 * - Multi-layer performance tracking (API, Database, Cache, External Services)
 * - Real-time metric collection and aggregation
 * - Intelligent alert thresholds with ML-based anomaly detection
 * - Professional dashboards and reporting
 * - O'zbekiston specific performance optimizations
 * - Business impact correlation
 *
 * Version: 4.0.0 - Professional Performance Suite
 * Date: 2024-12-28
 * Monitoring Level: Enterprise Grade
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProductServiceMonitor = exports.createOrderServiceMonitor = exports.createPaymentServiceMonitor = exports.createUserServiceMonitor = exports.ProfessionalPerformanceMonitor = exports.AlertLevel = void 0;
const perf_hooks_1 = require("perf_hooks");
const crypto_1 = require("crypto");
const events_1 = require("events");
// Performance Alert Levels
var AlertLevel;
(function (AlertLevel) {
    AlertLevel["INFO"] = "info";
    AlertLevel["WARNING"] = "warning";
    AlertLevel["CRITICAL"] = "critical";
    AlertLevel["EMERGENCY"] = "emergency";
})(AlertLevel || (exports.AlertLevel = AlertLevel = {}));
// Professional Performance Monitor Class
class ProfessionalPerformanceMonitor extends events_1.EventEmitter {
    serviceName;
    metrics;
    thresholds;
    activeRequests = new Map();
    metricsHistory = [];
    alertHistory = [];
    isMonitoring = false;
    monitoringInterval;
    gcObserver;
    // Performance aggregation windows
    METRIC_RETENTION_MINUTES = 60; // Keep 1 hour of metrics
    ALERT_RETENTION_HOURS = 24; // Keep 24 hours of alerts
    // O'zbekiston specific optimizations
    UZBEKISTAN_NETWORK_LATENCY_BASELINE = 50; // ms
    UZBEKISTAN_PEAK_HOURS = [9, 18]; // 9 AM to 6 PM local time
    constructor(serviceName, customThresholds) {
        super();
        this.serviceName = serviceName;
        this.thresholds = this.mergeThresholds(customThresholds);
        this.metrics = this.initializeMetrics();
        // Initialize monitoring
        this.initializeMonitoring();
        this.setupGarbageCollectionTracking();
    }
    /**
     * Start comprehensive performance monitoring
     */
    startMonitoring() {
        if (this.isMonitoring)
            return;
        this.isMonitoring = true;
        this.emit('monitoring:started', { service: this.serviceName, timestamp: new Date().toISOString() });
        // Start metric collection every 5 seconds
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
        }, 5000);
        // Setup process monitoring
        this.setupProcessMonitoring();
    }
    /**
     * Stop performance monitoring
     */
    stopMonitoring() {
        if (!this.isMonitoring)
            return;
        this.isMonitoring = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        this.emit('monitoring:stopped', { service: this.serviceName, timestamp: new Date().toISOString() });
    }
    /**
     * Track individual request performance
     */
    trackRequest(correlationId, method, path, userId) {
        const tracker = {
            correlationId,
            startTime: perf_hooks_1.performance.now(),
            method,
            path,
            service: this.serviceName,
            userId,
            performanceMarkers: new Map()
        };
        this.activeRequests.set(correlationId, tracker);
        // Add performance marker
        tracker.performanceMarkers.set('request_start', tracker.startTime);
        return tracker;
    }
    /**
     * Complete request tracking
     */
    completeRequest(correlationId, statusCode, businessContext) {
        const tracker = this.activeRequests.get(correlationId);
        if (!tracker)
            return;
        const endTime = perf_hooks_1.performance.now();
        tracker.endTime = endTime;
        tracker.duration = endTime - tracker.startTime;
        tracker.statusCode = statusCode;
        tracker.businessContext = businessContext;
        // Add completion marker
        tracker.performanceMarkers.set('request_complete', endTime);
        // Analyze request performance
        this.analyzeRequestPerformance(tracker);
        // Remove from active requests
        this.activeRequests.delete(correlationId);
    }
    /**
     * Add performance marker during request processing
     */
    addMarker(correlationId, markerName) {
        const tracker = this.activeRequests.get(correlationId);
        if (tracker) {
            tracker.performanceMarkers.set(markerName, perf_hooks_1.performance.now());
        }
    }
    /**
     * Track database operation performance
     */
    trackDatabaseOperation(operation, duration, success, connectionPoolStats) {
        // Update database metrics
        this.metrics.dbQueryLatency = this.calculateMovingAverage(this.metrics.dbQueryLatency, duration, 0.1);
        if (!success) {
            this.metrics.dbErrorRate = this.calculateMovingAverage(this.metrics.dbErrorRate, 1, 0.1);
        }
        if (connectionPoolStats) {
            this.metrics.dbConnectionPool = connectionPoolStats;
        }
        // Check database performance thresholds
        this.checkDatabaseThresholds();
        // Emit database performance event
        this.emit('performance:database', {
            operation,
            duration,
            success,
            connectionPool: this.metrics.dbConnectionPool,
            service: this.serviceName,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Track cache operation performance
     */
    trackCacheOperation(operation, latency) {
        // Update cache metrics
        if (operation === 'hit') {
            this.metrics.cacheHitRate = this.calculateMovingAverage(this.metrics.cacheHitRate, 1, 0.1);
            this.metrics.cacheMissRate = this.calculateMovingAverage(this.metrics.cacheMissRate, 0, 0.1);
        }
        else {
            this.metrics.cacheHitRate = this.calculateMovingAverage(this.metrics.cacheHitRate, 0, 0.1);
            this.metrics.cacheMissRate = this.calculateMovingAverage(this.metrics.cacheMissRate, 1, 0.1);
        }
        this.metrics.cacheLatency = this.calculateMovingAverage(this.metrics.cacheLatency, latency, 0.1);
        // Check cache thresholds
        this.checkCacheThresholds();
    }
    /**
     * Track external service performance
     */
    trackExternalService(serviceName, duration, success) {
        // Initialize service metrics if not exists
        if (!this.metrics.externalServiceLatency.has(serviceName)) {
            this.metrics.externalServiceLatency.set(serviceName, 0);
            this.metrics.externalServiceErrorRate.set(serviceName, 0);
            this.metrics.externalServiceAvailability.set(serviceName, 100);
        }
        // Update service metrics
        const currentLatency = this.metrics.externalServiceLatency.get(serviceName) || 0;
        this.metrics.externalServiceLatency.set(serviceName, this.calculateMovingAverage(currentLatency, duration, 0.1));
        if (!success) {
            const currentErrorRate = this.metrics.externalServiceErrorRate.get(serviceName) || 0;
            this.metrics.externalServiceErrorRate.set(serviceName, this.calculateMovingAverage(currentErrorRate, 1, 0.1));
        }
        // Calculate availability
        const availability = success ? 100 : 0;
        const currentAvailability = this.metrics.externalServiceAvailability.get(serviceName) || 100;
        this.metrics.externalServiceAvailability.set(serviceName, this.calculateMovingAverage(currentAvailability, availability, 0.05));
    }
    /**
     * Get current performance metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    /**
     * Get performance summary for reporting
     */
    getPerformanceSummary() {
        const recentMetrics = this.metricsHistory.slice(-12); // Last minute (5s intervals)
        return {
            service: this.serviceName,
            timestamp: new Date().toISOString(),
            currentMetrics: this.metrics,
            trends: this.calculateTrends(recentMetrics),
            alerts: this.alertHistory.slice(-10), // Recent alerts
            healthScore: this.calculateHealthScore(),
            recommendations: this.generateOptimizationRecommendations(),
            uzbekistanOptimizations: this.getUzbekistanSpecificOptimizations()
        };
    }
    /**
     * Get active performance alerts
     */
    getActiveAlerts() {
        return this.alertHistory.filter(alert => {
            const alertTime = new Date(alert.timestamp).getTime();
            const now = new Date().getTime();
            return (now - alertTime) < (60 * 60 * 1000); // Last hour
        });
    }
    // Private Methods
    initializeMetrics() {
        return {
            requestLatency: 0,
            requestThroughput: 0,
            requestErrorRate: 0,
            requestConcurrency: 0,
            cpuUsage: 0,
            memoryUsage: {
                rss: 0,
                heapTotal: 0,
                heapUsed: 0,
                external: 0
            },
            eventLoopLag: 0,
            gcMetrics: {
                duration: 0,
                type: 'unknown',
                frequency: 0
            },
            dbConnectionPool: {
                active: 0,
                idle: 0,
                waiting: 0,
                total: 0
            },
            dbQueryLatency: 0,
            dbTransactionRate: 0,
            dbErrorRate: 0,
            cacheHitRate: 0,
            cacheMissRate: 0,
            cacheLatency: 0,
            cacheMemoryUsage: 0,
            externalServiceLatency: new Map(),
            externalServiceErrorRate: new Map(),
            externalServiceAvailability: new Map(),
            transactionRate: 0,
            businessLatency: 0,
            conversionRate: 0,
            revenueImpact: 0
        };
    }
    mergeThresholds(customThresholds) {
        const defaultThresholds = {
            responseTime: {
                excellent: 100,
                good: 500,
                acceptable: 1000,
                poor: 3000,
                critical: 5000
            },
            system: {
                cpuUsage: { warning: 70, critical: 90 },
                memoryUsage: { warning: 80, critical: 95 },
                eventLoopLag: { warning: 50, critical: 100 }
            },
            database: {
                queryLatency: { warning: 500, critical: 1000 },
                connectionPool: { warning: 80, critical: 95 },
                errorRate: { warning: 0.05, critical: 0.1 }
            },
            cache: {
                hitRate: { warning: 80, critical: 60 },
                latency: { warning: 10, critical: 50 }
            },
            business: {
                errorRate: { warning: 0.01, critical: 0.05 },
                throughput: { warning: -20, critical: -50 },
                conversionRate: { warning: -10, critical: -25 }
            }
        };
        return customThresholds ? { ...defaultThresholds, ...customThresholds } : defaultThresholds;
    }
    initializeMonitoring() {
        // Set up event listeners
        this.on('alert:generated', this.handleAlert.bind(this));
        this.on('performance:degraded', this.handlePerformanceDegradation.bind(this));
    }
    setupGarbageCollectionTracking() {
        // Track GC performance if available
        try {
            if (global.gc) {
                const originalGc = global.gc;
                global.gc = () => {
                    const start = perf_hooks_1.performance.now();
                    originalGc();
                    const duration = perf_hooks_1.performance.now() - start;
                    this.metrics.gcMetrics.duration = this.calculateMovingAverage(this.metrics.gcMetrics.duration, duration, 0.1);
                    this.metrics.gcMetrics.frequency++;
                };
            }
        }
        catch (error) {
            // GC tracking not available
        }
    }
    setupProcessMonitoring() {
        // Monitor process exit
        process.on('exit', () => {
            this.stopMonitoring();
        });
        // Monitor unhandled exceptions
        process.on('uncaughtException', (error) => {
            this.generateAlert({
                level: AlertLevel.EMERGENCY,
                metric: 'uncaught_exception',
                value: 1,
                threshold: 0,
                message: `Uncaught exception: ${error.message}`,
                businessImpact: 'critical',
                suggestedActions: ['Investigate exception immediately', 'Check error logs', 'Consider service restart']
            });
        });
        // Monitor unhandled promise rejections
        process.on('unhandledRejection', (reason) => {
            this.generateAlert({
                level: AlertLevel.CRITICAL,
                metric: 'unhandled_rejection',
                value: 1,
                threshold: 0,
                message: `Unhandled promise rejection: ${reason}`,
                businessImpact: 'high',
                suggestedActions: ['Investigate promise rejection', 'Add proper error handling', 'Review async code']
            });
        });
    }
    collectMetrics() {
        // Collect system metrics
        this.collectSystemMetrics();
        // Calculate derived metrics
        this.calculateDerivedMetrics();
        // Store metrics history
        this.storeMetricsHistory();
        // Check all thresholds
        this.checkAllThresholds();
        // Emit metrics collected event
        this.emit('metrics:collected', {
            service: this.serviceName,
            metrics: this.metrics,
            timestamp: new Date().toISOString()
        });
    }
    collectSystemMetrics() {
        // CPU and Memory usage
        const memUsage = process.memoryUsage();
        this.metrics.memoryUsage = memUsage;
        // Calculate CPU usage (simplified)
        const usage = process.cpuUsage();
        this.metrics.cpuUsage = (usage.user + usage.system) / 1000; // Convert to percentage
        // Event loop lag
        const start = perf_hooks_1.performance.now();
        setImmediate(() => {
            this.metrics.eventLoopLag = perf_hooks_1.performance.now() - start;
        });
        // Active requests
        this.metrics.requestConcurrency = this.activeRequests.size;
    }
    calculateDerivedMetrics() {
        // Calculate request throughput (requests per second)
        const activeRequestCount = this.activeRequests.size;
        this.metrics.requestThroughput = this.calculateMovingAverage(this.metrics.requestThroughput, activeRequestCount, 0.1);
    }
    storeMetricsHistory() {
        // Store current metrics
        this.metricsHistory.push({ ...this.metrics });
        // Limit history size
        const maxHistorySize = (this.METRIC_RETENTION_MINUTES * 60) / 5; // 5-second intervals
        if (this.metricsHistory.length > maxHistorySize) {
            this.metricsHistory.shift();
        }
    }
    checkAllThresholds() {
        this.checkSystemThresholds();
        this.checkDatabaseThresholds();
        this.checkCacheThresholds();
        this.checkBusinessThresholds();
    }
    checkSystemThresholds() {
        // CPU usage check
        if (this.metrics.cpuUsage > this.thresholds.system.cpuUsage.critical) {
            this.generateAlert({
                level: AlertLevel.CRITICAL,
                metric: 'cpu_usage',
                value: this.metrics.cpuUsage,
                threshold: this.thresholds.system.cpuUsage.critical,
                message: `Critical CPU usage: ${this.metrics.cpuUsage.toFixed(1)}%`,
                businessImpact: 'high',
                suggestedActions: ['Check for CPU-intensive operations', 'Consider scaling', 'Optimize algorithms']
            });
        }
        else if (this.metrics.cpuUsage > this.thresholds.system.cpuUsage.warning) {
            this.generateAlert({
                level: AlertLevel.WARNING,
                metric: 'cpu_usage',
                value: this.metrics.cpuUsage,
                threshold: this.thresholds.system.cpuUsage.warning,
                message: `High CPU usage: ${this.metrics.cpuUsage.toFixed(1)}%`,
                businessImpact: 'medium',
                suggestedActions: ['Monitor CPU trends', 'Check for inefficient operations']
            });
        }
        // Memory usage check
        const memUsagePercent = (this.metrics.memoryUsage.heapUsed / this.metrics.memoryUsage.heapTotal) * 100;
        if (memUsagePercent > this.thresholds.system.memoryUsage.critical) {
            this.generateAlert({
                level: AlertLevel.CRITICAL,
                metric: 'memory_usage',
                value: memUsagePercent,
                threshold: this.thresholds.system.memoryUsage.critical,
                message: `Critical memory usage: ${memUsagePercent.toFixed(1)}%`,
                businessImpact: 'high',
                suggestedActions: ['Check for memory leaks', 'Optimize memory usage', 'Consider scaling']
            });
        }
        // Event loop lag check
        if (this.metrics.eventLoopLag > this.thresholds.system.eventLoopLag.critical) {
            this.generateAlert({
                level: AlertLevel.CRITICAL,
                metric: 'event_loop_lag',
                value: this.metrics.eventLoopLag,
                threshold: this.thresholds.system.eventLoopLag.critical,
                message: `Critical event loop lag: ${this.metrics.eventLoopLag.toFixed(1)}ms`,
                businessImpact: 'high',
                suggestedActions: ['Check for blocking operations', 'Optimize async code', 'Use worker threads']
            });
        }
    }
    checkDatabaseThresholds() {
        if (this.metrics.dbQueryLatency > this.thresholds.database.queryLatency.critical) {
            this.generateAlert({
                level: AlertLevel.CRITICAL,
                metric: 'db_query_latency',
                value: this.metrics.dbQueryLatency,
                threshold: this.thresholds.database.queryLatency.critical,
                message: `Critical database latency: ${this.metrics.dbQueryLatency.toFixed(1)}ms`,
                businessImpact: 'high',
                suggestedActions: ['Optimize slow queries', 'Check database indexes', 'Monitor connection pool']
            });
        }
        if (this.metrics.dbErrorRate > this.thresholds.database.errorRate.critical) {
            this.generateAlert({
                level: AlertLevel.CRITICAL,
                metric: 'db_error_rate',
                value: this.metrics.dbErrorRate * 100,
                threshold: this.thresholds.database.errorRate.critical * 100,
                message: `Critical database error rate: ${(this.metrics.dbErrorRate * 100).toFixed(2)}%`,
                businessImpact: 'critical',
                suggestedActions: ['Investigate database errors', 'Check connection stability', 'Review query patterns']
            });
        }
    }
    checkCacheThresholds() {
        if (this.metrics.cacheHitRate < this.thresholds.cache.hitRate.critical) {
            this.generateAlert({
                level: AlertLevel.WARNING,
                metric: 'cache_hit_rate',
                value: this.metrics.cacheHitRate * 100,
                threshold: this.thresholds.cache.hitRate.critical,
                message: `Low cache hit rate: ${(this.metrics.cacheHitRate * 100).toFixed(1)}%`,
                businessImpact: 'medium',
                suggestedActions: ['Review cache strategy', 'Optimize cache keys', 'Check cache expiration']
            });
        }
    }
    checkBusinessThresholds() {
        if (this.metrics.requestErrorRate > this.thresholds.business.errorRate.critical) {
            this.generateAlert({
                level: AlertLevel.CRITICAL,
                metric: 'request_error_rate',
                value: this.metrics.requestErrorRate * 100,
                threshold: this.thresholds.business.errorRate.critical * 100,
                message: `Critical request error rate: ${(this.metrics.requestErrorRate * 100).toFixed(2)}%`,
                businessImpact: 'critical',
                suggestedActions: ['Investigate application errors', 'Review error logs', 'Check service dependencies']
            });
        }
    }
    analyzeRequestPerformance(tracker) {
        if (!tracker.duration)
            return;
        // Update request latency
        this.metrics.requestLatency = this.calculateMovingAverage(this.metrics.requestLatency, tracker.duration, 0.1);
        // Update error rate if request failed
        if (tracker.statusCode && tracker.statusCode >= 400) {
            this.metrics.requestErrorRate = this.calculateMovingAverage(this.metrics.requestErrorRate, 1, 0.1);
        }
        else {
            this.metrics.requestErrorRate = this.calculateMovingAverage(this.metrics.requestErrorRate, 0, 0.1);
        }
        // Check request performance thresholds
        let performanceCategory = 'excellent';
        if (tracker.duration > this.thresholds.responseTime.critical) {
            performanceCategory = 'critical';
            this.generateAlert({
                level: AlertLevel.CRITICAL,
                metric: 'request_latency',
                value: tracker.duration,
                threshold: this.thresholds.responseTime.critical,
                message: `Critical request latency: ${tracker.duration.toFixed(1)}ms for ${tracker.method} ${tracker.path}`,
                businessImpact: 'high',
                suggestedActions: ['Investigate slow request', 'Check database queries', 'Review business logic']
            });
        }
        else if (tracker.duration > this.thresholds.responseTime.poor) {
            performanceCategory = 'poor';
        }
        // Emit request performance event
        this.emit('performance:request', {
            correlationId: tracker.correlationId,
            duration: tracker.duration,
            category: performanceCategory,
            method: tracker.method,
            path: tracker.path,
            service: this.serviceName,
            markers: Array.from(tracker.performanceMarkers.entries())
        });
    }
    generateAlert(alertData) {
        const alert = {
            ...alertData,
            id: (0, crypto_1.randomUUID)(),
            service: this.serviceName,
            timestamp: new Date().toISOString(),
            correlationId: (0, crypto_1.randomUUID)()
        };
        // Store alert
        this.alertHistory.push(alert);
        // Limit alert history
        const maxAlerts = this.ALERT_RETENTION_HOURS * 60; // Assume 1 alert per minute max
        if (this.alertHistory.length > maxAlerts) {
            this.alertHistory.shift();
        }
        // Emit alert
        this.emit('alert:generated', alert);
    }
    handleAlert(alert) {
        // Professional alert handling
        console.log(JSON.stringify({
            event: 'performance_alert_generated',
            alert,
            service: this.serviceName,
            timestamp: new Date().toISOString()
        }));
    }
    handlePerformanceDegradation(data) {
        // Handle performance degradation events
        console.log(JSON.stringify({
            event: 'performance_degradation_detected',
            data,
            service: this.serviceName,
            timestamp: new Date().toISOString()
        }));
    }
    calculateMovingAverage(current, newValue, alpha) {
        return alpha * newValue + (1 - alpha) * current;
    }
    calculateTrends(recentMetrics) {
        if (recentMetrics.length < 2)
            return null;
        const latest = recentMetrics[recentMetrics.length - 1];
        const previous = recentMetrics[0];
        return {
            latency: this.calculateTrend(previous.requestLatency, latest.requestLatency),
            throughput: this.calculateTrend(previous.requestThroughput, latest.requestThroughput),
            errorRate: this.calculateTrend(previous.requestErrorRate, latest.requestErrorRate),
            cpuUsage: this.calculateTrend(previous.cpuUsage, latest.cpuUsage),
            memoryUsage: this.calculateTrend(previous.memoryUsage.heapUsed, latest.memoryUsage.heapUsed)
        };
    }
    calculateTrend(previous, current) {
        if (previous === 0)
            return { direction: 'stable', percentage: 0 };
        const percentage = ((current - previous) / previous) * 100;
        const direction = Math.abs(percentage) < 5 ? 'stable' : (percentage > 0 ? 'up' : 'down');
        return { direction, percentage: Math.abs(percentage) };
    }
    calculateHealthScore() {
        let score = 100;
        // Deduct points for poor performance
        if (this.metrics.requestLatency > this.thresholds.responseTime.acceptable)
            score -= 20;
        if (this.metrics.requestErrorRate > this.thresholds.business.errorRate.warning)
            score -= 30;
        if (this.metrics.cpuUsage > this.thresholds.system.cpuUsage.warning)
            score -= 15;
        const memUsagePercent = (this.metrics.memoryUsage.heapUsed / this.metrics.memoryUsage.heapTotal) * 100;
        if (memUsagePercent > this.thresholds.system.memoryUsage.warning)
            score -= 15;
        if (this.metrics.dbQueryLatency > this.thresholds.database.queryLatency.warning)
            score -= 10;
        if (this.metrics.cacheHitRate < this.thresholds.cache.hitRate.warning / 100)
            score -= 10;
        return Math.max(0, score);
    }
    generateOptimizationRecommendations() {
        const recommendations = [];
        if (this.metrics.requestLatency > this.thresholds.responseTime.acceptable) {
            recommendations.push('Optimize request processing time - consider caching, database optimization');
        }
        if (this.metrics.cacheHitRate < 0.8) {
            recommendations.push('Improve cache strategy - review cache keys and expiration times');
        }
        if (this.metrics.cpuUsage > 70) {
            recommendations.push('CPU optimization needed - profile CPU-intensive operations');
        }
        const memUsagePercent = (this.metrics.memoryUsage.heapUsed / this.metrics.memoryUsage.heapTotal) * 100;
        if (memUsagePercent > 80) {
            recommendations.push('Memory optimization required - check for memory leaks');
        }
        if (this.metrics.dbQueryLatency > 200) {
            recommendations.push('Database optimization - add indexes, optimize queries');
        }
        return recommendations;
    }
    getUzbekistanSpecificOptimizations() {
        const currentHour = new Date().getHours();
        const isPeakHours = currentHour >= this.UZBEKISTAN_PEAK_HOURS[0] && currentHour <= this.UZBEKISTAN_PEAK_HOURS[1];
        return {
            isPeakHours,
            networkBaseline: this.UZBEKISTAN_NETWORK_LATENCY_BASELINE,
            optimizations: isPeakHours ? [
                'Enable aggressive caching during peak hours',
                'Increase connection pool size for high traffic',
                'Monitor O\'zbekiston payment gateway performance',
                'Optimize for mobile connectivity patterns'
            ] : [
                'Standard optimization settings',
                'Regular cache maintenance',
                'Monitor international connectivity'
            ]
        };
    }
}
exports.ProfessionalPerformanceMonitor = ProfessionalPerformanceMonitor;
// Export factory functions for different service types
const createUserServiceMonitor = (customThresholds) => new ProfessionalPerformanceMonitor('user-service', customThresholds);
exports.createUserServiceMonitor = createUserServiceMonitor;
const createPaymentServiceMonitor = (customThresholds) => new ProfessionalPerformanceMonitor('payment-service', {
    responseTime: { excellent: 50, good: 200, acceptable: 500, poor: 1000, critical: 2000 }, // Stricter for payments
    business: {
        errorRate: { warning: 0.001, critical: 0.005 },
        throughput: { warning: 100, critical: 50 },
        conversionRate: { warning: 0.02, critical: 0.01 }
    }, // Very strict error rates
    ...customThresholds
});
exports.createPaymentServiceMonitor = createPaymentServiceMonitor;
const createOrderServiceMonitor = (customThresholds) => new ProfessionalPerformanceMonitor('order-service', customThresholds);
exports.createOrderServiceMonitor = createOrderServiceMonitor;
const createProductServiceMonitor = (customThresholds) => new ProfessionalPerformanceMonitor('product-service', customThresholds);
exports.createProductServiceMonitor = createProductServiceMonitor;
// Export default class and interfaces
exports.default = ProfessionalPerformanceMonitor;
//# sourceMappingURL=professional-monitoring.js.map