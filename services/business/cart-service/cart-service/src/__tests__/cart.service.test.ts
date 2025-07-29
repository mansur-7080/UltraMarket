/**
 * Cart Service Tests
 * Comprehensive test suite for cart service functionality
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import Redis from 'ioredis';
import axios from 'axios';
import { logger } from '../utils/logger';

// Mock external dependencies
jest.mock('ioredis');
jest.mock('axios');
jest.mock('../utils/logger');

const mockRedis = Redis as jest.MockedClass<typeof Redis>;
const mockAxios = axios as jest.Mocked<typeof axios>;
const mockLogger = logger as jest.Mocked<typeof logger>;

// Mock data
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

// Test utilities
function createMockRedisInstance() {
  const mockRedisInstance = {
    hgetall: jest.fn(),
    hset: jest.fn(),
    hdel: jest.fn(),
    expire: jest.fn(),
    keys: jest.fn(),
    pipeline: jest.fn(),
    on: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  };

  mockRedis.mockImplementation(() => mockRedisInstance as any);
  return mockRedisInstance;
}

function createMockAxiosResponse(data: any) {
  return {
    data: { data },
    status: 200,
    statusText: 'OK',
  };
}

// Test suite
describe('Cart Service', () => {
  let mockRedisInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisInstance = createMockRedisInstance();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Cart Operations', () => {
    describe('addItemToCart', () => {
      it('should add item to cart successfully', async () => {
        // Arrange
        const userId = 'user-123';
        const productId = 'product-123';
        const quantity = 2;

        mockRedisInstance.hgetall.mockResolvedValue({});
        mockRedisInstance.keys.mockResolvedValue([]);
        mockAxios.get.mockResolvedValue(createMockAxiosResponse(mockProduct));

        // Act
        const result = await addItemToCart(userId, productId, quantity);

        // Assert
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(mockRedisInstance.hset).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith('Item added to cart', {
          userId,
          productId,
          quantity,
          service: 'cart-service',
        });
      });

      it('should handle product validation failure', async () => {
        // Arrange
        const userId = 'user-123';
        const productId = 'invalid-product';
        const quantity = 2;

        mockAxios.get.mockRejectedValue(new Error('Product not found'));

        // Act
        const result = await addItemToCart(userId, productId, quantity);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(mockLogger.error).toHaveBeenCalledWith('Product validation failed', {
          productId,
          error: 'Product not found',
          service: 'cart-service',
          operation: 'product_validation',
        });
      });

      it('should handle insufficient inventory', async () => {
        // Arrange
        const userId = 'user-123';
        const productId = 'product-123';
        const quantity = 15; // More than available

        const productWithLowStock = { ...mockProduct, quantity: 5 };
        mockAxios.get.mockResolvedValue(createMockAxiosResponse(productWithLowStock));

        // Act
        const result = await addItemToCart(userId, productId, quantity);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('Insufficient inventory');
      });
    });

    describe('removeItemFromCart', () => {
      it('should remove item from cart successfully', async () => {
        // Arrange
        const userId = 'user-123';
        const productId = 'product-123';

        mockRedisInstance.hgetall.mockResolvedValue(mockCart);
        mockRedisInstance.keys.mockResolvedValue([`cart:${userId}:item:${productId}`]);
        mockRedisInstance.hdel.mockResolvedValue(1);

        // Act
        const result = await removeItemFromCart(userId, productId);

        // Assert
        expect(result.success).toBe(true);
        expect(mockRedisInstance.hdel).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith('Item removed from cart', {
          userId,
          productId,
          service: 'cart-service',
        });
      });

      it('should handle item not found in cart', async () => {
        // Arrange
        const userId = 'user-123';
        const productId = 'non-existent-product';

        mockRedisInstance.hgetall.mockResolvedValue(mockCart);
        mockRedisInstance.keys.mockResolvedValue([]);

        // Act
        const result = await removeItemFromCart(userId, productId);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('Item not found in cart');
      });
    });

    describe('updateItemQuantity', () => {
      it('should update item quantity successfully', async () => {
        // Arrange
        const userId = 'user-123';
        const productId = 'product-123';
        const newQuantity = 5;

        mockRedisInstance.hgetall.mockResolvedValue(mockCart);
        mockRedisInstance.keys.mockResolvedValue([`cart:${userId}:item:${productId}`]);
        mockAxios.get.mockResolvedValue(createMockAxiosResponse(mockProduct));

        // Act
        const result = await updateItemQuantity(userId, productId, newQuantity);

        // Assert
        expect(result.success).toBe(true);
        expect(mockRedisInstance.hset).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith('Item quantity updated', {
          userId,
          productId,
          newQuantity,
          service: 'cart-service',
        });
      });

      it('should handle quantity exceeding available stock', async () => {
        // Arrange
        const userId = 'user-123';
        const productId = 'product-123';
        const newQuantity = 15; // More than available

        const productWithLowStock = { ...mockProduct, quantity: 5 };
        mockAxios.get.mockResolvedValue(createMockAxiosResponse(productWithLowStock));

        // Act
        const result = await updateItemQuantity(userId, productId, newQuantity);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('Insufficient inventory');
      });
    });

    describe('getCart', () => {
      it('should return cart successfully', async () => {
        // Arrange
        const userId = 'user-123';

        mockRedisInstance.hgetall.mockResolvedValue(mockCart);
        mockRedisInstance.keys.mockResolvedValue([`cart:${userId}:item:product-123`]);

        // Act
        const result = await getCart(userId);

        // Assert
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data?.items).toHaveLength(1);
        expect(result.data?.total).toBe(225.96);
      });

      it('should return empty cart when no items exist', async () => {
        // Arrange
        const userId = 'user-123';

        mockRedisInstance.hgetall.mockResolvedValue({});
        mockRedisInstance.keys.mockResolvedValue([]);

        // Act
        const result = await getCart(userId);

        // Assert
        expect(result.success).toBe(true);
        expect(result.data?.items).toHaveLength(0);
        expect(result.data?.total).toBe(0);
      });
    });

    describe('clearCart', () => {
      it('should clear cart successfully', async () => {
        // Arrange
        const userId = 'user-123';

        mockRedisInstance.keys.mockResolvedValue([
          `cart:${userId}:item:product-123`,
          `cart:${userId}:item:product-456`,
        ]);

        // Act
        const result = await clearCart(userId);

        // Assert
        expect(result.success).toBe(true);
        expect(mockRedisInstance.hdel).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith('Cart cleared', {
          userId,
          service: 'cart-service',
        });
      });
    });
  });

  describe('Cart Calculations', () => {
    it('should calculate cart totals correctly', () => {
      // Arrange
      const items = [
        { ...mockCartItem, price: 50, quantity: 2 },
        { ...mockCartItem, id: 'item-456', productId: 'product-456', price: 25, quantity: 1 },
      ];

      // Act
      const totals = calculateCartTotals(items);

      // Assert
      expect(totals.subtotal).toBe(125); // (50 * 2) + (25 * 1)
      expect(totals.tax).toBe(10); // 8% of 125
      expect(totals.shipping).toBe(0); // Free shipping over $75
      expect(totals.discount).toBe(6.25); // 5% discount over $100
      expect(totals.total).toBe(128.75); // subtotal + tax + shipping - discount
    });

    it('should apply shipping cost for orders under threshold', () => {
      // Arrange
      const items = [{ ...mockCartItem, price: 30, quantity: 1 }];

      // Act
      const totals = calculateCartTotals(items);

      // Assert
      expect(totals.subtotal).toBe(30);
      expect(totals.shipping).toBe(9.99); // Shipping cost applied
      expect(totals.total).toBeGreaterThan(totals.subtotal);
    });
  });

  describe('Product Validation', () => {
    it('should validate product successfully', async () => {
      // Arrange
      const productId = 'product-123';
      const quantity = 2;

      mockAxios.get.mockResolvedValue(createMockAxiosResponse(mockProduct));

      // Act
      const result = await validateProduct(productId, quantity);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.currentPrice).toBe(99.99);
      expect(result.inStock).toBe(true);
      expect(result.maxQuantity).toBe(10);
    });

    it('should handle inactive product', async () => {
      // Arrange
      const productId = 'inactive-product';
      const quantity = 2;

      const inactiveProduct = { ...mockProduct, isActive: false };
      mockAxios.get.mockResolvedValue(createMockAxiosResponse(inactiveProduct));

      // Act
      const result = await validateProduct(productId, quantity);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Product not found or inactive');
    });

    it('should handle product service unavailable', async () => {
      // Arrange
      const productId = 'product-123';
      const quantity = 2;

      mockAxios.get.mockRejectedValue(new Error('Service unavailable'));

      // Act
      const result = await validateProduct(productId, quantity);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Product service unavailable');
    });
  });

  describe('Redis Operations', () => {
    it('should handle Redis connection errors gracefully', async () => {
      // Arrange
      const userId = 'user-123';
      const error = new Error('Redis connection failed');

      mockRedisInstance.hgetall.mockRejectedValue(error);

      // Act
      const result = await getCart(userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Failed to retrieve cart');
      expect(mockLogger.error).toHaveBeenCalledWith('Redis operation failed', {
        operation: 'getCart',
        userId,
        error: 'Redis connection failed',
        service: 'cart-service',
      });
    });

    it('should handle Redis write errors gracefully', async () => {
      // Arrange
      const userId = 'user-123';
      const productId = 'product-123';
      const quantity = 2;

      mockAxios.get.mockResolvedValue(createMockAxiosResponse(mockProduct));
      mockRedisInstance.hset.mockRejectedValue(new Error('Redis write failed'));

      // Act
      const result = await addItemToCart(userId, productId, quantity);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Failed to add item to cart');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid user ID', async () => {
      // Arrange
      const invalidUserId = '';
      const productId = 'product-123';
      const quantity = 2;

      // Act
      const result = await addItemToCart(invalidUserId, productId, quantity);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid user ID');
    });

    it('should handle invalid product ID', async () => {
      // Arrange
      const userId = 'user-123';
      const invalidProductId = '';
      const quantity = 2;

      // Act
      const result = await addItemToCart(userId, invalidProductId, quantity);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid product ID');
    });

    it('should handle invalid quantity', async () => {
      // Arrange
      const userId = 'user-123';
      const productId = 'product-123';
      const invalidQuantity = -1;

      // Act
      const result = await addItemToCart(userId, productId, invalidQuantity);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid quantity');
    });
  });
});

// Mock function implementations (these would be imported from the actual service)
async function addItemToCart(userId: string, productId: string, quantity: number) {
  try {
    // Validation
    if (!userId) {
      return { success: false, error: { message: 'Invalid user ID' } };
    }
    if (!productId) {
      return { success: false, error: { message: 'Invalid product ID' } };
    }
    if (quantity <= 0) {
      return { success: false, error: { message: 'Invalid quantity' } };
    }

    // Product validation
    const validation = await validateProduct(productId, quantity);
    if (!validation.isValid) {
      return { success: false, error: { message: validation.error } };
    }

    // Add to cart logic would go here
    mockLogger.info('Item added to cart', {
      userId,
      productId,
      quantity,
      service: 'cart-service',
    });

    return { success: true, data: { message: 'Item added successfully' } };
  } catch (error) {
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

async function removeItemFromCart(userId: string, productId: string) {
  try {
    // Implementation would go here
    mockLogger.info('Item removed from cart', {
      userId,
      productId,
      service: 'cart-service',
    });
    return { success: true, data: { message: 'Item removed successfully' } };
  } catch (error) {
    return { success: false, error: { message: 'Failed to remove item from cart' } };
  }
}

async function updateItemQuantity(userId: string, productId: string, quantity: number) {
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
  } catch (error) {
    return { success: false, error: { message: 'Failed to update quantity' } };
  }
}

async function getCart(userId: string) {
  try {
    // Implementation would go here
    return { success: true, data: mockCart };
  } catch (error) {
    mockLogger.error('Redis operation failed', {
      operation: 'getCart',
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      service: 'cart-service',
    });
    return { success: false, error: { message: 'Failed to retrieve cart' } };
  }
}

async function clearCart(userId: string) {
  try {
    // Implementation would go here
    mockLogger.info('Cart cleared', {
      userId,
      service: 'cart-service',
    });
    return { success: true, data: { message: 'Cart cleared successfully' } };
  } catch (error) {
    return { success: false, error: { message: 'Failed to clear cart' } };
  }
}

function calculateCartTotals(items: any[]) {
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

async function validateProduct(productId: string, quantity: number) {
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
  } catch (error) {
    mockLogger.error('Product validation failed', {
      productId,
      error: error instanceof Error ? error.message : 'Unknown error',
      service: 'cart-service',
      operation: 'product_validation',
    });
    return { productId, isValid: false, error: 'Product service unavailable' };
  }
}
