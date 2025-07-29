"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuery = exports.validateProduct = exports.reviewQuerySchema = exports.productQuerySchema = exports.createReviewSchema = exports.updateCategorySchema = exports.createCategorySchema = exports.updateProductSchema = exports.createProductSchema = void 0;
const tslib_1 = require("tslib");
const joi_1 = tslib_1.__importDefault(require("joi"));
// Product validation schemas
exports.createProductSchema = joi_1.default.object({
    name: joi_1.default.string().min(1).max(200).required().trim(),
    description: joi_1.default.string().min(10).max(2000).required(),
    shortDescription: joi_1.default.string().max(300).optional(),
    price: joi_1.default.number().min(0).required(),
    originalPrice: joi_1.default.number().min(0).optional(),
    discount: joi_1.default.number().min(0).max(100).optional(),
    category: joi_1.default.string().required().trim(),
    subcategory: joi_1.default.string().optional().trim(),
    brand: joi_1.default.string().required().trim(),
    sku: joi_1.default.string().required().trim(),
    images: joi_1.default.array().items(joi_1.default.string().uri()).optional(),
    specifications: joi_1.default.object().optional(),
    inStock: joi_1.default.boolean().optional(),
    quantity: joi_1.default.number().min(0).required(),
    minQuantity: joi_1.default.number().min(0).optional(),
    weight: joi_1.default.number().min(0).optional(),
    dimensions: joi_1.default.object({
        length: joi_1.default.number().min(0).required(),
        width: joi_1.default.number().min(0).required(),
        height: joi_1.default.number().min(0).required(),
    }).optional(),
    tags: joi_1.default.array().items(joi_1.default.string().trim()).optional(),
    isActive: joi_1.default.boolean().optional(),
    isFeatured: joi_1.default.boolean().optional(),
    seoTitle: joi_1.default.string().max(60).optional(),
    seoDescription: joi_1.default.string().max(160).optional(),
    seoKeywords: joi_1.default.array().items(joi_1.default.string().trim()).optional(),
});
exports.updateProductSchema = joi_1.default.object({
    name: joi_1.default.string().min(1).max(200).optional().trim(),
    description: joi_1.default.string().min(10).max(2000).optional(),
    shortDescription: joi_1.default.string().max(300).optional(),
    price: joi_1.default.number().min(0).optional(),
    originalPrice: joi_1.default.number().min(0).optional(),
    discount: joi_1.default.number().min(0).max(100).optional(),
    category: joi_1.default.string().optional().trim(),
    subcategory: joi_1.default.string().optional().trim(),
    brand: joi_1.default.string().optional().trim(),
    sku: joi_1.default.string().optional().trim(),
    images: joi_1.default.array().items(joi_1.default.string().uri()).optional(),
    specifications: joi_1.default.object().optional(),
    inStock: joi_1.default.boolean().optional(),
    quantity: joi_1.default.number().min(0).optional(),
    minQuantity: joi_1.default.number().min(0).optional(),
    weight: joi_1.default.number().min(0).optional(),
    dimensions: joi_1.default.object({
        length: joi_1.default.number().min(0).required(),
        width: joi_1.default.number().min(0).required(),
        height: joi_1.default.number().min(0).required(),
    }).optional(),
    tags: joi_1.default.array().items(joi_1.default.string().trim()).optional(),
    isActive: joi_1.default.boolean().optional(),
    isFeatured: joi_1.default.boolean().optional(),
    seoTitle: joi_1.default.string().max(60).optional(),
    seoDescription: joi_1.default.string().max(160).optional(),
    seoKeywords: joi_1.default.array().items(joi_1.default.string().trim()).optional(),
});
// Category validation schemas
exports.createCategorySchema = joi_1.default.object({
    name: joi_1.default.string().min(1).max(100).required().trim(),
    slug: joi_1.default.string().min(1).max(100).required().trim().lowercase(),
    description: joi_1.default.string().max(500).optional(),
    parentCategory: joi_1.default.string().optional(),
    image: joi_1.default.string().uri().optional(),
    isActive: joi_1.default.boolean().optional(),
    sortOrder: joi_1.default.number().optional(),
});
exports.updateCategorySchema = joi_1.default.object({
    name: joi_1.default.string().min(1).max(100).optional().trim(),
    slug: joi_1.default.string().min(1).max(100).optional().trim().lowercase(),
    description: joi_1.default.string().max(500).optional(),
    parentCategory: joi_1.default.string().optional(),
    image: joi_1.default.string().uri().optional(),
    isActive: joi_1.default.boolean().optional(),
    sortOrder: joi_1.default.number().optional(),
});
// Review validation schemas
exports.createReviewSchema = joi_1.default.object({
    productId: joi_1.default.string().required(),
    userId: joi_1.default.string().required(),
    rating: joi_1.default.number().min(1).max(5).required(),
    title: joi_1.default.string().min(1).max(100).required().trim(),
    comment: joi_1.default.string().min(10).max(1000).required(),
    verified: joi_1.default.boolean().optional(),
});
// Query validation schemas
exports.productQuerySchema = joi_1.default.object({
    page: joi_1.default.number().min(1).optional(),
    limit: joi_1.default.number().min(1).max(100).optional(),
    category: joi_1.default.string().optional(),
    subcategory: joi_1.default.string().optional(),
    brand: joi_1.default.string().optional(),
    minPrice: joi_1.default.number().min(0).optional(),
    maxPrice: joi_1.default.number().min(0).optional(),
    inStock: joi_1.default.boolean().optional(),
    isActive: joi_1.default.boolean().optional(),
    isFeatured: joi_1.default.boolean().optional(),
    search: joi_1.default.string().min(1).optional(),
    sortBy: joi_1.default.string().valid('name', 'price', 'rating', 'createdAt').optional(),
    sortOrder: joi_1.default.string().valid('asc', 'desc').optional(),
});
exports.reviewQuerySchema = joi_1.default.object({
    page: joi_1.default.number().min(1).optional(),
    limit: joi_1.default.number().min(1).max(50).optional(),
});
// Validation middleware
const validateProduct = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const errors = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors,
            });
        }
        next();
    };
};
exports.validateProduct = validateProduct;
const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.query, { abortEarly: false });
        if (error) {
            const errors = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));
            return res.status(400).json({
                success: false,
                message: 'Query validation failed',
                errors,
            });
        }
        next();
    };
};
exports.validateQuery = validateQuery;
//# sourceMappingURL=productValidator.js.map