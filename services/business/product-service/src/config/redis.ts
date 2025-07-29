/**
 * Redis Configuration for Product Service
 * Used for caching and session management
 */

import { createClient, RedisClientType } from 'redis';
import { logger } from '@ultramarket/shared/logging/logger';

let redisClient: RedisClientType;

export const initializeRedis = async (): Promise<RedisClientType> => {
  try {
    if (!redisClient) {
      redisClient = createClient({
        url: process.env.REDIS_URL ?? 'redis://localhost:6379',
        retry_delay: 1000,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis reconnection failed after 10 attempts');
              return new Error('Redis reconnection failed');
            }
            return Math.min(retries * 50, 1000);
          }
        }
      });

      redisClient.on('error', (error) => {
        logger.error('Redis Client Error', error);
      });

      redisClient.on('connect', () => {
        logger.info('✅ Redis connected successfully');
      });

      redisClient.on('disconnect', () => {
        logger.warn('⚠️ Redis disconnected');
      });

      await redisClient.connect();
    }

    // Test the connection
    await redisClient.ping();
    
    logger.info('✅ Redis initialized successfully', {
      service: 'product-service',
      url: process.env.REDIS_URL ?? 'redis://localhost:6379'
    });
    
    return redisClient;
  } catch (error) {
    logger.error('❌ Redis connection failed', error);
    throw error;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    if (redisClient) {
      await redisClient.quit();
      logger.info('✅ Redis disconnected successfully');
    }
  } catch (error) {
    logger.error('❌ Redis disconnection failed', error);
    throw error;
  }
};

// Cache helper functions
export const cacheKey = {
  product: (id: string) => `product:${id}`,
  products: (filters: string) => `products:${filters}`,
  category: (id: string) => `category:${id}`,
  categories: () => 'categories:all',
  brand: (id: string) => `brand:${id}`,
  brands: () => 'brands:all',
  search: (query: string) => `search:${query}`,
  metrics: () => 'metrics:product-service'
};

export const cacheConfig = {
  ttl: {
    short: 300,    // 5 minutes
    medium: 1800,  // 30 minutes
    long: 3600     // 1 hour
  }
};

export { redisClient }; 