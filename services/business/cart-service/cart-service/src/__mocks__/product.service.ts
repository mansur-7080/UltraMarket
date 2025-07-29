import { jest } from '@jest/globals';

const mockProductService = {
  getProductById: jest.fn(),
  checkProductAvailability: jest.fn(),
  getPrice: jest.fn(),
};

// Default implementation of mock functions
mockProductService.getProductById.mockImplementation(async (productId) => {
  return {
    id: productId,
    name: 'Test Product',
    description: 'Test product description',
    price: 100,
    stock: 50,
    isActive: true,
  };
});

mockProductService.checkProductAvailability.mockImplementation(async (productId, quantity) => {
  return { available: true, currentStock: 50 };
});

mockProductService.getPrice.mockImplementation(async (productId) => {
  return 100;
});

export default mockProductService;
