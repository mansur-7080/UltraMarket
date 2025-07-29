import { Redis } from 'ioredis';
interface AnalyticsEvent {
    id: string;
    userId?: string;
    sessionId: string;
    eventType: string;
    eventData: any;
    timestamp: Date;
    userAgent?: string;
    ipAddress?: string;
    referer?: string;
    deviceType?: string;
    browser?: string;
    os?: string;
    country?: string;
    city?: string;
}
interface BusinessMetrics {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    conversionRate: number;
    customerLifetimeValue: number;
    returnCustomerRate: number;
    topProducts: Array<{
        productId: string;
        productName: string;
        revenue: number;
        quantity: number;
    }>;
    topCategories: Array<{
        categoryId: string;
        categoryName: string;
        revenue: number;
        orders: number;
    }>;
}
interface UserBehaviorAnalytics {
    pageViews: number;
    uniqueVisitors: number;
    bounceRate: number;
    averageSessionDuration: number;
    pagesPerSession: number;
    topPages: Array<{
        path: string;
        views: number;
        uniqueViews: number;
        averageTime: number;
    }>;
    userFlow: Array<{
        fromPage: string;
        toPage: string;
        count: number;
        percentage: number;
    }>;
}
interface SalesAnalytics {
    dailySales: Array<{
        date: string;
        revenue: number;
        orders: number;
        customers: number;
    }>;
    monthlySales: Array<{
        month: string;
        revenue: number;
        orders: number;
        customers: number;
    }>;
    salesByRegion: Array<{
        region: string;
        revenue: number;
        orders: number;
        percentage: number;
    }>;
    salesByPaymentMethod: Array<{
        method: string;
        revenue: number;
        orders: number;
        percentage: number;
    }>;
}
interface CustomerAnalytics {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    customerSegments: Array<{
        segment: string;
        count: number;
        revenue: number;
        percentage: number;
    }>;
    customerRetention: Array<{
        period: string;
        retentionRate: number;
        churnRate: number;
    }>;
    customerAcquisition: Array<{
        source: string;
        customers: number;
        cost: number;
        revenue: number;
        roi: number;
    }>;
}
interface ProductAnalytics {
    totalProducts: number;
    activeProducts: number;
    topSellingProducts: Array<{
        productId: string;
        productName: string;
        sales: number;
        revenue: number;
        views: number;
        conversionRate: number;
    }>;
    productPerformance: Array<{
        productId: string;
        productName: string;
        impressions: number;
        clicks: number;
        purchases: number;
        revenue: number;
        profitMargin: number;
    }>;
    inventoryAnalytics: Array<{
        productId: string;
        productName: string;
        currentStock: number;
        reorderLevel: number;
        turnoverRate: number;
        daysOfSupply: number;
    }>;
}
interface RealTimeMetrics {
    activeUsers: number;
    currentOrders: number;
    realtimeRevenue: number;
    serverLoad: number;
    responseTime: number;
    errorRate: number;
    topActivePages: Array<{
        path: string;
        activeUsers: number;
    }>;
}
export declare class AdvancedAnalyticsService {
    private readonly logger;
    private analyticsModel;
    private orderRepository;
    private userRepository;
    private productRepository;
    private redis;
    constructor(analyticsModel?: any, orderRepository?: any, userRepository?: any, productRepository?: any, redis?: Redis);
    /**
     * Track analytics event
     */
    trackEvent(event: Partial<AnalyticsEvent>): Promise<void>;
    /**
     * Get comprehensive business metrics
     */
    getBusinessMetrics(startDate: Date, endDate: Date): Promise<BusinessMetrics>;
    /**
     * Get user behavior analytics
     */
    getUserBehaviorAnalytics(startDate: Date, endDate: Date): Promise<UserBehaviorAnalytics>;
    /**
     * Get sales analytics
     */
    getSalesAnalytics(startDate: Date, endDate: Date): Promise<SalesAnalytics>;
    /**
     * Get customer analytics
     */
    getCustomerAnalytics(startDate: Date, endDate: Date): Promise<CustomerAnalytics>;
    /**
     * Get product analytics
     */
    getProductAnalytics(startDate: Date, endDate: Date): Promise<ProductAnalytics>;
    /**
     * Get real-time metrics
     */
    getRealTimeMetrics(): Promise<RealTimeMetrics>;
    /**
     * Generate custom analytics report
     */
    generateCustomReport(reportConfig: {
        metrics: string[];
        filters: any;
        groupBy: string;
        dateRange: {
            startDate: Date;
            endDate: Date;
        };
    }): Promise<any>;
    /**
     * Export analytics data
     */
    exportAnalyticsData(format: 'csv' | 'json' | 'xlsx', startDate: Date, endDate: Date): Promise<Buffer>;
    /**
     * Get predictive analytics
     */
    getPredictiveAnalytics(metric: string, timeframe: number): Promise<any>;
    private getTotalRevenue;
    private getTotalOrders;
    private getTopProducts;
    private getTopCategories;
    private getConversionRate;
    private getCustomerLifetimeValue;
    private getReturnCustomerRate;
    private updateRealTimeMetrics;
    private generateEventId;
    private generateReportId;
    private buildAnalyticsPipeline;
    private exportToCSV;
    private exportToExcel;
    private getHistoricalData;
    private predictFutureValues;
    private _prepareTrainingData;
    private getPageViews;
    private getUniqueVisitors;
    private getBounceRate;
    private getAverageSessionDuration;
    private getPagesPerSession;
    private getTopPages;
    private getUserFlow;
    private getDailySales;
    private getMonthlySales;
    private getSalesByRegion;
    private getSalesByPaymentMethod;
    private getCustomerMetrics;
    private getTotalCustomers;
    private getNewCustomers;
    private getReturningCustomers;
    private getCustomerSegments;
    private getCustomerRetention;
    private getCustomerAcquisition;
    private getTotalProducts;
    private getActiveProducts;
    private getTopSellingProducts;
    private getProductPerformance;
    private getInventoryAnalytics;
    private getActiveUsers;
    private getCurrentOrders;
    private getRealtimeRevenue;
    private getServerLoad;
    private getResponseTime;
    private getErrorRate;
    private getTopActivePages;
}
export {};
//# sourceMappingURL=advanced-analytics.service.d.ts.map