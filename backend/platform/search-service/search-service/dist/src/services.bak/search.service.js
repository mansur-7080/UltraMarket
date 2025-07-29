"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchService = exports.SearchService = void 0;
const elasticsearch_1 = require("@elastic/elasticsearch");
const shared_1 = require("@ultramarket/shared");
class SearchService {
    client;
    indexName;
    constructor() {
        this.client = new elasticsearch_1.Client({
            node: process.env['ELASTICSEARCH_URL'] || 'http://localhost:9200',
            auth: process.env['ELASTICSEARCH_USERNAME']
                ? {
                    username: process.env['ELASTICSEARCH_USERNAME'],
                    password: process.env['ELASTICSEARCH_PASSWORD'] || '',
                }
                : undefined,
        });
        this.indexName = process.env['ELASTICSEARCH_INDEX_PREFIX']
            ? `${process.env['ELASTICSEARCH_INDEX_PREFIX']}-products`
            : 'ultramarket-products';
    }
    async searchProducts(query) {
        try {
            const startTime = Date.now();
            const page = query.page || 1;
            const limit = Math.min(query.limit || 20, 100);
            const from = (page - 1) * limit;
            const body = this.buildSearchQuery(query);
            body.from = from;
            body.size = limit;
            body.aggs = this.buildAggregations();
            body.sort = this.buildSorting(query.sortBy);
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
            shared_1.logger.info('Executing product search', {
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
            const products = response.body.hits.hits.map((hit) => ({
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
        }
        catch (error) {
            shared_1.logger.error('Product search failed', error);
            throw new Error('Search service unavailable');
        }
    }
    async autocomplete(query, limit = 10) {
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
            const suggestions = [];
            if (response.body.suggest?.product_suggest?.[0]?.options) {
                response.body.suggest.product_suggest[0].options.forEach((option) => {
                    suggestions.push(option.text);
                });
            }
            response.body.hits.hits.forEach((hit) => {
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
            suggestions.sort((a, b) => b.score - a.score);
            return {
                query,
                suggestions: suggestions.slice(0, limit),
            };
        }
        catch (error) {
            shared_1.logger.error('Autocomplete search failed', error);
            return { query, suggestions: [] };
        }
    }
    async indexProduct(product) {
        try {
            const searchDocument = this.transformProductForSearch(product);
            await this.client.index({
                index: this.indexName,
                id: product.id,
                body: searchDocument,
            });
            shared_1.logger.debug('Product indexed successfully', { productId: product.id });
        }
        catch (error) {
            shared_1.logger.error('Product indexing failed', { productId: product.id, error });
            throw error;
        }
    }
    async bulkIndexProducts(products) {
        try {
            if (products.length === 0)
                return;
            const body = products.flatMap((product) => [
                { index: { _index: this.indexName, _id: product.id } },
                this.transformProductForSearch(product),
            ]);
            const response = await this.client.bulk({
                body,
                refresh: true,
            });
            const errors = response.body.items.filter((item) => item.index?.error || item.create?.error || item.update?.error);
            if (errors.length > 0) {
                shared_1.logger.error('Bulk indexing errors', { errors: errors.length, total: products.length });
            }
            else {
                shared_1.logger.info('Products bulk indexed successfully', { count: products.length });
            }
        }
        catch (error) {
            shared_1.logger.error('Bulk indexing failed', error);
            throw error;
        }
    }
    async removeProduct(productId) {
        try {
            await this.client.delete({
                index: this.indexName,
                id: productId,
            });
            shared_1.logger.debug('Product removed from index', { productId });
        }
        catch (error) {
            if (error.statusCode !== 404) {
                shared_1.logger.error('Product removal failed', { productId, error });
                throw error;
            }
        }
    }
    async getSearchAnalytics(dateRange) {
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
        }
        catch (error) {
            shared_1.logger.error('Search analytics failed', error);
            return {
                topQueries: [],
                zeroResultQueries: [],
                avgResults: 0,
                avgResponseTime: 0,
            };
        }
    }
    buildSearchQuery(query) {
        const must = [];
        const filter = [];
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
        }
        else {
            must.push({ match_all: {} });
        }
        filter.push({ term: { status: 'active' } });
        if (query.category) {
            filter.push({ term: { 'category.id': query.category } });
        }
        if (query.brand) {
            filter.push({ term: { 'brand.id': query.brand } });
        }
        if (query.minPrice || query.maxPrice) {
            const priceRange = {};
            if (query.minPrice)
                priceRange.gte = query.minPrice;
            if (query.maxPrice)
                priceRange.lte = query.maxPrice;
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
        if (query.filters) {
            Object.entries(query.filters).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    filter.push({ terms: { [key]: value } });
                }
                else {
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
    buildAggregations() {
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
    buildSorting(sortBy) {
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
    transformProductForSearch(product) {
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
    parseAggregations(aggs) {
        if (!aggs)
            return undefined;
        return {
            categories: aggs.categories?.buckets?.map((bucket) => ({
                key: bucket.key,
                count: bucket.doc_count,
            })) || [],
            brands: aggs.brands?.buckets?.map((bucket) => ({
                key: bucket.key,
                count: bucket.doc_count,
            })) || [],
            priceRanges: aggs.price_ranges?.buckets?.map((bucket) => ({
                key: bucket.key,
                count: bucket.doc_count,
                min: bucket.from || 0,
                max: bucket.to || Infinity,
            })) || [],
            ratings: aggs.ratings?.buckets?.map((bucket) => ({
                key: bucket.key,
                count: bucket.doc_count,
            })) || [],
        };
    }
    async generateSuggestions(query) {
        if (!query)
            return [];
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
            return (response.body.suggest?.simple_phrase?.[0]?.options?.map((option) => option.text) || []);
        }
        catch (error) {
            shared_1.logger.error('Suggestion generation failed', error);
            return [];
        }
    }
    parseAnalytics(aggs) {
        return {
            topQueries: aggs.top_queries?.buckets?.map((bucket) => ({
                query: bucket.key,
                count: bucket.doc_count,
            })) || [],
            zeroResultQueries: aggs.zero_results?.queries?.buckets?.map((bucket) => ({
                query: bucket.key,
                count: bucket.doc_count,
            })) || [],
            avgResults: 0,
            avgResponseTime: 0,
        };
    }
    async initializeIndex() {
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
                shared_1.logger.info('Search index created successfully', { index: this.indexName });
            }
        }
        catch (error) {
            shared_1.logger.error('Failed to initialize search index', error);
            throw error;
        }
    }
}
exports.SearchService = SearchService;
exports.searchService = new SearchService();
//# sourceMappingURL=search.service.js.map