"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductRepository = void 0;
const tslib_1 = require("tslib");
const Product_1 = require("../models/Product");
const shared_1 = require("@ultramarket/shared");
const mongoose_1 = tslib_1.__importDefault(require("mongoose"));
class ProductRepository {
    // Product CRUD operations
    async createProduct(productData) {
        try {
            const product = new Product_1.Product(productData);
            await product.save();
            shared_1.logger.info(`Product created: ${product._id}`);
            return product;
        }
        catch (error) {
            shared_1.logger.error('Error creating product:', error);
            throw error;
        }
    }
    async findProductById(id) {
        try {
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                return null;
            }
            const product = await Product_1.Product.findById(id).populate('reviews').exec();
            return product;
        }
        catch (error) {
            shared_1.logger.error('Error finding product by ID:', error);
            throw error;
        }
    }
    async findProductBySku(sku) {
        try {
            const product = await Product_1.Product.findOne({ sku }).populate('reviews').exec();
            return product;
        }
        catch (error) {
            shared_1.logger.error('Error finding product by SKU:', error);
            throw error;
        }
    }
    async updateProduct(id, updates) {
        try {
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                return null;
            }
            const product = await Product_1.Product.findByIdAndUpdate(id, { ...updates, updatedAt: new Date() }, { new: true, runValidators: true }).populate('reviews');
            if (product) {
                shared_1.logger.info(`Product updated: ${product._id}`);
            }
            return product;
        }
        catch (error) {
            shared_1.logger.error('Error updating product:', error);
            throw error;
        }
    }
    async deleteProduct(id) {
        try {
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                return false;
            }
            const result = await Product_1.Product.findByIdAndDelete(id);
            if (result) {
                shared_1.logger.info(`Product deleted: ${id}`);
                return true;
            }
            return false;
        }
        catch (error) {
            shared_1.logger.error('Error deleting product:', error);
            throw error;
        }
    }
    async findProducts(filters = {}, sort = { field: 'createdAt', direction: 'desc' }, pagination = { page: 1, limit: 20 }) {
        try {
            const query = {};
            // Apply filters
            if (filters.category)
                query.category = filters.category;
            if (filters.subcategory)
                query.subcategory = filters.subcategory;
            if (filters.brand)
                query.brand = filters.brand;
            if (filters.minPrice !== undefined)
                query.price = { ...query.price, $gte: filters.minPrice };
            if (filters.maxPrice !== undefined)
                query.price = { ...query.price, $lte: filters.maxPrice };
            if (filters.inStock !== undefined)
                query.inStock = filters.inStock;
            if (filters.isActive !== undefined)
                query.isActive = filters.isActive;
            if (filters.isFeatured !== undefined)
                query.isFeatured = filters.isFeatured;
            // Text search
            if (filters.search) {
                query.$text = { $search: filters.search };
            }
            // Sort configuration
            const sortConfig = {};
            if (filters.search) {
                sortConfig.score = { $meta: 'textScore' };
            }
            sortConfig[sort.field] = sort.direction === 'asc' ? 1 : -1;
            // Pagination
            const skip = (pagination.page - 1) * pagination.limit;
            // Execute query
            const [products, total] = await Promise.all([
                Product_1.Product.find(query)
                    .sort(sortConfig)
                    .skip(skip)
                    .limit(pagination.limit)
                    .populate('reviews')
                    .exec(),
                Product_1.Product.countDocuments(query),
            ]);
            const pages = Math.ceil(total / pagination.limit);
            return {
                products,
                total,
                pages,
                currentPage: pagination.page,
            };
        }
        catch (error) {
            shared_1.logger.error('Error finding products:', error);
            throw error;
        }
    }
    async updateProductRating(productId) {
        try {
            if (!mongoose_1.default.Types.ObjectId.isValid(productId)) {
                return;
            }
            const reviews = await Product_1.Review.find({ productId });
            if (reviews.length === 0) {
                await Product_1.Product.findByIdAndUpdate(productId, {
                    'rating.average': 0,
                    'rating.count': 0,
                });
                return;
            }
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = totalRating / reviews.length;
            await Product_1.Product.findByIdAndUpdate(productId, {
                'rating.average': Math.round(averageRating * 10) / 10,
                'rating.count': reviews.length,
            });
            shared_1.logger.info(`Product rating updated: ${productId}`);
        }
        catch (error) {
            shared_1.logger.error('Error updating product rating:', error);
            throw error;
        }
    }
    // Category operations
    async createCategory(categoryData) {
        try {
            const category = new Product_1.Category(categoryData);
            await category.save();
            shared_1.logger.info(`Category created: ${category._id}`);
            return category;
        }
        catch (error) {
            shared_1.logger.error('Error creating category:', error);
            throw error;
        }
    }
    async findCategories(parentId) {
        try {
            const query = parentId ? { parentCategory: parentId } : {};
            const categories = await Product_1.Category.find(query)
                .sort({ sortOrder: 1, name: 1 })
                .populate('parentCategory')
                .exec();
            return categories;
        }
        catch (error) {
            shared_1.logger.error('Error finding categories:', error);
            throw error;
        }
    }
    async findCategoryBySlug(slug) {
        try {
            const category = await Product_1.Category.findOne({ slug }).populate('parentCategory').exec();
            return category;
        }
        catch (error) {
            shared_1.logger.error('Error finding category by slug:', error);
            throw error;
        }
    }
    // Review operations
    async createReview(reviewData) {
        try {
            const review = new Product_1.Review(reviewData);
            await review.save();
            // Update product rating
            await this.updateProductRating(review.productId.toString());
            shared_1.logger.info(`Review created: ${review._id}`);
            return review;
        }
        catch (error) {
            shared_1.logger.error('Error creating review:', error);
            throw error;
        }
    }
    async findReviewsByProduct(productId, page = 1, limit = 10) {
        try {
            if (!mongoose_1.default.Types.ObjectId.isValid(productId)) {
                return { reviews: [], total: 0, pages: 0 };
            }
            const skip = (page - 1) * limit;
            const [reviews, total] = await Promise.all([
                Product_1.Review.find({ productId }).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
                Product_1.Review.countDocuments({ productId }),
            ]);
            const pages = Math.ceil(total / limit);
            return { reviews, total, pages };
        }
        catch (error) {
            shared_1.logger.error('Error finding reviews by product:', error);
            throw error;
        }
    }
    // Analytics and reporting
    async getProductStats() {
        try {
            const [totalProducts, activeProducts, outOfStock, priceStats, totalCategories] = await Promise.all([
                Product_1.Product.countDocuments(),
                Product_1.Product.countDocuments({ isActive: true }),
                Product_1.Product.countDocuments({ inStock: false }),
                Product_1.Product.aggregate([
                    { $match: { isActive: true } },
                    { $group: { _id: null, averagePrice: { $avg: '$price' } } },
                ]),
                Product_1.Category.countDocuments(),
            ]);
            return {
                totalProducts,
                activeProducts,
                outOfStock,
                averagePrice: priceStats[0]?.averagePrice || 0,
                totalCategories,
            };
        }
        catch (error) {
            shared_1.logger.error('Error getting product stats:', error);
            throw error;
        }
    }
}
exports.ProductRepository = ProductRepository;
//# sourceMappingURL=productRepository.js.map