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
        categories: Array<{
            key: string;
            count: number;
        }>;
        brands: Array<{
            key: string;
            count: number;
        }>;
        priceRanges: Array<{
            key: string;
            count: number;
            min: number;
            max: number;
        }>;
        ratings: Array<{
            key: number;
            count: number;
        }>;
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
        total: {
            value: number;
        };
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
        buckets: Array<{
            key: string;
            doc_count: number;
        }>;
    };
    brands?: {
        buckets: Array<{
            key: string;
            doc_count: number;
        }>;
    };
    price_ranges?: {
        buckets: Array<{
            key: string;
            doc_count: number;
            from?: number;
            to?: number;
        }>;
    };
    ratings?: {
        buckets: Array<{
            key: number;
            doc_count: number;
        }>;
    };
    top_queries?: {
        buckets: Array<{
            key: string;
            doc_count: number;
        }>;
    };
    zero_results?: {
        queries?: {
            buckets: Array<{
                key: string;
                doc_count: number;
            }>;
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
    topQueries: Array<{
        query: string;
        count: number;
    }>;
    zeroResultQueries: Array<{
        query: string;
        count: number;
    }>;
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
    range?: Record<string, {
        gte?: number;
        lte?: number;
    }>;
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
    [field: string]: {
        order: 'asc' | 'desc';
    };
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
export declare class SearchService {
    private client;
    private indexName;
    constructor();
    searchProducts(query: SearchQuery): Promise<SearchResult>;
    autocomplete(query: string, limit?: number): Promise<AutocompleteResult>;
    indexProduct(product: ProductToIndex): Promise<void>;
    bulkIndexProducts(products: ProductToIndex[]): Promise<void>;
    removeProduct(productId: string): Promise<void>;
    getSearchAnalytics(dateRange: {
        from: Date;
        to: Date;
    }): Promise<SearchAnalytics>;
    private buildSearchQuery;
    private buildAggregations;
    private buildSorting;
    private transformProductForSearch;
    private parseAggregations;
    private generateSuggestions;
    private parseAnalytics;
    initializeIndex(): Promise<void>;
}
export declare const searchService: SearchService;
//# sourceMappingURL=search.service.d.ts.map