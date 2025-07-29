/**
 * Redis Service for UltraMarket
 * Handles caching, session management, and other Redis operations
 */

import Redis from 'ioredis';
import { logger } from '../logging/logger';

// Redis configuration interface
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
  lazyConnect: boolean;
}

// Cache options interface
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

// Session data interface
export interface SessionData {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  lastActivity: number;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class RedisService {
  private client: Redis;
  private config: RedisConfig;
  private defaultTTL: number = 3600; // 1 hour

  constructor() {
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'ultramarket:',
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    };

    this.client = new Redis({
      host: this.config.host,
      port: this.config.port,
      password: this.config.password,
      db: this.config.db,
      keyPrefix: this.config.keyPrefix,
      maxRetriesPerRequest: this.config.maxRetriesPerRequest,
      lazyConnect: this.config.lazyConnect,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.setupEventHandlers();
  }

  /**
   * Setup Redis event handlers
   */
  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      logger.info('Redis client connected');
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
    });

    this.client.on('error', (error) => {
      logger.error('Redis client error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    });

    this.client.on('close', () => {
      logger.warn('Redis client connection closed');
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting');
    });
  }

  /**
   * Get Redis client instance
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * Set cache value
   */
  async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      const ttl = options?.ttl || this.defaultTTL;
      const prefixedKey = options?.prefix ? `${options.prefix}:${key}` : key;

      await this.client.setex(prefixedKey, ttl, serializedValue);

      logger.debug('Cache set successfully', {
        key: prefixedKey,
        ttl,
      });
    } catch (error) {
      logger.error('Failed to set cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        key,
      });
      throw error;
    }
  }

  /**
   * Get cache value
   */
  async get<T = any>(key: string, options?: CacheOptions): Promise<T | null> {
    try {
      const prefixedKey = options?.prefix ? `${options.prefix}:${key}` : key;
      const value = await this.client.get(prefixedKey);

      if (!value) {
        return null;
      }

      const parsedValue = JSON.parse(value);
      logger.debug('Cache get successful', { key: prefixedKey });
      return parsedValue;
    } catch (error) {
      logger.error('Failed to get cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        key,
      });
      return null;
    }
  }

  /**
   * Delete cache value
   */
  async del(key: string, options?: CacheOptions): Promise<number> {
    try {
      const prefixedKey = options?.prefix ? `${options.prefix}:${key}` : key;
      const result = await this.client.del(prefixedKey);

      logger.debug('Cache delete successful', {
        key: prefixedKey,
        deleted: result > 0,
      });

      return result;
    } catch (error) {
      logger.error('Failed to delete cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        key,
      });
      throw error;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    try {
      const prefixedKey = options?.prefix ? `${options.prefix}:${key}` : key;
      const result = await this.client.exists(prefixedKey);

      return result === 1;
    } catch (error) {
      logger.error('Failed to check cache existence', {
        error: error instanceof Error ? error.message : 'Unknown error',
        key,
      });
      return false;
    }
  }

  /**
   * Set cache value with expiration
   */
  async setex(key: string, seconds: number, value: any, options?: CacheOptions): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      const prefixedKey = options?.prefix ? `${options.prefix}:${key}` : key;

      await this.client.setex(prefixedKey, seconds, serializedValue);

      logger.debug('Cache setex successful', {
        key: prefixedKey,
        ttl: seconds,
      });
    } catch (error) {
      logger.error('Failed to setex cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        key,
      });
      throw error;
    }
  }

  /**
   * Get cache TTL
   */
  async ttl(key: string, options?: CacheOptions): Promise<number> {
    try {
      const prefixedKey = options?.prefix ? `${options.prefix}:${key}` : key;
      const result = await this.client.ttl(prefixedKey);

      return result;
    } catch (error) {
      logger.error('Failed to get cache TTL', {
        error: error instanceof Error ? error.message : 'Unknown error',
        key,
      });
      return -1;
    }
  }

  /**
   * Increment counter
   */
  async incr(key: string, options?: CacheOptions): Promise<number> {
    try {
      const prefixedKey = options?.prefix ? `${options.prefix}:${key}` : key;
      const result = await this.client.incr(prefixedKey);

      logger.debug('Cache increment successful', {
        key: prefixedKey,
        value: result,
      });

      return result;
    } catch (error) {
      logger.error('Failed to increment cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        key,
      });
      throw error;
    }
  }

  /**
   * Decrement counter
   */
  async decr(key: string, options?: CacheOptions): Promise<number> {
    try {
      const prefixedKey = options?.prefix ? `${options.prefix}:${key}` : key;
      const result = await this.client.decr(prefixedKey);

      logger.debug('Cache decrement successful', {
        key: prefixedKey,
        value: result,
      });

      return result;
    } catch (error) {
      logger.error('Failed to decrement cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        key,
      });
      throw error;
    }
  }

  /**
   * Set hash field
   */
  async hset(key: string, field: string, value: any, options?: CacheOptions): Promise<number> {
    try {
      const serializedValue = JSON.stringify(value);
      const prefixedKey = options?.prefix ? `${options.prefix}:${key}` : key;
      const result = await this.client.hset(prefixedKey, field, serializedValue);

      logger.debug('Cache hset successful', {
        key: prefixedKey,
        field,
      });

      return result;
    } catch (error) {
      logger.error('Failed to hset cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        key,
        field,
      });
      throw error;
    }
  }

  /**
   * Get hash field
   */
  async hget<T = any>(key: string, field: string, options?: CacheOptions): Promise<T | null> {
    try {
      const prefixedKey = options?.prefix ? `${options.prefix}:${key}` : key;
      const value = await this.client.hget(prefixedKey, field);

      if (!value) {
        return null;
      }

      const parsedValue = JSON.parse(value);
      logger.debug('Cache hget successful', { key: prefixedKey, field });
      return parsedValue;
    } catch (error) {
      logger.error('Failed to hget cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        key,
        field,
      });
      return null;
    }
  }

  /**
   * Get all hash fields
   */
  async hgetall<T = Record<string, any>>(key: string, options?: CacheOptions): Promise<T | null> {
    try {
      const prefixedKey = options?.prefix ? `${options.prefix}:${key}` : key;
      const value = await this.client.hgetall(prefixedKey);

      if (!value || Object.keys(value).length === 0) {
        return null;
      }

      const parsedValue: Record<string, any> = {};
      for (const [field, fieldValue] of Object.entries(value)) {
        try {
          parsedValue[field] = JSON.parse(fieldValue);
        } catch {
          parsedValue[field] = fieldValue;
        }
      }

      logger.debug('Cache hgetall successful', { key: prefixedKey });
      return parsedValue as T;
    } catch (error) {
      logger.error('Failed to hgetall cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        key,
      });
      return null;
    }
  }

  /**
   * Delete hash field
   */
  async hdel(key: string, field: string, options?: CacheOptions): Promise<number> {
    try {
      const prefixedKey = options?.prefix ? `${options.prefix}:${key}` : key;
      const result = await this.client.hdel(prefixedKey, field);

      logger.debug('Cache hdel successful', {
        key: prefixedKey,
        field,
        deleted: result > 0,
      });

      return result;
    } catch (error) {
      logger.error('Failed to hdel cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        key,
        field,
      });
      throw error;
    }
  }

  /**
   * Add to set
   */
  async sadd(key: string, member: string, options?: CacheOptions): Promise<number> {
    try {
      const prefixedKey = options?.prefix ? `${options.prefix}:${key}` : key;
      const result = await this.client.sadd(prefixedKey, member);

      logger.debug('Cache sadd successful', {
        key: prefixedKey,
        member,
      });

      return result;
    } catch (error) {
      logger.error('Failed to sadd cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        key,
        member,
      });
      throw error;
    }
  }

  /**
   * Get set members
   */
  async smembers(key: string, options?: CacheOptions): Promise<string[]> {
    try {
      const prefixedKey = options?.prefix ? `${options.prefix}:${key}` : key;
      const result = await this.client.smembers(prefixedKey);

      logger.debug('Cache smembers successful', {
        key: prefixedKey,
        count: result.length,
      });

      return result;
    } catch (error) {
      logger.error('Failed to smembers cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        key,
      });
      return [];
    }
  }

  /**
   * Remove from set
   */
  async srem(key: string, member: string, options?: CacheOptions): Promise<number> {
    try {
      const prefixedKey = options?.prefix ? `${options.prefix}:${key}` : key;
      const result = await this.client.srem(prefixedKey, member);

      logger.debug('Cache srem successful', {
        key: prefixedKey,
        member,
        removed: result > 0,
      });

      return result;
    } catch (error) {
      logger.error('Failed to srem cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        key,
        member,
      });
      throw error;
    }
  }

  /**
   * Check if member exists in set
   */
  async sismember(key: string, member: string, options?: CacheOptions): Promise<boolean> {
    try {
      const prefixedKey = options?.prefix ? `${options.prefix}:${key}` : key;
      const result = await this.client.sismember(prefixedKey, member);

      return result === 1;
    } catch (error) {
      logger.error('Failed to sismember cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        key,
        member,
      });
      return false;
    }
  }

  // Session Management

  /**
   * Store session data
   */
  async setSession(sessionId: string, sessionData: SessionData, ttl: number = 3600): Promise<void> {
    try {
      const key = `session:${sessionId}`;
      await this.setex(key, ttl, sessionData, { prefix: 'auth' });

      logger.info('Session stored successfully', {
        sessionId,
        userId: sessionData.userId,
        ttl,
      });
    } catch (error) {
      logger.error('Failed to store session', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId,
      });
      throw error;
    }
  }

  /**
   * Get session data
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      const key = `session:${sessionId}`;
      const sessionData = await this.get<SessionData>(key, { prefix: 'auth' });

      if (sessionData) {
        // Update last activity
        sessionData.lastActivity = Date.now();
        await this.setSession(sessionId, sessionData);
      }

      return sessionData;
    } catch (error) {
      logger.error('Failed to get session', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId,
      });
      return null;
    }
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const key = `session:${sessionId}`;
      await this.del(key, { prefix: 'auth' });

      logger.info('Session deleted successfully', { sessionId });
    } catch (error) {
      logger.error('Failed to delete session', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId,
      });
      throw error;
    }
  }

  /**
   * Get user sessions
   */
  async getUserSessions(userId: string): Promise<string[]> {
    try {
      const pattern = `session:*`;
      const keys = await this.client.keys(pattern);
      const sessions: string[] = [];

      for (const key of keys) {
        const sessionData = await this.get<SessionData>(key, { prefix: 'auth' });
        if (sessionData && sessionData.userId === userId) {
          const sessionId = key.replace('ultramarket:auth:session:', '');
          sessions.push(sessionId);
        }
      }

      return sessions;
    } catch (error) {
      logger.error('Failed to get user sessions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      return [];
    }
  }

  /**
   * Delete all user sessions
   */
  async deleteUserSessions(userId: string): Promise<void> {
    try {
      const sessions = await this.getUserSessions(userId);

      for (const sessionId of sessions) {
        await this.deleteSession(sessionId);
      }

      logger.info('All user sessions deleted', { userId, count: sessions.length });
    } catch (error) {
      logger.error('Failed to delete user sessions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      throw error;
    }
  }

  // Rate Limiting

  /**
   * Check rate limit
   */
  async checkRateLimit(
    key: string,
    limit: number,
    window: number
  ): Promise<{
    allowed: boolean;
    remaining: number;
    reset: number;
  }> {
    try {
      const current = await this.incr(key);
      const ttl = await this.ttl(key);

      if (current === 1) {
        await this.client.expire(key, window);
      }

      const remaining = Math.max(0, limit - current);
      const reset = Date.now() + (ttl > 0 ? ttl * 1000 : window * 1000);

      return {
        allowed: current <= limit,
        remaining,
        reset,
      };
    } catch (error) {
      logger.error('Failed to check rate limit', {
        error: error instanceof Error ? error.message : 'Unknown error',
        key,
      });
      return {
        allowed: true,
        remaining: limit,
        reset: Date.now() + window * 1000,
      };
    }
  }

  // Cache Management

  /**
   * Clear cache by pattern
   */
  async clearCache(pattern: string): Promise<number> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      const result = await this.client.del(...keys);

      logger.info('Cache cleared by pattern', {
        pattern,
        keysDeleted: result,
      });

      return result;
    } catch (error) {
      logger.error('Failed to clear cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        pattern,
      });
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    connectedClients: number;
  }> {
    try {
      const info = await this.client.info();
      const lines = info.split('\r\n');
      const stats: Record<string, string> = {};

      for (const line of lines) {
        const [key, value] = line.split(':');
        if (key && value) {
          stats[key] = value;
        }
      }

      const totalKeys = parseInt(stats['db0']?.split(',')[0]?.split('=')[1] || '0');
      const memoryUsage = stats['used_memory_human'] || '0B';
      const connectedClients = parseInt(stats['connected_clients'] || '0');

      return {
        totalKeys,
        memoryUsage,
        connectedClients,
      };
    } catch (error) {
      logger.error('Failed to get Redis stats', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return {
        totalKeys: 0,
        memoryUsage: '0B',
        connectedClients: 0,
      };
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
      logger.error('Redis health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    try {
      await this.client.quit();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Failed to close Redis connection', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
