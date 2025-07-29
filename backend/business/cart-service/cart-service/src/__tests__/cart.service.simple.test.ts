import { CartService, ICart, ICartItem } from '../services/cart.service';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock the Redis client and logger
jest.mock('../config/redis', () => ({
  getRedisClient: jest.fn().mockReturnValue({
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
  }),
}));

jest.mock('../utils/logger');

describe('CartService', () => {
  let cartService: CartService;
  let mockRedisClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRedisClient = {
      get: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
    };

    cartService = new CartService();
    (cartService as any).redisClient = mockRedisClient;
  });

  describe('getCart', () => {
    it('should return a cart from Redis if it exists', async () => {
      const mockCart: ICart = {
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

      expect(mockRedisClient.get).toHaveBeenCalledWith('cart:user123');
      expect(result).toEqual(mockCart);
    });

    it('should create a new cart if it does not exist in Redis', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await cartService.getCart('user123');

      expect(result.userId).toBe('user123');
      expect(result.items).toEqual([]);
      expect(result.summary?.itemCount).toBe(0);
      expect(mockRedisClient.setex).toHaveBeenCalled();
    });
  });

  describe('addItem', () => {
    it('should add an item to an empty cart', async () => {
      const emptyCart: ICart = {
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

      const newItem: ICartItem = {
        productId: 'prod1',
        productName: 'Test Product',
        price: 10,
        quantity: 2,
      };

      const result = await cartService.addItem('user123', newItem);

      expect(result.items.length).toBe(1);
      expect(result.items[0].productId).toBe('prod1');
      expect(result.items[0].quantity).toBe(2);
      expect(result.summary?.subtotal).toBe(20);
      expect(mockRedisClient.setex).toHaveBeenCalled();
    });
  });

  describe('updateItemQuantity', () => {
    it('should update the quantity of an item', async () => {
      const cart: ICart = {
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

      expect(result.items[0].quantity).toBe(3);
      expect(result.summary?.subtotal).toBe(30);
      expect(mockRedisClient.setex).toHaveBeenCalled();
    });
  });
});
