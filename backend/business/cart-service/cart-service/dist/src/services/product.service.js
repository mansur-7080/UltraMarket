"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productService = exports.ProductServiceClient = void 0;
const logger_1 = require("../utils/logger");
class ProductServiceClient {
    baseUrl;
    constructor(baseUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3000') {
        this.baseUrl = baseUrl;
    }
    async getProductById(productId) {
        try {
            logger_1.logger.info(`Fetching product with ID: ${productId}`);
            return {
                id: productId,
                name: 'Test Product',
                description: 'Test product description',
                price: 100,
                stock: 50,
                isActive: true,
            };
        }
        catch (error) {
            logger_1.logger.error(`Error fetching product with ID ${productId}:`, error);
            throw error;
        }
    }
    async checkProductAvailability(productId, quantity) {
        try {
            logger_1.logger.info(`Checking availability for product ${productId}, quantity ${quantity}`);
            return { available: true, currentStock: 50 };
        }
        catch (error) {
            logger_1.logger.error(`Error checking product availability for ${productId}:`, error);
            throw error;
        }
    }
    async getPrice(productId) {
        try {
            logger_1.logger.info(`Getting price for product ${productId}`);
            return 100;
        }
        catch (error) {
            logger_1.logger.error(`Error getting price for product ${productId}:`, error);
            throw error;
        }
    }
}
exports.ProductServiceClient = ProductServiceClient;
exports.productService = new ProductServiceClient();
exports.default = exports.productService;
//# sourceMappingURL=product.service.js.map