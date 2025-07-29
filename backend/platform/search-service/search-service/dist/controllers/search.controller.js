"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchController = void 0;
const elasticsearch_service_1 = require("../services/elasticsearch.service");
const shared_1 = require("@ultramarket/shared");
const express_validator_1 = require("express-validator");
class SearchController {
    elasticsearchService;
    constructor() {
        this.elasticsearchService = new elasticsearch_service_1.ElasticsearchService();
    }
    async searchProducts(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                });
                return;
            }
            const { q: query, category, brand, minPrice, maxPrice, rating, sortBy, page = 1, limit = 20, inStock, attributes, ...filters } = req.query;
            const searchQuery = {
                query: query,
                category: category,
                brand: brand,
                minPrice: minPrice ? parseFloat(minPrice) : undefined,
                maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
                rating: rating ? parseFloat(rating) : undefined,
                sortBy: sortBy,
                page: parseInt(page) || 1,
                limit: Math.min(parseInt(limit) || 20, 100),
                filters: {
                    ...filters,
                    inStock: inStock === 'true' ? true : inStock === 'false' ? false : undefined,
                    attributes: attributes ? JSON.parse(attributes) : undefined,
                },
            };
            const userId = req.user?.id;
            const sessionId = req.headers['x-session-id'];
            const results = await this.elasticsearchService.searchProducts(searchQuery, userId);
            res.status(200).json({
                success: true,
                data: results,
                meta: {
                    query: searchQuery.query,
                    filters: searchQuery.filters,
                    pagination: {
                        page: results.page,
                        limit: results.limit,
                        total: results.total,
                        totalPages: Math.ceil(results.total / results.limit),
                    },
                    took: results.took,
                },
            });
            shared_1.logger.info('Product search completed', {
                query: searchQuery.query,
                total: results.total,
                took: results.took,
                userId,
                sessionId,
            });
        }
        catch (error) {
            shared_1.logger.error('Product search failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                query: req.query,
            });
            res.status(500).json({
                success: false,
                error: 'Search operation failed',
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async getSearchSuggestions(req, res) {
        try {
            const { q: query, limit = 10 } = req.query;
            if (!query || typeof query !== 'string' || query.length < 2) {
                res.status(400).json({
                    success: false,
                    error: 'Query must be at least 2 characters long',
                });
                return;
            }
            const suggestions = await this.elasticsearchService.getSearchSuggestions(query, parseInt(limit) || 10);
            res.status(200).json({
                success: true,
                data: {
                    query,
                    suggestions,
                },
            });
            shared_1.logger.debug('Search suggestions generated', {
                query,
                suggestionsCount: suggestions.length,
            });
        }
        catch (error) {
            shared_1.logger.error('Search suggestions failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                query: req.query.q,
            });
            res.status(500).json({
                success: false,
                error: 'Failed to get search suggestions',
            });
        }
    }
    async getPopularQueries(req, res) {
        try {
            const { limit = 20, timeframe = '7d' } = req.query;
            const popularQueries = await this.elasticsearchService.getPopularQueries(parseInt(limit) || 20, timeframe);
            res.status(200).json({
                success: true,
                data: {
                    timeframe,
                    queries: popularQueries,
                },
            });
            shared_1.logger.debug('Popular queries retrieved', {
                timeframe,
                count: popularQueries.length,
            });
        }
        catch (error) {
            shared_1.logger.error('Failed to get popular queries', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            res.status(500).json({
                success: false,
                error: 'Failed to get popular queries',
            });
        }
    }
    async getSearchFilters(req, res) {
        try {
            const { category, brand } = req.query;
            const filters = await this.elasticsearchService.getSearchFilters({
                category: category,
                brand: brand,
            });
            res.status(200).json({
                success: true,
                data: filters,
            });
            shared_1.logger.debug('Search filters retrieved', {
                category,
                brand,
                filtersCount: Object.keys(filters).length,
            });
        }
        catch (error) {
            shared_1.logger.error('Failed to get search filters', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            res.status(500).json({
                success: false,
                error: 'Failed to get search filters',
            });
        }
    }
    async trackSearchClick(req, res) {
        try {
            const { query, productId, position } = req.body;
            const userId = req.user?.id;
            const sessionId = req.headers['x-session-id'];
            if (!query || !productId) {
                res.status(400).json({
                    success: false,
                    error: 'Query and productId are required',
                });
                return;
            }
            await this.elasticsearchService.trackSearchClick({
                query,
                productId,
                position: parseInt(position) || 0,
                userId,
                sessionId,
                timestamp: new Date(),
            });
            res.status(200).json({
                success: true,
                message: 'Click tracked successfully',
            });
            shared_1.logger.debug('Search click tracked', {
                query,
                productId,
                position,
                userId,
                sessionId,
            });
        }
        catch (error) {
            shared_1.logger.error('Failed to track search click', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            res.status(500).json({
                success: false,
                error: 'Failed to track click',
            });
        }
    }
    async getSearchAnalytics(req, res) {
        try {
            const { startDate, endDate, groupBy = 'day', metrics = 'searches,clicks,conversions', } = req.query;
            if (!startDate || !endDate) {
                res.status(400).json({
                    success: false,
                    error: 'startDate and endDate are required',
                });
                return;
            }
            const analytics = await this.elasticsearchService.getSearchAnalytics(new Date(startDate), new Date(endDate), {
                groupBy: groupBy,
                metrics: metrics.split(','),
            });
            res.status(200).json({
                success: true,
                data: analytics,
            });
            shared_1.logger.debug('Search analytics retrieved', {
                startDate,
                endDate,
                groupBy,
                metrics,
            });
        }
        catch (error) {
            shared_1.logger.error('Failed to get search analytics', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            res.status(500).json({
                success: false,
                error: 'Failed to get search analytics',
            });
        }
    }
    async bulkIndexProducts(req, res) {
        try {
            const { products } = req.body;
            if (!Array.isArray(products) || products.length === 0) {
                res.status(400).json({
                    success: false,
                    error: 'Products array is required',
                });
                return;
            }
            const result = await this.elasticsearchService.bulkIndexProducts(products);
            res.status(200).json({
                success: true,
                data: result,
                message: `Indexed ${result.indexed} products successfully`,
            });
            shared_1.logger.info('Bulk indexing completed', {
                total: products.length,
                indexed: result.indexed,
                errors: result.errors,
            });
        }
        catch (error) {
            shared_1.logger.error('Bulk indexing failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            res.status(500).json({
                success: false,
                error: 'Bulk indexing failed',
            });
        }
    }
    async clearSearchIndex(req, res) {
        try {
            if (process.env.NODE_ENV === 'production') {
                res.status(403).json({
                    success: false,
                    error: 'Index clearing is not allowed in production',
                });
                return;
            }
            await this.elasticsearchService.clearIndex();
            res.status(200).json({
                success: true,
                message: 'Search index cleared successfully',
            });
            shared_1.logger.warn('Search index cleared', {
                environment: process.env.NODE_ENV,
            });
        }
        catch (error) {
            shared_1.logger.error('Failed to clear search index', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            res.status(500).json({
                success: false,
                error: 'Failed to clear search index',
            });
        }
    }
    async getSearchHealth(req, res) {
        try {
            const health = await this.elasticsearchService.getHealthStatus();
            res.status(200).json({
                success: true,
                data: health,
            });
        }
        catch (error) {
            shared_1.logger.error('Failed to get search health', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            res.status(500).json({
                success: false,
                error: 'Failed to get search health',
            });
        }
    }
}
exports.SearchController = SearchController;
//# sourceMappingURL=search.controller.js.map