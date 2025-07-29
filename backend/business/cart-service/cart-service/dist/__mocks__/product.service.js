"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const mockProductService = {
    getProductById: globals_1.jest.fn(),
    checkProductAvailability: globals_1.jest.fn(),
    getPrice: globals_1.jest.fn(),
};
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
exports.default = mockProductService;
//# sourceMappingURL=product.service.js.map