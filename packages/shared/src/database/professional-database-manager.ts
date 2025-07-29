/**
 * ⚡ PROFESSIONAL DATABASE MANAGER - UltraMarket
 * 
 * N+1 queries, connection leaks, transaction management va performance optimization
 * Professional database connection va query management
 * 
 * @author UltraMarket Development Team
 * @version 2.0.0
 * @date 2024-12-28
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { createClient, RedisClientType } from 'redis';
import mongoose, { Connection } from 'mongoose';
import { Pool, PoolClient, QueryResult } from 'pg';
import EventEmitter from 'events';
import { logger } from '../logging/professional-logger';

// Interfaces
export interface DatabaseConnectionConfig {
  postgres: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
    maxConnections?: number;
    idleTimeout?: number;
    connectionTimeout?: number;
  };
  mongodb: {
    uri: string;
    maxPoolSize?: number;
    minPoolSize?: number;
    maxIdleTime?: number;
    serverSelectionTimeout?: number;
  };
  redis: {
    url: string;
    maxRetries?: number;
    retryDelay?: number;
    maxRetriesPerRequest?: number;
  };
}

export interface DatabaseMetrics {
  connections: {
    postgres: { active: number; idle: number; total: number };
    mongodb: { active: number; idle: number; total: number };
    redis: { active: boolean; status: string };
  };
  queries: {
    slow: number;
    failed: number;
    total: number;
    averageTime: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
  };
}

export interface QueryOptimizationOptions {
  enableJoinOptimization?: boolean;
  enableQueryCaching?: boolean;
  batchSize?: number;
  maxIncludes?: number;
  cacheTTL?: number;
}

export interface TransactionOptions {
  timeout?: number;
  isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Professional Database Manager
 */
export class ProfessionalDatabaseManager extends EventEmitter {
  private static instance: ProfessionalDatabaseManager;
  
  // Database clients
  private prismaClient: PrismaClient | null = null;
  private postgresPool: Pool | null = null;
  private redisClient: RedisClientType | null = null;
  private mongooseConnection: mongoose.Mongoose | null = null;
  
  // Configuration
  private connectionConfig: DatabaseConnectionConfig;
  private queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private activeConnections = new Set<string>();
  private queryMetrics = {
    slow: 0,
    failed: 0,
    total: 0,
    totalTime: 0
  };
  
  // Optimization settings
  private optimizationOptions: QueryOptimizationOptions = {
    enableJoinOptimization: true,
    enableQueryCaching: true,
    batchSize: 100,
    maxIncludes: 5,
    cacheTTL: 300000 // 5 minutes
  };
  
  private isShuttingDown = false;
  
  private constructor(config: DatabaseConnectionConfig) {
    super();
    this.connectionConfig = config;
    this.setupGracefulShutdown();
  }
  
  /**
   * Singleton pattern implementation
   */
  public static getInstance(config?: DatabaseConnectionConfig): ProfessionalDatabaseManager {
    if (!ProfessionalDatabaseManager.instance) {
      if (!config) {
        throw new Error('Database configuration is required for first initialization');
      }
      ProfessionalDatabaseManager.instance = new ProfessionalDatabaseManager(config);
    }
    return ProfessionalDatabaseManager.instance;
  }
  
  /**
   * Initialize all database connections
   */
  async initializeConnections(): Promise<void> {
    logger.info('🗄️ Initializing database connections...');
    
    try {
      await Promise.all([
        this.initializePrisma(),
        this.initializePostgresPool(),
        this.initializeRedis(),
        this.initializeMongoDB()
      ]);
      
      logger.info('✅ All database connections initialized successfully');
      this.emit('connectionsReady');
    } catch (error) {
      logger.error('❌ Failed to initialize database connections', error);
      throw error;
    }
  }
  
  /**
   * Initialize Prisma client with optimization
   */
  private async initializePrisma(): Promise<void> {
    if (this.prismaClient) return;
    
    this.prismaClient = new PrismaClient({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' }
      ],
      datasources: {
        db: {
          url: this.buildPostgresUrl()
        }
      }
    });
    
    // Query logging and metrics
    this.prismaClient.$on('query', (e) => {
      const queryTime = Date.now() - e.timestamp.getTime();
      this.queryMetrics.total++;
      this.queryMetrics.totalTime += queryTime;
      
      if (queryTime > 1000) { // Slow query (>1s)
        this.queryMetrics.slow++;
        logger.warn('🐌 Slow query detected', {
          query: e.query,
          params: e.params,
          duration: `${queryTime}ms`,
          target: e.target
        });
      }
      
      logger.database('query', 'prisma', queryTime, {
        query: e.query.substring(0, 100) + '...',
        params: e.params,
        target: e.target
      });
    });
    
    this.prismaClient.$on('error', (e) => {
      this.queryMetrics.failed++;
      logger.error('❌ Prisma error', e);
    });
    
    // Test connection
    await this.prismaClient.$connect();
    this.activeConnections.add('prisma');
    
    logger.info('✅ Prisma client initialized');
  }
  
  /**
   * Initialize PostgreSQL connection pool
   */
  private async initializePostgresPool(): Promise<void> {
    if (this.postgresPool) return;
    
    const config = this.connectionConfig.postgres;
    
    this.postgresPool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: config.maxConnections || 20,
      idleTimeoutMillis: config.idleTimeout || 30000,
      connectionTimeoutMillis: config.connectionTimeout || 2000,
      statement_timeout: 30000,
      query_timeout: 30000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 0,
    });
    
    // Pool event handlers
    this.postgresPool.on('connect', (client: PoolClient) => {
      logger.debug('🔌 New PostgreSQL client connected', {
        processId: client.processID,
        database: config.database
      });
    });
    
    this.postgresPool.on('remove', (client: PoolClient) => {
      logger.debug('🔌 PostgreSQL client removed', {
        processId: client.processID
      });
    });
    
    this.postgresPool.on('error', (error: Error) => {
      logger.error('❌ PostgreSQL pool error', error);
      this.emit('connectionError', { type: 'postgres', error });
    });
    
    // Test connection
    const client = await this.postgresPool.connect();
    await client.query('SELECT 1');
    client.release();
    
    this.activeConnections.add('postgres-pool');
    logger.info('✅ PostgreSQL pool initialized');
  }
  
  /**
   * Initialize Redis client
   */
  private async initializeRedis(): Promise<void> {
    if (this.redisClient) return;
    
    const config = this.connectionConfig.redis;
    
    this.redisClient = createClient({
      url: config.url,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > (config.maxRetries || 3)) {
            logger.error('❌ Redis max retries exceeded');
            return new Error('Redis connection failed');
          }
          const delay = Math.min(retries * 50, 3000);
          logger.warn(`🔄 Redis reconnecting in ${delay}ms, attempt ${retries}`);
          return delay;
        }
      }
    });
    
    // Redis event handlers
    this.redisClient.on('connect', () => {
      logger.info('✅ Redis client connected');
      this.activeConnections.add('redis');
    });
    
    this.redisClient.on('disconnect', () => {
      logger.warn('🔌 Redis client disconnected');
      this.activeConnections.delete('redis');
    });
    
    this.redisClient.on('error', (error: Error) => {
      logger.error('❌ Redis client error', error);
      this.emit('connectionError', { type: 'redis', error });
    });
    
    this.redisClient.on('reconnecting', () => {
      logger.warn('🔄 Redis client reconnecting...');
    });
    
    await this.redisClient.connect();
    logger.info('✅ Redis client initialized');
  }
  
  /**
   * Initialize MongoDB connection
   */
  private async initializeMongoDB(): Promise<void> {
    if (this.mongooseConnection) return;
    
    const config = this.connectionConfig.mongodb;
    
    try {
      this.mongooseConnection = await mongoose.connect(config.uri, {
        maxPoolSize: config.maxPoolSize || 10,
        minPoolSize: config.minPoolSize || 2,
        maxIdleTimeMS: config.maxIdleTime || 30000,
        serverSelectionTimeoutMS: config.serverSelectionTimeout || 5000,
        socketTimeoutMS: 45000,
        family: 4, // Use IPv4
        bufferCommands: false,
        bufferMaxEntries: 0,
      });
      
      // MongoDB event handlers
      this.mongooseConnection.connection.on('connected', () => {
        logger.info('✅ MongoDB connected successfully');
        this.activeConnections.add('mongodb');
      });
      
      this.mongooseConnection.connection.on('error', (error) => {
        logger.error('❌ MongoDB connection error', error);
        this.emit('connectionError', { type: 'mongodb', error });
      });
      
      this.mongooseConnection.connection.on('disconnected', () => {
        logger.warn('🔌 MongoDB disconnected');
        this.activeConnections.delete('mongodb');
      });
      
      logger.info('✅ MongoDB initialized');
      
    } catch (error) {
      logger.error('❌ Failed to initialize MongoDB', error);
      throw error;
    }
  }
  
  /**
   * Optimized query execution with batching and caching
   */
  async executeOptimizedQuery<T>(
    queryFn: (tx: PrismaClient) => Promise<T>,
    options: QueryOptimizationOptions = {}
  ): Promise<T> {
    const opts = { ...this.optimizationOptions, ...options };
    const startTime = Date.now();
    
    try {
      // Check cache first if enabled
      if (opts.enableQueryCaching) {
        const cacheKey = this.generateCacheKey(queryFn.toString());
        const cached = this.queryCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
          logger.debug('🎯 Query cache hit', { cacheKey });
          return cached.data;
        }
      }
      
      // Execute query with optimization
      const result = await this.prismaClient!.$transaction(async (tx) => {
        return await queryFn(tx);
      }, {
        timeout: 30000,
        isolationLevel: 'ReadCommitted'
      });
      
      // Cache result if enabled
      if (opts.enableQueryCaching && opts.cacheTTL) {
        const cacheKey = this.generateCacheKey(queryFn.toString());
        this.queryCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
          ttl: opts.cacheTTL
        });
      }
      
      const duration = Date.now() - startTime;
      logger.database('optimized-query', 'prisma', duration);
      
      return result;
      
    } catch (error) {
      this.queryMetrics.failed++;
      logger.error('❌ Optimized query failed', error);
      throw error;
    }
  }
  
  /**
   * Batch query execution to prevent N+1 problems
   */
  async executeBatchQuery<T, K>(
    ids: K[],
    queryFn: (batchIds: K[]) => Promise<T[]>,
    batchSize: number = 50
  ): Promise<T[]> {
    const results: T[] = [];
    
    // Process in batches to avoid overwhelming database
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const batchResults = await queryFn(batch);
      results.push(...batchResults);
      
      logger.debug('📦 Batch query executed', {
        batchNumber: Math.floor(i / batchSize) + 1,
        batchSize: batch.length,
        totalBatches: Math.ceil(ids.length / batchSize)
      });
    }
    
    return results;
  }
  
  /**
   * Professional transaction management
   */
  async executeTransaction<T>(
    transactionFn: (tx: PrismaClient) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const {
      timeout = 30000,
      isolationLevel = 'READ_COMMITTED',
      retryAttempts = 3,
      retryDelay = 1000
    } = options;
    
    let attempt = 0;
    
    while (attempt < retryAttempts) {
      try {
        const result = await this.prismaClient!.$transaction(
          transactionFn,
          {
            timeout,
            isolationLevel: isolationLevel as any
          }
        );
        
        logger.database('transaction', 'prisma', Date.now(), {
          attempt: attempt + 1,
          isolationLevel
        });
        
        return result;
        
      } catch (error) {
        attempt++;
        
        if (attempt >= retryAttempts) {
          logger.error('❌ Transaction failed after all retries', error, {
            attempts: attempt,
            isolationLevel
          });
          throw error;
        }
        
        logger.warn(`⚠️ Transaction failed, retrying (${attempt}/${retryAttempts})`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          retryDelay
        });
        
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
    
    throw new Error('Transaction failed after maximum retries');
  }
  
  /**
   * Get database metrics and health status
   */
  async getMetrics(): Promise<DatabaseMetrics> {
    const metrics: DatabaseMetrics = {
      connections: {
        postgres: { active: 0, idle: 0, total: 0 },
        mongodb: { active: 0, idle: 0, total: 0 },
        redis: { active: false, status: 'unknown' }
      },
      queries: {
        slow: this.queryMetrics.slow,
        failed: this.queryMetrics.failed,
        total: this.queryMetrics.total,
        averageTime: this.queryMetrics.total > 0 
          ? this.queryMetrics.totalTime / this.queryMetrics.total 
          : 0
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0
      }
    };
    
    // Get PostgreSQL pool stats
    if (this.postgresPool) {
      metrics.connections.postgres = {
        active: this.postgresPool.totalCount - this.postgresPool.idleCount,
        idle: this.postgresPool.idleCount,
        total: this.postgresPool.totalCount
      };
    }
    
    // Get MongoDB connection stats
    if (this.mongooseConnection) {
      const mongoStats = this.mongooseConnection.connection.readyState;
      metrics.connections.mongodb = {
        active: mongoStats === 1 ? 1 : 0,
        idle: 0,
        total: 1
      };
    }
    
    // Get Redis connection status
    if (this.redisClient) {
      metrics.connections.redis = {
        active: this.redisClient.isReady,
        status: this.redisClient.status || 'unknown'
      };
    }
    
    return metrics;
  }
  
  /**
   * Clear query cache
   */
  clearQueryCache(): void {
    this.queryCache.clear();
    logger.info('🗑️ Query cache cleared');
  }
  
  /**
   * Health check for all database connections
   */
  async healthCheck(): Promise<{ 
    healthy: boolean; 
    services: Record<string, boolean>;
    metrics: DatabaseMetrics 
  }> {
    const services: Record<string, boolean> = {};
    
    try {
      // Check Prisma/PostgreSQL
      if (this.prismaClient) {
        await this.prismaClient.$queryRaw`SELECT 1`;
        services.postgres = true;
      }
      
      // Check Redis
      if (this.redisClient) {
        await this.redisClient.ping();
        services.redis = true;
      }
      
      // Check MongoDB
      if (this.mongooseConnection) {
        services.mongodb = this.mongooseConnection.connection.readyState === 1;
      }
      
      const healthy = Object.values(services).every(status => status === true);
      const metrics = await this.getMetrics();
      
      logger.info('🏥 Database health check completed', { healthy, services });
      
      return { healthy, services, metrics };
      
    } catch (error) {
      logger.error('❌ Database health check failed', error);
      return { 
        healthy: false, 
        services, 
        metrics: await this.getMetrics() 
      };
    }
  }
  
  /**
   * Graceful shutdown of all connections
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn('⏳ Shutdown already in progress...');
      return;
    }
    
    this.isShuttingDown = true;
    logger.info('🛑 Starting graceful shutdown of database connections...');
    
    const shutdownPromises: Promise<void>[] = [];
    
    // Disconnect Prisma
    if (this.prismaClient) {
      shutdownPromises.push(
        this.prismaClient.$disconnect()
          .then(() => logger.info('✅ Prisma client disconnected'))
          .catch(error => logger.error('❌ Error disconnecting Prisma', error))
      );
    }
    
    // Close PostgreSQL pool
    if (this.postgresPool) {
      shutdownPromises.push(
        this.postgresPool.end()
          .then(() => logger.info('✅ PostgreSQL pool closed'))
          .catch(error => logger.error('❌ Error closing PostgreSQL pool', error))
      );
    }
    
    // Disconnect Redis
    if (this.redisClient) {
      shutdownPromises.push(
        this.redisClient.disconnect()
          .then(() => logger.info('✅ Redis client disconnected'))
          .catch(error => logger.error('❌ Error disconnecting Redis', error))
      );
    }
    
    // Disconnect MongoDB
    if (this.mongooseConnection) {
      shutdownPromises.push(
        this.mongooseConnection.connection.close()
          .then(() => logger.info('✅ MongoDB disconnected'))
          .catch(error => logger.error('❌ Error disconnecting MongoDB', error))
      );
    }
    
    try {
      await Promise.allSettled(shutdownPromises);
      this.activeConnections.clear();
      this.queryCache.clear();
      logger.info('✅ All database connections closed gracefully');
    } catch (error) {
      logger.error('❌ Error during database shutdown', error);
    } finally {
      this.emit('shutdown');
    }
  }
  
  // Private helper methods
  private buildPostgresUrl(): string {
    const { host, port, database, username, password, ssl } = this.connectionConfig.postgres;
    return `postgresql://${username}:${password}@${host}:${port}/${database}${ssl ? '?ssl=true' : ''}`;
  }
  
  private generateCacheKey(queryString: string): string {
    return Buffer.from(queryString).toString('base64').substring(0, 32);
  }
  
  private setupGracefulShutdown(): void {
    const handleShutdown = (signal: string) => {
      logger.info(`📡 Received ${signal}, starting graceful database shutdown...`);
      this.shutdown().finally(() => process.exit(0));
    };
    
    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    
    process.on('uncaughtException', (error: Error) => {
      logger.error('❌ Uncaught exception', error);
      this.shutdown().finally(() => process.exit(1));
    });
    
    process.on('unhandledRejection', (reason: any) => {
      logger.error('❌ Unhandled rejection', reason);
      this.shutdown().finally(() => process.exit(1));
    });
  }
}

// Export factory function
export const createDatabaseManager = (config: DatabaseConnectionConfig): ProfessionalDatabaseManager => {
  return ProfessionalDatabaseManager.getInstance(config);
};

// Export default configured instance
export const databaseManager = ProfessionalDatabaseManager.getInstance({
  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'ultramarket',
    username: process.env.POSTGRES_USER || 'ultramarket_user',
    password: process.env.POSTGRES_PASSWORD || 'secure_password_2024',
    ssl: process.env.POSTGRES_SSL === 'true',
    maxConnections: parseInt(process.env.POSTGRES_MAX_CONNECTIONS || '20'),
    idleTimeout: parseInt(process.env.POSTGRES_IDLE_TIMEOUT || '30000'),
    connectionTimeout: parseInt(process.env.POSTGRES_CONNECTION_TIMEOUT || '2000')
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ultramarket',
    maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
    minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2'),
    maxIdleTime: parseInt(process.env.MONGODB_MAX_IDLE_TIME || '30000'),
    serverSelectionTimeout: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT || '5000')
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.REDIS_RETRY_DELAY || '1000')
  }
});

export default databaseManager; 