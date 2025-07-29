"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductRepository = void 0;
const tslib_1 = require("tslib");
const database_1 = tslib_1.__importDefault(require("../lib/database"));
const shared_1 = require("../shared");
class ProductRepository {
    /**
     * Find many products with filtering and pagination
     */
    async findMany(params) {
        try {
            return await database_1.default.prisma.product.findMany(params);
        }
        catch (error) {
            shared_1.logger.error('Error finding products', { error, params });
            throw error;
        }
    }
    /**
     * Count products with filtering
     */
    async count(params) {
        try {
            return await database_1.default.prisma.product.count(params);
        }
        catch (error) {
            shared_1.logger.error('Error counting products', { error, params });
            throw error;
        }
    }
    /**
     * Find a single product by unique identifier
     */
    async findUnique(params) {
        try {
            return await database_1.default.prisma.product.findUnique(params);
        }
        catch (error) {
            shared_1.logger.error('Error finding unique product', { error, params });
            throw error;
        }
    }
    /**
     * Find first product matching criteria
     */
    async findFirst(params) {
        try {
            return await database_1.default.prisma.product.findFirst(params);
        }
        catch (error) {
            shared_1.logger.error('Error finding first product', { error, params });
            throw error;
        }
    }
    /**
     * Create a new product
     */
    async create(params) {
        try {
            return await database_1.default.prisma.product.create(params);
        }
        catch (error) {
            shared_1.logger.error('Error creating product', { error, params });
            throw error;
        }
    }
    /**
     * Update an existing product
     */
    async update(params) {
        try {
            return await database_1.default.prisma.product.update(params);
        }
        catch (error) {
            shared_1.logger.error('Error updating product', { error, params });
            throw error;
        }
    }
    /**
     * Delete a product
     */
    async delete(params) {
        try {
            return await database_1.default.prisma.product.delete(params);
        }
        catch (error) {
            shared_1.logger.error('Error deleting product', { error, params });
            throw error;
        }
    }
}
exports.ProductRepository = ProductRepository;
//# sourceMappingURL=product-repository.js.map