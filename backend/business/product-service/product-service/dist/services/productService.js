"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const tslib_1 = require("tslib");
const mongoose_1 = tslib_1.__importDefault(require("mongoose"));
const shared_1 = require("@ultramarket/shared");
// Product Schema
const productSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    description: {
        type: String,
        required: true,
        maxlength: 2000,
    },
    sku: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
    },
    category: {
        type: String,
        required: true,
        index: true,
    },
    brand: {
        type: String,
        required: true,
        index: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    originalPrice: {
        type: Number,
        min: 0,
    },
    discount: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    images: [
        {
            type: String,
            required: true,
        },
    ],
    specifications: {
        type: Map,
        of: String,
    },
    tags: [
        {
            type: String,
            trim: true,
        },
    ],
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    isFeatured: {
        type: Boolean,
        default: false,
        index: true,
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
    },
    reviewCount: {
        type: Number,
        default: 0,
    },
    vendorId: {
        type: String,
        required: true,
        index: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});
// Indexes for better performance
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ isActive: 1, isFeatured: 1 });
const Product = mongoose_1.default.model('Product', productSchema);
class ProductService {
    /**
     * Get all products with pagination and filtering
     */
    async getProducts(options) {
        try {
            const { page, limit, filters, sortBy, sortOrder } = options;
            const skip = (page - 1) * limit;
            // Build query
            const query = {};
            if (filters.category) {
                query.category = filters.category;
            }
            if (filters.brand) {
                query.brand = filters.brand;
            }
            if (filters.minPrice || filters.maxPrice) {
                query.price = {};
                if (filters.minPrice)
                    query.price.$gte = filters.minPrice;
                if (filters.maxPrice)
                    query.price.$lte = filters.maxPrice;
            }
            if (filters.inStock !== undefined) {
                if (filters.inStock) {
                    query.stock = { $gt: 0 };
                }
                else {
                    query.stock = { $lte: 0 };
                }
            }
            if (filters.isActive !== undefined) {
                query.isActive = filters.isActive;
            }
            if (filters.isFeatured !== undefined) {
                query.isFeatured = filters.isFeatured;
            }
            if (filters.vendorId) {
                query.vendorId = filters.vendorId;
            }
            if (filters.search) {
                query.$text = { $search: filters.search };
            }
            // Build sort object
            const sort = {};
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
            const [products, total] = await Promise.all([
                Product.find(query).sort(sort).skip(skip).limit(limit).lean(),
                Product.countDocuments(query),
            ]);
            return {
                products,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        }
        catch (error) {
            shared_1.logger.error('Failed to get products', { error });
            throw error;
        }
    }
    /**
     * Get product by ID
     */
    async getProductById(id) {
        try {
            const product = await Product.findById(id).lean();
            return product;
        }
        catch (error) {
            shared_1.logger.error('Failed to get product by ID', { error, productId: id });
            throw error;
        }
    }
    /**
     * Create new product
     */
    async createProduct(productData) {
        try {
            // Check if SKU already exists
            const existingProduct = await Product.findOne({ sku: productData.sku });
            if (existingProduct) {
                throw new Error('Product with this SKU already exists');
            }
            const product = new Product(productData);
            await product.save();
            shared_1.logger.info('Product created successfully', { productId: product._id });
            return product.toObject();
        }
        catch (error) {
            shared_1.logger.error('Failed to create product', { error });
            throw error;
        }
    }
    /**
     * Update product
     */
    async updateProduct(id, updateData) {
        try {
            const product = await Product.findByIdAndUpdate(id, { ...updateData, updatedAt: new Date() }, { new: true, runValidators: true }).lean();
            if (!product) {
                return null;
            }
            shared_1.logger.info('Product updated successfully', { productId: id });
            return product;
        }
        catch (error) {
            shared_1.logger.error('Failed to update product', { error, productId: id });
            throw error;
        }
    }
    /**
     * Delete product
     */
    async deleteProduct(id) {
        try {
            const result = await Product.findByIdAndDelete(id);
            return !!result;
        }
        catch (error) {
            shared_1.logger.error('Failed to delete product', { error, productId: id });
            throw error;
        }
    }
    /**
     * Get products by category
     */
    async getProductsByCategory(category, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            const [products, total] = await Promise.all([
                Product.find({ category, isActive: true })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Product.countDocuments({ category, isActive: true }),
            ]);
            return {
                products,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        }
        catch (error) {
            shared_1.logger.error('Failed to get products by category', { error, category });
            throw error;
        }
    }
    /**
     * Search products
     */
    async searchProducts(query, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            const searchQuery = {
                $text: { $search: query },
                isActive: true,
            };
            const [products, total] = await Promise.all([
                Product.find(searchQuery)
                    .sort({ score: { $meta: 'textScore' } })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Product.countDocuments(searchQuery),
            ]);
            return {
                products,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        }
        catch (error) {
            shared_1.logger.error('Failed to search products', { error, query });
            throw error;
        }
    }
    /**
     * Get product categories
     */
    async getCategories() {
        try {
            const categories = await Product.distinct('category');
            return categories.filter(Boolean);
        }
        catch (error) {
            shared_1.logger.error('Failed to get categories', { error });
            throw error;
        }
    }
    /**
     * Get product brands
     */
    async getBrands() {
        try {
            const brands = await Product.distinct('brand');
            return brands.filter(Boolean);
        }
        catch (error) {
            shared_1.logger.error('Failed to get brands', { error });
            throw error;
        }
    }
    /**
     * Update product stock
     */
    async updateStock(id, quantity, operation = 'add') {
        try {
            const product = await Product.findById(id);
            if (!product) {
                return null;
            }
            if (operation === 'subtract' && product.stock < quantity) {
                throw new Error('Insufficient stock');
            }
            const newStock = operation === 'add' ? product.stock + quantity : product.stock - quantity;
            const updatedProduct = await Product.findByIdAndUpdate(id, { stock: newStock, updatedAt: new Date() }, { new: true }).lean();
            shared_1.logger.info('Product stock updated', {
                productId: id,
                oldStock: product.stock,
                newStock,
                operation,
            });
            return updatedProduct;
        }
        catch (error) {
            shared_1.logger.error('Failed to update product stock', { error, productId: id });
            throw error;
        }
    }
    /**
     * Get product statistics
     */
    async getProductStats() {
        try {
            const [totalProducts, activeProducts, outOfStockProducts, featuredProducts, totalCategories, totalBrands, averagePrice,] = await Promise.all([
                Product.countDocuments(),
                Product.countDocuments({ isActive: true }),
                Product.countDocuments({ stock: { $lte: 0 } }),
                Product.countDocuments({ isFeatured: true }),
                Product.distinct('category').then((cats) => cats.length),
                Product.distinct('brand').then((brands) => brands.length),
                Product.aggregate([
                    { $match: { isActive: true } },
                    { $group: { _id: null, avgPrice: { $avg: '$price' } } },
                ]).then((result) => result[0]?.avgPrice || 0),
            ]);
            return {
                totalProducts,
                activeProducts,
                outOfStockProducts,
                featuredProducts,
                totalCategories,
                totalBrands,
                averagePrice: Math.round(averagePrice * 100) / 100,
            };
        }
        catch (error) {
            shared_1.logger.error('Failed to get product statistics', { error });
            throw error;
        }
    }
    /**
     * Get featured products
     */
    async getFeaturedProducts(limit = 10) {
        try {
            const products = await Product.find({
                isFeatured: true,
                isActive: true,
            })
                .sort({ rating: -1, reviewCount: -1 })
                .limit(limit)
                .lean();
            return products;
        }
        catch (error) {
            shared_1.logger.error('Failed to get featured products', { error });
            throw error;
        }
    }
    /**
     * Get related products
     */
    async getRelatedProducts(productId, limit = 5) {
        try {
            const product = await Product.findById(productId);
            if (!product) {
                return [];
            }
            const relatedProducts = await Product.find({
                _id: { $ne: productId },
                category: product.category,
                isActive: true,
            })
                .sort({ rating: -1, reviewCount: -1 })
                .limit(limit)
                .lean();
            return relatedProducts;
        }
        catch (error) {
            shared_1.logger.error('Failed to get related products', { error, productId });
            throw error;
        }
    }
    /**
     * Check product availability
     */
    async checkAvailability(productIds) {
        try {
            const products = await Product.find({
                _id: { $in: productIds },
                isActive: true,
            }).select('_id stock price name');
            const availability = products.map((product) => ({
                productId: product._id.toString(),
                name: product.name,
                price: product.price,
                inStock: product.stock > 0,
                stock: product.stock,
            }));
            return availability;
        }
        catch (error) {
            shared_1.logger.error('Failed to check product availability', { error });
            throw error;
        }
    }
    /**
     * Bulk update products
     */
    async bulkUpdateProducts(updates) {
        try {
            const bulkOps = updates.map(({ id, data }) => ({
                updateOne: {
                    filter: { _id: id },
                    update: { ...data, updatedAt: new Date() },
                },
            }));
            const result = await Product.bulkWrite(bulkOps);
            shared_1.logger.info('Bulk update completed', {
                matched: result.matchedCount,
                modified: result.modifiedCount,
            });
            return result;
        }
        catch (error) {
            shared_1.logger.error('Failed to bulk update products', { error });
            throw error;
        }
    }
}
exports.ProductService = ProductService;
//# sourceMappingURL=productService.js.map