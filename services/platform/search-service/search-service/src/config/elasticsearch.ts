import { Client } from '@elastic/elasticsearch';
import { logger } from '../utils/logger';
import { getEnvConfig } from './env.validation';

let client: Client;

export const connectElasticsearch = async (): Promise<Client> => {
  try {
    const config = getEnvConfig();

    // Create Elasticsearch client
    const clientConfig: any = {
      node: config.elasticsearch.node,
      requestTimeout: config.search.timeout,
      pingTimeout: 3000,
      sniffOnStart: true,
      sniffInterval: 300000, // 5 minutes
      sniffOnConnectionFault: true,
      maxRetries: 3,
      resurrectStrategy: 'ping',
    };

    // Add authentication if provided
    if (config.elasticsearch.username && config.elasticsearch.password) {
      clientConfig.auth = {
        username: config.elasticsearch.username,
        password: config.elasticsearch.password,
      };
    }

    client = new Client(clientConfig);

    // Test the connection
    const health = await client.cluster.health();
    logger.info('Elasticsearch connection established', {
      cluster: health.body.cluster_name,
      status: health.body.status,
      nodes: health.body.number_of_nodes,
      dataNodes: health.body.number_of_data_nodes,
    });

    // Initialize indices
    await initializeIndices();

    return client;
  } catch (error) {
    logger.error('Failed to connect to Elasticsearch:', error);
    throw error;
  }
};

export const getElasticsearchClient = (): Client => {
  if (!client) {
    throw new Error('Elasticsearch client not initialized. Call connectElasticsearch first.');
  }
  return client;
};

// Initialize search indices
const initializeIndices = async (): Promise<void> => {
  try {
    const config = getEnvConfig();
    const indexPrefix = config.elasticsearch.indexPrefix;

    // Define index mappings
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

    // Create indices if they don't exist
    for (const indexConfig of indices) {
      const exists = await client.indices.exists({ index: indexConfig.index });

      if (!exists.body) {
        await client.indices.create({
          index: indexConfig.index,
          body: {
            settings: {
              number_of_shards: 1,
              number_of_replicas: 0,
              refresh_interval: config.indexing.refreshInterval,
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
          },
        });

        logger.info(`Created Elasticsearch index: ${indexConfig.index}`);
      } else {
        logger.info(`Elasticsearch index already exists: ${indexConfig.index}`);
      }
    }
  } catch (error) {
    logger.error('Failed to initialize Elasticsearch indices:', error);
    throw error;
  }
};

// Health check for Elasticsearch
export const checkElasticsearchHealth = async (): Promise<any> => {
  try {
    const client = getElasticsearchClient();
    const health = await client.cluster.health();

    return {
      status: 'healthy',
      cluster: health.body.cluster_name,
      clusterStatus: health.body.status,
      nodes: health.body.number_of_nodes,
      dataNodes: health.body.number_of_data_nodes,
      activePrimaryShards: health.body.active_primary_shards,
      activeShards: health.body.active_shards,
      relocatingShards: health.body.relocating_shards,
      initializingShards: health.body.initializing_shards,
      unassignedShards: health.body.unassigned_shards,
    };
  } catch (error) {
    logger.error('Elasticsearch health check failed:', error);
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Get index statistics
export const getIndexStats = async (index: string): Promise<any> => {
  try {
    const client = getElasticsearchClient();
    const stats = await client.indices.stats({ index });

    return {
      index,
      total: stats.body._all.total,
      primaries: stats.body._all.primaries,
    };
  } catch (error) {
    logger.error(`Failed to get stats for index ${index}:`, error);
    throw error;
  }
};

// Close Elasticsearch connection
export const closeElasticsearch = async (): Promise<void> => {
  try {
    if (client) {
      await client.close();
      logger.info('Elasticsearch connection closed');
    }
  } catch (error) {
    logger.error('Error closing Elasticsearch connection:', error);
  }
};

// Export the close function for graceful shutdown
connectElasticsearch.close = closeElasticsearch;

export default client;
