/**
 * Database Setup and Configuration
 * Professional database connection management with pooling
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { memoryManager } from '../utils/memory-manager';

interface DatabaseConfig {
  url: string;
  pool: {
    min: number;
    max: number;
    acquireTimeoutMillis: number;
    createTimeoutMillis: number;
    destroyTimeoutMillis: number;
    idleTimeoutMillis: number;
    reapIntervalMillis: number;
    createRetryIntervalMillis: number;
  };
  logging: {
    level: 'query' | 'info' | 'warn' | 'error';
    slowQueryThreshold: number;
  };
}

class DatabaseManager {
  private static instance: DatabaseManager;
  private prisma: PrismaClient;
  private config: DatabaseConfig;
  private isConnected = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.config = {
      url: process.env['DATABASE_URL'] || '',
      pool: {
        min: parseInt(process.env['DB_POOL_MIN'] || '2'),
        max: parseInt(process.env['DB_POOL_MAX'] || '10'),
        acquireTimeoutMillis: parseInt(process.env['DB_ACQUIRE_TIMEOUT'] || '60000'),
        createTimeoutMillis: parseInt(process.env['DB_CREATE_TIMEOUT'] || '30000'),
        destroyTimeoutMillis: parseInt(process.env['DB_DESTROY_TIMEOUT'] || '5000'),
        idleTimeoutMillis: parseInt(process.env['DB_IDLE_TIMEOUT'] || '30000'),
        reapIntervalMillis: parseInt(process.env['DB_REAP_INTERVAL'] || '1000'),
        createRetryIntervalMillis: parseInt(process.env['DB_CREATE_RETRY_INTERVAL'] || '200'),
      },
      logging: {
        level: (process.env['DB_LOG_LEVEL'] as any) || 'warn',
        slowQueryThreshold: parseInt(process.env['DB_SLOW_QUERY_THRESHOLD'] || '1000'),
      },
    };

    this.prisma = new PrismaClient({
  datasources: {
    db: {
          url: this.config.url,
        },
      },
      log: this.getLogLevels(),
    });

    this.registerMemoryCleanup();
  }

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Get Prisma client instance
   */
  getClient(): PrismaClient {
    return this.prisma;
  }

  /**
   * Connect to database
   */
  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      this.isConnected = true;
      
      logger.info('✅ Database connected successfully', {
        url: this.maskDatabaseUrl(this.config.url),
        pool: this.config.pool,
      });

      this.startHealthCheck();
    } catch (error) {
      logger.error('❌ Database connection failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        url: this.maskDatabaseUrl(this.config.url),
      });
      throw error;
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    try {
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
    }

      await this.prisma.$disconnect();
      this.isConnected = false;
      
      logger.info('✅ Database disconnected successfully');
    } catch (error) {
      logger.error('❌ Database disconnection failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; responseTime: number; details?: any }> {
    const startTime = Date.now();
    
    try {
      // Simple query to test connection
      await this.prisma.$queryRaw`SELECT 1`;
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime,
        details: {
          isConnected: this.isConnected,
          poolSize: this.config.pool.max,
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      logger.error('❌ Database health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
      });
      
      return {
        status: 'unhealthy',
        responseTime,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<any> {
    try {
      const health = await this.healthCheck();
      
      return {
        ...health,
        config: {
          pool: this.config.pool,
          logging: this.config.logging,
        },
        isConnected: this.isConnected,
      };
    } catch (error) {
      logger.error('Failed to get database stats', { error });
      return null;
    }
  }



  /**
   * Register memory cleanup task
   */
  private registerMemoryCleanup(): void {
    memoryManager.registerCleanupTask('database-connections', () => {
      // Force garbage collection for database connections
      if (global.gc) {
        global.gc();
      }
    });
  }

  /**
   * Start health check interval
   */
  private startHealthCheck(): void {
    const interval = parseInt(process.env['DB_HEALTH_CHECK_INTERVAL'] || '30000');
    
    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.healthCheck();
        
        if (health.status === 'unhealthy') {
          logger.error('Database health check failed', { health });
        }
    } catch (error) {
        logger.error('Database health check error', { error });
    }
    }, interval);

    logger.info('Database health check started', { interval });
  }

  /**
   * Get log levels based on configuration
   */
  private getLogLevels(): any[] {
    const levels = [];
    
    switch (this.config.logging.level) {
      case 'query':
        levels.push('query');
      case 'info':
        levels.push('info');
      case 'warn':
        levels.push('warn');
      case 'error':
        levels.push('error');
        break;
      default:
        levels.push('warn', 'error');
    }
    
    return levels;
  }

  /**
   * Mask database URL for security
   */
  private maskDatabaseUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    } catch {
      return 'invalid-url';
    }
  }
}

// Export singleton instance
export const databaseManager = DatabaseManager.getInstance();
export const prisma = databaseManager.getClient(); 