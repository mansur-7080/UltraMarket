"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const cart_service_1 = require("../services/cart.service");
const logger_1 = require("../utils/logger");
globals_1.jest.mock('../config/redis', () => ({
    getRedisClient: globals_1.jest.fn().mockReturnValue({
        get: globals_1.jest.fn(),
        setex: globals_1.jest.fn(),
        del: globals_1.jest.fn(),
    }),
}));
globals_1.jest.mock('../utils/logger');
const mockLogger = logger_1.logger;
describe('CartService', () => {
    let cartService;
    let mockRedisClient;
    beforeEach(() => {
        globals_1.jest.clearAllMocks();
        mockRedisClient = {
            get: globals_1.jest.fn(),
            setex: globals_1.jest.fn(),
            del: globals_1.jest.fn(),
        };
        cartService = new cart_service_1.CartService();
        cartService.redisClient = mockRedisClient;
    });
    describe('getCart', () => {
        const userId = 'user-123';
        it('should return existing cart from Redis', async () => {
            const mockCartData = {
                id: 'cart-123',
                userId,
                items: [
                    {
                        id: 'item-1',
                        productId: 'product-1',
                        productName: 'iPhone 15 Pro',
                        price: 999.99,
                        quantity: 2,
                        subtotal: 1999.98,
                    },
                ],
                summary: {
                    itemCount: 1,
                    subtotal: 1999.98,
                    tax: 159.99,
                    shipping: 0,
                    discount: 0,
                    total: 2159.97,
                },
                updatedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            };
            mockRedisClient.get.mockResolvedValue(JSON.stringify(mockCartData));
            const result = await cartService.getCart(userId);
            (0, globals_1.expect)(mockRedisClient.get).toHaveBeenCalledWith(`cart:${userId}`);
            (0, globals_1.expect)(result).toEqual(mockCartData);
        });
        it('should create new empty cart if not exists', async () => {
            mockRedisClient.get.mockResolvedValue(null);
            mockRedisClient.setex.mockResolvedValue('OK');
            const result = await cartService.getCart(userId);
            (0, globals_1.expect)(mockRedisClient.get).toHaveBeenCalledWith(`cart:${userId}`);
            (0, globals_1.expect)(result).toMatchObject({
                userId,
                items: [],
                summary: {
                    itemCount: 0,
                    subtotal: 0,
                    tax: 0,
                    shipping: 0,
                    discount: 0,
                    total: 0,
                },
            });
            (0, globals_1.expect)(mockRedisClient.setex).toHaveBeenCalled();
        });
    });
    describe('addItem', () => {
        const userId = 'user-123';
        const productData = {
            productId: 'product-1',
            productName: 'iPhone 15 Pro',
            price: 999.99,
            quantity: 1,
        };
        it('should add item to cart', async () => {
            const emptyCart = {
                userId,
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
            const result = await cartService.addItem(userId, productData);
            (0, globals_1.expect)(result.items.length).toBe(1);
            (0, globals_1.expect)(result.items[0].productId).toBe('product-1');
            if (result.summary) {
                (0, globals_1.expect)(result.summary.itemCount).toBe(1);
                (0, globals_1.expect)(result.summary.subtotal).toBeCloseTo(999.99);
            }
        });
    });
    describe('updateItem', () => {
        const userId = 'user-123';
        const itemId = 'product-1';
        it('should update item quantity', async () => {
            const existingCart = {
                userId,
                items: [
                    {
                        productId: 'product-1',
                        productName: 'iPhone 15 Pro',
                        price: 999.99,
                        quantity: 1,
                        subtotal: 999.99,
                    },
                ],
                summary: {
                    itemCount: 1,
                    subtotal: 999.99,
                    tax: 0,
                    shipping: 0,
                    discount: 0,
                    total: 999.99,
                },
            };
            mockRedisClient.get.mockResolvedValue(JSON.stringify(existingCart));
            const result = await cartService.updateItem(userId, itemId, { quantity: 3 });
            (0, globals_1.expect)(result.items[0]?.quantity).toBe(3);
            (0, globals_1.expect)(result.items[0]?.subtotal).toBeCloseTo(2999.97);
            if (result.summary) {
                (0, globals_1.expect)(result.summary.subtotal).toBeCloseTo(2999.97);
            }
        });
    });
    describe('removeItem', () => {
        const userId = 'user-123';
        const itemId = 'product-1';
        it('should remove item from cart', async () => {
            const existingCart = {
                userId,
                items: [
                    {
                        id: 'item-1',
                        productId: 'product-1',
                        productName: 'iPhone 15 Pro',
                        price: 999.99,
                        quantity: 1,
                    },
                    {
                        id: 'item-2',
                        productId: 'product-2',
                        productName: 'AirPods Pro',
                        price: 249.99,
                        quantity: 2,
                    },
                ],
                summary: {
                    itemCount: 2,
                    subtotal: 1499.97,
                    tax: 120.0,
                    shipping: 0,
                    discount: 0,
                    total: 1619.97,
                },
            };
            mockRedisClient.get.mockResolvedValue(JSON.stringify(existingCart));
            const result = await cartService.removeItem(userId, itemId);
            (0, globals_1.expect)(result.items.length).toBe(1);
            (0, globals_1.expect)(result.items[0]?.id).toBe('item-2');
            if (result.summary) {
                (0, globals_1.expect)(result.summary.itemCount).toBe(1);
                (0, globals_1.expect)(result.summary.subtotal).toBeCloseTo(499.98);
            }
        });
    });
    describe('applyCoupon', () => {
        const userId = 'user-123';
        const couponCode = 'SUMMER20';
        it('should apply percentage discount coupon', async () => {
            const existingCart = {
                userId,
                items: [
                    {
                        productId: 'product-1',
                        productName: 'iPhone 15 Pro',
                        price: 1000,
                        quantity: 1,
                    },
                ],
                summary: {
                    itemCount: 1,
                    subtotal: 1000,
                    tax: 80,
                    shipping: 0,
                    discount: 0,
                    total: 1080,
                },
            };
            mockRedisClient.get.mockResolvedValue(JSON.stringify(existingCart));
            const mockCoupon = {
                type: 'percentage',
                value: 20,
                minimumPurchase: 500,
            };
            const result = await cartService.applyCoupon(userId, couponCode, mockCoupon);
            if (result.summary) {
                (0, globals_1.expect)(result.summary.discount).toBe(200.0);
                (0, globals_1.expect)(result.summary.total).toBeCloseTo(880.0);
            }
            (0, globals_1.expect)(result.coupon).toEqual({
                code: couponCode,
                discount: 200,
            });
        });
    });
});
//# sourceMappingURL=cart.service.test.fixed.js.map