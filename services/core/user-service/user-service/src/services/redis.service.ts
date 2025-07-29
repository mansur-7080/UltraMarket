import Redis from 'ioredis';
import { logger } from '../utils/logger';

export class RedisService {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });

    this.client.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });

    this.client.on('connect', () => {
      logger.info('Connected to Redis');
    });
  }

  /**
   * Set refresh token for user
   */
  async setRefreshToken(userId: string, token: string): Promise<void> {
    try {
      const key = `refresh_token:${userId}`;
      await this.client.setex(key, 7 * 24 * 60 * 60, token); // 7 days
      logger.debug(`Refresh token stored for user: ${userId}`);
    } catch (error) {
      logger.error('Error setting refresh token:', error);
      throw error;
    }
  }

  /**
   * Get refresh token for user
   */
  async getRefreshToken(userId: string): Promise<string | null> {
    try {
      const key = `refresh_token:${userId}`;
      const token = await this.client.get(key);
      return token;
    } catch (error) {
      logger.error('Error getting refresh token:', error);
      throw error;
    }
  }

  /**
   * Remove refresh token for user
   */
  async removeRefreshToken(userId: string): Promise<void> {
    try {
      const key = `refresh_token:${userId}`;
      await this.client.del(key);
      logger.debug(`Refresh token removed for user: ${userId}`);
    } catch (error) {
      logger.error('Error removing refresh token:', error);
      throw error;
    }
  }

  /**
   * Invalidate all tokens for user
   */
  async invalidateUserTokens(userId: string): Promise<void> {
    try {
      const pattern = `refresh_token:${userId}`;
      const keys = await this.client.keys(pattern);

      if (keys.length > 0) {
        await this.client.del(...keys);
        logger.debug(`All tokens invalidated for user: ${userId}`);
      }
    } catch (error) {
      logger.error('Error invalidating user tokens:', error);
      throw error;
    }
  }

  /**
   * Store user session
   */
  async setUserSession(sessionId: string, userData: Record<string, unknown>): Promise<void> {
    try {
      const key = `session:${sessionId}`;
      await this.client.setex(key, 24 * 60 * 60, JSON.stringify(userData)); // 24 hours
      logger.debug(`User session stored: ${sessionId}`);
    } catch (error) {
      logger.error('Error setting user session:', error);
      throw error;
    }
  }

  /**
   * Get user session
   */
  async getUserSession(sessionId: string): Promise<Record<string, unknown> | null> {
    try {
      const key = `session:${sessionId}`;
      const sessionData = await this.client.get(key);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      logger.error('Error getting user session:', error);
      throw error;
    }
  }

  /**
   * Remove user session
   */
  async removeUserSession(sessionId: string): Promise<void> {
    try {
      const key = `session:${sessionId}`;
      await this.client.del(key);
      logger.debug(`User session removed: ${sessionId}`);
    } catch (error) {
      logger.error('Error removing user session:', error);
      throw error;
    }
  }

  /**
   * Store rate limit data
   */
  async setRateLimit(key: string, limit: number, window: number): Promise<void> {
    try {
      await this.client.setex(key, window, limit.toString());
      logger.debug(`Rate limit set: ${key}`);
    } catch (error) {
      logger.error('Error setting rate limit:', error);
      throw error;
    }
  }

  /**
   * Get rate limit data
   */
  async getRateLimit(key: string): Promise<number> {
    try {
      const value = await this.client.get(key);
      return value ? parseInt(value) : 0;
    } catch (error) {
      logger.error('Error getting rate limit:', error);
      throw error;
    }
  }

  /**
   * Decrement rate limit
   */
  async decrementRateLimit(key: string): Promise<number> {
    try {
      const result = await this.client.decr(key);
      return result;
    } catch (error) {
      logger.error('Error decrementing rate limit:', error);
      throw error;
    }
  }

  /**
   * Store cache data
   */
  async setCache(key: string, data: unknown, ttl: number = 3600): Promise<void> {
    try {
      await this.client.setex(key, ttl, JSON.stringify(data));
      logger.debug(`Cache set: ${key}`);
    } catch (error) {
      logger.error('Error setting cache:', error);
      throw error;
    }
  }

  /**
   * Get cache data
   */
  async getCache<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Error getting cache:', error);
      throw error;
    }
  }

  /**
   * Remove cache data
   */
  async removeCache(key: string): Promise<void> {
    try {
      await this.client.del(key);
      logger.debug(`Cache removed: ${key}`);
    } catch (error) {
      logger.error('Error removing cache:', error);
      throw error;
    }
  }

  /**
   * Clear cache by pattern
   */
  async clearCacheByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
        logger.debug(`Cache cleared for pattern: ${pattern}`);
      }
    } catch (error) {
      logger.error('Error clearing cache by pattern:', error);
      throw error;
    }
  }

  /**
   * Store user preferences
   */
  async setUserPreferences(userId: string, preferences: Record<string, unknown>): Promise<void> {
    try {
      const key = `user_preferences:${userId}`;
      await this.client.setex(key, 30 * 24 * 60 * 60, JSON.stringify(preferences)); // 30 days
      logger.debug(`User preferences stored: ${userId}`);
    } catch (error) {
      logger.error('Error setting user preferences:', error);
      throw error;
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<Record<string, unknown> | null> {
    try {
      const key = `user_preferences:${userId}`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Error getting user preferences:', error);
      throw error;
    }
  }

  /**
   * Store temporary data
   */
  async setTempData(key: string, data: unknown, ttl: number = 300): Promise<void> {
    try {
      await this.client.setex(key, ttl, JSON.stringify(data));
      logger.debug(`Temporary data stored: ${key}`);
    } catch (error) {
      logger.error('Error setting temporary data:', error);
      throw error;
    }
  }

  /**
   * Get temporary data
   */
  async getTempData<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Error getting temporary data:', error);
      throw error;
    }
  }

  /**
   * Get Redis statistics
   */
  async getStats(): Promise<Record<string, unknown>> {
    try {
      const info = await this.client.info();
      const stats: Record<string, unknown> = {};

      info.split('\r\n').forEach((line) => {
        const [key, value] = line.split(':');
        if (key && value) {
          stats[key] = value;
        }
      });

      return stats;
    } catch (error) {
      logger.error('Error getting Redis stats:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
      throw error;
    }
  }
}
