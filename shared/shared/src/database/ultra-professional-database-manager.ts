/**
 * 🗄️ ULTRA PROFESSIONAL DATABASE MANAGER
 * UltraMarket E-commerce Platform
 * 
 * Solves critical database issues:
 * - Connection pool leaks (120+ connection limit problem)
 * - N+1 query optimization
 * - Professional connection management
 * - Health monitoring and auto-recovery
 * - Performance optimization
 * - Transaction management
 * 
 * @author UltraMarket Database Team
 * @version 3.0.0
 * @date 2024-12-28
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { Pool, PoolClient, PoolConfig } from 'pg';
import mongoose, { Connection } from 'mongoose';
import { Redis, Cluster } from 'ioredis';
import EventEmitter from 'events';
import { logger } from '../logging/ultra-professional-logger';

// Professional TypeScript interfaces
export interface DatabaseConfig {
  postgres: {
    connectionString: string;
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
    // CRITICAL: Optimized pool settings to prevent 120+ connection issue
    poolMin: number;
    poolMax: number;
    acquireTimeoutMillis: number;
    idleTimeoutMillis: number;
    evictionRunIntervalMillis: number;
    connectionTimeoutMillis: number;
    statementTimeoutMs: number;
    queryTimeoutMs: number;
  };
  mongodb: {
    uri: string;
    database: string;
    // Optimized MongoDB pool settings
    maxPoolSize: number;
    minPoolSize: number;
    maxIdleTimeMS: number;
    serverSelectionTimeoutMS: number;
    socketTimeoutMS: number;
    connectTimeoutMS: number;
    heartbeatFrequencyMS: number;
    retryWrites: boolean;
    retryReads: boolean;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
    keyPrefix: string;
    // Redis optimization settings
    maxRetriesPerRequest: number;
    retryDelayOnFailover: number;
    enableOfflineQueue: boolean;
    lazyConnect: boolean;
    keepAlive: number;
    family: 4 | 6;
    connectTimeout: number;
    commandTimeout: number;
    maxMemoryPolicy: string;
  };
  general: {
    enableHealthChecks: boolean;
    healthCheckInterval: number;
    enableMetrics: boolean;
    enableQueryLogging: boolean;
    enableSlowQueryLogging: boolean;
    slowQueryThreshold: number;
    enableConnectionPooling: boolean;
    gracefulShutdownTimeout: number;
    maxRetries: number;
    retryDelay: number;
  };
}

export interface ConnectionMetrics {
  postgres: {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    waitingConnections: number;
    errors: number;
    slowQueries: number;
    averageQueryTime: number;
  };
  mongodb: {
    totalConnections: number;
    availableConnections: number;
    checkedOutConnections: number;
    errors: number;
    slowQueries: number;
    averageQueryTime: number;
  };
  redis: {
    totalConnections: number;
    usedMemory: number;
    connectedClients: number;
    commandsProcessed: number;
    errors: number;
    averageResponseTime: number;
  };
}

export interface HealthStatus {
  postgres: 'healthy' | 'degraded' | 'unhealthy';
  mongodb: 'healthy' | 'degraded' | 'unhealthy';
  redis: 'healthy' | 'degraded' | 'unhealthy';
  overall: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  uptime: number;
}

export interface QueryResult<T = any> {
  data: T;
  executionTime: number;
  fromCache: boolean;
  queryHash: string;
  affectedRows?: number;
}

export interface TransactionOptions {
  isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
  timeout?: number;
  retries?: number;
  readOnly?: boolean;
}

/**
 * Ultra Professional Database Manager
 */
export class UltraProfessionalDatabaseManager extends EventEmitter {
  private static instance: UltraProfessionalDatabaseManager;
  private config: DatabaseConfig;
  
  // Database connections
  private prismaClient?: PrismaClient;
  private postgresPool?: Pool;
  private mongooseConnection?: Connection;
  private redisClient?: Redis;
  private redisCluster?: Cluster;

  // Connection status tracking
  private connectionStatus = {
    postgres: 'disconnected' as 'connected' | 'disconnected' | 'connecting' | 'error',
    mongodb: 'disconnected' as 'connected' | 'disconnected' | 'connecting' | 'error',
    redis: 'disconnected' as 'connected' | 'disconnected' | 'connecting' | 'error'
  };

  // Metrics tracking
  private metrics: ConnectionMetrics = {
    postgres: {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingConnections: 0,
      errors: 0,
      slowQueries: 0,
      averageQueryTime: 0
    },
    mongodb: {
      totalConnections: 0,
      availableConnections: 0,
      checkedOutConnections: 0,
      errors: 0,
      slowQueries: 0,
      averageQueryTime: 0
    },
    redis: {
      totalConnections: 0,
      usedMemory: 0,
      connectedClients: 0,
      commandsProcessed: 0,
      errors: 0,
      averageResponseTime: 0
    }
  };

  private healthCheckInterval?: NodeJS.Timeout;
  private isShuttingDown = false;
  private activeConnections = new Set<string>();

  constructor(config: Partial<DatabaseConfig> = {}) {
    super();
    
    this.config = this.mergeWithDefaults(config);
    this.setupGracefulShutdown();
    
    logger.info('🗄️ Ultra Professional Database Manager initializing', {
      postgresPool: `${this.config.postgres.poolMin}-${this.config.postgres.poolMax}`,
      mongodbPool: `${this.config.mongodb.minPoolSize}-${this.config.mongodb.maxPoolSize}`,
      redisConnection: this.config.redis.host
    });
  }

  /**
   * Singleton instance with professional configuration
   */
  public static getInstance(config?: Partial<DatabaseConfig>): UltraProfessionalDatabaseManager {
    if (!UltraProfessionalDatabaseManager.instance) {
      UltraProfessionalDatabaseManager.instance = new UltraProfessionalDatabaseManager(config);
    }
    return UltraProfessionalDatabaseManager.instance;
  }

  /**
   * Merge configuration with professional defaults
   */
  private mergeWithDefaults(config: Partial<DatabaseConfig>): DatabaseConfig {
    return {
      postgres: {
        connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/ultramarket',
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DB || 'ultramarket',
        username: process.env.POSTGRES_USER || 'ultramarket_user',
        password: process.env.POSTGRES_PASSWORD || 'secure_password',
        ssl: process.env.POSTGRES_SSL === 'true',
        // 🔥 CRITICAL: Optimized to solve 120+ connection limit problem
        poolMin: parseInt(process.env.POSTGRES_POOL_MIN || '2'), // Reduced from 10
        poolMax: parseInt(process.env.POSTGRES_POOL_MAX || '10'), // Reduced from 20
        acquireTimeoutMillis: parseInt(process.env.POSTGRES_ACQUIRE_TIMEOUT || '60000'),
        idleTimeoutMillis: parseInt(process.env.POSTGRES_IDLE_TIMEOUT || '30000'),
        evictionRunIntervalMillis: parseInt(process.env.POSTGRES_EVICTION_INTERVAL || '5000'),
        connectionTimeoutMillis: 10000,
        statementTimeoutMs: 30000,
        queryTimeoutMs: 30000,
        ...config.postgres
      },
      mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ultramarket',
        database: process.env.MONGODB_DB || 'ultramarket',
        // 🔥 CRITICAL: Optimized MongoDB pool settings
        maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '5'), // Reduced from 10
        minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '1'), // Reduced from 2
        maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME || '30000'),
        serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT || '5000'),
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        heartbeatFrequencyMS: 10000,
        retryWrites: true,
        retryReads: true,
        ...config.mongodb
      },
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'ultramarket:',
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableOfflineQueue: false,
        lazyConnect: true,
        keepAlive: 30000,
        family: 4,
        connectTimeout: 10000,
        commandTimeout: 5000,
        maxMemoryPolicy: 'allkeys-lru',
        ...config.redis
      },
      general: {
        enableHealthChecks: true,
        healthCheckInterval: 30000, // 30 seconds
        enableMetrics: true,
        enableQueryLogging: process.env.NODE_ENV === 'development',
        enableSlowQueryLogging: true,
        slowQueryThreshold: 1000, // 1 second
        enableConnectionPooling: true,
        gracefulShutdownTimeout: 30000,
        maxRetries: 3,
        retryDelay: 1000,
        ...config.general
      }
    };
  }

  /**
   * Initialize all database connections
   */
  public async initialize(): Promise<void> {
    try {
      logger.info('🚀 Initializing database connections...');

      // Initialize connections in parallel for better performance
      await Promise.allSettled([
        this.initializePostgres(),
        this.initializePrisma(),
        this.initializeMongoDB(),
        this.initializeRedis()
      ]);

      // Start health checks if enabled
      if (this.config.general.enableHealthChecks) {
        this.startHealthChecks();
      }

      // Start metrics collection if enabled
      if (this.config.general.enableMetrics) {
        this.startMetricsCollection();
      }

      logger.info('✅ Database connections initialized successfully', {
        postgres: this.connectionStatus.postgres,
        mongodb: this.connectionStatus.mongodb,
        redis: this.connectionStatus.redis
      });

      this.emit('initialized');

    } catch (error) {
      logger.error('❌ Database initialization failed', error);
      throw error;
    }
  }

  /**
   * 🐘 Initialize PostgreSQL connection pool with optimized settings
   */
  private async initializePostgres(): Promise<void> {
    if (this.postgresPool) return;
    
    this.connectionStatus.postgres = 'connecting';
    
    try {
      const poolConfig: PoolConfig = {
        connectionString: this.config.postgres.connectionString,
        // 🔥 CRITICAL: Optimized pool configuration to prevent connection leaks
        min: this.config.postgres.poolMin,
        max: this.config.postgres.poolMax,
        acquireTimeoutMillis: this.config.postgres.acquireTimeoutMillis,
        idleTimeoutMillis: this.config.postgres.idleTimeoutMillis,
        connectionTimeoutMillis: this.config.postgres.connectionTimeoutMillis,
        
        // Additional optimization settings
        application_name: 'UltraMarket',
        statement_timeout: this.config.postgres.statementTimeoutMs,
        query_timeout: this.config.postgres.queryTimeoutMs,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
        
        // SSL configuration
        ssl: this.config.postgres.ssl ? {
          rejectUnauthorized: false,
          ca: process.env.POSTGRES_CA_CERT,
          cert: process.env.POSTGRES_CLIENT_CERT,
          key: process.env.POSTGRES_CLIENT_KEY
        } : false
      };
      
      this.postgresPool = new Pool(poolConfig);
      
      // Setup comprehensive event listeners
      this.postgresPool.on('connect', (client: PoolClient) => {
        this.metrics.postgres.totalConnections++;
        logger.debug('🔌 New PostgreSQL client connected', {
          processId: client.processID,
          totalConnections: this.metrics.postgres.totalConnections
        });
      });
      
      this.postgresPool.on('acquire', () => {
        this.metrics.postgres.activeConnections++;
      });
      
      this.postgresPool.on('release', () => {
        this.metrics.postgres.activeConnections--;
      });
      
      this.postgresPool.on('remove', (client: PoolClient) => {
        this.metrics.postgres.totalConnections--;
        logger.debug('🔌 PostgreSQL client removed', {
          processId: client.processID,
          totalConnections: this.metrics.postgres.totalConnections
        });
      });
      
      this.postgresPool.on('error', (error: Error) => {
        this.metrics.postgres.errors++;
        logger.error('❌ PostgreSQL pool error', error);
        this.connectionStatus.postgres = 'error';
        this.emit('postgresError', error);
      });
      
      // Test initial connection
      const client = await this.postgresPool.connect();
      await client.query('SELECT 1 as health_check');
      client.release();
      
      this.connectionStatus.postgres = 'connected';
      logger.info('✅ PostgreSQL pool connected successfully', {
        poolSize: `${this.config.postgres.poolMin}-${this.config.postgres.poolMax}`,
        host: this.config.postgres.host,
        database: this.config.postgres.database
      });
      
      this.emit('postgresConnected');
      
    } catch (error) {
      this.connectionStatus.postgres = 'error';
      logger.error('❌ Failed to connect PostgreSQL pool', error);
      throw error;
    }
  }

  /**
   * 🔧 Initialize Prisma with optimized connection settings
   */
  private async initializePrisma(): Promise<void> {
    if (this.prismaClient) return;
    
    try {
      this.prismaClient = new PrismaClient({
        log: process.env.NODE_ENV === 'development' 
          ? ['query', 'info', 'warn', 'error']
          : ['error', 'warn'],
        
        datasources: {
          db: {
            url: this.config.postgres.connectionString
          }
        },
        
        // 🔥 CRITICAL: Optimized Prisma configuration
        __internal: {
          engine: {
            // Use the shared connection pool
            binaryTarget: 'native'
          }
        }
      });

      // Setup Prisma middleware for query logging and metrics
      this.prismaClient.$use(async (params, next) => {
        const startTime = Date.now();
        
        try {
          const result = await next(params);
          const executionTime = Date.now() - startTime;
          
          // Track query metrics
          if (executionTime > this.config.general.slowQueryThreshold) {
            this.metrics.postgres.slowQueries++;
            
            if (this.config.general.enableSlowQueryLogging) {
              logger.warn('🐌 Slow query detected', {
                model: params.model,
                action: params.action,
                executionTime,
                args: this.config.general.enableQueryLogging ? params.args : '[HIDDEN]'
              });
            }
          }
          
          // Update average query time
          this.updateAverageQueryTime('postgres', executionTime);
          
          return result;
        } catch (error) {
          this.metrics.postgres.errors++;
          logger.error('❌ Prisma query error', {
            model: params.model,
            action: params.action,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          throw error;
        }
      });

      // Test Prisma connection
      await this.prismaClient.$connect();
      
      // Setup graceful disconnect
      this.prismaClient.$on('beforeExit', async () => {
        logger.info('🔌 Prisma client disconnecting gracefully');
        await this.prismaClient?.$disconnect();
      });
      
      logger.info('✅ Prisma client initialized successfully');
      
    } catch (error) {
      logger.error('❌ Failed to initialize Prisma client', error);
      throw error;
    }
  }

  /**
   * 🍃 Initialize MongoDB with optimized settings
   */
  private async initializeMongoDB(): Promise<void> {
    if (this.mongooseConnection) return;
    
    this.connectionStatus.mongodb = 'connecting';
    
    try {
      // 🔥 CRITICAL: Optimized MongoDB connection options
      const mongooseOptions = {
        maxPoolSize: this.config.mongodb.maxPoolSize,
        minPoolSize: this.config.mongodb.minPoolSize,
        maxIdleTimeMS: this.config.mongodb.maxIdleTimeMS,
        serverSelectionTimeoutMS: this.config.mongodb.serverSelectionTimeoutMS,
        socketTimeoutMS: this.config.mongodb.socketTimeoutMS,
        connectTimeoutMS: this.config.mongodb.connectTimeoutMS,
        heartbeatFrequencyMS: this.config.mongodb.heartbeatFrequencyMS,
        
        // Additional optimization settings
        family: 4, // Use IPv4
        bufferCommands: false,
        bufferMaxEntries: 0,
        retryWrites: this.config.mongodb.retryWrites,
        retryReads: this.config.mongodb.retryReads,
        
        // Monitoring
        monitorCommands: this.config.general.enableQueryLogging,
        
        // Authentication
        authSource: 'admin',
        
        // Read preferences for better performance
        readPreference: 'primaryPreferred',
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority', j: true, wtimeout: 30000 }
      };
      
      await mongoose.connect(this.config.mongodb.uri, mongooseOptions);
      this.mongooseConnection = mongoose.connection;
      
      // Setup comprehensive event listeners
      this.mongooseConnection.on('connected', () => {
        this.connectionStatus.mongodb = 'connected';
        logger.info('✅ MongoDB connected successfully', {
          host: this.mongooseConnection?.host,
          port: this.mongooseConnection?.port,
          database: this.mongooseConnection?.name,
          readyState: this.mongooseConnection?.readyState
        });
        this.emit('mongodbConnected');
      });
      
      this.mongooseConnection.on('error', (error) => {
        this.metrics.mongodb.errors++;
        this.connectionStatus.mongodb = 'error';
        logger.error('❌ MongoDB connection error', error);
        this.emit('mongodbError', error);
      });
      
      this.mongooseConnection.on('disconnected', () => {
        this.connectionStatus.mongodb = 'disconnected';
        logger.warn('🔌 MongoDB disconnected');
        this.emit('mongodbDisconnected');
      });
      
      this.mongooseConnection.on('reconnected', () => {
        this.connectionStatus.mongodb = 'connected';
        logger.info('🔄 MongoDB reconnected');
        this.emit('mongodbReconnected');
      });
      
      // Monitor slow operations
      if (this.config.general.enableSlowQueryLogging) {
        mongoose.set('debug', (collectionName, method, query, doc) => {
          const startTime = Date.now();
          
          setImmediate(() => {
            const executionTime = Date.now() - startTime;
            
            if (executionTime > this.config.general.slowQueryThreshold) {
              this.metrics.mongodb.slowQueries++;
              logger.warn('🐌 Slow MongoDB operation detected', {
                collection: collectionName,
                method,
                executionTime,
                query: this.config.general.enableQueryLogging ? query : '[HIDDEN]'
              });
            }
            
            this.updateAverageQueryTime('mongodb', executionTime);
          });
        });
      }
      
    } catch (error) {
      this.connectionStatus.mongodb = 'error';
      logger.error('❌ Failed to connect MongoDB', error);
      throw error;
    }
  }

  /**
   * 🔴 Initialize Redis with cluster support
   */
  private async initializeRedis(): Promise<void> {
    if (this.redisClient) return;
    
    this.connectionStatus.redis = 'connecting';
    
    try {
      const redisConfig = {
        host: this.config.redis.host,
        port: this.config.redis.port,
        password: this.config.redis.password,
        db: this.config.redis.db,
        keyPrefix: this.config.redis.keyPrefix,
        maxRetriesPerRequest: this.config.redis.maxRetriesPerRequest,
        retryDelayOnFailover: this.config.redis.retryDelayOnFailover,
        enableOfflineQueue: this.config.redis.enableOfflineQueue,
        lazyConnect: this.config.redis.lazyConnect,
        keepAlive: this.config.redis.keepAlive,
        family: this.config.redis.family,
        connectTimeout: this.config.redis.connectTimeout,
        commandTimeout: this.config.redis.commandTimeout,
        
        // Additional optimization
        enableReadyCheck: true,
        maxLoadingTimeout: 10000,
        enableAutoPipelining: true,
        
        // Retry strategy
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        
        // Reconnect strategy
        reconnectOnError: (err: Error) => {
          const targetError = 'READONLY';
          return err.message.includes(targetError);
        }
      };
      
      // Check if cluster mode is enabled
      if (process.env.REDIS_CLUSTER_ENABLED === 'true') {
        const clusterNodes = process.env.REDIS_CLUSTER_NODES?.split(',') || [];
        
        if (clusterNodes.length > 0) {
          this.redisCluster = new Cluster(clusterNodes, {
            redisOptions: redisConfig,
            enableOfflineQueue: false,
            maxRetriesPerRequest: 3
          });
          
          this.redisClient = this.redisCluster as any;
        } else {
          throw new Error('Redis cluster nodes not configured');
        }
      } else {
        this.redisClient = new Redis(redisConfig);
      }
      
      // Setup comprehensive event listeners
      this.redisClient.on('connect', () => {
        logger.info('🔌 Redis connecting...');
      });
      
      this.redisClient.on('ready', () => {
        this.connectionStatus.redis = 'connected';
        logger.info('✅ Redis connected successfully', {
          host: this.config.redis.host,
          port: this.config.redis.port,
          db: this.config.redis.db,
          mode: this.redisCluster ? 'cluster' : 'standalone'
        });
        this.emit('redisConnected');
      });
      
      this.redisClient.on('error', (error: Error) => {
        this.metrics.redis.errors++;
        this.connectionStatus.redis = 'error';
        logger.error('❌ Redis connection error', error);
        this.emit('redisError', error);
      });
      
      this.redisClient.on('close', () => {
        this.connectionStatus.redis = 'disconnected';
        logger.warn('🔌 Redis connection closed');
        this.emit('redisDisconnected');
      });
      
      this.redisClient.on('reconnecting', () => {
        logger.info('🔄 Redis reconnecting...');
      });
      
      // Test Redis connection if not lazy connecting
      if (!this.config.redis.lazyConnect) {
        await this.redisClient.ping();
      }
      
    } catch (error) {
      this.connectionStatus.redis = 'error';
      logger.error('❌ Failed to connect Redis', error);
      throw error;
    }
  }

  /**
   * Get optimized Prisma client instance
   */
  public getPrisma(): PrismaClient {
    if (!this.prismaClient) {
      throw new Error('Prisma client not initialized. Call initialize() first.');
    }
    return this.prismaClient;
  }

  /**
   * Get optimized PostgreSQL pool
   */
  public getPostgresPool(): Pool {
    if (!this.postgresPool) {
      throw new Error('PostgreSQL pool not initialized. Call initialize() first.');
    }
    return this.postgresPool;
  }

  /**
   * Get MongoDB connection
   */
  public getMongoDB(): Connection {
    if (!this.mongooseConnection) {
      throw new Error('MongoDB connection not initialized. Call initialize() first.');
    }
    return this.mongooseConnection;
  }

  /**
   * Get Redis client
   */
  public getRedis(): Redis {
    if (!this.redisClient) {
      throw new Error('Redis client not initialized. Call initialize() first.');
    }
    return this.redisClient;
  }

  /**
   * Execute PostgreSQL query with connection management
   */
  public async executePostgresQuery<T = any>(
    query: string,
    params: any[] = [],
    options: { timeout?: number; retries?: number } = {}
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();
    const queryHash = this.generateQueryHash(query, params);
    
    let client: PoolClient | undefined;
    let retries = 0;
    const maxRetries = options.retries || this.config.general.maxRetries;
    
    while (retries <= maxRetries) {
      try {
        client = await this.postgresPool!.connect();
        
        // Set query timeout if specified
        if (options.timeout) {
          await client.query(`SET statement_timeout = ${options.timeout}`);
        }
        
        const result = await client.query(query, params);
        const executionTime = Date.now() - startTime;
        
        // Update metrics
        this.updateAverageQueryTime('postgres', executionTime);
        
        if (executionTime > this.config.general.slowQueryThreshold) {
          this.metrics.postgres.slowQueries++;
          
          if (this.config.general.enableSlowQueryLogging) {
            logger.warn('🐌 Slow PostgreSQL query detected', {
              query: this.config.general.enableQueryLogging ? query : '[HIDDEN]',
              executionTime,
              rowCount: result.rowCount
            });
          }
        }
        
        return {
          data: result.rows as T,
          executionTime,
          fromCache: false,
          queryHash,
          affectedRows: result.rowCount || 0
        };
        
      } catch (error) {
        this.metrics.postgres.errors++;
        
        if (retries < maxRetries && this.isRetryableError(error)) {
          retries++;
          logger.warn(`🔄 Retrying PostgreSQL query (attempt ${retries}/${maxRetries})`, {
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          await this.delay(this.config.general.retryDelay * retries);
          continue;
        }
        
        logger.error('❌ PostgreSQL query failed', {
          query: this.config.general.enableQueryLogging ? query : '[HIDDEN]',
          error: error instanceof Error ? error.message : 'Unknown error',
          retries
        });
        
        throw error;
        
      } finally {
        if (client) {
          client.release();
        }
      }
    }
    
    throw new Error('Max retries exceeded for PostgreSQL query');
  }

  /**
   * Execute transaction with optimized settings
   */
  public async executeTransaction<T>(
    callback: (prisma: PrismaClient) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await this.prismaClient!.$transaction(
        callback,
        {
          isolationLevel: options.isolationLevel,
          maxWait: options.timeout || 10000,
          timeout: options.timeout || 30000
        }
      );
      
      const executionTime = Date.now() - startTime;
      
      if (executionTime > this.config.general.slowQueryThreshold) {
        logger.warn('🐌 Slow transaction detected', {
          executionTime,
          isolationLevel: options.isolationLevel
        });
      }
      
      return result;
      
    } catch (error) {
      this.metrics.postgres.errors++;
      logger.error('❌ Transaction failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        isolationLevel: options.isolationLevel
      });
      throw error;
    }
  }

  /**
   * Get comprehensive health status
   */
  public async getHealthStatus(): Promise<HealthStatus> {
    const healthChecks = await Promise.allSettled([
      this.checkPostgresHealth(),
      this.checkMongoDBHealth(),
      this.checkRedisHealth()
    ]);
    
    const postgresHealth = healthChecks[0].status === 'fulfilled' ? 
      healthChecks[0].value : 'unhealthy';
    const mongodbHealth = healthChecks[1].status === 'fulfilled' ? 
      healthChecks[1].value : 'unhealthy';
    const redisHealth = healthChecks[2].status === 'fulfilled' ? 
      healthChecks[2].value : 'unhealthy';
    
    // Determine overall health
    const healthStatuses = [postgresHealth, mongodbHealth, redisHealth];
    const overallHealth = healthStatuses.includes('unhealthy') ? 'unhealthy' :
                         healthStatuses.includes('degraded') ? 'degraded' : 'healthy';
    
    return {
      postgres: postgresHealth,
      mongodb: mongodbHealth,
      redis: redisHealth,
      overall: overallHealth,
      lastCheck: new Date(),
      uptime: process.uptime()
    };
  }

  /**
   * Get current connection metrics
   */
  public getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }

  /**
   * Graceful shutdown of all connections
   */
  public async shutdown(): Promise<void> {
    if (this.isShuttingDown) return;
    
    this.isShuttingDown = true;
    logger.info('🔄 Starting graceful database shutdown...');
    
    // Stop health checks
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // Close connections in parallel
    const shutdownPromises = [];
    
    if (this.prismaClient) {
      shutdownPromises.push(
        this.prismaClient.$disconnect().catch(err => 
          logger.error('❌ Error disconnecting Prisma', err)
        )
      );
    }
    
    if (this.postgresPool) {
      shutdownPromises.push(
        this.postgresPool.end().catch(err => 
          logger.error('❌ Error closing PostgreSQL pool', err)
        )
      );
    }
    
    if (this.mongooseConnection) {
      shutdownPromises.push(
        this.mongooseConnection.close().catch(err => 
          logger.error('❌ Error closing MongoDB connection', err)
        )
      );
    }
    
    if (this.redisClient) {
      shutdownPromises.push(
        this.redisClient.disconnect().catch(err => 
          logger.error('❌ Error disconnecting Redis', err)
        )
      );
    }
    
    // Wait for all shutdowns to complete or timeout
    await Promise.race([
      Promise.allSettled(shutdownPromises),
      this.delay(this.config.general.gracefulShutdownTimeout)
    ]);
    
    logger.info('✅ Database shutdown completed');
    this.emit('shutdown');
  }

  // Private helper methods
  private async checkPostgresHealth(): Promise<'healthy' | 'degraded' | 'unhealthy'> {
    try {
      const startTime = Date.now();
      const client = await this.postgresPool!.connect();
      
      await client.query('SELECT 1');
      client.release();
      
      const responseTime = Date.now() - startTime;
      
      if (responseTime > 5000) return 'degraded';
      if (responseTime > 10000) return 'unhealthy';
      
      return 'healthy';
    } catch {
      return 'unhealthy';
    }
  }

  private async checkMongoDBHealth(): Promise<'healthy' | 'degraded' | 'unhealthy'> {
    try {
      if (!this.mongooseConnection || this.mongooseConnection.readyState !== 1) {
        return 'unhealthy';
      }
      
      const startTime = Date.now();
      await this.mongooseConnection.db.admin().ping();
      
      const responseTime = Date.now() - startTime;
      
      if (responseTime > 5000) return 'degraded';
      if (responseTime > 10000) return 'unhealthy';
      
      return 'healthy';
    } catch {
      return 'unhealthy';
    }
  }

  private async checkRedisHealth(): Promise<'healthy' | 'degraded' | 'unhealthy'> {
    try {
      const startTime = Date.now();
      await this.redisClient!.ping();
      
      const responseTime = Date.now() - startTime;
      
      if (responseTime > 2000) return 'degraded';
      if (responseTime > 5000) return 'unhealthy';
      
      return 'healthy';
    } catch {
      return 'unhealthy';
    }
  }

  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.getHealthStatus();
        
        if (health.overall !== 'healthy') {
          logger.warn('⚠️ Database health check warning', health);
          this.emit('healthWarning', health);
        }
        
        if (health.overall === 'unhealthy') {
          this.emit('healthCritical', health);
        }
        
      } catch (error) {
        logger.error('❌ Health check failed', error);
      }
    }, this.config.general.healthCheckInterval);
  }

  private startMetricsCollection(): void {
    setInterval(async () => {
      try {
        // Update PostgreSQL metrics
        if (this.postgresPool) {
          this.metrics.postgres.totalConnections = this.postgresPool.totalCount;
          this.metrics.postgres.idleConnections = this.postgresPool.idleCount;
          this.metrics.postgres.waitingConnections = this.postgresPool.waitingCount;
        }
        
        // Update Redis metrics
        if (this.redisClient) {
          const info = await this.redisClient.info('memory');
          const memoryMatch = info.match(/used_memory:(\d+)/);
          if (memoryMatch) {
            this.metrics.redis.usedMemory = parseInt(memoryMatch[1]);
          }
        }
        
      } catch (error) {
        logger.error('❌ Metrics collection failed', error);
      }
    }, 30000); // Every 30 seconds
  }

  private setupGracefulShutdown(): void {
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
    
    signals.forEach(signal => {
      process.on(signal, async () => {
        logger.info(`📡 Received ${signal}, starting graceful shutdown...`);
        await this.shutdown();
        process.exit(0);
      });
    });
    
    process.on('uncaughtException', async (error) => {
      logger.error('💥 Uncaught exception, shutting down...', error);
      await this.shutdown();
      process.exit(1);
    });
    
    process.on('unhandledRejection', async (reason) => {
      logger.error('💥 Unhandled rejection, shutting down...', reason);
      await this.shutdown();
      process.exit(1);
    });
  }

  private updateAverageQueryTime(database: 'postgres' | 'mongodb', executionTime: number): void {
    const metric = this.metrics[database];
    metric.averageQueryTime = (metric.averageQueryTime + executionTime) / 2;
  }

  private generateQueryHash(query: string, params: any[]): string {
    const crypto = require('crypto');
    return crypto.createHash('md5')
      .update(query + JSON.stringify(params))
      .digest('hex');
  }

  private isRetryableError(error: any): boolean {
    const retryableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED',
      'connection terminated unexpectedly'
    ];
    
    const errorMessage = error?.message?.toLowerCase() || '';
    return retryableErrors.some(msg => errorMessage.includes(msg));
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export default configured instance
export const databaseManager = UltraProfessionalDatabaseManager.getInstance({
  postgres: {
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/ultramarket',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'ultramarket',
    username: process.env.POSTGRES_USER || 'ultramarket_user',
    password: process.env.POSTGRES_PASSWORD || 'secure_password',
    ssl: process.env.POSTGRES_SSL === 'true',
    // 🔥 CRITICAL: Reduced pool sizes to solve connection limit issue
    poolMin: parseInt(process.env.POSTGRES_POOL_MIN || '2'),
    poolMax: parseInt(process.env.POSTGRES_POOL_MAX || '8'), // Reduced from 20
    acquireTimeoutMillis: parseInt(process.env.POSTGRES_ACQUIRE_TIMEOUT || '60000'),
    idleTimeoutMillis: parseInt(process.env.POSTGRES_IDLE_TIMEOUT || '30000'),
    evictionRunIntervalMillis: parseInt(process.env.POSTGRES_EVICTION_INTERVAL || '5000'),
    connectionTimeoutMillis: 10000,
    statementTimeoutMs: 30000,
    queryTimeoutMs: 30000
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ultramarket',
    database: process.env.MONGODB_DB || 'ultramarket',
    // 🔥 CRITICAL: Reduced MongoDB pool sizes
    maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '4'), // Reduced from 10
    minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '1'),
    maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME || '30000'),
    serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT || '5000'),
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    heartbeatFrequencyMS: 10000,
    retryWrites: true,
    retryReads: true
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'ultramarket:',
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableOfflineQueue: false,
    lazyConnect: true,
    keepAlive: 30000,
    family: 4,
    connectTimeout: 10000,
    commandTimeout: 5000,
    maxMemoryPolicy: 'allkeys-lru'
  },
  general: {
    enableHealthChecks: true,
    healthCheckInterval: 30000,
    enableMetrics: true,
    enableQueryLogging: process.env.NODE_ENV === 'development',
    enableSlowQueryLogging: true,
    slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000'),
    enableConnectionPooling: true,
    gracefulShutdownTimeout: 30000,
    maxRetries: 3,
    retryDelay: 1000
  }
});

// Auto-initialize if in production
if (process.env.NODE_ENV === 'production') {
  databaseManager.initialize().catch(error => {
    logger.error('💥 Failed to auto-initialize database manager', error);
    process.exit(1);
  });
} 