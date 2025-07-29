/**
 * 🏥 Ultra Professional Health Monitoring System
 * UltraMarket E-commerce Platform
 *
 * Bu fayl comprehensive health checks, metrics collection va
 * system monitoring ni ta'minlaydi
 */
import { Request, Response, NextFunction } from 'express';
/**
 * 🎯 Health Status Types
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
/**
 * 📊 System Metrics Interface
 */
export interface SystemMetrics {
    timestamp: string;
    system: {
        uptime: number;
        platform: string;
        arch: string;
        nodeVersion: string;
        totalMemory: number;
        freeMemory: number;
        loadAverage: number[];
        cpuUsage: number;
    };
    application: {
        processUptime: number;
        processMemory: NodeJS.MemoryUsage;
        processCpuUsage: NodeJS.CpuUsage;
        pid: number;
        version: string;
        environment: string;
    };
    database: {
        postgres: HealthCheckResult;
        mongodb: HealthCheckResult;
        redis: HealthCheckResult;
    };
    external: {
        paymentGateways: Record<string, HealthCheckResult>;
        emailService: HealthCheckResult;
        smsService: HealthCheckResult;
    };
    performance: {
        responseTime: number;
        throughput: number;
        errorRate: number;
        activeConnections: number;
    };
}
/**
 * 🔍 Health Check Result Interface
 */
export interface HealthCheckResult {
    status: HealthStatus;
    responseTime: number;
    timestamp: string;
    details?: any;
    error?: string;
}
/**
 * 🎯 Health Check Configuration
 */
export interface HealthCheckConfig {
    name: string;
    check: () => Promise<HealthCheckResult>;
    interval: number;
    timeout: number;
    retries: number;
    critical: boolean;
}
/**
 * 📈 Performance Metrics
 */
export interface PerformanceMetrics {
    requests: {
        total: number;
        successful: number;
        failed: number;
        averageResponseTime: number;
        p95ResponseTime: number;
        p99ResponseTime: number;
    };
    endpoints: Map<string, {
        count: number;
        averageTime: number;
        errors: number;
    }>;
    errors: Array<{
        timestamp: string;
        error: string;
        endpoint: string;
        statusCode: number;
    }>;
}
/**
 * 🏭 Ultra Professional Health Monitor
 */
export declare class UltraProfessionalHealthMonitor {
    private healthChecks;
    private metrics;
    private responseTimes;
    private isMonitoring;
    private monitoringInterval;
    constructor();
    /**
     * 🔧 Setup default health checks
     */
    private setupDefaultHealthChecks;
    /**
     * ➕ Add health check
     */
    addHealthCheck(config: HealthCheckConfig): void;
    /**
     * ➖ Remove health check
     */
    removeHealthCheck(name: string): void;
    /**
     * 🚀 Start monitoring
     */
    startMonitoring(): void;
    /**
     * 🛑 Stop monitoring
     */
    stopMonitoring(): void;
    /**
     * 🔍 Run all health checks
     */
    private runAllHealthChecks;
    /**
     * 🔍 Run single health check
     */
    private runHealthCheck;
    /**
     * 🖥️ Check system health
     */
    private checkSystemHealth;
    /**
     * 💾 Check memory health
     */
    private checkMemoryHealth;
    /**
     * 💿 Check disk health
     */
    private checkDiskHealth;
    /**
     * 💿 Get disk usage
     */
    private getDiskUsage;
    /**
     * 📊 Create metrics middleware
     */
    createMetricsMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * 📊 Get system metrics
     */
    getSystemMetrics(): SystemMetrics;
    /**
     * 🏥 Create health check endpoint
     */
    createHealthEndpoint(): (req: Request, res: Response) => Promise<void>;
    /**
     * 📊 Create metrics endpoint
     */
    createMetricsEndpoint(): (req: Request, res: Response) => void;
    /**
     * 🧹 Cleanup old metrics
     */
    private cleanupOldMetrics;
    /**
     * 📈 Get performance summary
     */
    getPerformanceSummary(): {
        totalRequests: number;
        successfulRequests: number;
        failedRequests: number;
        averageResponseTime: number;
        errorRate: string;
        topEndpoints: [string, {
            count: number;
            averageTime: number;
            errors: number;
        }][];
        recentErrors: {
            timestamp: string;
            error: string;
            endpoint: string;
            statusCode: number;
        }[];
    };
}
/**
 * 🌟 Global health monitor instance
 */
export declare const ultraHealthMonitor: UltraProfessionalHealthMonitor;
/**
 * 🚀 Quick setup functions
 */
export declare const healthSetup: {
    start: () => void;
    stop: () => void;
    middleware: () => (req: Request, res: Response, next: NextFunction) => void;
    healthEndpoint: () => (req: Request, res: Response) => Promise<void>;
    metricsEndpoint: () => (req: Request, res: Response) => void;
};
declare const _default: {
    UltraProfessionalHealthMonitor: typeof UltraProfessionalHealthMonitor;
    ultraHealthMonitor: UltraProfessionalHealthMonitor;
    healthSetup: {
        start: () => void;
        stop: () => void;
        middleware: () => (req: Request, res: Response, next: NextFunction) => void;
        healthEndpoint: () => (req: Request, res: Response) => Promise<void>;
        metricsEndpoint: () => (req: Request, res: Response) => void;
    };
};
export default _default;
//# sourceMappingURL=ultra-professional-health-monitor.d.ts.map