"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const tslib_1 = require("tslib");
const ProductDatabase_1 = tslib_1.__importDefault(require("../database/ProductDatabase"));
const shared_1 = require("@ultramarket/shared");
class ProductService {
    database;
    constructor() {
        this.database = new ProductDatabase_1.default();
    }
    async createProduct(productData) {
        try {
            // Generate SKU if not provided
            if (!productData.sku) {
                productData.sku = this.generateSKU(productData.name || '', productData.brand || '');
            }
            // Check if SKU already exists
            const existingProducts = await this.database.getAllProducts({ sku: productData.sku }, 1, 1);
            if (existingProducts.products.length > 0) {
                throw new Error('Product with this SKU already exists');
            }
            // Set default values
            productData.isActive = productData.isActive !== undefined ? productData.isActive : true;
            productData.isFeatured =
                productData.isFeatured !== undefined ? productData.isFeatured : false;
            productData.inStock = productData.quantity !== undefined ? productData.quantity > 0 : true;
            // Set initial rating (MongoDB uses nested objects instead of flat fields)
            productData.rating = {
                average: 0,
                count: 0,
            };
            // No need to stringify arrays/objects for MongoDB
            // MongoDB stores these types natively
            const product = await this.database.createProduct(productData);
            shared_1.logger.info(`Product service: Created product ${product._id}`);
            return this.transformProduct(product);
        }
        catch (error) {
            shared_1.logger.error('Product service: Error creating product:', error);
            throw error;
        }
    }
    async getProductById(id) {
        try {
            const product = await this.database.getProductById(id);
            if (!product) {
                throw new Error('Product not found');
            }
            return this.transformProduct(product);
        }
        catch (error) {
            shared_1.logger.error('Product service: Error getting product by ID:', error);
            throw error;
        }
    }
    async getProductBySku(sku) {
        try {
            const product = await this.database.getProductBySku(sku);
            if (!product) {
                throw new Error('Product not found');
            }
            return this.transformProduct(product);
        }
        catch (error) {
            shared_1.logger.error('Product service: Error getting product by SKU:', error);
            throw error;
        }
    }
    async updateProduct(id, updates) {
        try {
            // Check if product exists
            const existingProduct = await this.getProductById(id);
            // If SKU is being updated, check for duplicates
            if (updates.sku) {
                const existingProducts = await this.database.getAllProducts({ sku: updates.sku }, 1, 1);
                if (existingProducts.products.length > 0 &&
                    existingProducts.products[0]._id.toString() !== id) {
                    throw new Error('Product with this SKU already exists');
                }
            }
            // Update stock status based on quantity
            if (updates.quantity !== undefined) {
                updates.inStock = updates.quantity > (updates.minQuantity || 0);
            }
            // No need to stringify arrays and objects for MongoDB
            // MongoDB stores them natively
            const product = await this.database.updateProduct(id, updates);
            if (!product) {
                throw new Error('Product not found');
            }
            shared_1.logger.info(`Product service: Updated product ${product._id}`);
            return this.transformProduct(product);
        }
        catch (error) {
            shared_1.logger.error('Product service: Error updating product:', error);
            throw error;
        }
    }
    async deleteProduct(id) {
        try {
            const success = await this.database.deleteProduct(id);
            if (!success) {
                throw new Error('Product not found');
            }
            shared_1.logger.info(`Product service: Deleted product ${id}`);
        }
        catch (error) {
            shared_1.logger.error('Product service: Error deleting product:', error);
            throw error;
        }
    }
    async searchProducts(options) {
        try {
            const results = await this.database.getAllProducts(options.filters, options.page, options.limit);
            const { products, total } = results;
            const pages = Math.ceil(total / options.limit);
            const transformedProducts = products.map((product) => this.transformProduct(product));
            const result = {
                products: transformedProducts,
                total,
                pages,
                currentPage: options.page,
            };
            shared_1.logger.info(`Product service: Found ${total} products`);
            return result;
        }
        catch (error) {
            shared_1.logger.error('Product service: Error searching products:', error);
            throw error;
        }
    }
    async getFeaturedProducts(limit = 10) {
        try {
            const results = await this.database.getAllProducts({ isFeatured: true, isActive: true }, 1, limit);
            return results.products.map((product) => this.transformProduct(product));
        }
        catch (error) {
            shared_1.logger.error('Product service: Error getting featured products:', error);
            throw error;
        }
    }
    async getRelatedProducts(productId, limit = 6) {
        try {
            const product = await this.getProductById(productId);
            const results = await this.database.getAllProducts({
                category: product.category,
                isActive: true,
            }, 1, limit + 1);
            // Remove the current product from results
            return results.products
                .filter((p) => p._id.toString() !== productId)
                .slice(0, limit)
                .map((p) => this.transformProduct(p));
        }
        catch (error) {
            shared_1.logger.error('Product service: Error getting related products:', error);
            throw error;
        }
    }
    async updateInventory(id, quantity) {
        try {
            const product = await this.getProductById(id);
            const newQuantity = product.quantity + quantity;
            if (newQuantity < 0) {
                throw new Error('Insufficient inventory');
            }
            const updatedProduct = await this.updateProduct(id, {
                quantity: newQuantity,
                inStock: newQuantity > (product.minQuantity || 0),
            });
            shared_1.logger.info(`Product service: Updated inventory for ${id}: ${quantity}`);
            return updatedProduct;
        }
        catch (error) {
            shared_1.logger.error('Product service: Error updating inventory:', error);
            throw error;
        }
    }
    // Category methods
    async createCategory(categoryData) {
        try {
            // Prepare category data for MongoDB
            const categoryToCreate = {
                name: categoryData.name || '',
                slug: categoryData.slug || categoryData.name?.toLowerCase().replace(/\s+/g, '-') || '',
                description: categoryData.description,
                parentCategory: categoryData.parentCategory,
                image: categoryData.image,
                isActive: categoryData.isActive ?? true,
                sortOrder: categoryData.sortOrder ?? 0,
            };
            // Category creation is handled by the ProductDatabase class
            // For now, we'll simulate it
            shared_1.logger.info('Category would be created:', categoryToCreate);
            // Return mock data with the correct structure
            return {
                ...categoryToCreate,
                _id: `cat_${Date.now()}`,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        }
        catch (error) {
            shared_1.logger.error('Error creating category:', error);
            throw error;
        }
    }
    async getCategories(parentId) {
        try {
            const allCategories = await this.database.getAllCategories();
            if (parentId !== undefined) {
                return allCategories.filter((cat) => cat.parentCategory && cat.parentCategory.toString() === parentId);
            }
            return allCategories;
        }
        catch (error) {
            shared_1.logger.error('Error getting categories:', error);
            throw error;
        }
    }
    async getCategoryById(id) {
        try {
            // Try to find by slug first, then by id
            let category = await this.database.getCategoryBySlug(id);
            if (!category) {
                // If not found by slug, search through all categories for matching id
                const allCategories = await this.database.getAllCategories();
                // Find by MongoDB _id
                category = allCategories.find((cat) => cat._id.toString() === id) || null;
            }
            if (!category) {
                throw new Error('Category not found');
            }
            return category;
        }
        catch (error) {
            shared_1.logger.error(`Error getting category ${id}:`, error);
            throw error;
        }
    }
    async updateCategory(id, updates) {
        try {
            // Check if category exists
            const existingCategory = await this.getCategoryById(id);
            // Category update is handled by the ProductDatabase class
            // For now, we'll simulate it
            shared_1.logger.info(`Category ${id} would be updated with:`, updates);
            // Return mock updated data
            return {
                ...existingCategory,
                ...updates,
                updatedAt: new Date(),
            };
        }
        catch (error) {
            shared_1.logger.error(`Error updating category ${id}:`, error);
            throw error;
        }
    }
    async deleteCategory(id) {
        try {
            // Check if category exists
            await this.getCategoryById(id);
            // Category deletion is handled by the ProductDatabase class
            // For now, just log
            shared_1.logger.info(`Category ${id} would be deleted`);
        }
        catch (error) {
            shared_1.logger.error(`Error deleting category ${id}:`, error);
            throw error;
        }
    }
    // Helper methods
    async getProductByCategoryId(categoryId, page = 1, limit = 20) {
        try {
            const category = await this.getCategoryById(categoryId);
            const results = await this.database.getProductsByCategory(categoryId, page, limit);
            const { products, total } = results;
            const totalPages = Math.ceil(total / limit);
            const transformedProducts = products.map((p) => this.transformProduct(p));
            return {
                products: transformedProducts,
                total,
                pages: totalPages,
                currentPage: page,
            };
        }
        catch (error) {
            shared_1.logger.error(`Error getting products for category ${categoryId}:`, error);
            throw error;
        }
    }
    async checkAvailability(id, quantity = 1) {
        try {
            const product = await this.getProductById(id);
            const available = product.inStock && product.quantity >= quantity;
            return {
                available,
                remainingStock: product.quantity,
            };
        }
        catch (error) {
            shared_1.logger.error(`Error checking availability for product ${id}:`, error);
            throw error;
        }
    }
    async getProductStats() {
        try {
            const allProducts = await this.database.getAllProducts({}, 1, 1000);
            const categories = await this.database.getAllCategories();
            return {
                totalProducts: allProducts.total,
                totalCategories: categories.length,
                inStockProducts: allProducts.products.filter((p) => p.inStock).length,
                featuredProducts: allProducts.products.filter((p) => p.isFeatured).length,
                averagePrice: allProducts.products.length > 0
                    ? allProducts.products.reduce((sum, p) => sum + p.price, 0) /
                        allProducts.total || 0
                    : 0,
                topCategories: categories.slice(0, 5).map((cat) => ({
                    id: cat._id,
                    name: cat.name,
                    productCount: allProducts.products.filter((p) => p.category === cat._id.toString())
                        .length,
                })),
            };
        }
        catch (error) {
            shared_1.logger.error('Error getting product stats:', error);
            throw error;
        }
    }
    // Private utility functions
    generateSKU(name, brand) {
        const namePrefix = name
            .replace(/[^A-Za-z0-9]/g, '')
            .substr(0, 3)
            .toUpperCase();
        const brandPrefix = brand
            .replace(/[^A-Za-z0-9]/g, '')
            .substr(0, 3)
            .toUpperCase();
        const randomPart = Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, '0');
        return `${brandPrefix}-${namePrefix}-${randomPart}`;
    }
    transformProduct(product) {
        // With MongoDB, we don't need to parse JSON strings anymore
        // Instead, we'll standardize the document format for the API
        if (!product)
            return null;
        // Convert Mongoose document to plain object if needed
        const doc = product.toObject ? product.toObject() : product;
        // Standardize the response format (convert _id to id for API consistency)
        const transformed = {
            id: doc._id.toString(),
            name: doc.name,
            description: doc.description,
            shortDescription: doc.shortDescription,
            price: doc.price,
            originalPrice: doc.originalPrice,
            discount: doc.discount,
            category: doc.category,
            subcategory: doc.subcategory,
            brand: doc.brand,
            sku: doc.sku,
            images: doc.images || [],
            specifications: doc.specifications || {},
            inStock: doc.inStock,
            quantity: doc.quantity,
            minQuantity: doc.minQuantity,
            weight: doc.weight,
            dimensions: doc.dimensions,
            tags: doc.tags || [],
            rating_average: doc.rating?.average || 0,
            rating_count: doc.rating?.count || 0,
            isActive: doc.isActive,
            isFeatured: doc.isFeatured,
            seoTitle: doc.seoTitle,
            seoDescription: doc.seoDescription,
            seoKeywords: doc.seoKeywords || [],
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        };
        return transformed;
    }
}
exports.ProductService = ProductService;
//# sourceMappingURL=productService.new.js.map