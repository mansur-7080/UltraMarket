"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("@ultramarket/shared/logging/logger");
const errors_1 = require("@ultramarket/shared/errors");
const product_validator_1 = require("../validators/product.validator");
const product_service_1 = require("../services/product.service");
const cache_service_1 = require("../services/cache.service");
const audit_service_1 = require("../services/audit.service");
const prisma = new client_1.PrismaClient();
class ProductController {
    static async createProduct(req, res, next) {
        try {
            const { error, value } = (0, product_validator_1.validateProductInput)(req.body);
            if (error) {
                throw new errors_1.ValidationError('Invalid product data', error.details);
            }
            const productData = value;
            const userId = req.user?.id;
            const product = await (0, product_service_1.createProduct)({
                ...productData,
                vendorId: userId,
            });
            await (0, cache_service_1.cacheProduct)(product);
            await (0, audit_service_1.logProductAction)('PRODUCT_CREATED', {
                userId,
                productId: product.id,
                productName: product.name,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
            });
            logger_1.logger.info('Product created successfully', {
                productId: product.id,
                vendorId: userId,
                operation: 'product_creation',
            });
            res.status(201).json({
                success: true,
                message: 'Product created successfully',
                data: { product },
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getProduct(req, res, next) {
        try {
            const { id } = req.params;
            let product = await (0, cache_service_1.getCachedProduct)(id);
            if (!product) {
                product = await (0, product_service_1.findProductById)(id);
                if (!product) {
                    throw new errors_1.NotFoundError('Product not found');
                }
                await (0, cache_service_1.cacheProduct)(product);
            }
            logger_1.logger.debug('Product retrieved successfully', {
                productId: id,
                operation: 'product_retrieval',
            });
            res.status(200).json({
                success: true,
                data: { product },
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getProducts(req, res, next) {
        try {
            const { page = 1, limit = 20, category, brand, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'desc', status = 'ACTIVE', } = req.query;
            const filters = {
                category: category,
                brand: brand,
                minPrice: minPrice ? parseFloat(minPrice) : undefined,
                maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
                status: status,
            };
            const products = await (0, product_service_1.findProducts)({
                page: parseInt(page),
                limit: parseInt(limit),
                filters,
                sortBy: sortBy,
                sortOrder: sortOrder,
            });
            logger_1.logger.debug('Products retrieved successfully', {
                count: products.data.length,
                total: products.total,
                page: parseInt(page),
                operation: 'products_retrieval',
            });
            res.status(200).json({
                success: true,
                data: products,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateProduct(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const { error, value } = (0, product_validator_1.validateProductUpdateInput)(req.body);
            if (error) {
                throw new errors_1.ValidationError('Invalid product update data', error.details);
            }
            const existingProduct = await (0, product_service_1.findProductById)(id);
            if (!existingProduct) {
                throw new errors_1.NotFoundError('Product not found');
            }
            if (existingProduct.vendorId !== userId && req.user?.role !== 'ADMIN') {
                throw new errors_1.AuthorizationError('You can only update your own products');
            }
            const updatedProduct = await (0, product_service_1.updateProduct)(id, value);
            await (0, cache_service_1.cacheProduct)(updatedProduct);
            await (0, audit_service_1.logProductAction)('PRODUCT_UPDATED', {
                userId,
                productId: id,
                productName: updatedProduct.name,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
            });
            logger_1.logger.info('Product updated successfully', {
                productId: id,
                vendorId: userId,
                operation: 'product_update',
            });
            res.status(200).json({
                success: true,
                message: 'Product updated successfully',
                data: { product: updatedProduct },
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteProduct(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const existingProduct = await (0, product_service_1.findProductById)(id);
            if (!existingProduct) {
                throw new errors_1.NotFoundError('Product not found');
            }
            if (existingProduct.vendorId !== userId && req.user?.role !== 'ADMIN') {
                throw new errors_1.AuthorizationError('You can only delete your own products');
            }
            await (0, product_service_1.deleteProduct)(id);
            await (0, cache_service_1.invalidateProductCache)(id);
            await (0, audit_service_1.logProductAction)('PRODUCT_DELETED', {
                userId,
                productId: id,
                productName: existingProduct.name,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
            });
            logger_1.logger.info('Product deleted successfully', {
                productId: id,
                vendorId: userId,
                operation: 'product_deletion',
            });
            res.status(200).json({
                success: true,
                message: 'Product deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async searchProducts(req, res, next) {
        try {
            const { q, page = 1, limit = 20, category, brand, minPrice, maxPrice, sortBy = 'relevance', sortOrder = 'desc', } = req.query;
            if (!q) {
                throw new errors_1.ValidationError('Search query is required');
            }
            const searchResults = await (0, product_service_1.searchProducts)({
                query: q,
                page: parseInt(page),
                limit: parseInt(limit),
                filters: {
                    category: category,
                    brand: brand,
                    minPrice: minPrice ? parseFloat(minPrice) : undefined,
                    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
                },
                sortBy: sortBy,
                sortOrder: sortOrder,
            });
            logger_1.logger.debug('Product search completed', {
                query: q,
                results: searchResults.data.length,
                total: searchResults.total,
                operation: 'product_search',
            });
            res.status(200).json({
                success: true,
                data: searchResults,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getCategories(req, res, next) {
        try {
            const categories = await (0, product_service_1.getProductCategories)();
            logger_1.logger.debug('Product categories retrieved', {
                count: categories.length,
                operation: 'categories_retrieval',
            });
            res.status(200).json({
                success: true,
                data: { categories },
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getBrands(req, res, next) {
        try {
            const brands = await (0, product_service_1.getProductBrands)();
            logger_1.logger.debug('Product brands retrieved', {
                count: brands.length,
                operation: 'brands_retrieval',
            });
            res.status(200).json({
                success: true,
                data: { brands },
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getStatistics(req, res, next) {
        try {
            const statistics = await (0, product_service_1.getProductStatistics)();
            logger_1.logger.debug('Product statistics retrieved', {
                operation: 'statistics_retrieval',
            });
            res.status(200).json({
                success: true,
                data: { statistics },
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getVendorProducts(req, res, next) {
        try {
            const { vendorId } = req.params;
            const { page = 1, limit = 20, status = 'ACTIVE' } = req.query;
            const products = await (0, product_service_1.findProducts)({
                page: parseInt(page),
                limit: parseInt(limit),
                filters: {
                    vendorId,
                    status: status,
                },
                sortBy: 'createdAt',
                sortOrder: 'desc',
            });
            logger_1.logger.debug('Vendor products retrieved', {
                vendorId,
                count: products.data.length,
                total: products.total,
                operation: 'vendor_products_retrieval',
            });
            res.status(200).json({
                success: true,
                data: products,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async bulkUpdateProducts(req, res, next) {
        try {
            const { productIds, updates } = req.body;
            const userId = req.user?.id;
            if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
                throw new errors_1.ValidationError('Product IDs array is required');
            }
            if (!updates || typeof updates !== 'object') {
                throw new errors_1.ValidationError('Updates object is required');
            }
            const products = await prisma.product.findMany({
                where: { id: { in: productIds } },
            });
            if (products.length !== productIds.length) {
                throw new errors_1.NotFoundError('Some products not found');
            }
            const isAdmin = req.user?.role === 'ADMIN';
            const unauthorizedProducts = products.filter((p) => p.vendorId !== userId && !isAdmin);
            if (unauthorizedProducts.length > 0) {
                throw new errors_1.AuthorizationError('You can only update your own products');
            }
            const updatedProducts = await prisma.product.updateMany({
                where: { id: { in: productIds } },
                data: updates,
            });
            for (const productId of productIds) {
                await (0, cache_service_1.invalidateProductCache)(productId);
            }
            await (0, audit_service_1.logProductAction)('BULK_PRODUCT_UPDATE', {
                userId,
                productIds,
                updates,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
            });
            logger_1.logger.info('Bulk product update completed', {
                userId,
                productCount: productIds.length,
                operation: 'bulk_product_update',
            });
            res.status(200).json({
                success: true,
                message: 'Products updated successfully',
                data: {
                    updatedCount: updatedProducts.count,
                    productIds,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getProductRecommendations(req, res, next) {
        try {
            const { id } = req.params;
            const { limit = 10 } = req.query;
            const product = await (0, product_service_1.findProductById)(id);
            if (!product) {
                throw new errors_1.NotFoundError('Product not found');
            }
            const recommendations = await prisma.product.findMany({
                where: {
                    id: { not: id },
                    status: 'ACTIVE',
                    OR: [{ category: product.category }, { brand: product.brand }],
                },
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
            });
            logger_1.logger.debug('Product recommendations retrieved', {
                productId: id,
                recommendationsCount: recommendations.length,
                operation: 'product_recommendations',
            });
            res.status(200).json({
                success: true,
                data: { recommendations },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ProductController = ProductController;
//# sourceMappingURL=product.controller.js.map