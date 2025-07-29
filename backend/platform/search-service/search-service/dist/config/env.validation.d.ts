export declare const validateEnv: () => void;
export declare const getEnvConfig: () => {
    server: {
        nodeEnv: string | undefined;
        port: number;
        host: string | undefined;
    };
    cors: {
        allowedOrigins: string[];
    };
    jwt: {
        secret: string | undefined;
    };
    elasticsearch: {
        node: string | undefined;
        username: string | undefined;
        password: string | undefined;
        indexPrefix: string | undefined;
    };
    redis: {
        url: string | undefined;
        password: string | undefined;
    };
    services: {
        productService: string | undefined;
        userService: string | undefined;
    };
    search: {
        maxResults: number;
        defaultSize: number;
        timeout: number;
    };
    indexing: {
        batchSize: number;
        refreshInterval: string | undefined;
    };
    cache: {
        ttl: number;
        maxSize: number;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
    logging: {
        level: string | undefined;
        serviceUrl: string | undefined;
        serviceHost: string | undefined;
        servicePort: number | undefined;
        servicePath: string | undefined;
    };
    security: {
        trustedIps: string[];
        apiKeyHeader: string | undefined;
        adminApiKey: string | undefined;
    };
    monitoring: {
        metricsEnabled: boolean;
        healthCheckInterval: number;
    };
    performance: {
        maxConcurrentSearches: number;
        searchQueueSize: number;
    };
    features: {
        searchAnalytics: boolean;
        autocomplete: boolean;
        spellCheck: boolean;
        searchSuggestions: boolean;
        facetedSearch: boolean;
    };
};
//# sourceMappingURL=env.validation.d.ts.map