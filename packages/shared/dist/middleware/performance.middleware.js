"use strict";
/**
 * 📊 PROFESSIONAL PERFORMANCE MONITORING MIDDLEWARE
 *
 * Automatic performance tracking middleware that integrates with
 * the professional performance monitoring system
 *
 * Version: 4.0.0 - Professional Performance Integration
 * Date: 2024-12-28
 * Features: Automatic request tracking, real-time metrics, alerting
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPerformanceMiddleware = exports.createProductServicePerformanceMiddleware = exports.createOrderServicePerformanceMiddleware = exports.createPaymentServicePerformanceMiddleware = exports.createUserServicePerformanceMiddleware = exports.PerformanceMiddleware = void 0;
const perf_hooks_1 = require("perf_hooks");
const crypto_1 = require("crypto");
const professional_monitoring_1 = require("../performance/professional-monitoring");
// Performance middleware class
class PerformanceMiddleware {
    monitor;
    config;
    constructor(config) {
        this.config = config;
        this.monitor = new professional_monitoring_1.ProfessionalPerformanceMonitor(config.serviceName, config.customThresholds);
        // Start monitoring
        this.monitor.startMonitoring();
        // Set up event listeners
        this.setupEventListeners();
    }
    /**
     * Main performance tracking middleware
     */
    trackRequest() {
        return (req, res, next) => {
            const correlationId = req.headers['x-correlation-id'] || (0, crypto_1.randomUUID)();
            const startTime = perf_hooks_1.performance.now();
            // Add correlation ID to request
            req.correlationId = correlationId;
            req.startTime = startTime;
            // Start request tracking
            const tracker = this.monitor.trackRequest(correlationId, req.method, req.path, req.user?.userId);
            // Add performance tracking methods to request
            req.addMarker = (markerName) => {
                this.monitor.addMarker(correlationId, markerName);
            };
            req.trackDatabaseOp = (operation, duration, success, poolStats) => {
                this.monitor.trackDatabaseOperation(operation, duration, success, poolStats);
            };
            req.trackCacheOp = (operation, latency) => {
                this.monitor.trackCacheOperation(operation, latency);
            };
            req.trackExternalService = (serviceName, duration, success) => {
                this.monitor.trackExternalService(serviceName, duration, success);
            };
            // Override response methods to track completion
            const originalSend = res.send;
            const originalJson = res.json;
            res.send = function (data) {
                const businessContext = extractBusinessContext(req, data);
                completeTracking(correlationId, res.statusCode, businessContext);
                return originalSend.call(this, data);
            };
            res.json = function (data) {
                const businessContext = extractBusinessContext(req, data);
                completeTracking(correlationId, res.statusCode, businessContext);
                return originalJson.call(this, data);
            };
            // Complete tracking function
            const completeTracking = (correlationId, statusCode, businessContext) => {
                this.monitor.completeRequest(correlationId, statusCode, businessContext);
                // Emit request completed event
                this.monitor.emit('request:completed', {
                    correlationId,
                    duration: perf_hooks_1.performance.now() - startTime,
                    statusCode,
                    method: req.method,
                    path: req.path,
                    service: this.config.serviceName
                });
            };
            next();
        };
    }
    /**
     * Database operation tracking middleware
     */
    trackDatabase() {
        return (req, res, next) => {
            if (!this.config.enableDatabaseTracking) {
                return next();
            }
            // Hook into database operations (example implementation)
            const originalQuery = req.db?.query;
            if (originalQuery) {
                req.db.query = async (...args) => {
                    const start = perf_hooks_1.performance.now();
                    let success = true;
                    try {
                        const result = await originalQuery.apply(req.db, args);
                        return result;
                    }
                    catch (error) {
                        success = false;
                        throw error;
                    }
                    finally {
                        const duration = perf_hooks_1.performance.now() - start;
                        this.monitor.trackDatabaseOperation('query', duration, success);
                    }
                };
            }
            next();
        };
    }
    /**
     * Cache operation tracking middleware
     */
    trackCache() {
        return (req, res, next) => {
            if (!this.config.enableCacheTracking) {
                return next();
            }
            // Add cache tracking headers
            res.setHeader('X-Cache-Tracking', 'enabled');
            next();
        };
    }
    /**
     * Business metrics tracking middleware
     */
    trackBusinessMetrics() {
        return (req, res, next) => {
            if (!this.config.enableBusinessMetrics) {
                return next();
            }
            // Track business-specific metrics
            const businessType = this.detectBusinessOperationType(req);
            if (businessType) {
                req.businessType = businessType;
                this.monitor.addMarker(req.correlationId, `business_${businessType}_start`);
            }
            next();
        };
    }
    /**
     * Get performance metrics
     */
    getMetrics() {
        return this.monitor.getMetrics();
    }
    /**
     * Get performance summary
     */
    getSummary() {
        return this.monitor.getPerformanceSummary();
    }
    /**
     * Get active alerts
     */
    getAlerts() {
        return this.monitor.getActiveAlerts();
    }
    // Private methods
    setupEventListeners() {
        // Listen to performance events
        this.monitor.on('alert:generated', (alert) => {
            console.log(JSON.stringify({
                event: 'performance_alert',
                alert,
                service: this.config.serviceName,
                timestamp: new Date().toISOString()
            }));
        });
        this.monitor.on('performance:degraded', (data) => {
            console.log(JSON.stringify({
                event: 'performance_degradation',
                data,
                service: this.config.serviceName,
                timestamp: new Date().toISOString()
            }));
        });
        this.monitor.on('metrics:collected', (data) => {
            if (this.config.enableDetailedTracking) {
                console.log(JSON.stringify({
                    event: 'metrics_collected',
                    metrics: data.metrics,
                    service: this.config.serviceName,
                    timestamp: new Date().toISOString()
                }));
            }
        });
    }
    detectBusinessOperationType(req) {
        // Detect business operation type based on URL patterns
        const path = req.path.toLowerCase();
        if (path.includes('/payment') || path.includes('/pay'))
            return 'payment';
        if (path.includes('/order'))
            return 'order';
        if (path.includes('/product'))
            return 'product';
        if (path.includes('/user') || path.includes('/auth'))
            return 'user';
        if (path.includes('/cart'))
            return 'cart';
        if (path.includes('/inventory'))
            return 'inventory';
        return null;
    }
}
exports.PerformanceMiddleware = PerformanceMiddleware;
// Helper function to extract business context
function extractBusinessContext(req, responseData) {
    const context = {};
    // Extract from user context
    if (req.user) {
        context.userId = req.user.userId;
    }
    // Extract from request body
    if (req.body) {
        context.customerId = req.body.customerId;
        context.amount = req.body.amount;
        context.productIds = req.body.productIds;
        context.paymentMethod = req.body.paymentMethod;
        context.region = req.body.region;
    }
    // Extract from response data
    if (responseData && typeof responseData === 'object') {
        if (responseData.transactionType)
            context.transactionType = responseData.transactionType;
        if (responseData.amount)
            context.amount = responseData.amount;
    }
    // Detect transaction type from URL
    const path = req.path.toLowerCase();
    if (path.includes('/payment'))
        context.transactionType = 'payment';
    else if (path.includes('/order'))
        context.transactionType = 'order';
    else if (path.includes('/refund'))
        context.transactionType = 'refund';
    return context;
}
// Factory functions for different services
const createUserServicePerformanceMiddleware = (customConfig) => new PerformanceMiddleware({
    serviceName: 'user-service',
    enableDetailedTracking: true,
    enableBusinessMetrics: true,
    enableDatabaseTracking: true,
    enableCacheTracking: true,
    enableExternalServiceTracking: false,
    ...customConfig
});
exports.createUserServicePerformanceMiddleware = createUserServicePerformanceMiddleware;
const createPaymentServicePerformanceMiddleware = (customConfig) => new PerformanceMiddleware({
    serviceName: 'payment-service',
    enableDetailedTracking: true,
    enableBusinessMetrics: true,
    enableDatabaseTracking: true,
    enableCacheTracking: true,
    enableExternalServiceTracking: true,
    customThresholds: {
        responseTime: { excellent: 50, good: 200, acceptable: 500, poor: 1000, critical: 2000 },
        business: { errorRate: { warning: 0.001, critical: 0.005 } }
    },
    ...customConfig
});
exports.createPaymentServicePerformanceMiddleware = createPaymentServicePerformanceMiddleware;
const createOrderServicePerformanceMiddleware = (customConfig) => new PerformanceMiddleware({
    serviceName: 'order-service',
    enableDetailedTracking: true,
    enableBusinessMetrics: true,
    enableDatabaseTracking: true,
    enableCacheTracking: true,
    enableExternalServiceTracking: true,
    ...customConfig
});
exports.createOrderServicePerformanceMiddleware = createOrderServicePerformanceMiddleware;
const createProductServicePerformanceMiddleware = (customConfig) => new PerformanceMiddleware({
    serviceName: 'product-service',
    enableDetailedTracking: false, // Less detailed for product service
    enableBusinessMetrics: true,
    enableDatabaseTracking: true,
    enableCacheTracking: true,
    enableExternalServiceTracking: false,
    ...customConfig
});
exports.createProductServicePerformanceMiddleware = createProductServicePerformanceMiddleware;
// Express middleware factory
const createPerformanceMiddleware = (serviceName, customConfig) => {
    const middleware = new PerformanceMiddleware({
        serviceName,
        enableDetailedTracking: true,
        enableBusinessMetrics: true,
        enableDatabaseTracking: true,
        enableCacheTracking: true,
        enableExternalServiceTracking: true,
        ...customConfig
    });
    return {
        trackRequest: middleware.trackRequest(),
        trackDatabase: middleware.trackDatabase(),
        trackCache: middleware.trackCache(),
        trackBusinessMetrics: middleware.trackBusinessMetrics(),
        getMetrics: () => middleware.getMetrics(),
        getSummary: () => middleware.getSummary(),
        getAlerts: () => middleware.getAlerts()
    };
};
exports.createPerformanceMiddleware = createPerformanceMiddleware;
exports.default = PerformanceMiddleware;
//# sourceMappingURL=performance.middleware.js.map