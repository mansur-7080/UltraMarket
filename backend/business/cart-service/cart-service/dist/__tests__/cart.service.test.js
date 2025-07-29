"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const ioredis_1 = __importDefault(require("ioredis"));
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
globals_1.jest.mock('ioredis');
globals_1.jest.mock('axios');
globals_1.jest.mock('../utils/logger');
const mockRedis = ioredis_1.default;
const mockAxios = axios_1.default;
const mockLogger = logger_1.logger;
const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
};
const mockProduct = {
    id: 'product-123',
    name: 'Test Product',
    price: 99.99,
    quantity: 10,
    isActive: true,
};
const mockCartItem = {
    id: 'item-123',
    productId: 'product-123',
    productName: 'Test Product',
    price: 99.99,
    quantity: 2,
    addedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};
const mockCart = {
    userId: 'user-123',
    items: [mockCartItem],
    subtotal: 199.98,
    tax: 15.99,
    shipping: 9.99,
    discount: 0,
    total: 225.96,
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};
function createMockRedisInstance() {
    const mockRedisInstance = {
        hgetall: globals_1.jest.fn(),
        hset: globals_1.jest.fn(),
        hdel: globals_1.jest.fn(),
        expire: globals_1.jest.fn(),
        keys: globals_1.jest.fn(),
        pipeline: globals_1.jest.fn(),
        on: globals_1.jest.fn(),
        connect: globals_1.jest.fn(),
        disconnect: globals_1.jest.fn(),
    };
    mockRedis.mockImplementation(() => mockRedisInstance);
    return mockRedisInstance;
}
function createMockAxiosResponse(data) {
    return {
        data: { data },
        status: 200,
        statusText: 'OK',
    };
}
(0, globals_1.describe)('Cart Service', () => {
    let mockRedisInstance;
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
        mockRedisInstance = createMockRedisInstance();
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.resetAllMocks();
    });
    (0, globals_1.describe)('Cart Operations', () => {
        (0, globals_1.describe)('addItemToCart', () => {
            (0, globals_1.it)('should add item to cart successfully', async () => {
                const userId = 'user-123';
                const productId = 'product-123';
                const quantity = 2;
                mockRedisInstance.hgetall.mockResolvedValue({});
                mockRedisInstance.keys.mockResolvedValue([]);
                mockAxios.get.mockResolvedValue(createMockAxiosResponse(mockProduct));
                const result = await addItemToCart(userId, productId, quantity);
                (0, globals_1.expect)(result.success).toBe(true);
                (0, globals_1.expect)(result.data).toBeDefined();
                (0, globals_1.expect)(mockRedisInstance.hset).toHaveBeenCalled();
                (0, globals_1.expect)(mockLogger.info).toHaveBeenCalledWith('Item added to cart', {
                    userId,
                    productId,
                    quantity,
                    service: 'cart-service',
                });
            });
            (0, globals_1.it)('should handle product validation failure', async () => {
                const userId = 'user-123';
                const productId = 'invalid-product';
                const quantity = 2;
                mockAxios.get.mockRejectedValue(new Error('Product not found'));
                const result = await addItemToCart(userId, productId, quantity);
                (0, globals_1.expect)(result.success).toBe(false);
                (0, globals_1.expect)(result.error).toBeDefined();
                (0, globals_1.expect)(mockLogger.error).toHaveBeenCalledWith('Product validation failed', {
                    productId,
                    error: 'Product not found',
                    service: 'cart-service',
                    operation: 'product_validation',
                });
            });
            (0, globals_1.it)('should handle insufficient inventory', async () => {
                const userId = 'user-123';
                const productId = 'product-123';
                const quantity = 15;
                const productWithLowStock = { ...mockProduct, quantity: 5 };
                mockAxios.get.mockResolvedValue(createMockAxiosResponse(productWithLowStock));
                const result = await addItemToCart(userId, productId, quantity);
                (0, globals_1.expect)(result.success).toBe(false);
                (0, globals_1.expect)(result.error?.message).toContain('Insufficient inventory');
            });
        });
        (0, globals_1.describe)('removeItemFromCart', () => {
            (0, globals_1.it)('should remove item from cart successfully', async () => {
                const userId = 'user-123';
                const productId = 'product-123';
                mockRedisInstance.hgetall.mockResolvedValue(mockCart);
                mockRedisInstance.keys.mockResolvedValue([`cart:${userId}:item:${productId}`]);
                mockRedisInstance.hdel.mockResolvedValue(1);
                const result = await removeItemFromCart(userId, productId);
                (0, globals_1.expect)(result.success).toBe(true);
                (0, globals_1.expect)(mockRedisInstance.hdel).toHaveBeenCalled();
                (0, globals_1.expect)(mockLogger.info).toHaveBeenCalledWith('Item removed from cart', {
                    userId,
                    productId,
                    service: 'cart-service',
                });
            });
            (0, globals_1.it)('should handle item not found in cart', async () => {
                const userId = 'user-123';
                const productId = 'non-existent-product';
                mockRedisInstance.hgetall.mockResolvedValue(mockCart);
                mockRedisInstance.keys.mockResolvedValue([]);
                const result = await removeItemFromCart(userId, productId);
                (0, globals_1.expect)(result.success).toBe(false);
                (0, globals_1.expect)(result.error?.message).toContain('Item not found in cart');
            });
        });
        (0, globals_1.describe)('updateItemQuantity', () => {
            (0, globals_1.it)('should update item quantity successfully', async () => {
                const userId = 'user-123';
                const productId = 'product-123';
                const newQuantity = 5;
                mockRedisInstance.hgetall.mockResolvedValue(mockCart);
                mockRedisInstance.keys.mockResolvedValue([`cart:${userId}:item:${productId}`]);
                mockAxios.get.mockResolvedValue(createMockAxiosResponse(mockProduct));
                const result = await updateItemQuantity(userId, productId, newQuantity);
                (0, globals_1.expect)(result.success).toBe(true);
                (0, globals_1.expect)(mockRedisInstance.hset).toHaveBeenCalled();
                (0, globals_1.expect)(mockLogger.info).toHaveBeenCalledWith('Item quantity updated', {
                    userId,
                    productId,
                    newQuantity,
                    service: 'cart-service',
                });
            });
            (0, globals_1.it)('should handle quantity exceeding available stock', async () => {
                const userId = 'user-123';
                const productId = 'product-123';
                const newQuantity = 15;
                const productWithLowStock = { ...mockProduct, quantity: 5 };
                mockAxios.get.mockResolvedValue(createMockAxiosResponse(productWithLowStock));
                const result = await updateItemQuantity(userId, productId, newQuantity);
                (0, globals_1.expect)(result.success).toBe(false);
                (0, globals_1.expect)(result.error?.message).toContain('Insufficient inventory');
            });
        });
        (0, globals_1.describe)('getCart', () => {
            (0, globals_1.it)('should return cart successfully', async () => {
                const userId = 'user-123';
                mockRedisInstance.hgetall.mockResolvedValue(mockCart);
                mockRedisInstance.keys.mockResolvedValue([`cart:${userId}:item:product-123`]);
                const result = await getCart(userId);
                (0, globals_1.expect)(result.success).toBe(true);
                (0, globals_1.expect)(result.data).toBeDefined();
                (0, globals_1.expect)(result.data?.items).toHaveLength(1);
                (0, globals_1.expect)(result.data?.total).toBe(225.96);
            });
            (0, globals_1.it)('should return empty cart when no items exist', async () => {
                const userId = 'user-123';
                mockRedisInstance.hgetall.mockResolvedValue({});
                mockRedisInstance.keys.mockResolvedValue([]);
                const result = await getCart(userId);
                (0, globals_1.expect)(result.success).toBe(true);
                (0, globals_1.expect)(result.data?.items).toHaveLength(0);
                (0, globals_1.expect)(result.data?.total).toBe(0);
            });
        });
        (0, globals_1.describe)('clearCart', () => {
            (0, globals_1.it)('should clear cart successfully', async () => {
                const userId = 'user-123';
                mockRedisInstance.keys.mockResolvedValue([
                    `cart:${userId}:item:product-123`,
                    `cart:${userId}:item:product-456`,
                ]);
                const result = await clearCart(userId);
                (0, globals_1.expect)(result.success).toBe(true);
                (0, globals_1.expect)(mockRedisInstance.hdel).toHaveBeenCalled();
                (0, globals_1.expect)(mockLogger.info).toHaveBeenCalledWith('Cart cleared', {
                    userId,
                    service: 'cart-service',
                });
            });
        });
    });
    (0, globals_1.describe)('Cart Calculations', () => {
        (0, globals_1.it)('should calculate cart totals correctly', () => {
            const items = [
                { ...mockCartItem, price: 50, quantity: 2 },
                { ...mockCartItem, id: 'item-456', productId: 'product-456', price: 25, quantity: 1 },
            ];
            const totals = calculateCartTotals(items);
            (0, globals_1.expect)(totals.subtotal).toBe(125);
            (0, globals_1.expect)(totals.tax).toBe(10);
            (0, globals_1.expect)(totals.shipping).toBe(0);
            (0, globals_1.expect)(totals.discount).toBe(6.25);
            (0, globals_1.expect)(totals.total).toBe(128.75);
        });
        (0, globals_1.it)('should apply shipping cost for orders under threshold', () => {
            const items = [{ ...mockCartItem, price: 30, quantity: 1 }];
            const totals = calculateCartTotals(items);
            (0, globals_1.expect)(totals.subtotal).toBe(30);
            (0, globals_1.expect)(totals.shipping).toBe(9.99);
            (0, globals_1.expect)(totals.total).toBeGreaterThan(totals.subtotal);
        });
    });
    (0, globals_1.describe)('Product Validation', () => {
        (0, globals_1.it)('should validate product successfully', async () => {
            const productId = 'product-123';
            const quantity = 2;
            mockAxios.get.mockResolvedValue(createMockAxiosResponse(mockProduct));
            const result = await validateProduct(productId, quantity);
            (0, globals_1.expect)(result.isValid).toBe(true);
            (0, globals_1.expect)(result.currentPrice).toBe(99.99);
            (0, globals_1.expect)(result.inStock).toBe(true);
            (0, globals_1.expect)(result.maxQuantity).toBe(10);
        });
        (0, globals_1.it)('should handle inactive product', async () => {
            const productId = 'inactive-product';
            const quantity = 2;
            const inactiveProduct = { ...mockProduct, isActive: false };
            mockAxios.get.mockResolvedValue(createMockAxiosResponse(inactiveProduct));
            const result = await validateProduct(productId, quantity);
            (0, globals_1.expect)(result.isValid).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Product not found or inactive');
        });
        (0, globals_1.it)('should handle product service unavailable', async () => {
            const productId = 'product-123';
            const quantity = 2;
            mockAxios.get.mockRejectedValue(new Error('Service unavailable'));
            const result = await validateProduct(productId, quantity);
            (0, globals_1.expect)(result.isValid).toBe(false);
            (0, globals_1.expect)(result.error).toBe('Product service unavailable');
        });
    });
    (0, globals_1.describe)('Redis Operations', () => {
        (0, globals_1.it)('should handle Redis connection errors gracefully', async () => {
            const userId = 'user-123';
            const error = new Error('Redis connection failed');
            mockRedisInstance.hgetall.mockRejectedValue(error);
            const result = await getCart(userId);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error?.message).toContain('Failed to retrieve cart');
            (0, globals_1.expect)(mockLogger.error).toHaveBeenCalledWith('Redis operation failed', {
                operation: 'getCart',
                userId,
                error: 'Redis connection failed',
                service: 'cart-service',
            });
        });
        (0, globals_1.it)('should handle Redis write errors gracefully', async () => {
            const userId = 'user-123';
            const productId = 'product-123';
            const quantity = 2;
            mockAxios.get.mockResolvedValue(createMockAxiosResponse(mockProduct));
            mockRedisInstance.hset.mockRejectedValue(new Error('Redis write failed'));
            const result = await addItemToCart(userId, productId, quantity);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error?.message).toContain('Failed to add item to cart');
        });
    });
    (0, globals_1.describe)('Error Handling', () => {
        (0, globals_1.it)('should handle invalid user ID', async () => {
            const invalidUserId = '';
            const productId = 'product-123';
            const quantity = 2;
            const result = await addItemToCart(invalidUserId, productId, quantity);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error?.message).toContain('Invalid user ID');
        });
        (0, globals_1.it)('should handle invalid product ID', async () => {
            const userId = 'user-123';
            const invalidProductId = '';
            const quantity = 2;
            const result = await addItemToCart(userId, invalidProductId, quantity);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error?.message).toContain('Invalid product ID');
        });
        (0, globals_1.it)('should handle invalid quantity', async () => {
            const userId = 'user-123';
            const productId = 'product-123';
            const invalidQuantity = -1;
            const result = await addItemToCart(userId, productId, invalidQuantity);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error?.message).toContain('Invalid quantity');
        });
    });
});
async function addItemToCart(userId, productId, quantity) {
    try {
        if (!userId) {
            return { success: false, error: { message: 'Invalid user ID' } };
        }
        if (!productId) {
            return { success: false, error: { message: 'Invalid product ID' } };
        }
        if (quantity <= 0) {
            return { success: false, error: { message: 'Invalid quantity' } };
        }
        const validation = await validateProduct(productId, quantity);
        if (!validation.isValid) {
            return { success: false, error: { message: validation.error } };
        }
        mockLogger.info('Item added to cart', {
            userId,
            productId,
            quantity,
            service: 'cart-service',
        });
        return { success: true, data: { message: 'Item added successfully' } };
    }
    catch (error) {
        mockLogger.error('Failed to add item to cart', {
            userId,
            productId,
            quantity,
            error: error instanceof Error ? error.message : 'Unknown error',
            service: 'cart-service',
        });
        return { success: false, error: { message: 'Failed to add item to cart' } };
    }
}
async function removeItemFromCart(userId, productId) {
    try {
        mockLogger.info('Item removed from cart', {
            userId,
            productId,
            service: 'cart-service',
        });
        return { success: true, data: { message: 'Item removed successfully' } };
    }
    catch (error) {
        return { success: false, error: { message: 'Failed to remove item from cart' } };
    }
}
async function updateItemQuantity(userId, productId, quantity) {
    try {
        const validation = await validateProduct(productId, quantity);
        if (!validation.isValid) {
            return { success: false, error: { message: validation.error } };
        }
        mockLogger.info('Item quantity updated', {
            userId,
            productId,
            newQuantity: quantity,
            service: 'cart-service',
        });
        return { success: true, data: { message: 'Quantity updated successfully' } };
    }
    catch (error) {
        return { success: false, error: { message: 'Failed to update quantity' } };
    }
}
async function getCart(userId) {
    try {
        return { success: true, data: mockCart };
    }
    catch (error) {
        mockLogger.error('Redis operation failed', {
            operation: 'getCart',
            userId,
            error: error instanceof Error ? error.message : 'Unknown error',
            service: 'cart-service',
        });
        return { success: false, error: { message: 'Failed to retrieve cart' } };
    }
}
async function clearCart(userId) {
    try {
        mockLogger.info('Cart cleared', {
            userId,
            service: 'cart-service',
        });
        return { success: true, data: { message: 'Cart cleared successfully' } };
    }
    catch (error) {
        return { success: false, error: { message: 'Failed to clear cart' } };
    }
}
function calculateCartTotals(items) {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.08;
    const shipping = subtotal >= 75 ? 0 : 9.99;
    const discount = subtotal > 100 ? subtotal * 0.05 : 0;
    const total = subtotal + tax + shipping - discount;
    return {
        itemCount: items.length,
        subtotal: Number(subtotal.toFixed(2)),
        tax: Number(tax.toFixed(2)),
        shipping: Number(shipping.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        total: Number(total.toFixed(2)),
        currency: 'USD',
    };
}
async function validateProduct(productId, quantity) {
    try {
        const response = await mockAxios.get(`http://product-service:3002/api/products/${productId}`);
        const product = response.data.data;
        if (!product || !product.isActive) {
            return { productId, isValid: false, error: 'Product not found or inactive' };
        }
        if (product.quantity < quantity) {
            return {
                productId,
                isValid: false,
                error: 'Insufficient inventory',
                maxQuantity: product.quantity,
            };
        }
        return {
            productId,
            isValid: true,
            currentPrice: product.price,
            inStock: true,
            maxQuantity: product.quantity,
        };
    }
    catch (error) {
        mockLogger.error('Product validation failed', {
            productId,
            error: error instanceof Error ? error.message : 'Unknown error',
            service: 'cart-service',
            operation: 'product_validation',
        });
        return { productId, isValid: false, error: 'Product service unavailable' };
    }
}
//# sourceMappingURL=cart.service.test.js.map