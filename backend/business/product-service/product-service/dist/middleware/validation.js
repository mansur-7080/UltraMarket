"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateProductUpdate = exports.validateProduct = void 0;
const tslib_1 = require("tslib");
const joi_1 = tslib_1.__importDefault(require("joi"));
// Product validation schema
const productSchema = joi_1.default.object({
    name: joi_1.default.string().required().max(200).messages({
        'string.empty': 'Product name is required',
        'string.max': 'Product name cannot exceed 200 characters'
    }),
    description: joi_1.default.string().required().max(2000).messages({
        'string.empty': 'Product description is required',
        'string.max': 'Description cannot exceed 2000 characters'
    }),
    price: joi_1.default.number().required().min(0).messages({
        'number.base': 'Price must be a number',
        'number.min': 'Price cannot be negative'
    }),
    originalPrice: joi_1.default.number().min(0).optional().messages({
        'number.base': 'Original price must be a number',
        'number.min': 'Original price cannot be negative'
    }),
    category: joi_1.default.string().required().messages({
        'string.empty': 'Product category is required'
    }),
    subcategory: joi_1.default.string().optional(),
    brand: joi_1.default.string().required().messages({
        'string.empty': 'Product brand is required'
    }),
    sku: joi_1.default.string().optional(),
    images: joi_1.default.array().items(joi_1.default.string()).min(1).required().messages({
        'array.min': 'At least one product image is required'
    }),
    thumbnail: joi_1.default.string().required().messages({
        'string.empty': 'Product thumbnail is required'
    }),
    stock: joi_1.default.number().integer().min(0).default(0).messages({
        'number.base': 'Stock must be a number',
        'number.min': 'Stock cannot be negative'
    }),
    weight: joi_1.default.number().required().min(0).messages({
        'number.base': 'Weight must be a number',
        'number.min': 'Weight cannot be negative'
    }),
    dimensions: joi_1.default.object({
        length: joi_1.default.number().required().min(0).messages({
            'number.base': 'Length must be a number',
            'number.min': 'Length cannot be negative'
        }),
        width: joi_1.default.number().required().min(0).messages({
            'number.base': 'Width must be a number',
            'number.min': 'Width cannot be negative'
        }),
        height: joi_1.default.number().required().min(0).messages({
            'number.base': 'Height must be a number',
            'number.min': 'Height cannot be negative'
        })
    }).required(),
    specifications: joi_1.default.object().default({}),
    tags: joi_1.default.array().items(joi_1.default.string()).default([]),
    isActive: joi_1.default.boolean().default(true),
    isFeatured: joi_1.default.boolean().default(false)
});
// Product update validation schema (all fields optional)
const productUpdateSchema = joi_1.default.object({
    name: joi_1.default.string().max(200).optional(),
    description: joi_1.default.string().max(2000).optional(),
    price: joi_1.default.number().min(0).optional(),
    originalPrice: joi_1.default.number().min(0).optional(),
    category: joi_1.default.string().optional(),
    subcategory: joi_1.default.string().optional(),
    brand: joi_1.default.string().optional(),
    sku: joi_1.default.string().optional(),
    images: joi_1.default.array().items(joi_1.default.string()).optional(),
    thumbnail: joi_1.default.string().optional(),
    stock: joi_1.default.number().integer().min(0).optional(),
    weight: joi_1.default.number().min(0).optional(),
    dimensions: joi_1.default.object({
        length: joi_1.default.number().min(0),
        width: joi_1.default.number().min(0),
        height: joi_1.default.number().min(0)
    }).optional(),
    specifications: joi_1.default.object().optional(),
    tags: joi_1.default.array().items(joi_1.default.string()).optional(),
    isActive: joi_1.default.boolean().optional(),
    isFeatured: joi_1.default.boolean().optional()
});
// Validation middleware
const validateProduct = (req, res, next) => {
    const { error } = productSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessage = error.details.map(detail => detail.message).join(', ');
        res.status(400).json({
            success: false,
            error: errorMessage
        });
        return;
    }
    next();
};
exports.validateProduct = validateProduct;
const validateProductUpdate = (req, res, next) => {
    const { error } = productUpdateSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessage = error.details.map(detail => detail.message).join(', ');
        res.status(400).json({
            success: false,
            error: errorMessage
        });
        return;
    }
    next();
};
exports.validateProductUpdate = validateProductUpdate;
//# sourceMappingURL=validation.js.map