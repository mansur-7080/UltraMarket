import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { CartService } from '../services/cart.service';

// Mock Redis module
jest.mock('redis');

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('CartService', () => {
  let cartService: CartService;
  let mockRedisClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    cartService = new CartService();
    mockRedisClient = (cartService as any).redisClient;
  });

  it('should be defined', () => {
    expect(cartService).toBeDefined();
  });

  it('should have required methods', () => {
    expect(typeof cartService.getCart).toBe('function');
    expect(typeof cartService.addItem).toBe('function');
    expect(typeof cartService.removeItem).toBe('function');
    expect(typeof cartService.clearCart).toBe('function');
  });

  describe('getCart', () => {
    it('should return a cart from Redis if it exists', async () => {
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

      expect(mockRedisClient.get).toHaveBeenCalled();
      expect(result).toEqual(mockCart);
    });

    it('should create a new cart if not exists in Redis', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.setEx.mockResolvedValue('OK');

      const result = await cartService.getCart('user123');

      expect(mockRedisClient.get).toHaveBeenCalled();
      expect(mockRedisClient.setEx).toHaveBeenCalled();
      expect(result.userId).toBe('user123');
      expect(result.items).toEqual([]);
      expect(result.summary?.itemCount).toBe(0);
    });
  });

  describe('addItem', () => {
    it('should add a new item to cart', async () => {
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

      expect(mockRedisClient.setEx).toHaveBeenCalled();
      expect(result.items.length).toBe(1);
      expect(result.items[0].productId).toBe('prod1');
      expect(result.items[0].quantity).toBe(2);
      expect(result.summary?.subtotal).toBe(20);
    });

    it('should update quantity if item already exists in cart', async () => {
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

      expect(mockRedisClient.setEx).toHaveBeenCalled();
      expect(result.items.length).toBe(1);
      expect(result.items[0].quantity).toBe(3);
      expect(result.items[0].subtotal).toBe(30);
      expect(result.summary?.subtotal).toBe(30);
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
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

      expect(mockRedisClient.setEx).toHaveBeenCalled();
      expect(result.items.length).toBe(0);
      expect(result.summary?.itemCount).toBe(0);
      expect(result.summary?.subtotal).toBe(0);
    });

    it('should throw error if item not found in cart', async () => {
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

      await expect(cartService.removeItem('user123', 'nonexistent')).rejects.toThrow(
        'Item not found in cart'
      );
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', async () => {
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

      expect(mockRedisClient.setEx).toHaveBeenCalled();
      expect(result.items.length).toBe(0);
      expect(result.summary?.itemCount).toBe(0);
      expect(result.summary?.subtotal).toBe(0);
    });
  });

  describe('updateItemQuantity', () => {
    it('should update item quantity in cart', async () => {
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

      expect(mockRedisClient.setEx).toHaveBeenCalled();
      expect(result.items[0].quantity).toBe(5);
      expect(result.items[0].subtotal).toBe(50);
      expect(result.summary?.subtotal).toBe(50);
    });

    it('should remove item when updating quantity to 0', async () => {
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

      expect(mockRedisClient.setEx).toHaveBeenCalled();
      expect(result.items.length).toBe(0);
      expect(result.summary?.itemCount).toBe(0);
    });
  });

  describe('applyCoupon', () => {
    it('should apply percentage discount to cart', async () => {
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
        type: 'percentage' as 'percentage',
        value: 10, // 10% discount
        minimumPurchase: 100,
      };

      const result = await cartService.applyCoupon('user123', 'SAVE10', mockCoupon);

      expect(mockRedisClient.setEx).toHaveBeenCalled();
      expect(result.summary?.discount).toBe(12.5); // 10% of 125
      expect(result.coupon?.code).toBe('SAVE10');
      expect(result.summary?.total).toBeCloseTo(127.5); // 140 - 12.5
    });

    it('should apply fixed discount to cart', async () => {
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
        type: 'fixed' as 'fixed',
        value: 15, // $15 off
      };

      const result = await cartService.applyCoupon('user123', 'FLAT15', mockCoupon);

      expect(mockRedisClient.setEx).toHaveBeenCalled();
      expect(result.summary?.discount).toBe(15);
      expect(result.coupon?.code).toBe('FLAT15');
      expect(result.summary?.total).toBeCloseTo(98); // 113 - 15
    });

    it('should throw error if minimum purchase not met', async () => {
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
        type: 'percentage' as 'percentage',
        value: 10,
        minimumPurchase: 50,
      };

      await expect(cartService.applyCoupon('user123', 'SAVE10', mockCoupon)).rejects.toThrow(
        'Minimum purchase amount of 50 required for this coupon'
      );
    });
  });

  describe('invalidateCache', () => {
    it('should delete the cart from cache', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      await cartService.invalidateCache('user123');

      expect(mockRedisClient.del).toHaveBeenCalledWith('cart:user123');
    });
  });
});
