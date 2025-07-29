import { Client } from '@elastic/elasticsearch';
import { logger } from '@ultramarket/shared';

export interface SearchQuery {
  query?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest';
  page?: number;
  limit?: number;
  filters?: Record<string, any>;
}

export interface SearchResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  aggregations: SearchAggregations;
  suggestions: string[];
  took: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  brand: string;
  images: string[];
  rating: {
    average: number;
    count: number;
  };
  inStock: boolean;
  tags: string[];
  highlights?: Record<string, string[]>;
  score?: number;
}

export interface SearchAggregations {
  categories: Array<{ key: string; doc_count: number }>;
  brands: Array<{ key: string; doc_count: number }>;
  priceRanges: Array<{ key: string; doc_count: number; from?: number; to?: number }>;
  ratings: Array<{ key: number; doc_count: number }>;
  attributes: Record<string, Array<{ key: string; doc_count: number }>>;
}

export interface SearchSuggestion {
  text: string;
  type: 'product' | 'category' | 'brand';
  score: number;
}

export interface SearchClickData {
  query: string;
  productId: string;
  position: number;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
}

export interface SearchAnalyticsOptions {
  groupBy: string;
  metrics: string[];
}

export interface BulkIndexResult {
  indexed: number;
  errors: number;
  details?: any[];
}

export interface SearchFilters {
  category?: string;
  brand?: string;
}

export class ElasticsearchService {
  private client: Client;
  private productIndex: string;
  private searchLogIndex: string;

  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      auth:
        process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD
          ? {
              username: process.env.ELASTICSEARCH_USERNAME,
              password: process.env.ELASTICSEARCH_PASSWORD,
            }
          : undefined,
      requestTimeout: 30000,
      pingTimeout: 3000,
    });

    this.productIndex = `${process.env.ELASTICSEARCH_INDEX_PREFIX || 'ultramarket'}-products`;
    this.searchLogIndex = `${process.env.ELASTICSEARCH_INDEX_PREFIX || 'ultramarket'}-search-logs`;

    this.initializeConnection();
  }

  private async initializeConnection(): Promise<void> {
    try {
      await this.client.ping();
      logger.info('Elasticsearch connection established');
      await this.initializeIndices();
    } catch (error) {
      logger.error('Failed to connect to Elasticsearch', { error });
      throw error;
    }
  }

  private async initializeIndices(): Promise<void> {
    try {
      // Check if product index exists
      const productExists = await this.client.indices.exists({
        index: this.productIndex,
      });

      if (!productExists.body) {
        await this.createProductIndex();
      }

      // Check if search log index exists
      const logExists = await this.client.indices.exists({
        index: this.searchLogIndex,
      });

      if (!logExists.body) {
        await this.createSearchLogIndex();
      }
    } catch (error) {
      logger.error('Failed to initialize indices', { error });
      throw error;
    }
  }

  private async createProductIndex(): Promise<void> {
    const indexConfig = {
      settings: {
        number_of_shards: 2,
        number_of_replicas: 1,
        analysis: {
          analyzer: {
            custom_text: {
              type: 'custom',
              tokenizer: 'standard',
              filter: ['lowercase', 'stop', 'stemmer'],
            },
            autocomplete: {
              type: 'custom',
              tokenizer: 'standard',
              filter: ['lowercase', 'autocomplete_filter'],
            },
          },
          filter: {
            autocomplete_filter: {
              type: 'edge_ngram',
              min_gram: 2,
              max_gram: 20,
            },
          },
        },
      },
      mappings: {
        properties: {
          id: { type: 'keyword' },
          name: {
            type: 'text',
            analyzer: 'custom_text',
            fields: {
              keyword: { type: 'keyword' },
              autocomplete: { type: 'text', analyzer: 'autocomplete' },
            },
          },
          description: {
            type: 'text',
            analyzer: 'custom_text',
          },
          sku: { type: 'keyword' },
          price: { type: 'double' },
          originalPrice: { type: 'double' },
          currency: { type: 'keyword' },
          category: {
            type: 'nested',
            properties: {
              id: { type: 'keyword' },
              name: { type: 'text', fields: { keyword: { type: 'keyword' } } },
              slug: { type: 'keyword' },
            },
          },
          brand: { type: 'keyword' },
          images: { type: 'keyword' },
          rating: {
            properties: {
              average: { type: 'float' },
              count: { type: 'integer' },
            },
          },
          inStock: { type: 'boolean' },
          tags: { type: 'keyword' },
          attributes: {
            type: 'nested',
            properties: {
              name: { type: 'keyword' },
              value: { type: 'text' },
            },
          },
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' },
        },
      },
    };

    await this.client.indices.create({
      index: this.productIndex,
      body: indexConfig,
    });

    logger.info(`Created product index: ${this.productIndex}`);
  }

  private async createSearchLogIndex(): Promise<void> {
    const indexConfig = {
      settings: {
        number_of_shards: 1,
        number_of_replicas: 0,
      },
      mappings: {
        properties: {
          query: { type: 'text' },
          category: { type: 'keyword' },
          brand: { type: 'keyword' },
          min_price: { type: 'double' },
          max_price: { type: 'double' },
          sort_by: { type: 'keyword' },
          results_count: { type: 'integer' },
          user_id: { type: 'keyword' },
          session_id: { type: 'keyword' },
          timestamp: { type: 'date' },
          clicked_products: { type: 'keyword' },
          ip_address: { type: 'ip' },
          user_agent: { type: 'text' },
        },
      },
    };

    await this.client.indices.create({
      index: this.searchLogIndex,
      body: indexConfig,
    });

    logger.info(`Created search log index: ${this.searchLogIndex}`);
  }

  /**
   * Search products with advanced filtering
   */
  async searchProducts(searchQuery: SearchQuery, userId?: string): Promise<SearchResponse> {
    try {
      const startTime = Date.now();

      // Build Elasticsearch query
      const esQuery = this.buildSearchQuery(searchQuery);

      // Execute search
      const response = await this.client.search({
        index: this.productIndex,
        body: esQuery,
      });

      // Parse results
      const searchResponse = this.parseSearchResponse(response, searchQuery);
      searchResponse.took = Date.now() - startTime;

      // Log search query for analytics
      await this.logSearchQuery(searchQuery, searchResponse.total, userId);

      logger.info('Product search completed', {
        query: searchQuery.query,
        total: searchResponse.total,
        took: searchResponse.took,
        userId,
      });

      return searchResponse;
    } catch (error) {
      logger.error('Product search failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: searchQuery,
      });
      throw new Error('Search operation failed');
    }
  }

  /**
   * Get search suggestions
   */
  async getSearchSuggestions(query: string, limit: number = 10): Promise<SearchSuggestion[]> {
    try {
      const response = await this.client.search({
        index: this.productIndex,
        body: {
          suggest: {
            product_suggest: {
              prefix: query,
              completion: {
                field: 'name.autocomplete',
                size: limit,
                skip_duplicates: true,
              },
            },
          },
          _source: false,
        },
      });

      const suggestions: SearchSuggestion[] = [];

      if (response.body.suggest?.product_suggest?.[0]?.options) {
        response.body.suggest.product_suggest[0].options.forEach((option: any) => {
          suggestions.push({
            text: option.text,
            type: 'product',
            score: option._score || 1,
          });
        });
      }

      return suggestions;
    } catch (error) {
      logger.error('Failed to get search suggestions', { error, query });
      return [];
    }
  }

  /**
   * Get popular search queries
   */
  async getPopularQueries(
    limit: number = 20,
    timeframe: string = '7d'
  ): Promise<Array<{ query: string; count: number }>> {
    try {
      const response = await this.client.search({
        index: this.searchLogIndex,
        body: {
          query: {
            range: {
              timestamp: {
                gte: `now-${timeframe}`,
              },
            },
          },
          aggs: {
            popular_queries: {
              terms: {
                field: 'query.keyword',
                size: limit,
                order: { _count: 'desc' },
              },
            },
          },
          size: 0,
        },
      });

      return (
        response.body.aggregations?.popular_queries?.buckets?.map((bucket: any) => ({
          query: bucket.key,
          count: bucket.doc_count,
        })) || []
      );
    } catch (error) {
      logger.error('Failed to get popular queries', { error });
      return [];
    }
  }

  /**
   * Get search filters
   */
  async getSearchFilters(filters: SearchFilters): Promise<SearchAggregations> {
    try {
      const filterQuery: any = {
        bool: {
          must: [{ term: { inStock: true } }],
        },
      };

      if (filters.category) {
        filterQuery.bool.must.push({ term: { 'category.id': filters.category } });
      }

      if (filters.brand) {
        filterQuery.bool.must.push({ term: { brand: filters.brand } });
      }

      const response = await this.client.search({
        index: this.productIndex,
        body: {
          query: filterQuery,
          aggs: {
            categories: {
              nested: { path: 'category' },
              aggs: {
                category_names: {
                  terms: { field: 'category.name.keyword', size: 50 },
                },
              },
            },
            brands: {
              terms: { field: 'brand', size: 50 },
            },
            price_ranges: {
              range: {
                field: 'price',
                ranges: [
                  { key: 'under_100', to: 100 },
                  { key: '100_500', from: 100, to: 500 },
                  { key: '500_1000', from: 500, to: 1000 },
                  { key: '1000_5000', from: 1000, to: 5000 },
                  { key: 'over_5000', from: 5000 },
                ],
              },
            },
            ratings: {
              range: {
                field: 'rating.average',
                ranges: [
                  { key: '4_and_up', from: 4 },
                  { key: '3_and_up', from: 3 },
                  { key: '2_and_up', from: 2 },
                  { key: '1_and_up', from: 1 },
                ],
              },
            },
          },
          size: 0,
        },
      });

      return this.parseAggregations(response.body.aggregations);
    } catch (error) {
      logger.error('Failed to get search filters', { error });
      throw error;
    }
  }

  /**
   * Track search click
   */
  async trackSearchClick(clickData: SearchClickData): Promise<void> {
    try {
      await this.client.index({
        index: `${this.searchLogIndex}-clicks`,
        body: {
          query: clickData.query,
          product_id: clickData.productId,
          position: clickData.position,
          user_id: clickData.userId,
          session_id: clickData.sessionId,
          timestamp: clickData.timestamp,
        },
      });

      logger.debug('Search click tracked', clickData);
    } catch (error) {
      logger.error('Failed to track search click', { error, clickData });
    }
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(
    startDate: Date,
    endDate: Date,
    options: SearchAnalyticsOptions
  ): Promise<any> {
    try {
      const response = await this.client.search({
        index: this.searchLogIndex,
        body: {
          query: {
            range: {
              timestamp: {
                gte: startDate.toISOString(),
                lte: endDate.toISOString(),
              },
            },
          },
          aggs: {
            analytics_by_date: {
              date_histogram: {
                field: 'timestamp',
                calendar_interval: options.groupBy === 'hour' ? 'hour' : 'day',
              },
              aggs: {
                unique_queries: {
                  cardinality: { field: 'query.keyword' },
                },
                total_searches: {
                  value_count: { field: 'query.keyword' },
                },
                zero_results: {
                  filter: { term: { results_count: 0 } },
                },
              },
            },
          },
          size: 0,
        },
      });

      return response.body.aggregations?.analytics_by_date?.buckets || [];
    } catch (error) {
      logger.error('Failed to get search analytics', { error });
      throw error;
    }
  }

  /**
   * Bulk index products
   */
  async bulkIndexProducts(products: Product[]): Promise<BulkIndexResult> {
    try {
      const body: any[] = [];

      products.forEach((product) => {
        body.push({ index: { _index: this.productIndex, _id: product.id } });
        body.push(product);
      });

      const response = await this.client.bulk({ body });

      const result: BulkIndexResult = {
        indexed: 0,
        errors: 0,
        details: [],
      };

      if (response.body.items) {
        response.body.items.forEach((item: any) => {
          if (item.index?.error) {
            result.errors++;
            result.details?.push(item.index.error);
          } else {
            result.indexed++;
          }
        });
      }

      logger.info('Bulk indexing completed', result);
      return result;
    } catch (error) {
      logger.error('Bulk indexing failed', { error });
      throw error;
    }
  }

  /**
   * Clear search index
   */
  async clearIndex(): Promise<void> {
    try {
      await this.client.indices.delete({
        index: this.productIndex,
        ignore_unavailable: true,
      });

      await this.createProductIndex();
      logger.warn('Search index cleared and recreated');
    } catch (error) {
      logger.error('Failed to clear search index', { error });
      throw error;
    }
  }

  /**
   * Get health status
   */
  async getHealthStatus(): Promise<any> {
    try {
      const [clusterHealth, indexStats] = await Promise.all([
        this.client.cluster.health(),
        this.client.indices.stats({ index: this.productIndex }),
      ]);

      return {
        cluster: clusterHealth.body,
        index: indexStats.body,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Failed to get health status', { error });
      throw error;
    }
  }

  // Private helper methods

  private buildSearchQuery(searchQuery: SearchQuery): any {
    const {
      query,
      category,
      brand,
      minPrice,
      maxPrice,
      rating,
      sortBy = 'relevance',
      page = 1,
      limit = 20,
      filters = {},
    } = searchQuery;

    const esQuery: any = {
      query: {
        bool: {
          must: [],
          filter: [],
        },
      },
      highlight: {
        fields: {
          name: {},
          description: {},
        },
      },
      aggs: {
        categories: {
          nested: { path: 'category' },
          aggs: {
            category_names: {
              terms: { field: 'category.name.keyword', size: 20 },
            },
          },
        },
        brands: {
          terms: { field: 'brand', size: 20 },
        },
        price_ranges: {
          range: {
            field: 'price',
            ranges: [
              { key: 'under_100', to: 100 },
              { key: '100_500', from: 100, to: 500 },
              { key: '500_1000', from: 500, to: 1000 },
              { key: '1000_5000', from: 1000, to: 5000 },
              { key: 'over_5000', from: 5000 },
            ],
          },
        },
      },
      from: (page - 1) * limit,
      size: limit,
    };

    // Text search
    if (query) {
      esQuery.query.bool.must.push({
        multi_match: {
          query,
          fields: ['name^3', 'description^2', 'brand^2', 'category.name', 'tags'],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    } else {
      esQuery.query.bool.must.push({
        match_all: {},
      });
    }

    // Filters
    esQuery.query.bool.filter.push({
      term: { inStock: true },
    });

    if (category) {
      esQuery.query.bool.filter.push({
        nested: {
          path: 'category',
          query: { term: { 'category.id': category } },
        },
      });
    }

    if (brand) {
      esQuery.query.bool.filter.push({
        term: { brand },
      });
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceRange: any = {};
      if (minPrice !== undefined) priceRange.gte = minPrice;
      if (maxPrice !== undefined) priceRange.lte = maxPrice;
      esQuery.query.bool.filter.push({
        range: { price: priceRange },
      });
    }

    if (rating) {
      esQuery.query.bool.filter.push({
        range: { 'rating.average': { gte: rating } },
      });
    }

    // Additional filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'inStock') {
          esQuery.query.bool.filter.push({ term: { inStock: value } });
        } else if (Array.isArray(value)) {
          esQuery.query.bool.filter.push({ terms: { [key]: value } });
        } else {
          esQuery.query.bool.filter.push({ term: { [key]: value } });
        }
      }
    });

    // Sorting
    if (sortBy !== 'relevance') {
      esQuery.sort = this.buildSortOrder(sortBy);
    }

    return esQuery;
  }

  private buildSortOrder(sortBy: string): any[] {
    switch (sortBy) {
      case 'price_asc':
        return [{ price: { order: 'asc' } }];
      case 'price_desc':
        return [{ price: { order: 'desc' } }];
      case 'rating':
        return [{ 'rating.average': { order: 'desc' } }];
      case 'newest':
        return [{ createdAt: { order: 'desc' } }];
      default:
        return [{ _score: { order: 'desc' } }];
    }
  }

  private parseSearchResponse(response: any, searchQuery: SearchQuery): SearchResponse {
    const hits = response.body.hits;
    const aggregations = response.body.aggregations;

    const products: Product[] = hits.hits.map((hit: any) => ({
      ...hit._source,
      score: hit._score,
      highlights: hit.highlight,
    }));

    return {
      products,
      total: hits.total.value,
      page: searchQuery.page || 1,
      limit: searchQuery.limit || 20,
      totalPages: Math.ceil(hits.total.value / (searchQuery.limit || 20)),
      aggregations: this.parseAggregations(aggregations),
      suggestions: [], // Will be filled by separate suggestion call
      took: 0, // Will be set by caller
    };
  }

  private parseAggregations(aggregations: any): SearchAggregations {
    const result: SearchAggregations = {
      categories: [],
      brands: [],
      priceRanges: [],
      ratings: [],
      attributes: {},
    };

    if (aggregations?.categories?.category_names?.buckets) {
      result.categories = aggregations.categories.category_names.buckets.map((bucket: any) => ({
        key: bucket.key,
        doc_count: bucket.doc_count,
      }));
    }

    if (aggregations?.brands?.buckets) {
      result.brands = aggregations.brands.buckets.map((bucket: any) => ({
        key: bucket.key,
        doc_count: bucket.doc_count,
      }));
    }

    if (aggregations?.price_ranges?.buckets) {
      result.priceRanges = aggregations.price_ranges.buckets.map((bucket: any) => ({
        key: bucket.key,
        doc_count: bucket.doc_count,
        from: bucket.from,
        to: bucket.to,
      }));
    }

    return result;
  }

  private async logSearchQuery(
    searchQuery: SearchQuery,
    resultsCount: number,
    userId?: string
  ): Promise<void> {
    try {
      if (!searchQuery.query) return;

      await this.client.index({
        index: this.searchLogIndex,
        body: {
          query: searchQuery.query,
          category: searchQuery.category,
          brand: searchQuery.brand,
          min_price: searchQuery.minPrice,
          max_price: searchQuery.maxPrice,
          sort_by: searchQuery.sortBy,
          results_count: resultsCount,
          user_id: userId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Failed to log search query', { error });
    }
  }
}
