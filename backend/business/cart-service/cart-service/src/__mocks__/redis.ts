import { jest } from '@jest/globals';

// Define a proper mock client type
const mockRedisClient = {
  get: jest.fn(),
  setEx: jest.fn(),
  setex: jest.fn(), // Add for backward compatibility
  del: jest.fn(),
  connect: jest.fn().mockImplementation(() => Promise.resolve()),
  ping: jest.fn().mockImplementation(() => Promise.resolve('PONG')),
  quit: jest.fn().mockImplementation(() => Promise.resolve()),
};

const redis = {
  createClient: jest.fn().mockReturnValue(mockRedisClient),
};

module.exports = redis;
