"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const tslib_1 = require("tslib");
const category_repository_1 = require("../repositories/category-repository");
const shared_1 = require("../shared");
const slugify_1 = tslib_1.__importDefault(require("slugify"));
const database_1 = tslib_1.__importDefault(require("../lib/database"));
class CategoryService {
    categoryRepository;
    constructor() {
        this.categoryRepository = new category_repository_1.CategoryRepository();
    }
    /**
     * Get all categories with optional filtering and pagination
     */
    async getCategories(queryParams) {
        try {
            const { page = 1, limit = 50, search, isActive, parentId, includeChildren = false, sortBy = 'sortOrder', sortOrder = 'asc', } = queryParams;
            const skip = (page - 1) * limit;
            // Build where clause
            const where = {};
            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ];
            }
            if (isActive !== undefined) {
                where.isActive = isActive;
            }
            if (parentId === null) {
                where.parentId = null; // Only root categories
            }
            else if (parentId) {
                where.parentId = parentId; // Children of specific category
            }
            // Build order clause
            const orderBy = {};
            orderBy[sortBy] = sortOrder;
            // Query categories with pagination
            const [categories, total] = await Promise.all([
                this.categoryRepository.findMany({
                    skip,
                    take: limit,
                    where,
                    orderBy,
                    include: includeChildren
                        ? {
                            children: {
                                where: {
                                    isActive: isActive !== undefined ? isActive : true,
                                },
                                orderBy: {
                                    sortOrder: 'asc',
                                },
                            },
                            _count: {
                                select: {
                                    products: true,
                                },
                            },
                        }
                        : {
                            _count: {
                                select: {
                                    products: true,
                                },
                            },
                        },
                }),
                this.categoryRepository.count({ where }),
            ]);
            // Transform categories to responses
            const categoryResponses = categories.map((category) => this.mapCategoryToResponse(category, includeChildren));
            return {
                items: categoryResponses,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        }
        catch (error) {
            shared_1.logger.error('Error in getCategories service', { error, queryParams });
            throw error;
        }
    }
    /**
     * Get category tree (hierarchical structure)
     */
    async getCategoryTree(isActive) {
        try {
            const where = {
                parentId: null, // Only root categories
            };
            if (isActive !== undefined) {
                where.isActive = isActive;
            }
            const rootCategories = await this.categoryRepository.findMany({
                where,
                orderBy: {
                    sortOrder: 'asc',
                },
                include: {
                    children: {
                        include: {
                            children: {
                                include: {
                                    children: {
                                        include: {
                                            _count: {
                                                select: {
                                                    products: true,
                                                },
                                            },
                                        },
                                        orderBy: {
                                            sortOrder: 'asc',
                                        },
                                    },
                                    _count: {
                                        select: {
                                            products: true,
                                        },
                                    },
                                },
                                orderBy: {
                                    sortOrder: 'asc',
                                },
                            },
                            _count: {
                                select: {
                                    products: true,
                                },
                            },
                        },
                        orderBy: {
                            sortOrder: 'asc',
                        },
                    },
                    _count: {
                        select: {
                            products: true,
                        },
                    },
                },
            });
            return rootCategories.map((category) => this.mapCategoryToResponse(category, true));
        }
        catch (error) {
            shared_1.logger.error('Error in getCategoryTree service', { error });
            throw error;
        }
    }
    /**
     * Get a single category by ID
     */
    async getCategoryById(id, includeChildren = false) {
        try {
            const category = await this.categoryRepository.findUnique({
                where: { id },
                include: {
                    parent: includeChildren,
                    children: includeChildren
                        ? {
                            include: {
                                _count: {
                                    select: {
                                        products: true,
                                    },
                                },
                            },
                            orderBy: {
                                sortOrder: 'asc',
                            },
                        }
                        : false,
                    _count: {
                        select: {
                            products: true,
                        },
                    },
                },
            });
            if (!category) {
                throw new shared_1.AppError(404, 'Category not found');
            }
            return this.mapCategoryToResponse(category, includeChildren);
        }
        catch (error) {
            if (error instanceof shared_1.AppError) {
                throw error;
            }
            shared_1.logger.error('Error in getCategoryById service', { error, id });
            throw new shared_1.AppError(500, 'Failed to get category');
        }
    }
    /**
     * Get a single category by slug
     */
    async getCategoryBySlug(slug, includeChildren = false) {
        try {
            const category = await this.categoryRepository.findUnique({
                where: { slug },
                include: {
                    parent: includeChildren,
                    children: includeChildren
                        ? {
                            include: {
                                _count: {
                                    select: {
                                        products: true,
                                    },
                                },
                            },
                            orderBy: {
                                sortOrder: 'asc',
                            },
                        }
                        : false,
                    _count: {
                        select: {
                            products: true,
                        },
                    },
                },
            });
            if (!category) {
                throw new shared_1.AppError(404, 'Category not found');
            }
            return this.mapCategoryToResponse(category, includeChildren);
        }
        catch (error) {
            if (error instanceof shared_1.AppError) {
                throw error;
            }
            shared_1.logger.error('Error in getCategoryBySlug service', { error, slug });
            throw new shared_1.AppError(500, 'Failed to get category');
        }
    }
    /**
     * Create a new category
     */
    async createCategory(data) {
        try {
            // Generate slug
            const slug = (0, slugify_1.default)(data.name, { lower: true, strict: true });
            // Check if slug exists
            const existingCategoryWithSlug = await this.categoryRepository.findUnique({
                where: { slug },
            });
            const finalSlug = existingCategoryWithSlug
                ? `${slug}-${Date.now().toString().slice(-6)}`
                : slug;
            // Check if parent category exists if provided
            if (data.parentId) {
                const parentCategory = await this.categoryRepository.findUnique({
                    where: { id: data.parentId },
                });
                if (!parentCategory) {
                    throw new shared_1.AppError(400, 'Parent category not found');
                }
            }
            // Create category
            const category = await database_1.default.executeWithTransaction(async (prisma) => {
                // Prepare create data
                const createData = {
                    name: data.name,
                    slug: finalSlug,
                    description: data.description || null,
                    image: data.image || null,
                    isActive: data.isActive !== undefined ? data.isActive : true,
                    sortOrder: data.sortOrder || 0,
                };
                // Add parent relation if parentId is provided
                if (data.parentId) {
                    createData.parent = {
                        connect: { id: data.parentId },
                    };
                }
                const newCategory = await prisma.category.create({
                    data: createData,
                    include: {
                        parent: true,
                        _count: {
                            select: {
                                products: true,
                            },
                        },
                    },
                });
                return newCategory;
            });
            return this.mapCategoryToResponse(category, false);
        }
        catch (error) {
            if (error instanceof shared_1.AppError) {
                throw error;
            }
            shared_1.logger.error('Error in createCategory service', { error, data });
            throw new shared_1.AppError(500, 'Failed to create category');
        }
    }
    /**
     * Update an existing category
     */
    async updateCategory(id, data) {
        try {
            // Check if category exists
            const existingCategory = await this.categoryRepository.findUnique({
                where: { id },
                include: {
                    children: true,
                    products: {
                        select: { id: true },
                        take: 1,
                    },
                },
            });
            if (!existingCategory) {
                throw new shared_1.AppError(404, 'Category not found');
            }
            // Check for circular reference in parent-child relationship
            if (data.parentId && data.parentId === id) {
                throw new shared_1.AppError(400, 'Category cannot be its own parent');
            }
            // Check if parent category exists if changing parent
            if (data.parentId && data.parentId !== existingCategory.parentId) {
                const parentCategory = await this.categoryRepository.findUnique({
                    where: { id: data.parentId },
                });
                if (!parentCategory) {
                    throw new shared_1.AppError(400, 'Parent category not found');
                }
                // Check if the new parent is not a descendant of this category (would create a cycle)
                const isDescendant = await this.isCategoryDescendantOf(data.parentId, id);
                if (isDescendant) {
                    throw new shared_1.AppError(400, 'Cannot set a descendant as parent (would create a cycle)');
                }
            }
            // Generate new slug if name is changing
            let finalSlug = existingCategory.slug;
            if (data.name && data.name !== existingCategory.name) {
                const slug = (0, slugify_1.default)(data.name, { lower: true, strict: true });
                // Check if new slug would conflict with existing categories
                const existingCategoryWithSlug = await this.categoryRepository.findFirst({
                    where: {
                        slug,
                        id: { not: id }, // Exclude current category
                    },
                });
                finalSlug = existingCategoryWithSlug ? `${slug}-${Date.now().toString().slice(-6)}` : slug;
            }
            // Prepare update data
            const updateData = {};
            if (data.name !== undefined)
                updateData.name = data.name;
            if (data.name !== undefined)
                updateData.slug = finalSlug;
            if (data.description !== undefined)
                updateData.description = data.description;
            if (data.image !== undefined)
                updateData.image = data.image;
            if (data.isActive !== undefined)
                updateData.isActive = data.isActive;
            if (data.sortOrder !== undefined)
                updateData.sortOrder = data.sortOrder;
            // Handle parent relationship
            if (data.parentId !== undefined) {
                if (data.parentId === null) {
                    // Remove parent connection
                    updateData.parent = { disconnect: true };
                }
                else {
                    // Connect to new parent
                    updateData.parent = { connect: { id: data.parentId } };
                }
            }
            // Update category
            const category = await this.categoryRepository.update({
                where: { id },
                data: updateData,
                include: {
                    parent: true,
                    children: {
                        include: {
                            _count: {
                                select: {
                                    products: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            products: true,
                        },
                    },
                },
            });
            return this.mapCategoryToResponse(category, true);
        }
        catch (error) {
            if (error instanceof shared_1.AppError) {
                throw error;
            }
            shared_1.logger.error('Error in updateCategory service', { error, id, data });
            throw new shared_1.AppError(500, 'Failed to update category');
        }
    }
    /**
     * Delete a category
     */
    async deleteCategory(id) {
        try {
            // Check if category exists
            const existingCategory = await this.categoryRepository.findUnique({
                where: { id },
                include: {
                    children: true,
                    products: {
                        select: { id: true },
                        take: 1,
                    },
                },
            });
            if (!existingCategory) {
                throw new shared_1.AppError(404, 'Category not found');
            }
            // Check if category has children
            if (existingCategory.children && existingCategory.children.length > 0) {
                throw new shared_1.AppError(400, 'Cannot delete category with child categories');
            }
            // Check if category has products
            if (existingCategory.products && existingCategory.products.length > 0) {
                throw new shared_1.AppError(400, 'Cannot delete category with products');
            }
            // Delete category
            await this.categoryRepository.delete({ where: { id } });
        }
        catch (error) {
            if (error instanceof shared_1.AppError) {
                throw error;
            }
            shared_1.logger.error('Error in deleteCategory service', { error, id });
            throw new shared_1.AppError(500, 'Failed to delete category');
        }
    }
    /**
     * Check if a category is a descendant of another category
     * Used to prevent circular references in the category tree
     */
    async isCategoryDescendantOf(categoryId, potentialAncestorId) {
        try {
            const category = await this.categoryRepository.findUnique({
                where: { id: categoryId },
                include: { parent: true },
            });
            if (!category || !category.parentId) {
                return false;
            }
            if (category.parentId === potentialAncestorId) {
                return true;
            }
            return this.isCategoryDescendantOf(category.parentId, potentialAncestorId);
        }
        catch (error) {
            shared_1.logger.error('Error in isCategoryDescendantOf service', {
                error,
                categoryId,
                potentialAncestorId,
            });
            return false;
        }
    }
    /**
     * Map database category to API response
     */
    mapCategoryToResponse(category, includeChildren = false) {
        const response = {
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            image: category.image,
            isActive: category.isActive,
            parentId: category.parentId,
            sortOrder: category.sortOrder,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
            productCount: category._count?.products || 0,
        };
        // Add parent if available
        if (category.parent) {
            response.parent = {
                id: category.parent.id,
                name: category.parent.name,
                slug: category.parent.slug,
            };
        }
        // Add children if available and requested
        if (includeChildren && category.children && category.children.length > 0) {
            response.children = category.children.map((child) => this.mapCategoryToResponse(child, includeChildren));
        }
        return response;
    }
}
exports.CategoryService = CategoryService;
//# sourceMappingURL=category.service.js.map