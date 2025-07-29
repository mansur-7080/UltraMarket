import { Request, Response } from 'express';
import { ElasticsearchService, SearchQuery } from '../services/elasticsearch.service';
import { logger } from '@ultramarket/shared';

export class SearchController {
  private elasticsearchService: ElasticsearchService;

  constructor() {
    this.elasticsearchService = new ElasticsearchService();
  }

  /**
   * Search products
   */
  async searchProducts(req: Request, res: Response): Promise<void> {
    try {
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
        ...filters
      } = req.query;

      // Validate parameters
      const searchQuery: SearchQuery = {
        query: query as string,
        category: category as string,
        brand: brand as string,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        rating: rating ? parseFloat(rating as string) : undefined,
        sortBy: sortBy as SearchQuery['sortBy'],
        page: parseInt(page as string) || 1,
        limit: Math.min(parseInt(limit as string) || 20, 100), // Max 100 items per page
        filters,
      };

      // Get user ID from auth token (if available)
      const userId = (req as any).user?.id;

      const results = await this.elasticsearchService.searchProducts(searchQuery, userId);

      res.status(200).json({
        success: true,
        data: results,
      });

      logger.info('Product search completed', {
        query: searchQuery.query,
        total: results.total,
        took: results.took,
        userId,
      });
    } catch (error) {
      logger.error('Product search failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query,
      });

      res.status(500).json({
        success: false,
        error: 'Search operation failed',
      });
    }
  }

  /**
   * Get autocomplete suggestions
   */
  async getAutocomplete(req: Request, res: Response): Promise<void> {
    try {
      const { q: query, limit = 10 } = req.query;

      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Query parameter is required',
        });
        return;
      }

      if (query.length < 2) {
        res.status(200).json({
          success: true,
          data: { suggestions: [] },
        });
        return;
      }

      const suggestions = await this.elasticsearchService.getAutocompleteSuggestions(
        query,
        parseInt(limit as string) || 10
      );

      res.status(200).json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      logger.error('Autocomplete failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query.q,
      });

      res.status(500).json({
        success: false,
        error: 'Autocomplete operation failed',
      });
    }
  }

  /**
   * Get similar products
   */
  async getSimilarProducts(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const { limit = 5 } = req.query;

      if (!productId) {
        res.status(400).json({
          success: false,
          error: 'Product ID is required',
        });
        return;
      }

      const similarProducts = await this.elasticsearchService.getSimilarProducts(
        productId,
        parseInt(limit as string) || 5
      );

      res.status(200).json({
        success: true,
        data: {
          productId,
          similarProducts,
          total: similarProducts.length,
        },
      });
    } catch (error) {
      logger.error('Similar products search failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        productId: req.params.productId,
      });

      res.status(500).json({
        success: false,
        error: 'Similar products search failed',
      });
    }
  }

  /**
   * Index a product (Admin only)
   */
  async indexProduct(req: Request, res: Response): Promise<void> {
    try {
      const product = req.body;

      if (!product.id || !product.name || !product.price) {
        res.status(400).json({
          success: false,
          error: 'Product ID, name, and price are required',
        });
        return;
      }

      await this.elasticsearchService.indexProduct(product);

      res.status(200).json({
        success: true,
        message: 'Product indexed successfully',
        data: {
          productId: product.id,
        },
      });

      logger.info('Product indexed via API', {
        productId: product.id,
        name: product.name,
        adminId: (req as any).user?.id,
      });
    } catch (error) {
      logger.error('Product indexing via API failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        productId: req.body.id,
      });

      res.status(500).json({
        success: false,
        error: 'Product indexing failed',
      });
    }
  }

  /**
   * Update product in index (Admin only)
   */
  async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const updates = req.body;

      if (!productId) {
        res.status(400).json({
          success: false,
          error: 'Product ID is required',
        });
        return;
      }

      await this.elasticsearchService.updateProduct(productId, updates);

      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: {
          productId,
          updates: Object.keys(updates),
        },
      });

      logger.info('Product updated in index via API', {
        productId,
        updates: Object.keys(updates),
        adminId: (req as any).user?.id,
      });
    } catch (error) {
      logger.error('Product update in index via API failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        productId: req.params.productId,
      });

      res.status(500).json({
        success: false,
        error: 'Product update failed',
      });
    }
  }

  /**
   * Delete product from index (Admin only)
   */
  async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;

      if (!productId) {
        res.status(400).json({
          success: false,
          error: 'Product ID is required',
        });
        return;
      }

      await this.elasticsearchService.deleteProduct(productId);

      res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
        data: {
          productId,
        },
      });

      logger.info('Product deleted from index via API', {
        productId,
        adminId: (req as any).user?.id,
      });
    } catch (error) {
      logger.error('Product deletion from index via API failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        productId: req.params.productId,
      });

      res.status(500).json({
        success: false,
        error: 'Product deletion failed',
      });
    }
  }

  /**
   * Bulk index products (Admin only)
   */
  async bulkIndexProducts(req: Request, res: Response): Promise<void> {
    try {
      const { products } = req.body;

      if (!Array.isArray(products) || products.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Products array is required and cannot be empty',
        });
        return;
      }

      // Validate each product
      const invalidProducts = products.filter(
        (product) => !product.id || !product.name || !product.price
      );

      if (invalidProducts.length > 0) {
        res.status(400).json({
          success: false,
          error: 'All products must have id, name, and price',
          invalidProducts: invalidProducts.length,
        });
        return;
      }

      await this.elasticsearchService.bulkIndexProducts(products);

      res.status(200).json({
        success: true,
        message: 'Products bulk indexed successfully',
        data: {
          total: products.length,
        },
      });

      logger.info('Products bulk indexed via API', {
        total: products.length,
        adminId: (req as any).user?.id,
      });
    } catch (error) {
      logger.error('Products bulk indexing via API failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        productCount: req.body.products?.length,
      });

      res.status(500).json({
        success: false,
        error: 'Bulk indexing failed',
      });
    }
  }

  /**
   * Get search analytics (Admin only)
   */
  async getSearchAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { startDate: startDateStr, endDate: endDateStr, period = '7d' } = req.query;

      let startDate: Date;
      let endDate: Date = new Date();

      if (startDateStr && endDateStr) {
        startDate = new Date(startDateStr as string);
        endDate = new Date(endDateStr as string);
      } else {
        // Default to last 7 days
        const days = period === '30d' ? 30 : period === '1d' ? 1 : 7;
        startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
      }

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        res.status(400).json({
          success: false,
          error: 'Invalid date format',
        });
        return;
      }

      const analytics = await this.elasticsearchService.getSearchAnalytics(startDate, endDate);

      res.status(200).json({
        success: true,
        data: {
          period: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
          ...analytics,
        },
      });
    } catch (error) {
      logger.error('Search analytics failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query,
      });

      res.status(500).json({
        success: false,
        error: 'Search analytics failed',
      });
    }
  }

  /**
   * Health check
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      // Simple health check - try to get cluster health
      const health = await this.elasticsearchService['client'].cluster.health();

      res.status(200).json({
        success: true,
        service: 'search-service',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        elasticsearch: {
          status: health.status,
          cluster: health.cluster_name,
          nodes: health.number_of_nodes,
        },
      });
    } catch (error) {
      logger.error('Search service health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(503).json({
        success: false,
        service: 'search-service',
        error: 'Elasticsearch connection failed',
      });
    }
  }

  /**
   * Get search suggestions for admin dashboard
   */
  async getSearchSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const { period = '7d' } = req.query;

      const days = period === '30d' ? 30 : period === '1d' ? 1 : 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const endDate = new Date();

      const analytics = await this.elasticsearchService.getSearchAnalytics(startDate, endDate);

      // Combine insights for admin dashboard
      const improvementSuggestions: Array<{
        type: string;
        message: string;
        action: string;
      }> = [];

      // Generate improvement suggestions
      if (analytics.noResultsQueries.length > 0) {
        improvementSuggestions.push({
          type: 'no_results',
          message: `${analytics.noResultsQueries.length} queries returned no results`,
          action: 'Consider adding products or improving search synonyms',
        });
      }

      if (analytics.averageResultsPerQuery < 5) {
        improvementSuggestions.push({
          type: 'low_results',
          message: `Average results per query is low (${analytics.averageResultsPerQuery})`,
          action: 'Review search configuration and product indexing',
        });
      }

      const suggestions = {
        popularQueries: analytics.topQueries.slice(0, 5),
        noResultsQueries: analytics.noResultsQueries.slice(0, 5),
        improvementSuggestions,
      };

      res.status(200).json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      logger.error('Search suggestions failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Search suggestions failed',
      });
    }
  }
}
