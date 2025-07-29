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
import { EventEmitter } from 'events';
export interface PerformanceMetrics {
    requestLatency: number;
    requestThroughput: number;
    requestErrorRate: number;
    requestConcurrency: number;
    cpuUsage: number;
    memoryUsage: {
        rss: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
    };
    eventLoopLag: number;
    gcMetrics: {
        duration: number;
        type: string;
        frequency: number;
    };
    dbConnectionPool: {
        active: number;
        idle: number;
        waiting: number;
        total: number;
    };
    dbQueryLatency: number;
    dbTransactionRate: number;
    dbErrorRate: number;
    cacheHitRate: number;
    cacheMissRate: number;
    cacheLatency: number;
    cacheMemoryUsage: number;
    externalServiceLatency: Map<string, number>;
    externalServiceErrorRate: Map<string, number>;
    externalServiceAvailability: Map<string, number>;
    transactionRate: number;
    businessLatency: number;
    conversionRate: number;
    revenueImpact: number;
}
export interface PerformanceThresholds {
    responseTime: {
        excellent: number;
        good: number;
        acceptable: number;
        poor: number;
        critical: number;
    };
    system: {
        cpuUsage: {
            warning: number;
            critical: number;
        };
        memoryUsage: {
            warning: number;
            critical: number;
        };
        eventLoopLag: {
            warning: number;
            critical: number;
        };
    };
    database: {
        queryLatency: {
            warning: number;
            critical: number;
        };
        connectionPool: {
            warning: number;
            critical: number;
        };
        errorRate: {
            warning: number;
            critical: number;
        };
    };
    cache: {
        hitRate: {
            warning: number;
            critical: number;
        };
        latency: {
            warning: number;
            critical: number;
        };
    };
    business: {
        errorRate: {
            warning: number;
            critical: number;
        };
        throughput: {
            warning: number;
            critical: number;
        };
        conversionRate: {
            warning: number;
            critical: number;
        };
    };
}
export declare enum AlertLevel {
    INFO = "info",
    WARNING = "warning",
    CRITICAL = "critical",
    EMERGENCY = "emergency"
}
export interface PerformanceAlert {
    id: string;
    level: AlertLevel;
    metric: string;
    value: number;
    threshold: number;
    message: string;
    service: string;
    timestamp: string;
    correlationId: string;
    businessImpact: 'low' | 'medium' | 'high' | 'critical';
    suggestedActions: string[];
}
export interface RequestTracker {
    correlationId: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    method: string;
    path: string;
    statusCode?: number;
    service: string;
    userId?: string;
    businessContext?: any;
    errors?: any[];
    performanceMarkers: Map<string, number>;
}
export declare class ProfessionalPerformanceMonitor extends EventEmitter {
    private serviceName;
    private metrics;
    private thresholds;
    private activeRequests;
    private metricsHistory;
    private alertHistory;
    private isMonitoring;
    private monitoringInterval?;
    private gcObserver?;
    private readonly METRIC_RETENTION_MINUTES;
    private readonly ALERT_RETENTION_HOURS;
    private readonly UZBEKISTAN_NETWORK_LATENCY_BASELINE;
    private readonly UZBEKISTAN_PEAK_HOURS;
    constructor(serviceName: string, customThresholds?: Partial<PerformanceThresholds>);
    /**
     * Start comprehensive performance monitoring
     */
    startMonitoring(): void;
    /**
     * Stop performance monitoring
     */
    stopMonitoring(): void;
    /**
     * Track individual request performance
     */
    trackRequest(correlationId: string, method: string, path: string, userId?: string): RequestTracker;
    /**
     * Complete request tracking
     */
    completeRequest(correlationId: string, statusCode: number, businessContext?: any): void;
    /**
     * Add performance marker during request processing
     */
    addMarker(correlationId: string, markerName: string): void;
    /**
     * Track database operation performance
     */
    trackDatabaseOperation(operation: string, duration: number, success: boolean, connectionPoolStats?: any): void;
    /**
     * Track cache operation performance
     */
    trackCacheOperation(operation: 'hit' | 'miss', latency: number): void;
    /**
     * Track external service performance
     */
    trackExternalService(serviceName: string, duration: number, success: boolean): void;
    /**
     * Get current performance metrics
     */
    getMetrics(): PerformanceMetrics;
    /**
     * Get performance summary for reporting
     */
    getPerformanceSummary(): any;
    /**
     * Get active performance alerts
     */
    getActiveAlerts(): PerformanceAlert[];
    private initializeMetrics;
    private mergeThresholds;
    private initializeMonitoring;
    private setupGarbageCollectionTracking;
    private setupProcessMonitoring;
    private collectMetrics;
    private collectSystemMetrics;
    private calculateDerivedMetrics;
    private storeMetricsHistory;
    private checkAllThresholds;
    private checkSystemThresholds;
    private checkDatabaseThresholds;
    private checkCacheThresholds;
    private checkBusinessThresholds;
    private analyzeRequestPerformance;
    private generateAlert;
    private handleAlert;
    private handlePerformanceDegradation;
    private calculateMovingAverage;
    private calculateTrends;
    private calculateTrend;
    private calculateHealthScore;
    private generateOptimizationRecommendations;
    private getUzbekistanSpecificOptimizations;
}
export declare const createUserServiceMonitor: (customThresholds?: Partial<PerformanceThresholds>) => ProfessionalPerformanceMonitor;
export declare const createPaymentServiceMonitor: (customThresholds?: Partial<PerformanceThresholds>) => ProfessionalPerformanceMonitor;
export declare const createOrderServiceMonitor: (customThresholds?: Partial<PerformanceThresholds>) => ProfessionalPerformanceMonitor;
export declare const createProductServiceMonitor: (customThresholds?: Partial<PerformanceThresholds>) => ProfessionalPerformanceMonitor;
export default ProfessionalPerformanceMonitor;
export type { AlertLevel, PerformanceMetrics, PerformanceThresholds, PerformanceAlert, RequestTracker };
//# sourceMappingURL=professional-monitoring.d.ts.map