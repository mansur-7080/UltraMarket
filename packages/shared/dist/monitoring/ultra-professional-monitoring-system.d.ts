/**
 * 🚀 ULTRA PROFESSIONAL MONITORING SYSTEM
 * UltraMarket E-commerce Platform
 *
 * Comprehensive monitoring and alerting system featuring:
 * - Real-time application performance monitoring (APM)
 * - Infrastructure monitoring and metrics collection
 * - Custom business metrics tracking
 * - Multi-channel alerting (Slack, Discord, Email, SMS)
 * - Performance analytics and reporting
 * - Health check orchestration
 * - Error tracking and debugging
 * - SLA monitoring and reporting
 * - Automated incident response
 *
 * @author UltraMarket Monitoring Team
 * @version 5.0.0
 * @date 2024-12-28
 */
import { EventEmitter } from 'events';
export interface MonitoringConfig {
    enabled: boolean;
    environment: string;
    serviceName: string;
    serviceVersion: string;
    datacenter: string;
    region: string;
    metrics: {
        collectInterval: number;
        retentionPeriod: number;
        enableSystemMetrics: boolean;
        enableBusinessMetrics: boolean;
        enableCustomMetrics: boolean;
    };
    alerting: {
        enabled: boolean;
        channels: AlertChannel[];
        rules: AlertRule[];
        escalationPolicy: EscalationPolicy;
    };
    integrations: {
        prometheus?: PrometheusConfig;
        grafana?: GrafanaConfig;
        elasticsearch?: ElasticsearchConfig;
        sentry?: SentryConfig;
        datadog?: DatadogConfig;
        newRelic?: NewRelicConfig;
    };
}
export interface Metric {
    name: string;
    value: number;
    unit: string;
    type: 'gauge' | 'counter' | 'histogram' | 'summary';
    tags: Record<string, string>;
    timestamp: Date;
    source: string;
}
export interface HealthCheck {
    name: string;
    type: 'database' | 'external_service' | 'file_system' | 'memory' | 'cpu' | 'custom';
    check: () => Promise<HealthCheckResult>;
    interval: number;
    timeout: number;
    retries: number;
    enabled: boolean;
}
export interface HealthCheckResult {
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    message?: string;
    metadata?: Record<string, any>;
    timestamp: Date;
}
export interface Alert {
    id: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    description: string;
    source: string;
    metric?: string;
    value?: number;
    threshold?: number;
    tags: Record<string, string>;
    timestamp: Date;
    acknowledged: boolean;
    resolved: boolean;
    resolvedAt?: Date;
    escalated: boolean;
    escalatedAt?: Date;
}
export interface AlertRule {
    id: string;
    name: string;
    enabled: boolean;
    metric: string;
    condition: 'greater_than' | 'less_than' | 'equal_to' | 'not_equal_to' | 'change_rate';
    threshold: number;
    duration: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    tags: Record<string, string>;
    actions: AlertAction[];
}
export interface AlertAction {
    type: 'notification' | 'webhook' | 'script' | 'auto_scale' | 'restart_service';
    config: Record<string, any>;
    delay?: number;
}
export interface AlertChannel {
    id: string;
    type: 'slack' | 'discord' | 'email' | 'sms' | 'webhook' | 'teams';
    name: string;
    config: Record<string, any>;
    enabled: boolean;
    severityFilter: ('LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')[];
}
export interface EscalationPolicy {
    enabled: boolean;
    levels: Array<{
        duration: number;
        channels: string[];
        actions: AlertAction[];
    }>;
}
export interface SystemMetrics {
    cpu: {
        usage: number;
        loadAverage: number[];
        cores: number;
    };
    memory: {
        total: number;
        used: number;
        free: number;
        usage: number;
    };
    disk: {
        total: number;
        used: number;
        free: number;
        usage: number;
    };
    network: {
        inbound: number;
        outbound: number;
    };
    process: {
        pid: number;
        uptime: number;
        memoryUsage: NodeJS.MemoryUsage;
        cpuUsage: NodeJS.CpuUsage;
    };
}
export interface BusinessMetrics {
    orders: {
        totalCount: number;
        pendingCount: number;
        completedCount: number;
        cancelledCount: number;
        revenueToday: number;
        averageOrderValue: number;
    };
    users: {
        totalUsers: number;
        activeUsers: number;
        newRegistrations: number;
        conversionRate: number;
    };
    products: {
        totalProducts: number;
        lowStockProducts: number;
        outOfStockProducts: number;
        topSellingProducts: string[];
    };
    payments: {
        successfulTransactions: number;
        failedTransactions: number;
        totalRevenue: number;
        averageTransactionTime: number;
    };
}
export interface PrometheusConfig {
    endpoint: string;
    pushGateway?: string;
    jobName: string;
    instance: string;
}
export interface GrafanaConfig {
    url: string;
    apiKey: string;
    orgId: number;
}
export interface ElasticsearchConfig {
    url: string;
    index: string;
    apiKey?: string;
}
export interface SentryConfig {
    dsn: string;
    environment: string;
    release: string;
}
export interface DatadogConfig {
    apiKey: string;
    appKey: string;
    site: string;
}
export interface NewRelicConfig {
    licenseKey: string;
    appName: string;
}
/**
 * Ultra Professional Monitoring System
 */
export declare class UltraProfessionalMonitoringSystem extends EventEmitter {
    private config;
    private metrics;
    private healthChecks;
    private alerts;
    private alertRules;
    private alertChannels;
    private metricsInterval;
    private healthCheckIntervals;
    private startTime;
    private requestMetrics;
    private systemMetricsHistory;
    constructor(config: MonitoringConfig);
    /**
     * Start comprehensive monitoring
     */
    private startMonitoring;
    /**
     * Start metrics collection
     */
    private startMetricsCollection;
    /**
     * Collect comprehensive system metrics
     */
    private collectSystemMetrics;
    /**
     * Collect business-specific metrics
     */
    private collectBusinessMetrics;
    /**
     * Record a custom metric
     */
    recordMetric(name: string, value: number, unit?: string, type?: 'gauge' | 'counter' | 'histogram' | 'summary', tags?: Record<string, string>): void;
    /**
     * Record HTTP request metrics
     */
    recordHttpRequest(method: string, path: string, statusCode: number, responseTime: number, error?: Error): void;
    /**
     * Start health checks
     */
    private startHealthChecks;
    /**
     * Execute a health check
     */
    private executeHealthCheck;
    /**
     * Add a health check
     */
    addHealthCheck(name: string, healthCheck: HealthCheck): void;
    /**
     * Create an alert
     */
    createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'acknowledged' | 'resolved' | 'escalated'>): void;
    /**
     * Send alert to configured channels
     */
    private sendAlert;
    /**
     * Send alert to specific channel
     */
    private sendAlertToChannel;
    /**
     * Initialize default alert rules
     */
    private initializeAlertRules;
    /**
     * Initialize default alert channels
     */
    private initializeAlertChannels;
    /**
     * Start alert processing
     */
    private startAlertProcessing;
    /**
     * Initialize integrations
     */
    private initializeIntegrations;
    /**
     * Get current metrics snapshot
     */
    getMetricsSnapshot(): {
        system: SystemMetrics | null;
        business: any;
        custom: Map<string, Metric[]>;
        requests: Map<string, any>;
    };
    /**
     * Get system health overview
     */
    getHealthOverview(): {
        overall: 'healthy' | 'degraded' | 'unhealthy';
        checks: Array<{
            name: string;
            status: 'healthy' | 'degraded' | 'unhealthy';
            lastCheck: Date;
            responseTime: number;
        }>;
        uptime: number;
    };
    /**
     * Helper methods for business metrics (would integrate with actual data sources)
     */
    private getOrderCount;
    private getPendingOrderCount;
    private getCompletedOrderCount;
    private getCancelledOrderCount;
    private getTodayRevenue;
    private getAverageOrderValue;
    private getTotalUsers;
    private getActiveUsers;
    private getNewRegistrations;
    private getConversionRate;
    private getTotalProducts;
    private getLowStockProductCount;
    private getOutOfStockProductCount;
    private getTopSellingProducts;
    private getSuccessfulTransactions;
    private getFailedTransactions;
    private getTotalRevenue;
    private getAverageTransactionTime;
    /**
     * Helper methods
     */
    private calculateCpuUsage;
    private normalizeHttpPath;
    private checkAlertRules;
    private evaluateAlertCondition;
    private cleanOldMetrics;
    private sendMetricToIntegrations;
    private getLatestBusinessMetrics;
    private processAlertEscalations;
    private sendSlackAlert;
    private sendDiscordAlert;
    private sendEmailAlert;
    private sendWebhookAlert;
    private initializePrometheus;
    private initializeSentry;
    /**
     * Shutdown monitoring system
     */
    shutdown(): void;
}
export declare const createMonitoringSystem: (config: MonitoringConfig) => UltraProfessionalMonitoringSystem;
export default UltraProfessionalMonitoringSystem;
//# sourceMappingURL=ultra-professional-monitoring-system.d.ts.map