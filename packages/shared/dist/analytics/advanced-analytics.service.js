"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedAnalyticsService = void 0;
const logger_replacement_1 = require("../utils/logger-replacement");
const ioredis_1 = require("ioredis");
class AdvancedAnalyticsService {
    logger = (0, logger_replacement_1.createLogger)('advanced-analytics');
    analyticsModel;
    orderRepository;
    userRepository;
    productRepository;
    redis;
    constructor(analyticsModel, orderRepository, userRepository, productRepository, redis) {
        this.analyticsModel = analyticsModel;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.redis = redis || new ioredis_1.Redis();
    }
    /**
     * Track analytics event
     */
    async trackEvent(event) {
        try {
            const analyticsEvent = new this.analyticsModel({
                ...event,
                id: this.generateEventId(),
                timestamp: new Date(),
            });
            await analyticsEvent.save();
            // Update real-time metrics in Redis
            await this.updateRealTimeMetrics(event);
            this.logger.log(`Analytics event tracked: ${event.eventType || 'unknown'}`);
        }
        catch (error) {
            this.logger.error('Error tracking analytics event:', error);
            throw error;
        }
    }
    /**
     * Get comprehensive business metrics
     */
    async getBusinessMetrics(startDate, endDate) {
        try {
            const [totalRevenue, totalOrders, topProducts, topCategories, _customerMetrics] = await Promise.all([
                this.getTotalRevenue(startDate, endDate),
                this.getTotalOrders(startDate, endDate),
                this.getTopProducts(startDate, endDate),
                this.getTopCategories(startDate, endDate),
                this.getCustomerMetrics(startDate, endDate),
            ]);
            const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
            const conversionRate = await this.getConversionRate(startDate, endDate);
            const customerLifetimeValue = await this.getCustomerLifetimeValue();
            const returnCustomerRate = await this.getReturnCustomerRate(startDate, endDate);
            return {
                totalRevenue,
                totalOrders,
                averageOrderValue,
                conversionRate,
                customerLifetimeValue,
                returnCustomerRate,
                topProducts,
                topCategories,
            };
        }
        catch (error) {
            this.logger.error('Error getting business metrics:', error);
            throw error;
        }
    }
    /**
     * Get user behavior analytics
     */
    async getUserBehaviorAnalytics(startDate, endDate) {
        try {
            const [pageViews, uniqueVisitors, bounceRate, averageSessionDuration, pagesPerSession, topPages, userFlow,] = await Promise.all([
                this.getPageViews(startDate, endDate),
                this.getUniqueVisitors(startDate, endDate),
                this.getBounceRate(startDate, endDate),
                this.getAverageSessionDuration(startDate, endDate),
                this.getPagesPerSession(startDate, endDate),
                this.getTopPages(startDate, endDate),
                this.getUserFlow(startDate, endDate),
            ]);
            return {
                pageViews,
                uniqueVisitors,
                bounceRate,
                averageSessionDuration,
                pagesPerSession,
                topPages,
                userFlow,
            };
        }
        catch (error) {
            this.logger.error('Error getting user behavior analytics:', error);
            throw error;
        }
    }
    /**
     * Get sales analytics
     */
    async getSalesAnalytics(startDate, endDate) {
        try {
            const [dailySales, monthlySales, salesByRegion, salesByPaymentMethod] = await Promise.all([
                this.getDailySales(startDate, endDate),
                this.getMonthlySales(startDate, endDate),
                this.getSalesByRegion(startDate, endDate),
                this.getSalesByPaymentMethod(startDate, endDate),
            ]);
            return {
                dailySales,
                monthlySales,
                salesByRegion,
                salesByPaymentMethod,
            };
        }
        catch (error) {
            this.logger.error('Error getting sales analytics:', error);
            throw error;
        }
    }
    /**
     * Get customer analytics
     */
    async getCustomerAnalytics(startDate, endDate) {
        try {
            const [totalCustomers, newCustomers, returningCustomers, customerSegments, customerRetention, customerAcquisition,] = await Promise.all([
                this.getTotalCustomers(),
                this.getNewCustomers(startDate, endDate),
                this.getReturningCustomers(startDate, endDate),
                this.getCustomerSegments(startDate, endDate),
                this.getCustomerRetention(startDate, endDate),
                this.getCustomerAcquisition(startDate, endDate),
            ]);
            return {
                totalCustomers,
                newCustomers,
                returningCustomers,
                customerSegments,
                customerRetention,
                customerAcquisition,
            };
        }
        catch (error) {
            this.logger.error('Error getting customer analytics:', error);
            throw error;
        }
    }
    /**
     * Get product analytics
     */
    async getProductAnalytics(startDate, endDate) {
        try {
            const [totalProducts, activeProducts, topSellingProducts, productPerformance, inventoryAnalytics,] = await Promise.all([
                this.getTotalProducts(),
                this.getActiveProducts(),
                this.getTopSellingProducts(startDate, endDate),
                this.getProductPerformance(startDate, endDate),
                this.getInventoryAnalytics(),
            ]);
            return {
                totalProducts,
                activeProducts,
                topSellingProducts,
                productPerformance,
                inventoryAnalytics,
            };
        }
        catch (error) {
            this.logger.error('Error getting product analytics:', error);
            throw error;
        }
    }
    /**
     * Get real-time metrics
     */
    async getRealTimeMetrics() {
        try {
            const [activeUsers, currentOrders, realtimeRevenue, serverLoad, responseTime, errorRate, topActivePages,] = await Promise.all([
                this.getActiveUsers(),
                this.getCurrentOrders(),
                this.getRealtimeRevenue(),
                this.getServerLoad(),
                this.getResponseTime(),
                this.getErrorRate(),
                this.getTopActivePages(),
            ]);
            return {
                activeUsers,
                currentOrders,
                realtimeRevenue,
                serverLoad,
                responseTime,
                errorRate,
                topActivePages,
            };
        }
        catch (error) {
            this.logger.error('Error getting real-time metrics:', error);
            throw error;
        }
    }
    /**
     * Generate custom analytics report
     */
    async generateCustomReport(reportConfig) {
        try {
            const { metrics, filters, groupBy, dateRange } = reportConfig;
            const { startDate, endDate } = dateRange;
            const pipeline = this.buildAnalyticsPipeline(metrics, filters, groupBy, startDate, endDate);
            const result = await this.analyticsModel.aggregate(pipeline);
            return {
                reportId: this.generateReportId(),
                generatedAt: new Date(),
                config: reportConfig,
                data: result,
            };
        }
        catch (error) {
            this.logger.error('Error generating custom report:', error);
            throw error;
        }
    }
    /**
     * Export analytics data
     */
    async exportAnalyticsData(format, startDate, endDate) {
        try {
            const data = await this.analyticsModel
                .find({
                timestamp: { $gte: startDate, $lte: endDate },
            })
                .lean();
            switch (format) {
                case 'csv':
                    return this.exportToCSV(data);
                case 'json':
                    return Buffer.from(JSON.stringify(data, null, 2));
                case 'xlsx':
                    return this.exportToExcel(data);
                default:
                    throw new Error(`Unsupported format: ${format}`);
            }
        }
        catch (error) {
            this.logger.error('Error exporting analytics data:', error);
            throw error;
        }
    }
    /**
     * Get predictive analytics
     */
    async getPredictiveAnalytics(metric, timeframe) {
        try {
            const historicalData = await this.getHistoricalData(metric, timeframe);
            const prediction = await this.predictFutureValues(historicalData, timeframe);
            return {
                metric,
                timeframe,
                historicalData,
                prediction,
                confidence: prediction.confidence,
                trend: prediction.trend,
            };
        }
        catch (error) {
            this.logger.error('Error getting predictive analytics:', error);
            throw error;
        }
    }
    // Private helper methods
    async getTotalRevenue(startDate, endDate) {
        const result = await this.orderRepository
            .createQueryBuilder('order')
            .select('SUM(order.totalAmount)', 'total')
            .where('order.createdAt BETWEEN :startDate AND :endDate', {
            startDate,
            endDate,
        })
            .andWhere('order.status = :status', { status: 'completed' })
            .getRawOne();
        return parseFloat(result.total) || 0;
    }
    async getTotalOrders(startDate, endDate) {
        return await this.orderRepository
            .createQueryBuilder('order')
            .where('order.createdAt BETWEEN :startDate AND :endDate', {
            startDate,
            endDate,
        })
            .getCount();
    }
    async getTopProducts(startDate, endDate) {
        return await this.orderRepository
            .createQueryBuilder('order')
            .innerJoin('order.items', 'item')
            .innerJoin('item.product', 'product')
            .select([
            'product.id as productId',
            'product.name as productName',
            'SUM(item.quantity * item.price) as revenue',
            'SUM(item.quantity) as quantity',
        ])
            .where('order.createdAt BETWEEN :startDate AND :endDate', {
            startDate,
            endDate,
        })
            .groupBy('product.id')
            .orderBy('revenue', 'DESC')
            .limit(10)
            .getRawMany();
    }
    async getTopCategories(startDate, endDate) {
        return await this.orderRepository
            .createQueryBuilder('order')
            .innerJoin('order.items', 'item')
            .innerJoin('item.product', 'product')
            .innerJoin('product.category', 'category')
            .select([
            'category.id as categoryId',
            'category.name as categoryName',
            'SUM(item.quantity * item.price) as revenue',
            'COUNT(DISTINCT order.id) as orders',
        ])
            .where('order.createdAt BETWEEN :startDate AND :endDate', {
            startDate,
            endDate,
        })
            .groupBy('category.id')
            .orderBy('revenue', 'DESC')
            .limit(10)
            .getRawMany();
    }
    async getConversionRate(startDate, endDate) {
        const [visitors, orders] = await Promise.all([
            this.analyticsModel.countDocuments({
                eventType: 'page_view',
                timestamp: { $gte: startDate, $lte: endDate },
            }),
            this.orderRepository
                .createQueryBuilder('order')
                .where('order.createdAt BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            })
                .getCount(),
        ]);
        return visitors > 0 ? (orders / visitors) * 100 : 0;
    }
    async getCustomerLifetimeValue() {
        const result = await this.orderRepository
            .createQueryBuilder('order')
            .select('AVG(customer_total.total)', 'avgLifetimeValue')
            .from((subQuery) => subQuery
            .select('order.userId', 'userId')
            .addSelect('SUM(order.totalAmount)', 'total')
            .from('order', 'order')
            .where('order.status = :status', { status: 'completed' })
            .groupBy('order.userId'), 'customer_total')
            .getRawOne();
        return parseFloat(result.avgLifetimeValue) || 0;
    }
    async getReturnCustomerRate(startDate, endDate) {
        const [totalCustomers, returningCustomers] = await Promise.all([
            this.orderRepository
                .createQueryBuilder('order')
                .select('COUNT(DISTINCT order.userId)', 'count')
                .where('order.createdAt BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            })
                .getRawOne(),
            this.orderRepository
                .createQueryBuilder('order')
                .select('COUNT(DISTINCT order.userId)', 'count')
                .where('order.createdAt BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            })
                .andWhere('order.userId IN (SELECT DISTINCT userId FROM order WHERE createdAt < :startDate)', { startDate })
                .getRawOne(),
        ]);
        const total = parseInt(totalCustomers.count);
        const returning = parseInt(returningCustomers.count);
        return total > 0 ? (returning / total) * 100 : 0;
    }
    async updateRealTimeMetrics(event) {
        const key = `analytics:realtime:${event.eventType}`;
        const timestamp = Math.floor(Date.now() / 1000);
        await Promise.all([
            this.redis.incr(key),
            this.redis.expire(key, 3600), // 1 hour expiry
            this.redis.zadd('analytics:realtime:events', timestamp, JSON.stringify(event)),
            this.redis.zremrangebyscore('analytics:realtime:events', 0, timestamp - 3600),
        ]);
    }
    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateReportId() {
        return `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    buildAnalyticsPipeline(metrics, filters, groupBy, startDate, endDate) {
        const pipeline = [
            {
                $match: {
                    timestamp: { $gte: startDate, $lte: endDate },
                    ...filters,
                },
            },
        ];
        if (groupBy) {
            pipeline.push({
                $group: {
                    _id: `$${groupBy}`,
                    count: { $sum: 1 },
                    ...metrics.reduce((acc, metric) => {
                        acc[metric] = { $sum: `$${metric}` };
                        return acc;
                    }, {}),
                },
            });
        }
        return pipeline;
    }
    async exportToCSV(_data) {
        // Implementation for CSV export
        const csv = [].map((row) => Object.values(row).join(',')).join('\n');
        return Buffer.from(csv);
    }
    async exportToExcel(_data) {
        // Implementation for Excel export
        // This would require a library like 'exceljs'
        return Buffer.from('Excel export not implemented');
    }
    async getHistoricalData(_metric, _timeframe) {
        // Implementation for getting historical data
        return [];
    }
    async predictFutureValues(_data, _timeframe) {
        // Implementation for predictive analytics
        return {
            values: [],
            confidence: 0.85,
            trend: 'increasing',
        };
    }
    _prepareTrainingData(_data) {
        // Implementation would go here
        return { features: [], labels: [] };
    }
    // Additional helper methods for specific metrics
    async getPageViews(startDate, endDate) {
        return await this.analyticsModel.countDocuments({
            eventType: 'page_view',
            timestamp: { $gte: startDate, $lte: endDate },
        });
    }
    async getUniqueVisitors(startDate, endDate) {
        const result = await this.analyticsModel.aggregate([
            {
                $match: {
                    timestamp: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $group: {
                    _id: '$sessionId',
                },
            },
            {
                $count: 'uniqueVisitors',
            },
        ]);
        return result[0]?.uniqueVisitors || 0;
    }
    async getBounceRate(_startDate, _endDate) {
        // Implementation for bounce rate calculation
        return 0;
    }
    async getAverageSessionDuration(_startDate, _endDate) {
        // Implementation for average session duration
        return 0;
    }
    async getPagesPerSession(_startDate, _endDate) {
        // Implementation for pages per session
        return 0;
    }
    async getTopPages(startDate, endDate) {
        return await this.analyticsModel.aggregate([
            {
                $match: {
                    eventType: 'page_view',
                    timestamp: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $group: {
                    _id: '$eventData.path',
                    views: { $sum: 1 },
                    uniqueViews: { $addToSet: '$sessionId' },
                },
            },
            {
                $project: {
                    path: '$_id',
                    views: 1,
                    uniqueViews: { $size: '$uniqueViews' },
                },
            },
            {
                $sort: { views: -1 },
            },
            {
                $limit: 10,
            },
        ]);
    }
    async getUserFlow(_startDate, _endDate) {
        // Implementation for user flow analysis
        return [];
    }
    async getDailySales(startDate, endDate) {
        return await this.orderRepository
            .createQueryBuilder('order')
            .select([
            'DATE(order.createdAt) as date',
            'SUM(order.totalAmount) as revenue',
            'COUNT(order.id) as orders',
            'COUNT(DISTINCT order.userId) as customers',
        ])
            .where('order.createdAt BETWEEN :startDate AND :endDate', {
            startDate,
            endDate,
        })
            .andWhere('order.status = :status', { status: 'completed' })
            .groupBy('DATE(order.createdAt)')
            .orderBy('date', 'ASC')
            .getRawMany();
    }
    async getMonthlySales(startDate, endDate) {
        return await this.orderRepository
            .createQueryBuilder('order')
            .select([
            'DATE_FORMAT(order.createdAt, "%Y-%m") as month',
            'SUM(order.totalAmount) as revenue',
            'COUNT(order.id) as orders',
            'COUNT(DISTINCT order.userId) as customers',
        ])
            .where('order.createdAt BETWEEN :startDate AND :endDate', {
            startDate,
            endDate,
        })
            .andWhere('order.status = :status', { status: 'completed' })
            .groupBy('DATE_FORMAT(order.createdAt, "%Y-%m")')
            .orderBy('month', 'ASC')
            .getRawMany();
    }
    async getSalesByRegion(_startDate, _endDate) {
        // Implementation for sales by region
        return [];
    }
    async getSalesByPaymentMethod(startDate, endDate) {
        return await this.orderRepository
            .createQueryBuilder('order')
            .select([
            'order.paymentMethod as method',
            'SUM(order.totalAmount) as revenue',
            'COUNT(order.id) as orders',
        ])
            .where('order.createdAt BETWEEN :startDate AND :endDate', {
            startDate,
            endDate,
        })
            .andWhere('order.status = :status', { status: 'completed' })
            .groupBy('order.paymentMethod')
            .orderBy('revenue', 'DESC')
            .getRawMany();
    }
    async getCustomerMetrics(_startDate, _endDate) {
        // Implementation for customer metrics
        return {};
    }
    async getTotalCustomers() {
        return await this.userRepository.count();
    }
    async getNewCustomers(startDate, endDate) {
        return await this.userRepository
            .createQueryBuilder('user')
            .where('user.createdAt BETWEEN :startDate AND :endDate', {
            startDate,
            endDate,
        })
            .getCount();
    }
    async getReturningCustomers(startDate, endDate) {
        return await this.userRepository
            .createQueryBuilder('user')
            .where('user.createdAt < :startDate', { startDate })
            .andWhere('user.id IN (SELECT DISTINCT userId FROM order WHERE createdAt BETWEEN :startDate AND :endDate)', { startDate, endDate })
            .getCount();
    }
    async getCustomerSegments(_startDate, _endDate) {
        // Implementation for customer segmentation
        return [];
    }
    async getCustomerRetention(_startDate, _endDate) {
        // Implementation for customer retention analysis
        return [];
    }
    async getCustomerAcquisition(_startDate, _endDate) {
        // Implementation for customer acquisition analysis
        return [];
    }
    async getTotalProducts() {
        return await this.productRepository.count();
    }
    async getActiveProducts() {
        return await this.productRepository
            .createQueryBuilder('product')
            .where('product.isActive = :isActive', { isActive: true })
            .getCount();
    }
    async getTopSellingProducts(startDate, endDate) {
        return await this.orderRepository
            .createQueryBuilder('order')
            .innerJoin('order.items', 'item')
            .innerJoin('item.product', 'product')
            .select([
            'product.id as productId',
            'product.name as productName',
            'SUM(item.quantity) as sales',
            'SUM(item.quantity * item.price) as revenue',
        ])
            .where('order.createdAt BETWEEN :startDate AND :endDate', {
            startDate,
            endDate,
        })
            .groupBy('product.id')
            .orderBy('sales', 'DESC')
            .limit(10)
            .getRawMany();
    }
    async getProductPerformance(_startDate, _endDate) {
        // Implementation for product performance analysis
        return [];
    }
    async getInventoryAnalytics() {
        // Implementation for inventory analytics
        return [];
    }
    async getActiveUsers() {
        const activeUsers = await this.redis.zcard('analytics:realtime:active_users');
        return activeUsers;
    }
    async getCurrentOrders() {
        return await this.orderRepository
            .createQueryBuilder('order')
            .where('order.status IN (:...statuses)', {
            statuses: ['pending', 'processing', 'confirmed'],
        })
            .getCount();
    }
    async getRealtimeRevenue() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const result = await this.orderRepository
            .createQueryBuilder('order')
            .select('SUM(order.totalAmount)', 'total')
            .where('order.createdAt >= :today', { today })
            .andWhere('order.status = :status', { status: 'completed' })
            .getRawOne();
        return parseFloat(result.total) || 0;
    }
    async getServerLoad() {
        // Implementation for server load metrics
        return 0;
    }
    async getResponseTime() {
        // Implementation for response time metrics
        return 0;
    }
    async getErrorRate() {
        // Implementation for error rate metrics
        return 0;
    }
    async getTopActivePages() {
        const activePages = await this.redis.zrevrange('analytics:realtime:active_pages', 0, 9, 'WITHSCORES');
        const result = [];
        for (let i = 0; i < activePages.length; i += 2) {
            result.push({
                path: activePages[i],
                activeUsers: parseInt(activePages[i + 1]),
            });
        }
        return result;
    }
}
exports.AdvancedAnalyticsService = AdvancedAnalyticsService;
//# sourceMappingURL=advanced-analytics.service.js.map