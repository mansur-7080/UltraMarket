"use strict";
/**
 * Comprehensive Input Validation System
 * UltraMarket E-commerce Platform
 *
 * Bu fayl barcha input validation va security issues ni hal qilish uchun
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupValidationMiddleware = exports.validateFileUpload = exports.validateRequest = exports.createRateLimit = exports.SQLInjectionProtection = exports.XSSProtection = exports.OrderValidationSchema = exports.UserValidationSchema = exports.ProductValidationSchema = exports.CommonValidationSchemas = void 0;
const tslib_1 = require("tslib");
const zod_1 = require("zod");
const dompurify_1 = tslib_1.__importDefault(require("dompurify"));
const jsdom_1 = require("jsdom");
const express_rate_limit_1 = tslib_1.__importDefault(require("express-rate-limit"));
// Initialize DOMPurify for server-side usage
const window = new jsdom_1.JSDOM('').window;
const domPurify = (0, dompurify_1.default)(window);
// ❌ NOTO'G'RI - Validation yo'q
/*
app.post('/api/products', (req, res) => {
  const { name, price, description } = req.body;
  // Hech qanday validation yo'q - SQL injection risk!
  const query = `INSERT INTO products (name, price) VALUES ('${name}', ${price})`;
});
*/
// ✅ TO'G'RI - Comprehensive validation
// Common validation schemas
exports.CommonValidationSchemas = {
    // O'zbek telefon raqami validation
    uzbekPhoneNumber: zod_1.z.string().regex(/^\+998[0-9]{9}$/, 'Telefon raqami +998XXXXXXXXX formatida bo\'lishi kerak'),
    // Email validation
    email: zod_1.z.string().email('Noto\'g\'ri email format'),
    // Strong password validation
    strongPassword: zod_1.z.string()
        .min(8, 'Parol kamida 8 ta belgidan iborat bo\'lishi kerak')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Parol katta-kichik harf, raqam va maxsus belgini o\'z ichiga olishi kerak'),
    // UUID validation
    uuid: zod_1.z.string().uuid('Noto\'g\'ri UUID format'),
    // Positive integer
    positiveInteger: zod_1.z.number().int().positive('Musbat butun son bo\'lishi kerak'),
    // Price validation (O'zbekiston so'm)
    price: zod_1.z.number()
        .positive('Narx musbat bo\'lishi kerak')
        .max(999999999, 'Narx juda katta')
        .multipleOf(0.01, 'Narx 2 xonali bo\'lishi kerak'),
    // Slug validation
    slug: zod_1.z.string().regex(/^[a-z0-9-]+$/, 'Slug faqat kichik harf, raqam va tire (-) belgilarini o\'z ichiga olishi mumkin'),
    // HTML content sanitization
    htmlContent: zod_1.z.string().transform((content) => {
        return domPurify.sanitize(content, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h3', 'h4'],
            ALLOWED_ATTR: []
        });
    }),
    // File upload validation
    fileUpload: zod_1.z.object({
        mimetype: zod_1.z.enum([
            'image/jpeg',
            'image/png',
            'image/webp',
            'application/pdf'
        ]),
        size: zod_1.z.number().max(10 * 1024 * 1024, 'Fayl hajmi 10MB dan oshmasligi kerak')
    })
};
// Product validation schema
exports.ProductValidationSchema = zod_1.z.object({
    name: zod_1.z.string()
        .min(3, 'Mahsulot nomi kamida 3 ta belgidan iborat bo\'lishi kerak')
        .max(200, 'Mahsulot nomi 200 ta belgidan oshmasligi kerak')
        .transform(input => domPurify.sanitize(input, { ALLOWED_TAGS: [] })),
    slug: exports.CommonValidationSchemas.slug,
    description: exports.CommonValidationSchemas.htmlContent
        .optional()
        .transform(content => content && content.length > 2000 ? content.slice(0, 2000) : content),
    price: exports.CommonValidationSchemas.price,
    comparePrice: exports.CommonValidationSchemas.price.optional(),
    sku: zod_1.z.string()
        .min(3, 'SKU kamida 3 ta belgidan iborat bo\'lishi kerak')
        .max(50, 'SKU 50 ta belgidan oshmasligi kerak')
        .regex(/^[A-Z0-9-_]+$/, 'SKU faqat katta harf, raqam, tire va pastki chiziq bo\'lishi mumkin'),
    categoryId: exports.CommonValidationSchemas.uuid,
    tags: zod_1.z.array(zod_1.z.string().max(50)).max(10, '10 tadan ortiq tag bo\'lmasligi kerak').optional(),
    specifications: zod_1.z.record(zod_1.z.string().max(100), zod_1.z.string().max(500)).optional(),
    isActive: zod_1.z.boolean().default(true),
    isFeatured: zod_1.z.boolean().default(false)
});
// User validation schema
exports.UserValidationSchema = zod_1.z.object({
    firstName: zod_1.z.string()
        .min(2, 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak')
        .max(50, 'Ism 50 ta belgidan oshmasligi kerak')
        .transform(input => domPurify.sanitize(input, { ALLOWED_TAGS: [] })),
    lastName: zod_1.z.string()
        .min(2, 'Familiya kamida 2 ta belgidan iborat bo\'lishi kerak')
        .max(50, 'Familiya 50 ta belgidan oshmasligi kerak')
        .transform(input => domPurify.sanitize(input, { ALLOWED_TAGS: [] })),
    email: exports.CommonValidationSchemas.email,
    password: exports.CommonValidationSchemas.strongPassword,
    phone: exports.CommonValidationSchemas.uzbekPhoneNumber.optional(),
    dateOfBirth: zod_1.z.string().datetime().optional(),
    gender: zod_1.z.enum(['male', 'female', 'other']).optional(),
    role: zod_1.z.enum(['CUSTOMER', 'ADMIN', 'MANAGER']).default('CUSTOMER')
});
// Order validation schema
exports.OrderValidationSchema = zod_1.z.object({
    items: zod_1.z.array(zod_1.z.object({
        productId: exports.CommonValidationSchemas.uuid,
        quantity: exports.CommonValidationSchemas.positiveInteger.max(100, 'Maksimal miqdor 100 ta'),
        price: exports.CommonValidationSchemas.price
    })).min(1, 'Kamida 1 ta mahsulot bo\'lishi kerak').max(50, '50 tadan ortiq mahsulot bo\'lmasligi kerak'),
    shippingAddress: zod_1.z.object({
        street: zod_1.z.string().min(5, 'Ko\'cha manzili kamida 5 ta belgidan iborat bo\'lishi kerak').max(200),
        city: zod_1.z.string().min(2).max(100),
        region: zod_1.z.string().min(2).max(100),
        postalCode: zod_1.z.string().regex(/^[0-9]{6}$/, 'Pochta indeksi 6 ta raqamdan iborat bo\'lishi kerak'),
        country: zod_1.z.literal('UZ')
    }),
    paymentMethod: zod_1.z.enum(['click', 'payme', 'uzcard', 'cash']),
    notes: zod_1.z.string().max(500, 'Izoh 500 ta belgidan oshmasligi kerak').optional()
});
// XSS Prevention
class XSSProtection {
    static sanitizeInput(input, allowedTags) {
        return domPurify.sanitize(input, {
            ALLOWED_TAGS: allowedTags || [],
            ALLOWED_ATTR: []
        });
    }
    static sanitizeObject(obj) {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = this.sanitizeInput(value);
            }
            else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeObject(value);
            }
            else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
}
exports.XSSProtection = XSSProtection;
// SQL Injection Prevention
class SQLInjectionProtection {
    static validateParameterizedQuery(query) {
        // Parametrized query patterns ni tekshirish
        const dangerousPatterns = [
            /'\s*;\s*(?:DROP|DELETE|UPDATE|INSERT|ALTER|CREATE)/i,
            /UNION\s+SELECT/i,
            /--.*$/m,
            /\/\*.*?\*\//g
        ];
        return !dangerousPatterns.some(pattern => pattern.test(query));
    }
    static sanitizeOrderBy(orderBy) {
        // Faqat allowed column names
        const allowedColumns = [
            'id', 'name', 'price', 'createdAt', 'updatedAt', 'rating', 'views'
        ];
        const cleanOrderBy = orderBy.replace(/[^a-zA-Z0-9_,\s]/g, '');
        if (!allowedColumns.includes(cleanOrderBy.split(' ')[0])) {
            return 'createdAt'; // Default ordering
        }
        return cleanOrderBy;
    }
}
exports.SQLInjectionProtection = SQLInjectionProtection;
// Rate Limiting Middleware
const createRateLimit = (windowMs, max, message) => {
    return (0, express_rate_limit_1.default)({
        windowMs,
        max,
        message: message || 'Juda ko\'p so\'rov yuborildi, biroz kuting',
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            res.status(429).json({
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Juda ko\'p so\'rov yuborildi, biroz kuting',
                    retryAfter: Math.ceil(windowMs / 1000)
                }
            });
        }
    });
};
exports.createRateLimit = createRateLimit;
// Validation middleware generator
const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            // Input sanitization
            req.body = XSSProtection.sanitizeObject(req.body);
            // Schema validation
            const validatedData = schema.parse(req.body);
            req.body = validatedData;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Kiritilgan ma\'lumotlar noto\'g\'ri',
                        details: error.errors?.map((err) => ({
                            field: err.path?.join('.') || 'unknown',
                            message: err.message || 'Validation error'
                        })) || []
                    }
                });
            }
            return res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Ichki server xatosi'
                }
            });
        }
    };
};
exports.validateRequest = validateRequest;
// File upload validation
const validateFileUpload = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'FILE_REQUIRED',
                message: 'Fayl yuklash majburiy'
            }
        });
    }
    try {
        exports.CommonValidationSchemas.fileUpload.parse({
            mimetype: req.file.mimetype,
            size: req.file.size
        });
        next();
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_FILE',
                message: 'Noto\'g\'ri fayl turi yoki hajmi'
            }
        });
    }
};
exports.validateFileUpload = validateFileUpload;
// Express middleware setup
const setupValidationMiddleware = (app) => {
    // Global rate limiting
    app.use('/api', (0, exports.createRateLimit)(15 * 60 * 1000, 1000)); // 1000 requests per 15 minutes
    // Strict rate limiting for auth endpoints
    app.use('/api/auth', (0, exports.createRateLimit)(15 * 60 * 1000, 50)); // 50 requests per 15 minutes
    // File upload rate limiting
    app.use('/api/upload', (0, exports.createRateLimit)(60 * 1000, 10)); // 10 uploads per minute
};
exports.setupValidationMiddleware = setupValidationMiddleware;
// Example usage in route handlers
/*
// Product creation route
app.post('/api/products',
  validateRequest(ProductValidationSchema),
  async (req: Request, res: Response) => {
    // req.body is now validated and sanitized
    const productData = req.body;
    
    // Safe database operation
    const product = await prisma.product.create({
      data: productData
    });
    
    res.json({ success: true, data: product });
  }
);

// User registration route
app.post('/api/auth/register',
  validateRequest(UserValidationSchema),
  async (req: Request, res: Response) => {
    // Validation passed, safe to proceed
    const userData = req.body;
    // ... registration logic
  }
);
*/ 
//# sourceMappingURL=comprehensive-input-validation.js.map