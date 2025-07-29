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
import { Request, Response, NextFunction } from 'express';
export interface PerformanceMiddlewareConfig {
    serviceName: string;
    enableDetailedTracking: boolean;
    enableBusinessMetrics: boolean;
    enableDatabaseTracking: boolean;
    enableCacheTracking: boolean;
    enableExternalServiceTracking: boolean;
    customThresholds?: any;
}
export interface BusinessContext {
    transactionType?: string;
    userId?: string;
    customerId?: string;
    amount?: number;
    productIds?: string[];
    paymentMethod?: string;
    region?: string;
}
export declare class PerformanceMiddleware {
    private monitor;
    private config;
    constructor(config: PerformanceMiddlewareConfig);
    /**
     * Main performance tracking middleware
     */
    trackRequest(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Database operation tracking middleware
     */
    trackDatabase(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Cache operation tracking middleware
     */
    trackCache(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Business metrics tracking middleware
     */
    trackBusinessMetrics(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Get performance metrics
     */
    getMetrics(): import("../performance/professional-monitoring").PerformanceMetrics;
    /**
     * Get performance summary
     */
    getSummary(): any;
    /**
     * Get active alerts
     */
    getAlerts(): import("../performance/professional-monitoring").PerformanceAlert[];
    private setupEventListeners;
    private detectBusinessOperationType;
}
export declare const createUserServicePerformanceMiddleware: (customConfig?: Partial<PerformanceMiddlewareConfig>) => PerformanceMiddleware;
export declare const createPaymentServicePerformanceMiddleware: (customConfig?: Partial<PerformanceMiddlewareConfig>) => PerformanceMiddleware;
export declare const createOrderServicePerformanceMiddleware: (customConfig?: Partial<PerformanceMiddlewareConfig>) => PerformanceMiddleware;
export declare const createProductServicePerformanceMiddleware: (customConfig?: Partial<PerformanceMiddlewareConfig>) => PerformanceMiddleware;
export declare const createPerformanceMiddleware: (serviceName: string, customConfig?: Partial<PerformanceMiddlewareConfig>) => {
    trackRequest: (req: Request, res: Response, next: NextFunction) => void;
    trackDatabase: (req: Request, res: Response, next: NextFunction) => void;
    trackCache: (req: Request, res: Response, next: NextFunction) => void;
    trackBusinessMetrics: (req: Request, res: Response, next: NextFunction) => void;
    getMetrics: () => import("../performance/professional-monitoring").PerformanceMetrics;
    getSummary: () => any;
    getAlerts: () => import("../performance/professional-monitoring").PerformanceAlert[];
};
export default PerformanceMiddleware;
//# sourceMappingURL=performance.middleware.d.ts.map