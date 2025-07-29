"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const mockRedisClient = {
    get: globals_1.jest.fn(),
    setEx: globals_1.jest.fn(),
    setex: globals_1.jest.fn(),
    del: globals_1.jest.fn(),
    connect: globals_1.jest.fn().mockImplementation(() => Promise.resolve()),
    ping: globals_1.jest.fn().mockImplementation(() => Promise.resolve('PONG')),
    quit: globals_1.jest.fn().mockImplementation(() => Promise.resolve()),
};
const redis = {
    createClient: globals_1.jest.fn().mockReturnValue(mockRedisClient),
};
module.exports = redis;
//# sourceMappingURL=redis.js.map