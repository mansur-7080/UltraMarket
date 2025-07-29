"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const cart_service_1 = require("../services/cart.service");
globals_1.jest.mock('../config/redis', () => ({
    getRedisClient: globals_1.jest.fn(() => ({
        get: globals_1.jest.fn(),
        setEx: globals_1.jest.fn(),
        del: globals_1.jest.fn(),
    })),
}));
globals_1.jest.mock('../utils/logger', () => ({
    logger: {
        error: globals_1.jest.fn(),
        info: globals_1.jest.fn(),
        debug: globals_1.jest.fn(),
    },
}));
(0, globals_1.describe)('CartService', () => {
    let cartService;
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
        cartService = new cart_service_1.CartService();
    });
    (0, globals_1.it)('should be defined', () => {
        (0, globals_1.expect)(cartService).toBeDefined();
    });
    (0, globals_1.it)('should have a getCart method', () => {
        (0, globals_1.expect)(typeof cartService.getCart).toBe('function');
    });
});
//# sourceMappingURL=basic-cart.test.js.map