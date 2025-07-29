"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryRepository = void 0;
const tslib_1 = require("tslib");
const database_1 = tslib_1.__importDefault(require("../lib/database"));
const shared_1 = require("../shared");
class CategoryRepository {
    /**
     * Find many categories with filtering and pagination
     */
    async findMany(params) {
        try {
            return await database_1.default.prisma.category.findMany(params);
        }
        catch (error) {
            shared_1.logger.error('Error finding categories', { error, params });
            throw error;
        }
    }
    /**
     * Count categories with filtering
     */
    async count(params) {
        try {
            return await database_1.default.prisma.category.count(params);
        }
        catch (error) {
            shared_1.logger.error('Error counting categories', { error, params });
            throw error;
        }
    }
    /**
     * Find a single category by unique identifier
     */
    async findUnique(params) {
        try {
            return await database_1.default.prisma.category.findUnique(params);
        }
        catch (error) {
            shared_1.logger.error('Error finding unique category', { error, params });
            throw error;
        }
    }
    /**
     * Find first category matching criteria
     */
    async findFirst(params) {
        try {
            return await database_1.default.prisma.category.findFirst(params);
        }
        catch (error) {
            shared_1.logger.error('Error finding first category', { error, params });
            throw error;
        }
    }
    /**
     * Create a new category
     */
    async create(params) {
        try {
            return await database_1.default.prisma.category.create(params);
        }
        catch (error) {
            shared_1.logger.error('Error creating category', { error, params });
            throw error;
        }
    }
    /**
     * Update an existing category
     */
    async update(params) {
        try {
            return await database_1.default.prisma.category.update(params);
        }
        catch (error) {
            shared_1.logger.error('Error updating category', { error, params });
            throw error;
        }
    }
    /**
     * Delete a category
     */
    async delete(params) {
        try {
            return await database_1.default.prisma.category.delete(params);
        }
        catch (error) {
            shared_1.logger.error('Error deleting category', { error, params });
            throw error;
        }
    }
    /**
     * Get hierarchical category tree
     */
    async getCategoryTree() {
        try {
            // Get all parent categories (those with no parentId)
            const parentCategories = await database_1.default.prisma.category.findMany({
                where: {
                    parentId: null,
                    isActive: true,
                },
                include: {
                    children: {
                        where: { isActive: true },
                        include: {
                            children: {
                                where: { isActive: true },
                            },
                        },
                    },
                },
                orderBy: {
                    sortOrder: 'asc',
                },
            });
            return parentCategories;
        }
        catch (error) {
            shared_1.logger.error('Error getting category tree', { error });
            throw error;
        }
    }
}
exports.CategoryRepository = CategoryRepository;
//# sourceMappingURL=category-repository.js.map