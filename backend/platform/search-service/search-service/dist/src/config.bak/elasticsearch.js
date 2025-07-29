"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeElasticsearch = exports.getIndexStats = exports.checkElasticsearchHealth = exports.getElasticsearchClient = exports.connectElasticsearch = void 0;
const elasticsearch_1 = require("@elastic/elasticsearch");
const logger_1 = require("../utils/logger");
const env_validation_1 = require("./env.validation");
let client;
const connectElasticsearch = async () => {
    try {
        const config = (0, env_validation_1.getEnvConfig)();
        const clientConfig = {
            node: config.elasticsearch.node,
            requestTimeout: config.search.timeout,
            pingTimeout: 3000,
            sniffOnStart: true,
            sniffInterval: 300000,
            sniffOnConnectionFault: true,
            maxRetries: 3,
            resurrectStrategy: 'ping',
        };
        if (config.elasticsearch.username && config.elasticsearch.password) {
            clientConfig.auth = {
                username: config.elasticsearch.username,
                password: config.elasticsearch.password,
            };
        }
        client = new elasticsearch_1.Client(clientConfig);
        const health = await client.cluster.health();
        logger_1.logger.info('Elasticsearch connection established', {
            cluster: health.cluster_name,
            status: health.status,
            nodes: health.number_of_nodes,
            dataNodes: health.number_of_data_nodes,
        });
        await initializeIndices();
        return client;
    }
    catch (error) {
        logger_1.logger.error('Failed to connect to Elasticsearch:', error);
        throw error;
    }
};
exports.connectElasticsearch = connectElasticsearch;
const getElasticsearchClient = () => {
    if (!client) {
        throw new Error('Elasticsearch client not initialized. Call connectElasticsearch first.');
    }
    return client;
};
exports.getElasticsearchClient = getElasticsearchClient;
const initializeIndices = async () => {
    try {
        const config = (0, env_validation_1.getEnvConfig)();
        const indexPrefix = config.elasticsearch.indexPrefix;
        const indices = [
            {
                index: `${indexPrefix}-products`,
                mapping: {
                    properties: {
                        id: { type: 'keyword' },
                        name: {
                            type: 'text',
                            analyzer: 'standard',
                            fields: {
                                keyword: { type: 'keyword' },
                                suggest: { type: 'completion' },
                            },
                        },
                        description: {
                            type: 'text',
                            analyzer: 'standard',
                        },
                        sku: { type: 'keyword' },
                        price: { type: 'double' },
                        originalPrice: { type: 'double' },
                        discount: { type: 'double' },
                        currency: { type: 'keyword' },
                        category: {
                            type: 'nested',
                            properties: {
                                id: { type: 'keyword' },
                                name: { type: 'text' },
                                slug: { type: 'keyword' },
                                path: { type: 'keyword' },
                            },
                        },
                        brand: { type: 'keyword' },
                        tags: { type: 'keyword' },
                        attributes: {
                            type: 'nested',
                            properties: {
                                name: { type: 'keyword' },
                                value: { type: 'text' },
                                unit: { type: 'keyword' },
                            },
                        },
                        images: {
                            type: 'nested',
                            properties: {
                                url: { type: 'keyword' },
                                alt: { type: 'text' },
                                isPrimary: { type: 'boolean' },
                            },
                        },
                        inventory: {
                            properties: {
                                quantity: { type: 'integer' },
                                inStock: { type: 'boolean' },
                                lowStock: { type: 'boolean' },
                            },
                        },
                        rating: {
                            properties: {
                                average: { type: 'float' },
                                count: { type: 'integer' },
                            },
                        },
                        status: { type: 'keyword' },
                        featured: { type: 'boolean' },
                        createdAt: { type: 'date' },
                        updatedAt: { type: 'date' },
                        searchKeywords: { type: 'text' },
                        popularity: { type: 'integer' },
                        location: { type: 'geo_point' },
                    },
                },
            },
            {
                index: `${indexPrefix}-categories`,
                mapping: {
                    properties: {
                        id: { type: 'keyword' },
                        name: {
                            type: 'text',
                            fields: {
                                keyword: { type: 'keyword' },
                                suggest: { type: 'completion' },
                            },
                        },
                        description: { type: 'text' },
                        slug: { type: 'keyword' },
                        parentId: { type: 'keyword' },
                        path: { type: 'keyword' },
                        level: { type: 'integer' },
                        productCount: { type: 'integer' },
                        image: { type: 'keyword' },
                        status: { type: 'keyword' },
                        sortOrder: { type: 'integer' },
                        createdAt: { type: 'date' },
                        updatedAt: { type: 'date' },
                    },
                },
            },
            {
                index: `${indexPrefix}-search-logs`,
                mapping: {
                    properties: {
                        query: { type: 'text' },
                        filters: { type: 'object' },
                        results: { type: 'integer' },
                        clickedResults: { type: 'keyword' },
                        userId: { type: 'keyword' },
                        sessionId: { type: 'keyword' },
                        ip: { type: 'ip' },
                        userAgent: { type: 'text' },
                        timestamp: { type: 'date' },
                        responseTime: { type: 'integer' },
                        source: { type: 'keyword' },
                    },
                },
            },
        ];
        for (const indexConfig of indices) {
            const exists = await client.indices.exists({ index: indexConfig.index });
            if (!exists) {
                await client.indices.create({
                    index: indexConfig.index,
                    settings: {
                        number_of_shards: 1,
                        number_of_replicas: 0,
                        refresh_interval: config.indexing.refreshInterval || '1s',
                        analysis: {
                            analyzer: {
                                autocomplete_analyzer: {
                                    type: 'custom',
                                    tokenizer: 'standard',
                                    filter: ['lowercase', 'autocomplete_filter'],
                                },
                                search_analyzer: {
                                    type: 'custom',
                                    tokenizer: 'standard',
                                    filter: ['lowercase'],
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
                    mappings: indexConfig.mapping,
                });
                logger_1.logger.info(`Created Elasticsearch index: ${indexConfig.index}`);
            }
            else {
                logger_1.logger.info(`Elasticsearch index already exists: ${indexConfig.index}`);
            }
        }
    }
    catch (error) {
        logger_1.logger.error('Failed to initialize Elasticsearch indices:', error);
        throw error;
    }
};
const checkElasticsearchHealth = async () => {
    try {
        const client = (0, exports.getElasticsearchClient)();
        const health = await client.cluster.health();
        return {
            status: 'healthy',
            cluster: health.cluster_name,
            clusterStatus: health.status,
            nodes: health.number_of_nodes,
            dataNodes: health.number_of_data_nodes,
            activePrimaryShards: health.active_primary_shards,
            activeShards: health.active_shards,
            relocatingShards: health.relocating_shards,
            initializingShards: health.initializing_shards,
            unassignedShards: health.unassigned_shards,
        };
    }
    catch (error) {
        logger_1.logger.error('Elasticsearch health check failed:', error);
        return {
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
};
exports.checkElasticsearchHealth = checkElasticsearchHealth;
const getIndexStats = async (index) => {
    try {
        const client = (0, exports.getElasticsearchClient)();
        const stats = await client.indices.stats({ index });
        return {
            index,
            total: stats._all?.total || 0,
            primaries: stats._all?.primaries || 0,
        };
    }
    catch (error) {
        logger_1.logger.error(`Failed to get stats for index ${index}:`, error);
        throw error;
    }
};
exports.getIndexStats = getIndexStats;
const closeElasticsearch = async () => {
    try {
        if (client) {
            await client.close();
            logger_1.logger.info('Elasticsearch connection closed');
        }
    }
    catch (error) {
        logger_1.logger.error('Error closing Elasticsearch connection:', error);
    }
};
exports.closeElasticsearch = closeElasticsearch;
exports.connectElasticsearch.close = exports.closeElasticsearch;
exports.default = client;
//# sourceMappingURL=elasticsearch.js.map