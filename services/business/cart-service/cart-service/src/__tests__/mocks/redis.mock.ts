import { jest } from '@jest/globals';

// Create a mock Redis client that implements the methods we use in the CartService
const mockRedisClient = {
  get: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  connect: jest.fn(),
  ping: jest.fn(),
  quit: jest.fn(),
};

// Mock the Redis module and its createClient function
jest.mock('redis', () => ({
  createClient: jest.fn(() => mockRedisClient),
}));

// Export the mock Redis client for use in tests
export const mockRedis = mockRedisClient;

// Mock the redis.ts module
jest.mock('../config/redis', () => ({
  getRedisClient: jest.fn(() => mockRedisClient),
  connectRedis: jest.fn().mockImplementation(() => Promise.resolve()),
}));
