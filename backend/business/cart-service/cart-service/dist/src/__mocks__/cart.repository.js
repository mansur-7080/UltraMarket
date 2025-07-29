"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const mockCartRepository = {
    findByUserId: globals_1.jest.fn(),
    create: globals_1.jest.fn(),
    addItem: globals_1.jest.fn(),
    updateItemQuantity: globals_1.jest.fn(),
    removeItem: globals_1.jest.fn(),
    clearCart: globals_1.jest.fn(),
    getCartWithItems: globals_1.jest.fn(),
};
const decimal_js_1 = require("decimal.js");
mockCartRepository.findByUserId.mockImplementation(async (userId) => {
    return {
        id: 'mock-cart-id',
        userId,
        sessionId: null,
        status: 'ACTIVE',
        currency: 'USD',
        subtotal: new decimal_js_1.Decimal(0),
        taxAmount: new decimal_js_1.Decimal(0),
        discountAmount: new decimal_js_1.Decimal(0),
        shippingAmount: new decimal_js_1.Decimal(0),
        totalAmount: new decimal_js_1.Decimal(0),
        appliedCoupons: [],
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
});
mockCartRepository.create.mockImplementation(async (userId) => {
    return {
        id: 'mock-cart-id',
        userId,
        sessionId: null,
        status: 'ACTIVE',
        currency: 'USD',
        subtotal: new decimal_js_1.Decimal(0),
        taxAmount: new decimal_js_1.Decimal(0),
        discountAmount: new decimal_js_1.Decimal(0),
        shippingAmount: new decimal_js_1.Decimal(0),
        totalAmount: new decimal_js_1.Decimal(0),
        appliedCoupons: [],
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
});
mockCartRepository.addItem.mockImplementation(async (cartId, item) => {
    return {
        id: 'mock-item-id',
        cartId,
        productId: item.productId,
        name: item.name || 'Mock Product',
        sku: item.sku || 'MOCK-SKU',
        quantity: item.quantity,
        price: item.price || new decimal_js_1.Decimal(100),
        image: item.image,
        createdAt: new Date(),
    };
});
mockCartRepository.updateItemQuantity.mockImplementation(async (cartItemId, quantity) => {
    return {
        id: cartItemId,
        cartId: 'mock-cart-id',
        productId: 'mock-product-id',
        name: 'Mock Product',
        sku: 'MOCK-SKU',
        quantity,
        price: new decimal_js_1.Decimal(100),
        image: 'mock-image.jpg',
        createdAt: new Date(),
    };
});
mockCartRepository.getCartWithItems.mockImplementation(async (userId) => {
    return {
        id: 'mock-cart-id',
        userId,
        sessionId: null,
        status: 'ACTIVE',
        currency: 'USD',
        subtotal: new decimal_js_1.Decimal(100),
        taxAmount: new decimal_js_1.Decimal(8.5),
        discountAmount: new decimal_js_1.Decimal(0),
        shippingAmount: new decimal_js_1.Decimal(9.99),
        totalAmount: new decimal_js_1.Decimal(118.49),
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
                price: new decimal_js_1.Decimal(100),
                image: 'mock-image.jpg',
                createdAt: new Date(),
            },
        ],
    };
});
exports.default = mockCartRepository;
//# sourceMappingURL=cart.repository.js.map