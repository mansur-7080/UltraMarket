import Redis from 'ioredis';
import { logger } from '../utils/logger';

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  connectTimeout: 10000,
  lazyConnect: true,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  retryDelayOnClusterDown: 300,
  enableOfflineQueue: false,
  family: 4, // 4 (IPv4) or 6 (IPv6)
};

// Create Redis client
export const redisClient = new Redis(redisConfig);

// Export getter function
export const getRedisClient = () => redisClient;

// Redis connection events
redisClient.on('connect', () => {
  logger.info('✅ Redis connection established', {
    service: 'cart-service',
    component: 'redis',
    status: 'connected',
    host: redisConfig.host,
    port: redisConfig.port,
    db: redisConfig.db,
  });
});

redisClient.on('error', (error) => {
  logger.error('❌ Redis connection error', {
    service: 'cart-service',
    component: 'redis',
    error: error.message,
    stack: error.stack,
  });
});

redisClient.on('ready', () => {
  logger.info('🔴 Redis ready for operations', {
    service: 'cart-service',
    component: 'redis',
    status: 'ready',
  });
});

redisClient.on('reconnecting', () => {
  logger.warn('🔄 Redis reconnecting', {
    service: 'cart-service',
    component: 'redis',
    status: 'reconnecting',
  });
});

redisClient.on('end', () => {
  logger.info('🔴 Redis connection ended', {
    service: 'cart-service',
    component: 'redis',
    status: 'disconnected',
  });
});

// Redis utility functions
export const redisUtils = {
  // Test Redis connection
  async ping(): Promise<boolean> {
    try {
      const result = await redisClient.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis ping failed:', error);
      return false;
    }
  },

  // Get Redis info
  async getInfo(): Promise<any> {
    try {
      const info = await redisClient.info();
      return info;
    } catch (error) {
      logger.error('Failed to get Redis info:', error);
      return null;
    }
  },

  // Get Redis memory usage
  async getMemoryUsage(): Promise<any> {
    try {
      const memory = await redisClient.info('memory');
      return memory;
    } catch (error) {
      logger.error('Failed to get Redis memory usage:', error);
      return null;
    }
  },

  // Flush specific database
  async flushDb(): Promise<boolean> {
    try {
      await redisClient.flushdb();
      return true;
    } catch (error) {
      logger.error('Failed to flush Redis database:', error);
      return false;
    }
  },

  // Get connection status
  getStatus(): string {
    return redisClient.status;
  },

  // Close connection
  async close(): Promise<void> {
    await redisClient.quit();
  },
};

// Export Redis client and utilities
export default redisClient;
