"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cart_service_1 = require("../services/cart.service");
const globals_1 = require("@jest/globals");
globals_1.jest.mock('../config/redis', () => ({
    getRedisClient: globals_1.jest.fn().mockReturnValue({
        get: globals_1.jest.fn(),
        setex: globals_1.jest.fn(),
        del: globals_1.jest.fn(),
    }),
}));
globals_1.jest.mock('../utils/logger');
(0, globals_1.describe)('CartService', () => {
    let cartService;
    let mockRedisClient;
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
        mockRedisClient = {
            get: globals_1.jest.fn(),
            setex: globals_1.jest.fn(),
            del: globals_1.jest.fn(),
        };
        cartService = new cart_service_1.CartService();
        cartService.redisClient = mockRedisClient;
    });
    (0, globals_1.describe)('getCart', () => {
        (0, globals_1.it)('should return a cart from Redis if it exists', async () => {
            const mockCart = {
                userId: 'user123',
                items: [],
                summary: {
                    itemCount: 0,
                    subtotal: 0,
                    tax: 0,
                    shipping: 0,
                    discount: 0,
                    total: 0,
                },
            };
            mockRedisClient.get.mockResolvedValue(JSON.stringify(mockCart));
            const result = await cartService.getCart('user123');
            (0, globals_1.expect)(mockRedisClient.get).toHaveBeenCalledWith('cart:user123');
            (0, globals_1.expect)(result).toEqual(mockCart);
        });
        (0, globals_1.it)('should create a new cart if it does not exist in Redis', async () => {
            mockRedisClient.get.mockResolvedValue(null);
            const result = await cartService.getCart('user123');
            (0, globals_1.expect)(result.userId).toBe('user123');
            (0, globals_1.expect)(result.items).toEqual([]);
            (0, globals_1.expect)(result.summary?.itemCount).toBe(0);
            (0, globals_1.expect)(mockRedisClient.setex).toHaveBeenCalled();
        });
    });
    (0, globals_1.describe)('addItem', () => {
        (0, globals_1.it)('should add an item to an empty cart', async () => {
            const emptyCart = {
                userId: 'user123',
                items: [],
                summary: {
                    itemCount: 0,
                    subtotal: 0,
                    tax: 0,
                    shipping: 0,
                    discount: 0,
                    total: 0,
                },
            };
            mockRedisClient.get.mockResolvedValue(JSON.stringify(emptyCart));
            const newItem = {
                productId: 'prod1',
                productName: 'Test Product',
                price: 10,
                quantity: 2,
            };
            const result = await cartService.addItem('user123', newItem);
            (0, globals_1.expect)(result.items.length).toBe(1);
            (0, globals_1.expect)(result.items[0].productId).toBe('prod1');
            (0, globals_1.expect)(result.items[0].quantity).toBe(2);
            (0, globals_1.expect)(result.summary?.subtotal).toBe(20);
            (0, globals_1.expect)(mockRedisClient.setex).toHaveBeenCalled();
        });
    });
    (0, globals_1.describe)('updateItemQuantity', () => {
        (0, globals_1.it)('should update the quantity of an item', async () => {
            const cart = {
                userId: 'user123',
                items: [
                    {
                        productId: 'prod1',
                        productName: 'Test Product',
                        price: 10,
                        quantity: 1,
                    },
                ],
                summary: {
                    itemCount: 1,
                    subtotal: 10,
                    tax: 0.8,
                    shipping: 0,
                    discount: 0,
                    total: 10.8,
                },
            };
            mockRedisClient.get.mockResolvedValue(JSON.stringify(cart));
            const result = await cartService.updateItemQuantity('user123', 'prod1', 3);
            (0, globals_1.expect)(result.items[0].quantity).toBe(3);
            (0, globals_1.expect)(result.summary?.subtotal).toBe(30);
            (0, globals_1.expect)(mockRedisClient.setex).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=cart.service.simple.test.js.map