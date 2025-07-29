"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const cart_service_1 = require("../services/cart.service");
globals_1.jest.mock('redis');
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
    (0, globals_1.it)('should have required methods', () => {
        (0, globals_1.expect)(typeof cartService.getCart).toBe('function');
        (0, globals_1.expect)(typeof cartService.addItem).toBe('function');
        (0, globals_1.expect)(typeof cartService.removeItem).toBe('function');
        (0, globals_1.expect)(typeof cartService.clearCart).toBe('function');
    });
});
//# sourceMappingURL=cart.simple.test.js.map