"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockRedis = void 0;
const globals_1 = require("@jest/globals");
const mockRedisClient = {
    get: globals_1.jest.fn(),
    setEx: globals_1.jest.fn(),
    del: globals_1.jest.fn(),
    connect: globals_1.jest.fn(),
    ping: globals_1.jest.fn(),
    quit: globals_1.jest.fn(),
};
globals_1.jest.mock('redis', () => ({
    createClient: globals_1.jest.fn(() => mockRedisClient),
}));
exports.mockRedis = mockRedisClient;
globals_1.jest.mock('../config/redis', () => ({
    getRedisClient: globals_1.jest.fn(() => mockRedisClient),
    connectRedis: globals_1.jest.fn().mockImplementation(() => Promise.resolve()),
}));
//# sourceMappingURL=redis.mock.js.map