import { Client } from '@elastic/elasticsearch';
import { logger, createError } from '@ultramarket/shared';

export interface SearchQuery {
  q?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  availability?: 'in-stock' | 'out-of-stock' | 'all';
  sortBy?: 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'newest';
  page?: number;
  limit?: number;
  filters?: Record<string, string | number | boolean | Array<string | number>>;
}

export interface SearchResult {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  products: ProductSearchResult[];
  aggregations?: {
    categories: Array<{ key: string; count: number }>;
    brands: Array<{ key: string; count: number }>;
    priceRanges: Array<{ key: string; count: number; min: number; max: number }>;
    ratings: Array<{ key: number; count: number }>;
  };
  suggestions?: string[];
  searchTime: number;
}

export interface ProductSearchResult {
  id: string;
  name: string;
  description: string;
  price: {
    current: number;
    original?: number;
    currency: string;
  };
  images: {
    primary: string;
    thumbnails: string[];
  };
  rating: {
    average: number;
    count: number;
  };
  category: {
    id: string;
    name: string;
    path: string[];
  };
  brand: {
    id: string;
    name: string;
  };
  availability: {
    inStock: boolean;
    quantity: number;
  };
  tags: string[];
  highlights?: Record<string, string[]>;
  score?: number;
}

export interface AutocompleteResult {
  query: string;
  suggestions: Array<{
    text: string;
    type: 'product' | 'category' | 'brand';
    score: number;
    metadata?: ProductMetadata;
  }>;
}

export interface ProductMetadata {
  id?: string;
  name?: string;
  category?: {
    id: string;
    name: string;
  };
  brand?: {
    id: string;
    name: string;
  };
}

export interface ElasticsearchHit {
  _id: string;
  _score: number;
  _source: ProductSearchResult;
  highlight?: Record<string, string[]>;
}

export interface ElasticsearchResponse {
  hits: {
    total: { value: number };
    hits: ElasticsearchHit[];
  };
  aggregations?: ElasticsearchAggregations;
  suggest?: {
    product_suggest: Array<{
      options: Array<{
        text: string;
        _score: number;
        _source: ProductMetadata;
      }>;
    }>;
  };
}

export interface ElasticsearchAggregations {
  categories?: {
    buckets: Array<{ key: string; doc_count: number }>;
  };
  brands?: {
    buckets: Array<{ key: string; doc_count: number }>;
  };
  price_ranges?: {
    buckets: Array<{ key: string; doc_count: number; from?: number; to?: number }>;
  };
  ratings?: {
    buckets: Array<{ key: number; doc_count: number }>;
  };
  top_queries?: {
    buckets: Array<{ key: string; doc_count: number }>;
  };
  zero_results?: {
    queries?: {
      buckets: Array<{ key: string; doc_count: number }>;
    };
  };
}

export interface ProductToIndex {
  id: string;
  name: string;
  description: string;
  price: {
    current: number;
    original?: number;
    currency: string;
  };
  category: {
    id: string;
    name: string;
    path: string[];
  };
  brand: {
    id: string;
    name: string;
  };
  availability: {
    inStock: boolean;
    quantity: number;
  };
  rating: {
    average: number;
    count: number;
  };
  images: {
    primary: string;
    thumbnails: string[];
  };
  tags: string[];
  specifications: Record<string, string | number>;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchAnalytics {
  topQueries: Array<{ query: string; count: number }>;
  zeroResultQueries: Array<{ query: string; count: number }>;
  avgResults: number;
  avgResponseTime: number;
}

export interface ElasticsearchQuery {
  query: {
    bool: {
      must: ElasticsearchQueryClause[];
      filter: ElasticsearchQueryClause[];
    };
  };
}

export interface ElasticsearchQueryClause {
  multi_match?: {
    query: string;
    fields: string[];
    type: string;
    fuzziness: string;
    operator: string;
  };
  match_all?: {};
  term?: Record<string, string | boolean>;
  terms?: Record<string, Array<string | number>>;
  range?: Record<string, { gte?: number; lte?: number }>;
}

export interface ElasticsearchAggregation {
  terms?: {
    field: string;
    size: number;
  };
  range?: {
    field: string;
    ranges: Array<{
      key: string;
      from?: number;
      to?: number;
    }>;
  };
  aggs?: Record<string, ElasticsearchAggregation>;
}

export interface ElasticsearchSort {
  [field: string]: { order: 'asc' | 'desc' };
}

export interface SearchDocument extends ProductToIndex {
  suggest: {
    input: string[];
    contexts: {
      status: string[];
      category: string[];
      brand: string[];
    };
  };
}

export class SearchService {
  private client: Client;
  private indexName: string;

  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      auth: process.env.ELASTICSEARCH_USERNAME
        ? {
            username: process.env.ELASTICSEARCH_USERNAME,
            password: process.env.ELASTICSEARCH_PASSWORD || '',
          }
        : undefined,
    });
    this.indexName = process.env.ELASTICSEARCH_INDEX_PREFIX
      ? `${process.env.ELASTICSEARCH_INDEX_PREFIX}-products`
      : 'ultramarket-products';
  }

  /**
   * Search products with advanced filtering and aggregations
   */
  async searchProducts(query: SearchQuery): Promise<SearchResult> {
    try {
      const startTime = Date.now();
      const page = query.page || 1;
      const limit = Math.min(query.limit || 20, 100);
      const from = (page - 1) * limit;

      // Build Elasticsearch query
      const body = this.buildSearchQuery(query);
      body.from = from;
      body.size = limit;

      // Add aggregations
      body.aggs = this.buildAggregations();

      // Add sorting
      body.sort = this.buildSorting(query.sortBy);

      // Add highlighting
      body.highlight = {
        fields: {
          name: { fragment_size: 150, number_of_fragments: 1 },
          description: { fragment_size: 200, number_of_fragments: 2 },
          'category.name': {},
          'brand.name': {},
        },
        pre_tags: ['<mark>'],
        post_tags: ['</mark>'],
      };

      logger.info('Executing product search', {
        query: query.q,
        filters: Object.keys(query).filter((k) => k !== 'q'),
        page,
        limit,
      });

      const response = await this.client.search({
        index: this.indexName,
        body,
      });

      const searchTime = Date.now() - startTime;
      const total = response.body.hits.total.value;
      const totalPages = Math.ceil(total / limit);

      const products = response.body.hits.hits.map((hit: ElasticsearchHit) => ({
        ...hit._source,
        id: hit._id,
        score: hit._score,
        highlights: hit.highlight,
      }));

      const aggregations = this.parseAggregations(response.body.aggregations);
      const suggestions = await this.generateSuggestions(query.q);

      return {
        total,
        page,
        limit,
        totalPages,
        products,
        aggregations,
        suggestions,
        searchTime,
      };
    } catch (error) {
      logger.error('Product search failed', error);
      throw createError(500, 'Search service unavailable');
    }
  }

  /**
   * Autocomplete search for instant suggestions
   */
  async autocomplete(query: string, limit = 10): Promise<AutocompleteResult> {
    try {
      if (!query || query.length < 2) {
        return { query, suggestions: [] };
      }

      const body = {
        suggest: {
          product_suggest: {
            prefix: query.toLowerCase(),
            completion: {
              field: 'suggest',
              size: limit,
              contexts: {
                status: ['active'],
              },
            },
          },
        },
        query: {
          bool: {
            should: [
              {
                match_phrase_prefix: {
                  name: {
                    query,
                    boost: 3,
                  },
                },
              },
              {
                match_phrase_prefix: {
                  'category.name': {
                    query,
                    boost: 2,
                  },
                },
              },
              {
                match_phrase_prefix: {
                  'brand.name': {
                    query,
                    boost: 2,
                  },
                },
              },
            ],
            filter: [{ term: { status: 'active' } }, { term: { 'availability.inStock': true } }],
          },
        },
        _source: ['name', 'category.name', 'brand.name'],
        size: limit,
      };

      const response = await this.client.search({
        index: this.indexName,
        body,
      });

      const suggestions: string[] = [];

      // Add completion suggestions
      if (response.body.suggest?.product_suggest?.[0]?.options) {
        response.body.suggest.product_suggest[0].options.forEach(
          (option: { text: string; _score: number; _source: unknown }) => {
            suggestions.push(option.text);
          }
        );
      }

      // Add search result suggestions
      response.body.hits.hits.forEach((hit: any) => {
        const source = hit._source;

        if (!suggestions.find((s) => s.text === source.name)) {
          suggestions.push({
            text: source.name,
            type: 'product',
            score: hit._score,
            metadata: source,
          });
        }

        if (!suggestions.find((s) => s.text === source.category.name)) {
          suggestions.push({
            text: source.category.name,
            type: 'category',
            score: hit._score * 0.8,
            metadata: source.category,
          });
        }

        if (!suggestions.find((s) => s.text === source.brand.name)) {
          suggestions.push({
            text: source.brand.name,
            type: 'brand',
            score: hit._score * 0.8,
            metadata: source.brand,
          });
        }
      });

      // Sort by score and limit
      suggestions.sort((a, b) => b.score - a.score);

      return {
        query,
        suggestions: suggestions.slice(0, limit),
      };
    } catch (error) {
      logger.error('Autocomplete search failed', error);
      return { query, suggestions: [] };
    }
  }

  /**
   * Index a product for search
   */
  async indexProduct(product: ProductToIndex): Promise<void> {
    try {
      const searchDocument = this.transformProductForSearch(product);

      await this.client.index({
        index: this.indexName,
        id: product.id,
        body: searchDocument,
      });

      logger.debug('Product indexed successfully', { productId: product.id });
    } catch (error) {
      logger.error('Product indexing failed', { productId: product.id, error });
      throw error;
    }
  }

  /**
   * Bulk index products
   */
  async bulkIndexProducts(products: ProductToIndex[]): Promise<void> {
    try {
      if (products.length === 0) return;

      const body = products.flatMap((product) => [
        { index: { _index: this.indexName, _id: product.id } },
        this.transformProductForSearch(product),
      ]);

      const response = await this.client.bulk({
        body,
        refresh: true,
      });

      const errors = response.body.items.filter(
        (item: {
          index?: { error?: unknown };
          create?: { error?: unknown };
          update?: { error?: unknown };
        }) => item.index?.error || item.create?.error || item.update?.error
      );

      if (errors.length > 0) {
        logger.error('Bulk indexing errors', { errors: errors.length, total: products.length });
      } else {
        logger.info('Products bulk indexed successfully', { count: products.length });
      }
    } catch (error) {
      logger.error('Bulk indexing failed', error);
      throw error;
    }
  }

  /**
   * Remove product from search index
   */
  async removeProduct(productId: string): Promise<void> {
    try {
      await this.client.delete({
        index: this.indexName,
        id: productId,
      });

      logger.debug('Product removed from index', { productId });
    } catch (error) {
      if (error.statusCode !== 404) {
        logger.error('Product removal failed', { productId, error });
        throw error;
      }
    }
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(dateRange: { from: Date; to: Date }): Promise<SearchAnalytics> {
    try {
      const response = await this.client.search({
        index: 'search-analytics',
        body: {
          query: {
            range: {
              timestamp: {
                gte: dateRange.from.toISOString(),
                lte: dateRange.to.toISOString(),
              },
            },
          },
          aggs: {
            top_queries: {
              terms: {
                field: 'query.keyword',
                size: 20,
              },
            },
            zero_results: {
              filter: {
                term: { resultCount: 0 },
              },
              aggs: {
                queries: {
                  terms: {
                    field: 'query.keyword',
                    size: 10,
                  },
                },
              },
            },
            avg_results: {
              avg: {
                field: 'resultCount',
              },
            },
            avg_response_time: {
              avg: {
                field: 'responseTime',
              },
            },
          },
          size: 0,
        },
      });

      return this.parseAnalytics(response.body.aggregations);
    } catch (error) {
      logger.error('Search analytics failed', error);
      return {
        topQueries: [],
        zeroResultQueries: [],
        avgResults: 0,
        avgResponseTime: 0,
      };
    }
  }

  /**
   * Build Elasticsearch query from search parameters
   */
  private buildSearchQuery(query: SearchQuery): ElasticsearchQuery {
    const must: ElasticsearchQueryClause[] = [];
    const filter: ElasticsearchQueryClause[] = [];

    // Text search
    if (query.q) {
      must.push({
        multi_match: {
          query: query.q,
          fields: [
            'name^3',
            'description^2',
            'category.name^2',
            'brand.name^2',
            'tags',
            'specifications.*',
          ],
          type: 'best_fields',
          fuzziness: 'AUTO',
          operator: 'and',
        },
      });
    } else {
      must.push({ match_all: {} });
    }

    // Filters
    filter.push({ term: { status: 'active' } });

    if (query.category) {
      filter.push({ term: { 'category.id': query.category } });
    }

    if (query.brand) {
      filter.push({ term: { 'brand.id': query.brand } });
    }

    if (query.minPrice || query.maxPrice) {
      const priceRange: { gte?: number; lte?: number } = {};
      if (query.minPrice) priceRange.gte = query.minPrice;
      if (query.maxPrice) priceRange.lte = query.maxPrice;
      filter.push({ range: { 'price.current': priceRange } });
    }

    if (query.rating) {
      filter.push({ range: { 'rating.average': { gte: query.rating } } });
    }

    if (query.availability && query.availability !== 'all') {
      filter.push({
        term: {
          'availability.inStock': query.availability === 'in-stock',
        },
      });
    }

    // Custom filters
    if (query.filters) {
      Object.entries(query.filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          filter.push({ terms: { [key]: value } });
        } else {
          filter.push({ term: { [key]: value } });
        }
      });
    }

    return {
      query: {
        bool: {
          must,
          filter,
        },
      },
    };
  }

  /**
   * Build aggregations for faceted search
   */
  private buildAggregations(): Record<string, ElasticsearchAggregation> {
    return {
      categories: {
        terms: {
          field: 'category.id',
          size: 50,
        },
        aggs: {
          category_names: {
            terms: {
              field: 'category.name.keyword',
              size: 1,
            },
          },
        },
      },
      brands: {
        terms: {
          field: 'brand.id',
          size: 50,
        },
        aggs: {
          brand_names: {
            terms: {
              field: 'brand.name.keyword',
              size: 1,
            },
          },
        },
      },
      price_ranges: {
        range: {
          field: 'price.current',
          ranges: [
            { key: '0-50', to: 50 },
            { key: '50-100', from: 50, to: 100 },
            { key: '100-500', from: 100, to: 500 },
            { key: '500+', from: 500 },
          ],
        },
      },
      ratings: {
        terms: {
          field: 'rating.average',
          size: 5,
        },
      },
    };
  }

  /**
   * Build sorting configuration
   */
  private buildSorting(sortBy?: string): ElasticsearchSort[] {
    switch (sortBy) {
      case 'price-asc':
        return [{ 'price.current': { order: 'asc' } }];
      case 'price-desc':
        return [{ 'price.current': { order: 'desc' } }];
      case 'rating':
        return [{ 'rating.average': { order: 'desc' } }];
      case 'newest':
        return [{ createdAt: { order: 'desc' } }];
      default:
        return [{ _score: { order: 'desc' } }];
    }
  }

  /**
   * Transform product for search indexing
   */
  private transformProductForSearch(product: ProductToIndex): SearchDocument {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      brand: product.brand,
      availability: product.availability,
      rating: product.rating,
      images: product.images,
      tags: product.tags,
      specifications: product.specifications,
      status: product.status,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      suggest: {
        input: [product.name, product.brand.name, product.category.name, ...product.tags],
        contexts: {
          status: [product.status],
          category: [product.category.id],
          brand: [product.brand.id],
        },
      },
    };
  }

  /**
   * Parse Elasticsearch aggregations
   */
  private parseAggregations(aggs: ElasticsearchAggregations): SearchResult['aggregations'] {
    if (!aggs) return undefined;

    return {
      categories:
        aggs.categories?.buckets?.map((bucket) => ({
          key: bucket.key,
          count: bucket.doc_count,
        })) || [],
      brands:
        aggs.brands?.buckets?.map((bucket) => ({
          key: bucket.key,
          count: bucket.doc_count,
        })) || [],
      priceRanges:
        aggs.price_ranges?.buckets?.map((bucket) => ({
          key: bucket.key,
          count: bucket.doc_count,
          min: bucket.from || 0,
          max: bucket.to || Infinity,
        })) || [],
      ratings:
        aggs.ratings?.buckets?.map((bucket) => ({
          key: bucket.key,
          count: bucket.doc_count,
        })) || [],
    };
  }

  /**
   * Generate search suggestions
   */
  private async generateSuggestions(query?: string): Promise<string[]> {
    if (!query) return [];

    try {
      const response = await this.client.search({
        index: this.indexName,
        body: {
          suggest: {
            text: query,
            simple_phrase: {
              phrase: {
                field: 'name',
                size: 5,
                gram_size: 2,
                direct_generator: [
                  {
                    field: 'name',
                    suggest_mode: 'missing',
                  },
                ],
              },
            },
          },
        },
      });

      return (
        response.body.suggest?.simple_phrase?.[0]?.options?.map(
          (option: { text: string }) => option.text
        ) || []
      );
    } catch (error) {
      logger.error('Suggestion generation failed', error);
      return [];
    }
  }

  /**
   * Parse search analytics
   */
  private parseAnalytics(aggs: ElasticsearchAggregations): SearchAnalytics {
    return {
      topQueries:
        aggs.top_queries?.buckets?.map((bucket) => ({
          query: bucket.key,
          count: bucket.doc_count,
        })) || [],
      zeroResultQueries:
        aggs.zero_results?.queries?.buckets?.map((bucket) => ({
          query: bucket.key,
          count: bucket.doc_count,
        })) || [],
      avgResults: 0,
      avgResponseTime: 0,
    };
  }

  /**
   * Initialize search index
   */
  async initializeIndex(): Promise<void> {
    try {
      const indexExists = await this.client.indices.exists({
        index: this.indexName,
      });

      if (!indexExists.body) {
        await this.client.indices.create({
          index: this.indexName,
          body: {
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
                },
              },
            },
            mappings: {
              properties: {
                name: {
                  type: 'text',
                  analyzer: 'custom_text',
                  fields: {
                    keyword: { type: 'keyword' },
                    suggest: { type: 'completion' },
                  },
                },
                description: {
                  type: 'text',
                  analyzer: 'custom_text',
                },
                'category.name': {
                  type: 'text',
                  fields: { keyword: { type: 'keyword' } },
                },
                'brand.name': {
                  type: 'text',
                  fields: { keyword: { type: 'keyword' } },
                },
                'price.current': { type: 'float' },
                'rating.average': { type: 'float' },
                'rating.count': { type: 'integer' },
                'rating.rounded': { type: 'integer' },
                status: { type: 'keyword' },
                suggest: {
                  type: 'completion',
                  contexts: [
                    {
                      name: 'status',
                      type: 'category',
                    },
                  ],
                },
              },
            },
          },
        });

        logger.info('Search index created successfully', { index: this.indexName });
      }
    } catch (error) {
      logger.error('Failed to initialize search index', error);
      throw error;
    }
  }
}

export const searchService = new SearchService();
