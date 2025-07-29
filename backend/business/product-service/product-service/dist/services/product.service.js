"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const tslib_1 = require("tslib");
const client_1 = require("@prisma/client");
const product_repository_1 = require("../repositories/product-repository");
const category_repository_1 = require("../repositories/category-repository");
const product_model_1 = require("../models/product.model");
const shared_1 = require("../shared");
const database_1 = tslib_1.__importDefault(require("../lib/database"));
const slugify_1 = tslib_1.__importDefault(require("slugify"));
// Map model enums to Prisma enums
const mapProductStatusToPrisma = (status) => {
    if (!status)
        return undefined;
    switch (status) {
        case product_model_1.ProductStatus.DRAFT:
            return client_1.ProductStatus.DRAFT;
        case product_model_1.ProductStatus.ACTIVE:
            return client_1.ProductStatus.ACTIVE;
        case product_model_1.ProductStatus.ARCHIVED:
            return client_1.ProductStatus.ARCHIVED;
        case product_model_1.ProductStatus.OUTOFSTOCK:
            return client_1.ProductStatus.INACTIVE; // Map to closest Prisma equivalent
        case product_model_1.ProductStatus.COMINGSOON:
            return client_1.ProductStatus.DRAFT; // Map to closest Prisma equivalent
        default:
            return undefined;
    }
};
const mapProductTypeToPrisma = (type) => {
    if (!type)
        return undefined;
    switch (type) {
        case product_model_1.ProductType.PHYSICAL:
            return client_1.ProductType.PHYSICAL;
        case product_model_1.ProductType.DIGITAL:
            return client_1.ProductType.DIGITAL;
        case product_model_1.ProductType.SERVICE:
            return client_1.ProductType.SERVICE;
        case product_model_1.ProductType.SUBSCRIPTION:
            return client_1.ProductType.SERVICE; // Map to closest Prisma equivalent
        default:
            return undefined;
    }
};
class ProductService {
    productRepository;
    categoryRepository;
    constructor() {
        this.productRepository = new product_repository_1.ProductRepository();
        this.categoryRepository = new category_repository_1.CategoryRepository();
    }
    /**
     * Get products with pagination and filtering
     */
    async getProducts(queryParams) {
        try {
            const { page = 1, limit = 20, search, category, brand, minPrice, maxPrice, status, type, isActive = true, isFeatured, sortBy = 'createdAt', sortOrder = 'desc', tags, } = queryParams;
            const skip = (page - 1) * limit;
            // Build where clause
            const where = { isActive };
            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ];
            }
            if (category) {
                where.categoryId = category;
            }
            if (brand) {
                where.brand = brand;
            }
            if (minPrice !== undefined || maxPrice !== undefined) {
                where.price = {};
                if (minPrice !== undefined) {
                    where.price.gte = minPrice;
                }
                if (maxPrice !== undefined) {
                    where.price.lte = maxPrice;
                }
            }
            if (status) {
                const prismaStatus = mapProductStatusToPrisma(status);
                if (prismaStatus) {
                    where.status = prismaStatus;
                }
            }
            if (type) {
                const prismaType = mapProductTypeToPrisma(type);
                if (prismaType) {
                    where.type = prismaType;
                }
            }
            if (isFeatured !== undefined) {
                where.isFeatured = isFeatured;
            }
            if (tags && tags.length > 0) {
                where.tags = {
                    hasSome: tags,
                };
            }
            // Build order clause
            const orderBy = {};
            orderBy[sortBy] = sortOrder;
            // Query products with pagination
            const [products, total] = await Promise.all([
                this.productRepository.findMany({
                    skip,
                    take: limit,
                    where,
                    orderBy,
                    include: {
                        category: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                            },
                        },
                    },
                }),
                this.productRepository.count({ where }),
            ]);
            // Transform products to responses
            const productResponses = products.map((product) => this.mapProductToResponse(product));
            return {
                items: productResponses,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        }
        catch (error) {
            shared_1.logger.error('Error in getProducts service', { error, queryParams });
            throw error;
        }
    }
    /**
     * Get a single product by ID
     */
    async getProductById(id) {
        try {
            const product = await this.productRepository.findUnique({
                where: { id },
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                },
            });
            if (!product) {
                throw new shared_1.AppError(404, 'Product not found');
            }
            return this.mapProductToResponse(product);
        }
        catch (error) {
            if (error instanceof shared_1.AppError) {
                throw error;
            }
            shared_1.logger.error('Error in getProductById service', { error, id });
            throw new shared_1.AppError(500, 'Failed to get product');
        }
    }
    /**
     * Get a single product by slug
     */
    async getProductBySlug(slug) {
        try {
            const product = await this.productRepository.findUnique({
                where: { slug },
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                },
            });
            if (!product) {
                throw new shared_1.AppError(404, 'Product not found');
            }
            return this.mapProductToResponse(product);
        }
        catch (error) {
            if (error instanceof shared_1.AppError) {
                throw error;
            }
            shared_1.logger.error('Error in getProductBySlug service', { error, slug });
            throw new shared_1.AppError(500, 'Failed to get product');
        }
    }
    /**
     * Create a new product
     */
    async createProduct(data, userId) {
        try {
            // Validate category exists
            const category = await this.categoryRepository.findUnique({
                where: { id: data.categoryId },
            });
            if (!category) {
                throw new shared_1.AppError(400, 'Category not found');
            }
            // Generate slug
            const slug = (0, slugify_1.default)(data.name, { lower: true, strict: true });
            // Check if slug exists
            const existingProductWithSlug = await this.productRepository.findUnique({
                where: { slug },
            });
            const finalSlug = existingProductWithSlug
                ? `${slug}-${Date.now().toString().slice(-6)}`
                : slug;
            // Create product with transaction
            const product = await database_1.default.executeWithTransaction(async (prisma) => {
                const newProduct = await prisma.product.create({
                    data: {
                        name: data.name,
                        slug: finalSlug,
                        description: data.description || null,
                        shortDescription: data.shortDescription || null,
                        sku: data.sku,
                        barcode: data.barcode || null,
                        brand: data.brand || null,
                        model: data.model || null,
                        weight: data.weight ? new client_1.Prisma.Decimal(data.weight) : null,
                        dimensions: data.dimensions || null,
                        price: new client_1.Prisma.Decimal(data.price),
                        comparePrice: data.comparePrice ? new client_1.Prisma.Decimal(data.comparePrice) : null,
                        costPrice: data.costPrice ? new client_1.Prisma.Decimal(data.costPrice) : null,
                        currency: data.currency || 'USD',
                        status: data.status
                            ? mapProductStatusToPrisma(data.status) || client_1.ProductStatus.DRAFT
                            : client_1.ProductStatus.DRAFT,
                        type: data.type
                            ? mapProductTypeToPrisma(data.type) || client_1.ProductType.PHYSICAL
                            : client_1.ProductType.PHYSICAL,
                        isActive: data.isActive !== undefined ? data.isActive : true,
                        isFeatured: data.isFeatured || false,
                        tags: data.tags || [],
                        attributes: data.attributes || null,
                        specifications: data.specifications || null,
                        warranty: data.warranty || null,
                        returnPolicy: data.returnPolicy || null,
                        shippingInfo: data.shippingInfo || null,
                        category: {
                            connect: { id: data.categoryId },
                        },
                        vendorId: data.vendorId || userId,
                    },
                    include: {
                        category: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                            },
                        },
                    },
                });
                return newProduct;
            });
            return this.mapProductToResponse(product);
        }
        catch (error) {
            if (error instanceof shared_1.AppError) {
                throw error;
            }
            shared_1.logger.error('Error in createProduct service', { error, data });
            throw new shared_1.AppError(500, 'Failed to create product');
        }
    }
    /**
     * Update an existing product
     */
    async updateProduct(id, data, userId) {
        try {
            // Check if product exists and belongs to the user
            const existingProduct = await this.productRepository.findUnique({
                where: { id },
            });
            if (!existingProduct) {
                throw new shared_1.AppError(404, 'Product not found');
            }
            // Only allow vendor/owner or admin to update
            if (existingProduct.vendorId !== userId) {
                // In a real app, you'd check if the user is an admin here
                throw new shared_1.AppError(403, 'You can only update your own products');
            }
            // If category is changing, validate it exists
            if (data.categoryId && data.categoryId !== existingProduct.categoryId) {
                const category = await this.categoryRepository.findUnique({
                    where: { id: data.categoryId },
                });
                if (!category) {
                    throw new shared_1.AppError(400, 'Category not found');
                }
            }
            // Convert model enums to Prisma enums
            const prismaStatus = data.status ? mapProductStatusToPrisma(data.status) : undefined;
            const prismaType = data.type ? mapProductTypeToPrisma(data.type) : undefined;
            // Prepare update data (only include defined properties)
            const updateData = {};
            if (data.name !== undefined)
                updateData.name = data.name;
            if (data.description !== undefined)
                updateData.description = data.description;
            if (data.shortDescription !== undefined)
                updateData.shortDescription = data.shortDescription;
            if (data.sku !== undefined)
                updateData.sku = data.sku;
            if (data.barcode !== undefined)
                updateData.barcode = data.barcode;
            if (data.brand !== undefined)
                updateData.brand = data.brand;
            if (data.model !== undefined)
                updateData.model = data.model;
            if (data.dimensions !== undefined)
                updateData.dimensions = data.dimensions;
            if (data.currency !== undefined)
                updateData.currency = data.currency;
            if (prismaStatus !== undefined)
                updateData.status = prismaStatus;
            if (prismaType !== undefined)
                updateData.type = prismaType;
            if (data.isActive !== undefined)
                updateData.isActive = data.isActive;
            if (data.isFeatured !== undefined)
                updateData.isFeatured = data.isFeatured;
            if (data.tags !== undefined)
                updateData.tags = data.tags;
            if (data.attributes !== undefined)
                updateData.attributes = data.attributes;
            if (data.specifications !== undefined)
                updateData.specifications = data.specifications;
            if (data.warranty !== undefined)
                updateData.warranty = data.warranty;
            if (data.returnPolicy !== undefined)
                updateData.returnPolicy = data.returnPolicy;
            if (data.shippingInfo !== undefined)
                updateData.shippingInfo = data.shippingInfo;
            // Handle numeric conversions
            if (data.price !== undefined) {
                updateData.price = new client_1.Prisma.Decimal(data.price);
            }
            if (data.comparePrice !== undefined) {
                updateData.comparePrice =
                    data.comparePrice !== null ? new client_1.Prisma.Decimal(data.comparePrice) : null;
            }
            if (data.costPrice !== undefined) {
                updateData.costPrice = data.costPrice !== null ? new client_1.Prisma.Decimal(data.costPrice) : null;
            }
            if (data.weight !== undefined) {
                updateData.weight = data.weight !== null ? new client_1.Prisma.Decimal(data.weight) : null;
            }
            // Handle category connection if needed
            if (data.categoryId) {
                updateData.category = {
                    connect: { id: data.categoryId },
                };
            }
            // Update the product
            const updatedProduct = await this.productRepository.update({
                where: { id },
                data: updateData,
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                },
            });
            return this.mapProductToResponse(updatedProduct);
        }
        catch (error) {
            if (error instanceof shared_1.AppError) {
                throw error;
            }
            shared_1.logger.error('Error in updateProduct service', { error, id, data });
            throw new shared_1.AppError(500, 'Failed to update product');
        }
    }
    /**
     * Delete (soft-delete) a product
     */
    async deleteProduct(id, userId) {
        try {
            // Check if product exists and belongs to the user
            const existingProduct = await this.productRepository.findUnique({
                where: { id },
            });
            if (!existingProduct) {
                throw new shared_1.AppError(404, 'Product not found');
            }
            // Only allow vendor/owner or admin to delete
            if (existingProduct.vendorId !== userId) {
                // In a real app, you'd check if the user is an admin here
                throw new shared_1.AppError(403, 'You can only delete your own products');
            }
            // Soft delete by marking as inactive and updating status
            await this.productRepository.update({
                where: { id },
                data: {
                    isActive: false,
                    status: client_1.ProductStatus.ARCHIVED,
                },
            });
        }
        catch (error) {
            if (error instanceof shared_1.AppError) {
                throw error;
            }
            shared_1.logger.error('Error in deleteProduct service', { error, id });
            throw new shared_1.AppError(500, 'Failed to delete product');
        }
    }
    /**
     * Map database product to API response
     */
    mapProductToResponse(product) {
        return {
            ...product,
            price: product.price instanceof client_1.Prisma.Decimal
                ? parseFloat(product.price.toString())
                : product.price,
            comparePrice: product.comparePrice instanceof client_1.Prisma.Decimal
                ? parseFloat(product.comparePrice.toString())
                : product.comparePrice,
            costPrice: product.costPrice instanceof client_1.Prisma.Decimal
                ? parseFloat(product.costPrice.toString())
                : product.costPrice,
            weight: product.weight instanceof client_1.Prisma.Decimal
                ? parseFloat(product.weight.toString())
                : product.weight,
        };
    }
}
exports.ProductService = ProductService;
//# sourceMappingURL=product.service.js.map