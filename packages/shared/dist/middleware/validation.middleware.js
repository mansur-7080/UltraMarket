"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminSchemas = exports.fileSchemas = exports.paymentSchemas = exports.cartSchemas = exports.orderSchemas = exports.productSchemas = exports.userSchemas = exports.commonSchemas = exports.validate = void 0;
const tslib_1 = require("tslib");
const joi_1 = tslib_1.__importDefault(require("joi"));
const AppError_1 = require("../errors/AppError");
const logger_1 = require("../logging/logger");
// Default validation options
const defaultOptions = {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
};
// Validation middleware factory
const validate = (schema, options = {}) => {
    return (req, res, next) => {
        const validationOptions = { ...defaultOptions, ...options };
        const errors = {};
        try {
            // Validate request body
            if (schema.body) {
                const { error, value } = schema.body.validate(req.body, validationOptions);
                if (error) {
                    errors.body = error.details.map((detail) => detail.message);
                }
                else {
                    req.body = value;
                }
            }
            // Validate request params
            if (schema.params) {
                const { error, value } = schema.params.validate(req.params, validationOptions);
                if (error) {
                    errors.params = error.details.map((detail) => detail.message);
                }
                else {
                    req.params = value;
                }
            }
            // Validate request query
            if (schema.query) {
                const { error, value } = schema.query.validate(req.query, validationOptions);
                if (error) {
                    errors.query = error.details.map((detail) => detail.message);
                }
                else {
                    req.query = value;
                }
            }
            // Validate request headers
            if (schema.headers) {
                const { error, value } = schema.headers.validate(req.headers, validationOptions);
                if (error) {
                    errors.headers = error.details.map((detail) => detail.message);
                }
                else {
                    req.headers = value;
                }
            }
            // If there are validation errors, throw ValidationError
            if (Object.keys(errors).length > 0) {
                logger_1.logger.warn('Validation failed', {
                    url: req.url,
                    method: req.method,
                    errors,
                    userId: req.user?.userId,
                });
                throw new AppError_1.ValidationError(errors, 'Request validation failed');
            }
            next();
        }
        catch (error) {
            if (error instanceof AppError_1.ValidationError) {
                return res.status(error.statusCode).json(error.toJSON());
            }
            logger_1.logger.error('Validation middleware error', error);
            return res.status(500).json({
                success: false,
                error: 'Internal validation error',
            });
        }
    };
};
exports.validate = validate;
// Common validation schemas
exports.commonSchemas = {
    // MongoDB ObjectId validation
    mongoId: joi_1.default.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required(),
    // UUID validation
    uuid: joi_1.default.string().uuid().required(),
    // Email validation
    email: joi_1.default.string().email().required(),
    // Password validation (strong password)
    password: joi_1.default.string()
        .min(8)
        .max(128)
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
        .required()
        .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    }),
    // Phone number validation (Uzbekistan format)
    phoneUz: joi_1.default.string()
        .pattern(/^(\+998|998)?[0-9]{9}$/)
        .required()
        .messages({
        'string.pattern.base': 'Phone number must be in Uzbekistan format (+998XXXXXXXXX)',
    }),
    // Pagination
    pagination: {
        page: joi_1.default.number().integer().min(1).default(1),
        limit: joi_1.default.number().integer().min(1).max(100).default(10),
        sortBy: joi_1.default.string().optional(),
        sortOrder: joi_1.default.string().valid('asc', 'desc').default('asc'),
    },
    // Date range
    dateRange: {
        startDate: joi_1.default.date().iso().optional(),
        endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).optional(),
    },
    // Price validation (in UZS)
    price: joi_1.default.number().integer().min(0).max(999999999).required(),
    // Uzbekistan region validation
    region: joi_1.default.string()
        .valid('tashkent', 'samarkand', 'bukhara', 'andijan', 'fergana', 'namangan', 'kashkadarya', 'surkhandarya', 'jizzakh', 'syrdarya', 'navoiy', 'khorezm', 'karakalpakstan')
        .required(),
};
// User validation schemas
exports.userSchemas = {
    register: {
        body: joi_1.default.object({
            firstName: joi_1.default.string().min(2).max(50).required(),
            lastName: joi_1.default.string().min(2).max(50).required(),
            email: exports.commonSchemas.email,
            password: exports.commonSchemas.password,
            phone: exports.commonSchemas.phoneUz,
            dateOfBirth: joi_1.default.date().max('now').optional(),
            gender: joi_1.default.string().valid('male', 'female', 'other').optional(),
            region: exports.commonSchemas.region.optional(),
            acceptTerms: joi_1.default.boolean().valid(true).required(),
        }),
    },
    login: {
        body: joi_1.default.object({
            email: exports.commonSchemas.email,
            password: joi_1.default.string().required(),
            rememberMe: joi_1.default.boolean().default(false),
        }),
    },
    updateProfile: {
        body: joi_1.default.object({
            firstName: joi_1.default.string().min(2).max(50).optional(),
            lastName: joi_1.default.string().min(2).max(50).optional(),
            phone: exports.commonSchemas.phoneUz.optional(),
            dateOfBirth: joi_1.default.date().max('now').optional(),
            gender: joi_1.default.string().valid('male', 'female', 'other').optional(),
            region: exports.commonSchemas.region.optional(),
        }),
    },
    changePassword: {
        body: joi_1.default.object({
            currentPassword: joi_1.default.string().required(),
            newPassword: exports.commonSchemas.password,
            confirmPassword: joi_1.default.string().valid(joi_1.default.ref('newPassword')).required(),
        }),
    },
};
// Product validation schemas
exports.productSchemas = {
    create: {
        body: joi_1.default.object({
            name: joi_1.default.string().min(2).max(200).required(),
            description: joi_1.default.string().max(2000).required(),
            price: exports.commonSchemas.price,
            discountPrice: joi_1.default.number().integer().min(0).less(joi_1.default.ref('price')).optional(),
            category: joi_1.default.string().required(),
            subcategory: joi_1.default.string().optional(),
            brand: joi_1.default.string().max(100).optional(),
            sku: joi_1.default.string().max(50).optional(),
            barcode: joi_1.default.string().max(50).optional(),
            weight: joi_1.default.number().positive().optional(),
            dimensions: joi_1.default.object({
                length: joi_1.default.number().positive(),
                width: joi_1.default.number().positive(),
                height: joi_1.default.number().positive(),
            }).optional(),
            specifications: joi_1.default.object().optional(),
            tags: joi_1.default.array().items(joi_1.default.string().max(50)).max(10).optional(),
            images: joi_1.default.array().items(joi_1.default.string().uri()).max(10).optional(),
            isActive: joi_1.default.boolean().default(true),
            stock: joi_1.default.number().integer().min(0).required(),
            minStock: joi_1.default.number().integer().min(0).default(0),
        }),
    },
    update: {
        params: joi_1.default.object({
            id: exports.commonSchemas.mongoId,
        }),
        body: joi_1.default.object({
            name: joi_1.default.string().min(2).max(200).optional(),
            description: joi_1.default.string().max(2000).optional(),
            price: exports.commonSchemas.price.optional(),
            discountPrice: joi_1.default.number().integer().min(0).optional(),
            category: joi_1.default.string().optional(),
            subcategory: joi_1.default.string().optional(),
            brand: joi_1.default.string().max(100).optional(),
            sku: joi_1.default.string().max(50).optional(),
            barcode: joi_1.default.string().max(50).optional(),
            weight: joi_1.default.number().positive().optional(),
            dimensions: joi_1.default.object({
                length: joi_1.default.number().positive(),
                width: joi_1.default.number().positive(),
                height: joi_1.default.number().positive(),
            }).optional(),
            specifications: joi_1.default.object().optional(),
            tags: joi_1.default.array().items(joi_1.default.string().max(50)).max(10).optional(),
            images: joi_1.default.array().items(joi_1.default.string().uri()).max(10).optional(),
            isActive: joi_1.default.boolean().optional(),
            stock: joi_1.default.number().integer().min(0).optional(),
            minStock: joi_1.default.number().integer().min(0).optional(),
        }),
    },
    search: {
        query: joi_1.default.object({
            q: joi_1.default.string().max(200).optional(),
            category: joi_1.default.string().optional(),
            minPrice: joi_1.default.number().integer().min(0).optional(),
            maxPrice: joi_1.default.number().integer().min(0).optional(),
            brand: joi_1.default.string().optional(),
            inStock: joi_1.default.boolean().optional(),
            ...exports.commonSchemas.pagination,
        }),
    },
};
// Order validation schemas
exports.orderSchemas = {
    create: {
        body: joi_1.default.object({
            items: joi_1.default.array()
                .items(joi_1.default.object({
                productId: exports.commonSchemas.mongoId,
                quantity: joi_1.default.number().integer().min(1).max(100).required(),
                price: exports.commonSchemas.price,
            }))
                .min(1)
                .max(50)
                .required(),
            shippingAddress: joi_1.default.object({
                firstName: joi_1.default.string().min(2).max(50).required(),
                lastName: joi_1.default.string().min(2).max(50).required(),
                phone: exports.commonSchemas.phoneUz,
                region: exports.commonSchemas.region,
                city: joi_1.default.string().max(100).required(),
                address: joi_1.default.string().max(200).required(),
                zipCode: joi_1.default.string().max(10).optional(),
                instructions: joi_1.default.string().max(500).optional(),
            }).required(),
            paymentMethod: joi_1.default.string().valid('click', 'payme', 'uzcard', 'cash').required(),
            notes: joi_1.default.string().max(500).optional(),
        }),
    },
    updateStatus: {
        params: joi_1.default.object({
            id: exports.commonSchemas.mongoId,
        }),
        body: joi_1.default.object({
            status: joi_1.default.string()
                .valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')
                .required(),
            notes: joi_1.default.string().max(500).optional(),
        }),
    },
};
// Cart validation schemas
exports.cartSchemas = {
    addItem: {
        body: joi_1.default.object({
            productId: exports.commonSchemas.mongoId,
            quantity: joi_1.default.number().integer().min(1).max(100).required(),
        }),
    },
    updateItem: {
        params: joi_1.default.object({
            productId: exports.commonSchemas.mongoId,
        }),
        body: joi_1.default.object({
            quantity: joi_1.default.number().integer().min(1).max(100).required(),
        }),
    },
    removeItem: {
        params: joi_1.default.object({
            productId: exports.commonSchemas.mongoId,
        }),
    },
};
// Payment validation schemas
exports.paymentSchemas = {
    initiate: {
        body: joi_1.default.object({
            orderId: exports.commonSchemas.mongoId,
            amount: exports.commonSchemas.price,
            paymentMethod: joi_1.default.string().valid('click', 'payme', 'uzcard').required(),
            returnUrl: joi_1.default.string().uri().optional(),
            cancelUrl: joi_1.default.string().uri().optional(),
        }),
    },
    webhook: {
        body: joi_1.default.object({
            // This will vary based on payment provider
            // Common fields for Uzbekistan payment systems
            merchant_trans_id: joi_1.default.string().required(),
            service_id: joi_1.default.string().required(),
            amount: joi_1.default.number().required(),
            status: joi_1.default.string().required(),
            sign_time: joi_1.default.string().required(),
            sign_string: joi_1.default.string().required(),
        }),
    },
};
// File upload validation
exports.fileSchemas = {
    upload: {
        body: joi_1.default.object({
            category: joi_1.default.string().valid('product', 'avatar', 'document').required(),
            description: joi_1.default.string().max(200).optional(),
        }),
    },
};
// Admin validation schemas
exports.adminSchemas = {
    createUser: {
        body: joi_1.default.object({
            firstName: joi_1.default.string().min(2).max(50).required(),
            lastName: joi_1.default.string().min(2).max(50).required(),
            email: exports.commonSchemas.email,
            password: exports.commonSchemas.password,
            phone: exports.commonSchemas.phoneUz,
            role: joi_1.default.string().valid('admin', 'moderator', 'manager').required(),
            permissions: joi_1.default.array().items(joi_1.default.string()).optional(),
            isActive: joi_1.default.boolean().default(true),
        }),
    },
    updateUser: {
        params: joi_1.default.object({
            id: exports.commonSchemas.mongoId,
        }),
        body: joi_1.default.object({
            firstName: joi_1.default.string().min(2).max(50).optional(),
            lastName: joi_1.default.string().min(2).max(50).optional(),
            email: exports.commonSchemas.email.optional(),
            phone: exports.commonSchemas.phoneUz.optional(),
            role: joi_1.default.string().valid('admin', 'moderator', 'manager').optional(),
            permissions: joi_1.default.array().items(joi_1.default.string()).optional(),
            isActive: joi_1.default.boolean().optional(),
        }),
    },
};
// Default export
exports.default = exports.validate;
//# sourceMappingURL=validation.middleware.js.map