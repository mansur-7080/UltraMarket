import { createLogger } from '../utils/logger-replacement';
import { Pool } from 'pg';
import { MongoClient } from 'mongodb';
import { createClient, RedisClientType } from 'redis';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { Client as MinioClient } from 'minio';
import axios from 'axios';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    [key: string]: ServiceHealth;
  };
  system: SystemHealth;
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  details?: any;
  error?: string;
}

export interface SystemHealth {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    connections: number;
  };
}

@Injectable()
export class HealthCheckService {
  private readonly logger = new Logger(HealthCheckService.name);
  private readonly startTime = Date.now();
  private pgPool: Pool;
  private redisClient: RedisClientType;
  private mongoClient: MongoClient;
  private elasticsearchClient: ElasticsearchClient;
  private minioClient: MinioClient;

  constructor(private configService: ConfigService) {
    this.initializeClients();
  }

  private initializeClients() {
    // PostgreSQL
    this.pgPool = new Pool({
      host: this.configService.get('POSTGRES_HOST'),
      port: this.configService.get('POSTGRES_PORT'),
      database: this.configService.get('POSTGRES_DB'),
      user: this.configService.get('POSTGRES_USER'),
      password: this.configService.get('POSTGRES_PASSWORD'),
      max: 1, // Only for health checks
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // Redis
    this.redisClient = createClient({
      url: `redis://${this.configService.get('REDIS_HOST')}:${this.configService.get('REDIS_PORT')}`,
      password: this.configService.get('REDIS_PASSWORD'),
      socket: {
        connectTimeout: 5000,
      },
    });

    // MongoDB
    this.mongoClient = new MongoClient(this.configService.get('MONGO_URL'), {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    // Elasticsearch
    this.elasticsearchClient = new ElasticsearchClient({
      node: this.configService.get('ELASTICSEARCH_URL'),
      auth: {
        username: this.configService.get('ELASTICSEARCH_USERNAME'),
        password: this.configService.get('ELASTICSEARCH_PASSWORD'),
      },
      requestTimeout: 5000,
    });

    // MinIO
    this.minioClient = new MinioClient({
      endPoint: this.configService.get('MINIO_ENDPOINT'),
      port: parseInt(this.configService.get('MINIO_PORT')),
      useSSL: this.configService.get('MINIO_SSL') === 'true',
      accessKey: this.configService.get('MINIO_ACCESS_KEY'),
      secretKey: this.configService.get('MINIO_SECRET_KEY'),
    });
  }

  async getHealthStatus(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const [
        postgresHealth,
        redisHealth,
        mongoHealth,
        elasticsearchHealth,
        minioHealth,
        systemHealth,
      ] = await Promise.allSettled([
        this.checkPostgreSQL(),
        this.checkRedis(),
        this.checkMongoDB(),
        this.checkElasticsearch(),
        this.checkMinIO(),
        this.getSystemHealth(),
      ]);

      const services = {
        postgres: this.getResultValue(postgresHealth),
        redis: this.getResultValue(redisHealth),
        mongodb: this.getResultValue(mongoHealth),
        elasticsearch: this.getResultValue(elasticsearchHealth),
        minio: this.getResultValue(minioHealth),
      };

      // Overall status determination
      const unhealthyServices = Object.values(services).filter(
        (service) => service.status === 'unhealthy'
      );
      const degradedServices = Object.values(services).filter(
        (service) => service.status === 'degraded'
      );

      let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
      if (unhealthyServices.length > 0) {
        overallStatus = 'unhealthy';
      } else if (degradedServices.length > 0) {
        overallStatus = 'degraded';
      }

      const result: HealthCheckResult = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
        version: this.configService.get('APP_VERSION', '1.0.0'),
        services,
        system: this.getResultValue(systemHealth),
      };

      this.logger.log(
        `Health check completed in ${Date.now() - startTime}ms - Status: ${overallStatus}`
      );
      return result;
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
        version: this.configService.get('APP_VERSION', '1.0.0'),
        services: {},
        system: {
          memory: { used: 0, total: 0, percentage: 0 },
          cpu: { usage: 0 },
          disk: { used: 0, total: 0, percentage: 0 },
          network: { connections: 0 },
        },
      };
    }
  }

  private getResultValue<T>(result: PromiseSettledResult<T>): T {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      this.logger.error('Health check component failed:', result.reason);
      return {
        status: 'unhealthy',
        responseTime: 0,
        error: result.reason?.message || 'Unknown error',
      } as T;
    }
  }

  private async checkPostgreSQL(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      const client = await this.pgPool.connect();
      const result = await client.query('SELECT 1 as health_check');
      client.release();

      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 100 ? 'healthy' : 'degraded',
        responseTime,
        details: {
          database: this.configService.get('POSTGRES_DB'),
          totalConnections: this.pgPool.totalCount,
          idleConnections: this.pgPool.idleCount,
          waitingConnections: this.pgPool.waitingCount,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  private async checkRedis(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      if (!this.redisClient.isOpen) {
        await this.redisClient.connect();
      }

      const testKey = 'health_check';
      const testValue = Date.now().toString();

      await this.redisClient.set(testKey, testValue, { EX: 10 });
      const retrievedValue = await this.redisClient.get(testKey);

      if (retrievedValue !== testValue) {
        throw new Error('Redis read/write test failed');
      }

      await this.redisClient.del(testKey);

      const responseTime = Date.now() - startTime;
      const info = await this.redisClient.info();

      return {
        status: responseTime < 50 ? 'healthy' : 'degraded',
        responseTime,
        details: {
          connectedClients: this.parseRedisInfo(info, 'connected_clients'),
          usedMemory: this.parseRedisInfo(info, 'used_memory_human'),
          uptime: this.parseRedisInfo(info, 'uptime_in_seconds'),
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  private async checkMongoDB(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      await this.mongoClient.connect();
      const db = this.mongoClient.db(this.configService.get('MONGO_DB'));
      const result = await db.admin().ping();

      const responseTime = Date.now() - startTime;
      const stats = await db.stats();

      return {
        status: responseTime < 100 ? 'healthy' : 'degraded',
        responseTime,
        details: {
          database: this.configService.get('MONGO_DB'),
          collections: stats.collections,
          dataSize: stats.dataSize,
          storageSize: stats.storageSize,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    } finally {
      await this.mongoClient.close();
    }
  }

  private async checkElasticsearch(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      const response = await this.elasticsearchClient.cluster.health();
      const responseTime = Date.now() - startTime;

      let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
      if (response.status === 'red') {
        status = 'unhealthy';
      } else if (response.status === 'yellow') {
        status = 'degraded';
      }

      return {
        status,
        responseTime,
        details: {
          clusterName: response.cluster_name,
          status: response.status,
          numberOfNodes: response.number_of_nodes,
          numberOfDataNodes: response.number_of_data_nodes,
          activePrimaryShards: response.active_primary_shards,
          activeShards: response.active_shards,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  private async checkMinIO(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      const buckets = await this.minioClient.listBuckets();
      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 200 ? 'healthy' : 'degraded',
        responseTime,
        details: {
          bucketsCount: buckets.length,
          buckets: buckets.map((bucket) => ({
            name: bucket.name,
            creationDate: bucket.creationDate,
          })),
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  private async getSystemHealth(): Promise<SystemHealth> {
    const process = await import('process');
    const os = await import('os');
    const fs = await import('fs');

    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    // Get disk usage
    let diskUsage = { used: 0, total: 0, percentage: 0 };
    try {
      const stats = fs.statSync('.');
      // Note: This is a simplified disk usage check
      // In production, you might want to use a more robust solution
      diskUsage = {
        used: 0,
        total: 0,
        percentage: 0,
      };
    } catch (error) {
      // Ignore disk usage errors
    }

    return {
      memory: {
        used: usedMemory,
        total: totalMemory,
        percentage: Math.round((usedMemory / totalMemory) * 100),
      },
      cpu: {
        usage: Math.round(os.loadavg()[0] * 100), // Simplified CPU usage
      },
      disk: diskUsage,
      network: {
        connections: 0, // This would require additional system calls
      },
    };
  }

  private parseRedisInfo(info: string, key: string): string {
    const lines = info.split('\r\n');
    for (const line of lines) {
      if (line.startsWith(key + ':')) {
        return line.split(':')[1];
      }
    }
    return 'N/A';
  }

  async checkExternalServices(): Promise<{ [key: string]: ServiceHealth }> {
    const services = {
      click: this.checkClickPayment(),
      payme: this.checkPaymePayment(),
      eskiz: this.checkEskizSMS(),
      playMobile: this.checkPlayMobileSMS(),
    };

    const results = await Promise.allSettled(Object.values(services));
    const serviceNames = Object.keys(services);

    return serviceNames.reduce(
      (acc, name, index) => {
        acc[name] = this.getResultValue(results[index]);
        return acc;
      },
      {} as { [key: string]: ServiceHealth }
    );
  }

  private async checkClickPayment(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      // Simple connectivity check to Click API
      const response = await axios.get('https://api.click.uz/v2/merchant', {
        timeout: 5000,
        validateStatus: (status) => status < 500, // Accept 4xx as "reachable"
      });

      const responseTime = Date.now() - startTime;

      return {
        status: response.status < 400 ? 'healthy' : 'degraded',
        responseTime,
        details: {
          statusCode: response.status,
          reachable: true,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  private async checkPaymePayment(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      // Simple connectivity check to Payme API
      const response = await axios.post(
        'https://checkout.paycom.uz/api',
        {
          method: 'CheckPerformTransaction',
          params: { amount: 1000 },
        },
        {
          timeout: 5000,
          validateStatus: (status) => status < 500,
        }
      );

      const responseTime = Date.now() - startTime;

      return {
        status: response.status < 400 ? 'healthy' : 'degraded',
        responseTime,
        details: {
          statusCode: response.status,
          reachable: true,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  private async checkEskizSMS(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      const response = await axios.get('https://notify.eskiz.uz/api/auth/user', {
        timeout: 5000,
        validateStatus: (status) => status < 500,
      });

      const responseTime = Date.now() - startTime;

      return {
        status: response.status < 400 ? 'healthy' : 'degraded',
        responseTime,
        details: {
          statusCode: response.status,
          reachable: true,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  private async checkPlayMobileSMS(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      const response = await axios.get('https://send.smsxabar.uz/broker-api/send', {
        timeout: 5000,
        validateStatus: (status) => status < 500,
      });

      const responseTime = Date.now() - startTime;

      return {
        status: response.status < 400 ? 'healthy' : 'degraded',
        responseTime,
        details: {
          statusCode: response.status,
          reachable: true,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  async onApplicationShutdown() {
    try {
      await this.pgPool.end();
      await this.redisClient.quit();
      await this.mongoClient.close();
    } catch (error) {
      this.logger.error('Error during health check service shutdown:', error);
    }
  }
}
