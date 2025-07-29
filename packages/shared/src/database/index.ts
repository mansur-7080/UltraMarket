/**
 * UltraMarket E-Commerce Platform
 * Professional TypeScript Database Client
 * Enterprise-Grade Database Management
 */

// import { PrismaClient, Prisma } from '@prisma/client'; // Optional import
let PrismaClient: any = null;
let Prisma: any = null;
try {
  const prisma = require('@prisma/client');
  PrismaClient = prisma.PrismaClient;
  Prisma = prisma.Prisma;
} catch (error) {
  console.warn('Prisma not available, using fallback');
  PrismaClient = class MockPrismaClient {
    constructor() {}
    async $connect() {}
    async $disconnect() {}
  };
  Prisma = {
    TransactionIsolationLevel: {
      ReadUncommitted: 'ReadUncommitted',
      ReadCommitted: 'ReadCommitted',
      RepeatableRead: 'RepeatableRead',
      Serializable: 'Serializable'
    }
  };
}
import winston from 'winston';
import { performance } from 'perf_hooks';
import crypto from 'crypto';

// ===== TYPESCRIPT INTERFACES & TYPES =====

interface DatabaseConfig {
  url: string;
  maxConnections: number;
  connectionTimeout: number;
  queryTimeout: number;
  logLevel: 'info' | 'query' | 'warn' | 'error';
  enableMetrics: boolean;
  retryAttempts: number;
  retryDelay: number;
}

interface QueryMetrics {
  totalQueries: number;
  slowQueries: number;
  failedQueries: number;
  averageResponseTime: number;
  connectionPoolSize: number;
  activeConnections: number;
  peakConnections: number;
  cacheHitRate: number;
}

interface DatabaseHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  connections: {
    active: number;
    idle: number;
    total: number;
    max: number;
  };
  queries: {
    running: number;
    queued: number;
    completed: number;
  };
  lastCheck: Date;
  uptime: number;
}

interface AuditLog {
  id: string;
  operation: string;
  table: string;
  recordId?: string;
  userId?: string;
  before?: any;
  after?: any;
  timestamp: Date;
  duration: number;
  success: boolean;
  error?: string;
}

interface TransactionOptions {
  timeout?: number;
  isolationLevel?: any; // Prisma.TransactionIsolationLevel
  maxWait?: number;
}

enum DatabaseOperation {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  BULK_INSERT = 'BULK_INSERT',
  BULK_UPDATE = 'BULK_UPDATE',
  BULK_DELETE = 'BULK_DELETE'
}

// ===== CONFIGURATION =====

const DATABASE_CONFIG: DatabaseConfig = {
  url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/ultramarket',
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
  queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
  logLevel: (process.env.DB_LOG_LEVEL as any) || 'warn',
  enableMetrics: process.env.DB_ENABLE_METRICS === 'true',
  retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '3'),
  retryDelay: parseInt(process.env.DB_RETRY_DELAY || '1000')
};

// ===== LOGGER CONFIGURATION =====

const dbLogger = winston.createLogger({
  level: DATABASE_CONFIG.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'database' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: 'logs/database-error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/database.log'
    })
  ]
});

// ===== PRISMA CLIENT CONFIGURATION =====

const prismaClientConfig: any = {
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' }
  ],
  errorFormat: 'pretty',
  rejectOnNotFound: false
};

// ===== DATABASE CLIENT CLASS =====

export class DatabaseClient {
  private static instance: DatabaseClient;
  private prisma: any; // Changed from PrismaClient to any
  private metrics: QueryMetrics;
  private health: DatabaseHealth;
  private auditLogs: AuditLog[] = [];
  private queryCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private isConnected: boolean = false;

  private constructor() {
    this.prisma = new PrismaClient(prismaClientConfig);
    this.metrics = {
      totalQueries: 0,
      slowQueries: 0,
      failedQueries: 0,
      averageResponseTime: 0,
      connectionPoolSize: DATABASE_CONFIG.maxConnections,
      activeConnections: 0,
      peakConnections: 0,
      cacheHitRate: 0
    };

    this.health = {
      status: 'unhealthy',
      responseTime: 0,
      connections: {
        active: 0,
        idle: 0,
        total: 0,
        max: DATABASE_CONFIG.maxConnections
      },
      queries: {
        running: 0,
        queued: 0,
        completed: 0
      },
      lastCheck: new Date(),
      uptime: 0
    };

    this.setupEventListeners();
    this.startHealthMonitoring();
  }

  public static getInstance(): DatabaseClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient();
    }
    return DatabaseClient.instance;
  }

  private setupEventListeners(): void {
    // Query event logging
    this.prisma.$on('query', (e: any) => {
      this.metrics.totalQueries++;
      
      if (e.duration > 1000) { // Slow query threshold: 1 second
        this.metrics.slowQueries++;
        dbLogger.warn('Slow query detected', {
          query: e.query,
          duration: e.duration,
          params: e.params
        });
      }

      if (DATABASE_CONFIG.logLevel === 'query') {
        dbLogger.debug('Database query', {
          query: e.query,
          duration: e.duration,
          params: e.params
        });
      }
    });

    // Error event logging
    this.prisma.$on('error', (e: any) => {
      this.metrics.failedQueries++;
      dbLogger.error('Database error', {
        message: e.message,
        target: e.target
      });
    });

    // Info and warn events
    this.prisma.$on('info', (e: any) => {
      dbLogger.info('Database info', e);
    });

    this.prisma.$on('warn', (e: any) => {
      dbLogger.warn('Database warning', e);
    });
  }

  public async connect(): Promise<void> {
    try {
      dbLogger.info('Connecting to database...');
      
      await this.prisma.$connect();
      this.isConnected = true;
      
      // Test connection
      await this.prisma.$queryRaw`SELECT 1`;
      
      this.health.status = 'healthy';
      this.health.uptime = Date.now();
      
      dbLogger.info('Database connected successfully', {
        url: this.maskDatabaseUrl(DATABASE_CONFIG.url),
        maxConnections: DATABASE_CONFIG.maxConnections
      });
    } catch (error) {
      this.health.status = 'unhealthy';
      dbLogger.error('Failed to connect to database', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
      this.health.status = 'unhealthy';
      dbLogger.info('Database disconnected');
    } catch (error) {
      dbLogger.error('Error disconnecting from database', error);
      throw error;
    }
  }

  // ===== QUERY METHODS WITH MONITORING =====

  public async findUnique<T>(
    model: string,
    args: any,
    options?: { cache?: boolean; ttl?: number }
  ): Promise<T | null> {
    const startTime = performance.now();
    const queryId = this.generateQueryId(model, 'findUnique', args);

    try {
      // Check cache first
      if (options?.cache) {
        const cached = this.getFromCache(queryId);
        if (cached) {
          return cached as T;
        }
      }

      const result = await (this.prisma as any)[model].findUnique(args);
      
      // Cache the result
      if (options?.cache && result) {
        this.setCache(queryId, result, options.ttl || 300000); // 5 minutes default
      }

      this.recordQueryMetrics(startTime, true);
      return result;
    } catch (error) {
      this.recordQueryMetrics(startTime, false);
      throw this.handleDatabaseError(error, 'findUnique', model);
    }
  }

  public async findMany<T>(
    model: string,
    args: any,
    options?: { cache?: boolean; ttl?: number }
  ): Promise<T[]> {
    const startTime = performance.now();
    const queryId = this.generateQueryId(model, 'findMany', args);

    try {
      // Check cache first
      if (options?.cache) {
        const cached = this.getFromCache(queryId);
        if (cached) {
          return cached as T[];
        }
      }

      const result = await (this.prisma as any)[model].findMany(args);
      
      // Cache the result
      if (options?.cache) {
        this.setCache(queryId, result, options.ttl || 300000); // 5 minutes default
      }

      this.recordQueryMetrics(startTime, true);
      return result;
    } catch (error) {
      this.recordQueryMetrics(startTime, false);
      throw this.handleDatabaseError(error, 'findMany', model);
    }
  }

  public async create<T>(
    model: string,
    args: any,
    userId?: string
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await (this.prisma as any)[model].create(args);
      
      // Audit logging
      this.logAudit({
        operation: DatabaseOperation.CREATE,
        table: model,
        recordId: result.id,
        userId,
        after: result,
        duration: performance.now() - startTime,
        success: true
      });

      this.recordQueryMetrics(startTime, true);
      this.invalidateCache(model);
      
      return result;
    } catch (error) {
      this.recordQueryMetrics(startTime, false);
      
      // Audit failed operation
      this.logAudit({
        operation: DatabaseOperation.CREATE,
        table: model,
        userId,
        duration: performance.now() - startTime,
        success: false,
        error: (error as any).message
      });

      throw this.handleDatabaseError(error, 'create', model);
    }
  }

  public async update<T>(
    model: string,
    args: any,
    userId?: string
  ): Promise<T> {
    const startTime = performance.now();

    try {
      // Get the record before update for audit
      const before = args.where ? await (this.prisma as any)[model].findUnique({
        where: args.where
      }) : null;

      const result = await (this.prisma as any)[model].update(args);
      
      // Audit logging
      this.logAudit({
        operation: DatabaseOperation.UPDATE,
        table: model,
        recordId: result.id,
        userId,
        before,
        after: result,
        duration: performance.now() - startTime,
        success: true
      });

      this.recordQueryMetrics(startTime, true);
      this.invalidateCache(model);
      
      return result;
    } catch (error) {
      this.recordQueryMetrics(startTime, false);
      
      // Audit failed operation
      this.logAudit({
        operation: DatabaseOperation.UPDATE,
        table: model,
        userId,
        duration: performance.now() - startTime,
        success: false,
        error: (error as any).message
      });

      throw this.handleDatabaseError(error, 'update', model);
    }
  }

  public async delete<T>(
    model: string,
    args: any,
    userId?: string
  ): Promise<T> {
    const startTime = performance.now();

    try {
      // Get the record before delete for audit
      const before = await (this.prisma as any)[model].findUnique({
        where: args.where
      });

      const result = await (this.prisma as any)[model].delete(args);
      
      // Audit logging
      this.logAudit({
        operation: DatabaseOperation.DELETE,
        table: model,
        recordId: before?.id,
        userId,
        before,
        duration: performance.now() - startTime,
        success: true
      });

      this.recordQueryMetrics(startTime, true);
      this.invalidateCache(model);
      
      return result;
    } catch (error) {
      this.recordQueryMetrics(startTime, false);
      
      // Audit failed operation
      this.logAudit({
        operation: DatabaseOperation.DELETE,
        table: model,
        userId,
        duration: performance.now() - startTime,
        success: false,
        error: (error as any).message
      });

      throw this.handleDatabaseError(error, 'delete', model);
    }
  }

  // ===== TRANSACTION SUPPORT =====

  public async transaction<T>(
    operations: (prisma: any) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await this.prisma.$transaction(operations, {
        timeout: options?.timeout || DATABASE_CONFIG.queryTimeout,
        isolationLevel: options?.isolationLevel,
        maxWait: options?.maxWait || 5000
      });

      this.recordQueryMetrics(startTime, true);
      return result;
    } catch (error) {
      this.recordQueryMetrics(startTime, false);
      throw this.handleDatabaseError(error, 'transaction', 'multiple');
    }
  }

  // ===== RAW QUERIES =====

  public async query<T = any>(sql: string, values?: any[]): Promise<T[]> {
    const startTime = performance.now();

    try {
      const result = await (this.prisma as any).$queryRawUnsafe(sql, ...(values || []));
      this.recordQueryMetrics(startTime, true);
      return result;
    } catch (error) {
      this.recordQueryMetrics(startTime, false);
      throw this.handleDatabaseError(error, 'rawQuery', 'raw');
    }
  }

  public async execute(sql: string, values?: any[]): Promise<number> {
    const startTime = performance.now();

    try {
      const result = await (this.prisma as any).$executeRawUnsafe(sql, ...(values || []));
      this.recordQueryMetrics(startTime, true);
      return result;
    } catch (error) {
      this.recordQueryMetrics(startTime, false);
      throw this.handleDatabaseError(error, 'rawExecute', 'raw');
    }
  }

  // ===== HEALTH MONITORING =====

  public async healthCheck(): Promise<DatabaseHealth> {
    const startTime = performance.now();

    try {
      // Test basic connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      
      // Get connection pool info (if available)
      const responseTime = performance.now() - startTime;
      
      this.health = {
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        responseTime,
        connections: {
          active: this.metrics.activeConnections,
          idle: DATABASE_CONFIG.maxConnections - this.metrics.activeConnections,
          total: this.metrics.activeConnections,
          max: DATABASE_CONFIG.maxConnections
        },
        queries: {
          running: 0, // Would need database-specific queries to get this
          queued: 0,
          completed: this.metrics.totalQueries
        },
        lastCheck: new Date(),
        uptime: this.health.uptime ? Date.now() - this.health.uptime : 0
      };

      return this.health;
    } catch (error) {
      this.health.status = 'unhealthy';
      this.health.lastCheck = new Date();
      throw error;
    }
  }

  public getMetrics(): QueryMetrics {
    return { ...this.metrics };
  }

  public getAuditLogs(limit: number = 100): AuditLog[] {
    return this.auditLogs.slice(-limit);
  }

  // ===== UTILITY METHODS =====

  private recordQueryMetrics(startTime: number, success: boolean): void {
    const duration = performance.now() - startTime;
    
    if (success) {
      this.metrics.averageResponseTime = 
        (this.metrics.averageResponseTime + duration) / 2;
    }

    this.metrics.totalQueries++;
    
    if (duration > 1000) {
      this.metrics.slowQueries++;
    }
  }

  private handleDatabaseError(error: any, operation: string, model: string): Error {
    const errorMessage = `Database ${operation} failed for ${model}: ${(error as any).message}`;
    
    if ((error as any).code === 'P2002') {
      return new Error(`Unique constraint violation: ${(error as any).meta?.target}`);
    } else if ((error as any).code === 'P2025') {
      return new Error('Record not found');
    } else if ((error as any).code === 'P2003') {
      return new Error('Foreign key constraint violation');
    }

    return new Error(errorMessage);
  }

  private logAudit(log: Partial<AuditLog>): void {
    const auditEntry: AuditLog = {
      id: crypto.randomBytes(16).toString('hex'),
      operation: log.operation!,
      table: log.table!,
      recordId: log.recordId,
      userId: log.userId,
      before: log.before,
      after: log.after,
      timestamp: new Date(),
      duration: log.duration!,
      success: log.success!,
      error: log.error
    };

    this.auditLogs.push(auditEntry);
    
    // Keep only last 1000 audit logs in memory
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000);
    }

    // Log to file for persistent storage
    dbLogger.info('Database audit', auditEntry);
  }

  private generateQueryId(model: string, operation: string, args: any): string {
    const key = `${model}:${operation}:${JSON.stringify(args)}`;
    return crypto.createHash('md5').update(key).digest('hex');
  }

  private getFromCache(key: string): any | null {
    const cached = this.queryCache.get(key);
    if (cached && Date.now() < cached.timestamp + cached.ttl) {
      this.metrics.cacheHitRate++;
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.queryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    // Clean expired cache entries
    if (this.queryCache.size > 1000) {
      this.cleanCache();
    }
  }

  private invalidateCache(model: string): void {
    for (const [key] of this.queryCache.entries()) {
      if (key.startsWith(`${model}:`)) {
        this.queryCache.delete(key);
      }
    }
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.queryCache.entries()) {
      if (now >= cached.timestamp + cached.ttl) {
        this.queryCache.delete(key);
      }
    }
  }

  private maskDatabaseUrl(url: string): string {
    return url.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@');
  }

  private startHealthMonitoring(): void {
    setInterval(async () => {
      try {
        await this.healthCheck();
      } catch (error) {
        dbLogger.error('Health check failed', error);
      }
    }, 30000); // Check every 30 seconds
  }

  // ===== PUBLIC API =====

  public get client(): any {
    return this.prisma;
  }

  public get isHealthy(): boolean {
    return this.health.status === 'healthy';
  }

  public get status(): DatabaseHealth {
    return { ...this.health };
  }
}

// ===== SINGLETON EXPORT =====

export const database = DatabaseClient.getInstance();

// ===== CONVENIENCE EXPORTS =====

export const db = database.client;
export const dbHealth = () => database.healthCheck();
export const dbMetrics = () => database.getMetrics();
export const dbAuditLogs = (limit?: number) => database.getAuditLogs(limit);

// ===== DEFAULT EXPORT =====

export default database; 