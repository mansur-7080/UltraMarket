import { Request, Response } from 'express';
import { ElasticsearchService, SearchQuery } from '../services/elasticsearch.service';
import { logger } from '@ultramarket/shared';
import { validationResult } from 'express-validator';

export class SearchController {
  private elasticsearchService: ElasticsearchService;

  constructor() {
    this.elasticsearchService = new ElasticsearchService();
  }

  /**
   * Search products with advanced filtering and facets
   */
  async searchProducts(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      const {
        q: query,
        category,
        brand,
        minPrice,
        maxPrice,
        rating,
        sortBy,
        page = 1,
        limit = 20,
        inStock,
        attributes,
        ...filters
      } = req.query;

      // Build search query
      const searchQuery: SearchQuery = {
        query: query as string,
        category: category as string,
        brand: brand as string,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        rating: rating ? parseFloat(rating as string) : undefined,
        sortBy: sortBy as SearchQuery['sortBy'],
        page: parseInt(page as string) || 1,
        limit: Math.min(parseInt(limit as string) || 20, 100),
        filters: {
          ...filters,
          inStock: inStock === 'true' ? true : inStock === 'false' ? false : undefined,
          attributes: attributes ? JSON.parse(attributes as string) : undefined,
        },
      };

      // Get user ID from auth token (if available)
      const userId = (req as any).user?.id;
      const sessionId = req.headers['x-session-id'] as string;

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

      logger.info('Product search completed', {
        query: searchQuery.query,
        total: results.total,
        took: results.took,
        userId,
        sessionId,
      });
    } catch (error) {
      logger.error('Product search failed', {
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

  /**
   * Get search suggestions and autocomplete
   */
  async getSearchSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const { q: query, limit = 10 } = req.query;

      if (!query || typeof query !== 'string' || query.length < 2) {
        res.status(400).json({
          success: false,
          error: 'Query must be at least 2 characters long',
        });
        return;
      }

      const suggestions = await this.elasticsearchService.getSearchSuggestions(
        query,
        parseInt(limit as string) || 10
      );

      res.status(200).json({
        success: true,
        data: {
          query,
          suggestions,
        },
      });

      logger.debug('Search suggestions generated', {
        query,
        suggestionsCount: suggestions.length,
      });
    } catch (error) {
      logger.error('Search suggestions failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query.q,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get search suggestions',
      });
    }
  }

  /**
   * Get popular search queries
   */
  async getPopularQueries(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 20, timeframe = '7d' } = req.query;

      const popularQueries = await this.elasticsearchService.getPopularQueries(
        parseInt(limit as string) || 20,
        timeframe as string
      );

      res.status(200).json({
        success: true,
        data: {
          timeframe,
          queries: popularQueries,
        },
      });

      logger.debug('Popular queries retrieved', {
        timeframe,
        count: popularQueries.length,
      });
    } catch (error) {
      logger.error('Failed to get popular queries', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get popular queries',
      });
    }
  }

  /**
   * Get search filters and facets
   */
  async getSearchFilters(req: Request, res: Response): Promise<void> {
    try {
      const { category, brand } = req.query;

      const filters = await this.elasticsearchService.getSearchFilters({
        category: category as string,
        brand: brand as string,
      });

      res.status(200).json({
        success: true,
        data: filters,
      });

      logger.debug('Search filters retrieved', {
        category,
        brand,
        filtersCount: Object.keys(filters).length,
      });
    } catch (error) {
      logger.error('Failed to get search filters', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get search filters',
      });
    }
  }

  /**
   * Track search click
   */
  async trackSearchClick(req: Request, res: Response): Promise<void> {
    try {
      const { query, productId, position } = req.body;
      const userId = (req as any).user?.id;
      const sessionId = req.headers['x-session-id'] as string;

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

      logger.debug('Search click tracked', {
        query,
        productId,
        position,
        userId,
        sessionId,
      });
    } catch (error) {
      logger.error('Failed to track search click', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to track click',
      });
    }
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const {
        startDate,
        endDate,
        groupBy = 'day',
        metrics = 'searches,clicks,conversions',
      } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: 'startDate and endDate are required',
        });
        return;
      }

      const analytics = await this.elasticsearchService.getSearchAnalytics(
        new Date(startDate as string),
        new Date(endDate as string),
        {
          groupBy: groupBy as string,
          metrics: (metrics as string).split(','),
        }
      );

      res.status(200).json({
        success: true,
        data: analytics,
      });

      logger.debug('Search analytics retrieved', {
        startDate,
        endDate,
        groupBy,
        metrics,
      });
    } catch (error) {
      logger.error('Failed to get search analytics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get search analytics',
      });
    }
  }

  /**
   * Bulk index products
   */
  async bulkIndexProducts(req: Request, res: Response): Promise<void> {
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

      logger.info('Bulk indexing completed', {
        total: products.length,
        indexed: result.indexed,
        errors: result.errors,
      });
    } catch (error) {
      logger.error('Bulk indexing failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Bulk indexing failed',
      });
    }
  }

  /**
   * Clear search index
   */
  async clearSearchIndex(req: Request, res: Response): Promise<void> {
    try {
      // Only allow in development environment
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

      logger.warn('Search index cleared', {
        environment: process.env.NODE_ENV,
      });
    } catch (error) {
      logger.error('Failed to clear search index', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to clear search index',
      });
    }
  }

  /**
   * Get search health status
   */
  async getSearchHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await this.elasticsearchService.getHealthStatus();

      res.status(200).json({
        success: true,
        data: health,
      });
    } catch (error) {
      logger.error('Failed to get search health', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get search health',
      });
    }
  }
}
