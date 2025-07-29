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
    let mockRedisClient;
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
        cartService = new cart_service_1.CartService();
        mockRedisClient = cartService.redisClient;
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
            (0, globals_1.expect)(mockRedisClient.get).toHaveBeenCalled();
            (0, globals_1.expect)(result).toEqual(mockCart);
        });
        (0, globals_1.it)('should create a new cart if not exists in Redis', async () => {
            mockRedisClient.get.mockResolvedValue(null);
            mockRedisClient.setEx.mockResolvedValue('OK');
            const result = await cartService.getCart('user123');
            (0, globals_1.expect)(mockRedisClient.get).toHaveBeenCalled();
            (0, globals_1.expect)(mockRedisClient.setEx).toHaveBeenCalled();
            (0, globals_1.expect)(result.userId).toBe('user123');
            (0, globals_1.expect)(result.items).toEqual([]);
            (0, globals_1.expect)(result.summary?.itemCount).toBe(0);
        });
    });
    (0, globals_1.describe)('addItem', () => {
        (0, globals_1.it)('should add a new item to cart', async () => {
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
            mockRedisClient.setEx.mockResolvedValue('OK');
            const newItem = {
                productId: 'prod1',
                productName: 'Test Product',
                price: 10,
                quantity: 2,
            };
            const result = await cartService.addItem('user123', newItem);
            (0, globals_1.expect)(mockRedisClient.setEx).toHaveBeenCalled();
            (0, globals_1.expect)(result.items.length).toBe(1);
            (0, globals_1.expect)(result.items[0].productId).toBe('prod1');
            (0, globals_1.expect)(result.items[0].quantity).toBe(2);
            (0, globals_1.expect)(result.summary?.subtotal).toBe(20);
        });
        (0, globals_1.it)('should update quantity if item already exists in cart', async () => {
            const mockCart = {
                userId: 'user123',
                items: [
                    {
                        productId: 'prod1',
                        productName: 'Test Product',
                        price: 10,
                        quantity: 2,
                        subtotal: 20,
                    },
                ],
                summary: {
                    itemCount: 1,
                    subtotal: 20,
                    tax: 1.6,
                    shipping: 0,
                    discount: 0,
                    total: 21.6,
                },
            };
            mockRedisClient.get.mockResolvedValue(JSON.stringify(mockCart));
            mockRedisClient.setEx.mockResolvedValue('OK');
            const additionalItem = {
                productId: 'prod1',
                productName: 'Test Product',
                price: 10,
                quantity: 1,
            };
            const result = await cartService.addItem('user123', additionalItem);
            (0, globals_1.expect)(mockRedisClient.setEx).toHaveBeenCalled();
            (0, globals_1.expect)(result.items.length).toBe(1);
            (0, globals_1.expect)(result.items[0].quantity).toBe(3);
            (0, globals_1.expect)(result.items[0].subtotal).toBe(30);
            (0, globals_1.expect)(result.summary?.subtotal).toBe(30);
        });
    });
    (0, globals_1.describe)('removeItem', () => {
        (0, globals_1.it)('should remove item from cart', async () => {
            const mockCart = {
                userId: 'user123',
                items: [
                    {
                        productId: 'prod1',
                        productName: 'Test Product',
                        price: 10,
                        quantity: 2,
                    },
                ],
                summary: {
                    itemCount: 1,
                    subtotal: 20,
                    tax: 1.6,
                    shipping: 0,
                    discount: 0,
                    total: 21.6,
                },
            };
            mockRedisClient.get.mockResolvedValue(JSON.stringify(mockCart));
            mockRedisClient.setEx.mockResolvedValue('OK');
            const result = await cartService.removeItem('user123', 'prod1');
            (0, globals_1.expect)(mockRedisClient.setEx).toHaveBeenCalled();
            (0, globals_1.expect)(result.items.length).toBe(0);
            (0, globals_1.expect)(result.summary?.itemCount).toBe(0);
            (0, globals_1.expect)(result.summary?.subtotal).toBe(0);
        });
        (0, globals_1.it)('should throw error if item not found in cart', async () => {
            const mockCart = {
                userId: 'user123',
                items: [
                    {
                        productId: 'prod1',
                        productName: 'Test Product',
                        price: 10,
                        quantity: 2,
                    },
                ],
                summary: {
                    itemCount: 1,
                    subtotal: 20,
                    tax: 1.6,
                    shipping: 0,
                    discount: 0,
                    total: 21.6,
                },
            };
            mockRedisClient.get.mockResolvedValue(JSON.stringify(mockCart));
            await (0, globals_1.expect)(cartService.removeItem('user123', 'nonexistent')).rejects.toThrow('Item not found in cart');
        });
    });
    (0, globals_1.describe)('clearCart', () => {
        (0, globals_1.it)('should clear all items from cart', async () => {
            const mockCart = {
                userId: 'user123',
                items: [
                    { productId: 'prod1', productName: 'Product 1', price: 10, quantity: 2 },
                    { productId: 'prod2', productName: 'Product 2', price: 15, quantity: 1 },
                ],
                summary: {
                    itemCount: 2,
                    subtotal: 35,
                    tax: 2.8,
                    shipping: 0,
                    discount: 0,
                    total: 37.8,
                },
            };
            mockRedisClient.get.mockResolvedValue(JSON.stringify(mockCart));
            mockRedisClient.setEx.mockResolvedValue('OK');
            const result = await cartService.clearCart('user123');
            (0, globals_1.expect)(mockRedisClient.setEx).toHaveBeenCalled();
            (0, globals_1.expect)(result.items.length).toBe(0);
            (0, globals_1.expect)(result.summary?.itemCount).toBe(0);
            (0, globals_1.expect)(result.summary?.subtotal).toBe(0);
        });
    });
    (0, globals_1.describe)('updateItemQuantity', () => {
        (0, globals_1.it)('should update item quantity in cart', async () => {
            const mockCart = {
                userId: 'user123',
                items: [
                    {
                        productId: 'prod1',
                        productName: 'Test Product',
                        price: 10,
                        quantity: 2,
                        subtotal: 20,
                    },
                ],
                summary: {
                    itemCount: 1,
                    subtotal: 20,
                    tax: 1.6,
                    shipping: 0,
                    discount: 0,
                    total: 21.6,
                },
            };
            mockRedisClient.get.mockResolvedValue(JSON.stringify(mockCart));
            mockRedisClient.setEx.mockResolvedValue('OK');
            const result = await cartService.updateItemQuantity('user123', 'prod1', 5);
            (0, globals_1.expect)(mockRedisClient.setEx).toHaveBeenCalled();
            (0, globals_1.expect)(result.items[0].quantity).toBe(5);
            (0, globals_1.expect)(result.items[0].subtotal).toBe(50);
            (0, globals_1.expect)(result.summary?.subtotal).toBe(50);
        });
        (0, globals_1.it)('should remove item when updating quantity to 0', async () => {
            const mockCart = {
                userId: 'user123',
                items: [
                    {
                        productId: 'prod1',
                        productName: 'Test Product',
                        price: 10,
                        quantity: 2,
                        subtotal: 20,
                    },
                ],
                summary: {
                    itemCount: 1,
                    subtotal: 20,
                    tax: 1.6,
                    shipping: 0,
                    discount: 0,
                    total: 21.6,
                },
            };
            mockRedisClient.get.mockResolvedValue(JSON.stringify(mockCart));
            mockRedisClient.setEx.mockResolvedValue('OK');
            const result = await cartService.updateItemQuantity('user123', 'prod1', 0);
            (0, globals_1.expect)(mockRedisClient.setEx).toHaveBeenCalled();
            (0, globals_1.expect)(result.items.length).toBe(0);
            (0, globals_1.expect)(result.summary?.itemCount).toBe(0);
        });
    });
    (0, globals_1.describe)('applyCoupon', () => {
        (0, globals_1.it)('should apply percentage discount to cart', async () => {
            const mockCart = {
                userId: 'user123',
                items: [
                    { productId: 'prod1', productName: 'Product 1', price: 50, quantity: 2 },
                    { productId: 'prod2', productName: 'Product 2', price: 25, quantity: 1 },
                ],
                summary: {
                    itemCount: 2,
                    subtotal: 125,
                    tax: 10,
                    shipping: 5,
                    discount: 0,
                    total: 140,
                },
            };
            mockRedisClient.get.mockResolvedValue(JSON.stringify(mockCart));
            mockRedisClient.setEx.mockResolvedValue('OK');
            const mockCoupon = {
                type: 'percentage',
                value: 10,
                minimumPurchase: 100,
            };
            const result = await cartService.applyCoupon('user123', 'SAVE10', mockCoupon);
            (0, globals_1.expect)(mockRedisClient.setEx).toHaveBeenCalled();
            (0, globals_1.expect)(result.summary?.discount).toBe(12.5);
            (0, globals_1.expect)(result.coupon?.code).toBe('SAVE10');
            (0, globals_1.expect)(result.summary?.total).toBeCloseTo(127.5);
        });
        (0, globals_1.it)('should apply fixed discount to cart', async () => {
            const mockCart = {
                userId: 'user123',
                items: [{ productId: 'prod1', productName: 'Product 1', price: 50, quantity: 2 }],
                summary: {
                    itemCount: 1,
                    subtotal: 100,
                    tax: 8,
                    shipping: 5,
                    discount: 0,
                    total: 113,
                },
            };
            mockRedisClient.get.mockResolvedValue(JSON.stringify(mockCart));
            mockRedisClient.setEx.mockResolvedValue('OK');
            const mockCoupon = {
                type: 'fixed',
                value: 15,
            };
            const result = await cartService.applyCoupon('user123', 'FLAT15', mockCoupon);
            (0, globals_1.expect)(mockRedisClient.setEx).toHaveBeenCalled();
            (0, globals_1.expect)(result.summary?.discount).toBe(15);
            (0, globals_1.expect)(result.coupon?.code).toBe('FLAT15');
            (0, globals_1.expect)(result.summary?.total).toBeCloseTo(98);
        });
        (0, globals_1.it)('should throw error if minimum purchase not met', async () => {
            const mockCart = {
                userId: 'user123',
                items: [{ productId: 'prod1', productName: 'Product 1', price: 20, quantity: 1 }],
                summary: {
                    itemCount: 1,
                    subtotal: 20,
                    tax: 1.6,
                    shipping: 5,
                    discount: 0,
                    total: 26.6,
                },
            };
            mockRedisClient.get.mockResolvedValue(JSON.stringify(mockCart));
            const mockCoupon = {
                type: 'percentage',
                value: 10,
                minimumPurchase: 50,
            };
            await (0, globals_1.expect)(cartService.applyCoupon('user123', 'SAVE10', mockCoupon)).rejects.toThrow('Minimum purchase amount of 50 required for this coupon');
        });
    });
    (0, globals_1.describe)('invalidateCache', () => {
        (0, globals_1.it)('should delete the cart from cache', async () => {
            mockRedisClient.del.mockResolvedValue(1);
            await cartService.invalidateCache('user123');
            (0, globals_1.expect)(mockRedisClient.del).toHaveBeenCalledWith('cart:user123');
        });
    });
});
//# sourceMappingURL=cart.service.fixed.test.js.map