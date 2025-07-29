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
  
  beforeEach(() => {
    jest.clearAllMocks();
    cartService = new CartService();
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
});
