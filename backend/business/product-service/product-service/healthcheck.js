#!/usr/bin/env node

/**
 * Professional Health Check for Product Service
 * Comprehensive health monitoring with database and service dependencies
 */

const http = require('http');
const { MongoClient } = require('mongodb');

// Configuration
const config = {
  port: process.env.PORT || 3003,
  host: process.env.HOST || 'localhost',
  timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000,
  retries: parseInt(process.env.HEALTH_CHECK_RETRIES) || 3,
  mongodb: {
    url: process.env.MONGODB_URL || 'mongodb://localhost:27017/ultramarket_products',
    timeout: 3000,
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    timeout: 2000,
  },
  elasticsearch: {
    url: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    timeout: 3000,
  },
};

/**
 * Health check result structure
 */
class HealthCheckResult {
  constructor() {
    this.status = 'healthy';
    this.timestamp = new Date().toISOString();
    this.service = 'product-service';
    this.version = process.env.SERVICE_VERSION || '1.0.0';
    this.checks = {};
    this.details = {};
  }

  addCheck(name, status, message, duration) {
    this.checks[name] = {
      status,
      message,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    };

    if (status === 'unhealthy') {
      this.status = 'unhealthy';
    } else if (status === 'degraded' && this.status === 'healthy') {
      this.status = 'degraded';
    }
  }

  setDetails(key, value) {
    this.details[key] = value;
  }
}

/**
 * Check HTTP endpoint
 */
async function checkHTTP(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const request = http.get(url, { timeout }, (res) => {
      const duration = Date.now() - startTime;

      if (res.statusCode === 200) {
        resolve({ status: 'healthy', duration });
      } else {
        resolve({
          status: 'unhealthy',
          duration,
          message: `HTTP ${res.statusCode}`,
        });
      }
    });

    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });

    request.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Check MongoDB connection
 */
async function checkMongoDB(url, timeout = 3000) {
  const startTime = Date.now();
  let client;

  try {
    client = new MongoClient(url, {
      serverSelectionTimeoutMS: timeout,
      connectTimeoutMS: timeout,
    });

    await client.connect();

    // Test database operation
    const db = client.db();
    await db.admin().ping();

    const duration = Date.now() - startTime;
    return { status: 'healthy', duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      status: 'unhealthy',
      duration,
      message: error.message,
    };
  } finally {
    if (client) {
      await client.close();
    }
  }
}

/**
 * Check Redis connection
 */
async function checkRedis(url, timeout = 2000) {
  const startTime = Date.now();

  try {
    const { createClient } = require('redis');
    const client = createClient({
      url,
      socket: { connectTimeout: timeout },
    });

    await client.connect();
    await client.ping();
    await client.disconnect();

    const duration = Date.now() - startTime;
    return { status: 'healthy', duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      status: 'unhealthy',
      duration,
      message: error.message,
    };
  }
}

/**
 * Check Elasticsearch connection
 */
async function checkElasticsearch(url, timeout = 3000) {
  const startTime = Date.now();

  try {
    const response = await checkHTTP(`${url}/_cluster/health`, timeout);
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      status: 'unhealthy',
      duration,
      message: error.message,
    };
  }
}

/**
 * Main health check function
 */
async function performHealthCheck() {
  const result = new HealthCheckResult();

  try {
    // Check service endpoint
    const serviceCheck = await checkHTTP(
      `http://${config.host}:${config.port}/health`,
      config.timeout
    );
    result.addCheck('service', serviceCheck.status, serviceCheck.message, serviceCheck.duration);

    // Check MongoDB
    const mongoCheck = await checkMongoDB(config.mongodb.url, config.mongodb.timeout);
    result.addCheck('mongodb', mongoCheck.status, mongoCheck.message, mongoCheck.duration);

    // Check Redis
    const redisCheck = await checkRedis(config.redis.url, config.redis.timeout);
    result.addCheck('redis', redisCheck.status, redisCheck.message, redisCheck.duration);

    // Check Elasticsearch
    const elasticsearchCheck = await checkElasticsearch(
      config.elasticsearch.url,
      config.elasticsearch.timeout
    );
    result.addCheck(
      'elasticsearch',
      elasticsearchCheck.status,
      elasticsearchCheck.message,
      elasticsearchCheck.duration
    );

    // Add system details
    result.setDetails('uptime', process.uptime());
    result.setDetails('memory', process.memoryUsage());
    result.setDetails('pid', process.pid);
    result.setDetails('platform', process.platform);
    result.setDetails('nodeVersion', process.version);

    return result;
  } catch (error) {
    result.status = 'unhealthy';
    result.addCheck('system', 'unhealthy', error.message, 0);
    return result;
  }
}

/**
 * Health check with retries
 */
async function healthCheckWithRetries() {
  for (let attempt = 1; attempt <= config.retries; attempt++) {
    try {
      const result = await performHealthCheck();

      if (result.status === 'healthy') {
        // Output JSON result
        process.stdout.write(JSON.stringify(result, null, 2) + '\n');
        process.exit(0);
      } else if (attempt === config.retries) {
        // Last attempt failed
        process.stderr.write(JSON.stringify(result, null, 2) + '\n');
        process.exit(1);
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    } catch (error) {
      if (attempt === config.retries) {
        process.stderr.write(
          JSON.stringify(
            {
              status: 'unhealthy',
              error: error.message,
              timestamp: new Date().toISOString(),
              service: 'product-service',
            },
            null,
            2
          ) + '\n'
        );
        process.exit(1);
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// Handle timeout
const timeoutId = setTimeout(() => {
  process.stderr.write(
    JSON.stringify(
      {
        status: 'unhealthy',
        error: 'Health check timeout',
        timestamp: new Date().toISOString(),
        service: 'product-service',
      },
      null,
      2
    ) + '\n'
  );
  process.exit(1);
}, config.timeout + 2000);

// Run health check
healthCheckWithRetries().finally(() => {
  clearTimeout(timeoutId);
});
