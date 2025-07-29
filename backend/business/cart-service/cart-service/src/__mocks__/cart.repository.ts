import { jest } from '@jest/globals';
import { CartRepository, PrismaCart, PrismaCartItem } from '../repositories/cart.repository';

// Mock cart repository implementation for tests
const mockCartRepository: jest.Mocked<CartRepository> = {
  findByUserId: jest.fn(),
  create: jest.fn(),
  addItem: jest.fn(),
  updateItemQuantity: jest.fn(),
  removeItem: jest.fn(),
  clearCart: jest.fn(),
  getCartWithItems: jest.fn(),
};

// Import Decimal type for proper mocking
import { Decimal } from 'decimal.js';

// Default implementation of mock functions
mockCartRepository.findByUserId.mockImplementation(async (userId: string) => {
  return {
    id: 'mock-cart-id',
    userId,
    sessionId: null,
    status: 'ACTIVE',
    currency: 'USD',
    subtotal: new Decimal(0),
    taxAmount: new Decimal(0),
    discountAmount: new Decimal(0),
    shippingAmount: new Decimal(0),
    totalAmount: new Decimal(0),
    appliedCoupons: [],
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as PrismaCart;
});

mockCartRepository.create.mockImplementation(async (userId: string) => {
  return {
    id: 'mock-cart-id',
    userId,
    sessionId: null,
    status: 'ACTIVE',
    currency: 'USD',
    subtotal: new Decimal(0),
    taxAmount: new Decimal(0),
    discountAmount: new Decimal(0),
    shippingAmount: new Decimal(0),
    totalAmount: new Decimal(0),
    appliedCoupons: [],
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as PrismaCart;
});

mockCartRepository.addItem.mockImplementation(async (cartId, item) => {
  return {
    id: 'mock-item-id',
    cartId,
    productId: item.productId,
    name: item.name || 'Mock Product',
    sku: item.sku || 'MOCK-SKU',
    quantity: item.quantity,
    price: item.price || new Decimal(100),
    image: item.image,
    createdAt: new Date(),
  } as PrismaCartItem;
});

mockCartRepository.updateItemQuantity.mockImplementation(async (cartItemId, quantity) => {
  return {
    id: cartItemId,
    cartId: 'mock-cart-id',
    productId: 'mock-product-id',
    name: 'Mock Product',
    sku: 'MOCK-SKU',
    quantity,
    price: new Decimal(100),
    image: 'mock-image.jpg',
    createdAt: new Date(),
  } as PrismaCartItem;
});

mockCartRepository.getCartWithItems.mockImplementation(async (userId) => {
  return {
    id: 'mock-cart-id',
    userId,
    sessionId: null,
    status: 'ACTIVE',
    currency: 'USD',
    subtotal: new Decimal(100),
    taxAmount: new Decimal(8.5),
    discountAmount: new Decimal(0),
    shippingAmount: new Decimal(9.99),
    totalAmount: new Decimal(118.49),
    appliedCoupons: [],
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: 'mock-item-id',
        cartId: 'mock-cart-id',
        productId: 'mock-product-id',
        name: 'Mock Product',
        sku: 'MOCK-SKU',
        quantity: 1,
        price: new Decimal(100),
        image: 'mock-image.jpg',
        createdAt: new Date(),
      },
    ],
  } as PrismaCart & { items: PrismaCartItem[] };
});

export default mockCartRepository;
