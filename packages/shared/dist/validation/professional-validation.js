"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationMiddleware = exports.ValidationSchemas = exports.CustomValidators = exports.SecurityPatterns = exports.UzbekistanPatterns = void 0;
exports.createValidationMiddleware = createValidationMiddleware;
const tslib_1 = require("tslib");
const joi_1 = tslib_1.__importDefault(require("joi"));
const validator_1 = tslib_1.__importDefault(require("validator"));
const isomorphic_dompurify_1 = tslib_1.__importDefault(require("isomorphic-dompurify"));
const logger_1 = require("../logging/logger");
// Uzbekistan-specific validation patterns
exports.UzbekistanPatterns = {
    phone: /^\+998\d{9}$/,
    passportSeries: /^[A-Z]{2}\d{7}$/,
    innNumber: /^\d{9}$/,
    bankCard: /^\d{16}$/,
    postalCode: /^\d{6}$/,
};
// Security validation patterns
exports.SecurityPatterns = {
    sqlInjection: [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
        /(--|#|\/\*|\*\/)/g,
        /['";\x00\x1a]/g,
        /(\bor\b|\band\b)\s+\d+\s*=\s*\d+/gi,
        /'\s*(or|and)\s+.*?[=<>]/gi,
    ],
    xssPatterns: [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<img[^>]+src[\\s]*=[\\s]*["\']([^"\'>&<;]*)[^>]*>/gi,
    ],
    pathTraversal: [
        /\.\.[\\\/]/g,
        /%2e%2e[\\\/]/gi,
        /\.\.%2f/gi,
        /\.\.%5c/gi,
    ],
    commandInjection: [
        /[;&|`$(){}[\]]/g,
        /\b(rm|del|format|sudo|su|cat|type|echo|curl|wget|nc|netcat)\b/gi,
    ],
};
// Custom validation functions
exports.CustomValidators = {
    /**
     * Secure string validation with XSS prevention
     */
    secureString: (value, helpers) => {
        // Check for SQL injection patterns
        for (const pattern of exports.SecurityPatterns.sqlInjection) {
            if (pattern.test(value)) {
                logger_1.logger.warn('SQL injection attempt detected', {
                    value: value.substring(0, 100),
                    pattern: pattern.toString()
                });
                return helpers.error('validation.security.sqlInjection');
            }
        }
        // Check for XSS patterns
        for (const pattern of exports.SecurityPatterns.xssPatterns) {
            if (pattern.test(value)) {
                logger_1.logger.warn('XSS attempt detected', {
                    value: value.substring(0, 100),
                    pattern: pattern.toString()
                });
                return helpers.error('validation.security.xss');
            }
        }
        // Check for path traversal
        for (const pattern of exports.SecurityPatterns.pathTraversal) {
            if (pattern.test(value)) {
                logger_1.logger.warn('Path traversal attempt detected', {
                    value: value.substring(0, 100),
                    pattern: pattern.toString()
                });
                return helpers.error('validation.security.pathTraversal');
            }
        }
        // Check for command injection
        for (const pattern of exports.SecurityPatterns.commandInjection) {
            if (pattern.test(value)) {
                logger_1.logger.warn('Command injection attempt detected', {
                    value: value.substring(0, 100),
                    pattern: pattern.toString()
                });
                return helpers.error('validation.security.commandInjection');
            }
        }
        // Sanitize the string
        const sanitized = isomorphic_dompurify_1.default.sanitize(value);
        return sanitized;
    },
    /**
     * Uzbekistan phone number validation
     */
    uzbekPhoneNumber: (value, helpers) => {
        if (!exports.UzbekistanPatterns.phone.test(value)) {
            return helpers.error('validation.uzbekistan.invalidPhone');
        }
        return value;
    },
    /**
     * Strong password validation
     */
    strongPassword: (value, helpers) => {
        const minLength = 12;
        const hasUpperCase = /[A-Z]/.test(value);
        const hasLowerCase = /[a-z]/.test(value);
        const hasNumbers = /\d/.test(value);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
        if (value.length < minLength) {
            return helpers.error('validation.password.tooShort', { minLength });
        }
        if (!hasUpperCase) {
            return helpers.error('validation.password.missingUppercase');
        }
        if (!hasLowerCase) {
            return helpers.error('validation.password.missingLowercase');
        }
        if (!hasNumbers) {
            return helpers.error('validation.password.missingNumbers');
        }
        if (!hasSpecialChar) {
            return helpers.error('validation.password.missingSpecialChar');
        }
        // Check against common passwords
        const commonPasswords = [
            'password', '123456', 'qwerty', 'admin', 'ultramarket',
            'password123', 'admin123', '123456789', 'qwertyuiop'
        ];
        if (commonPasswords.some(common => value.toLowerCase().includes(common))) {
            return helpers.error('validation.password.tooCommon');
        }
        return value;
    },
    /**
     * Email validation with domain restrictions
     */
    businessEmail: (value, helpers) => {
        if (!validator_1.default.isEmail(value)) {
            return helpers.error('validation.email.invalid');
        }
        // Block disposable email domains
        const disposableDomains = [
            '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
            'mailinator.com', 'throwaway.email'
        ];
        const domain = value.split('@')[1]?.toLowerCase();
        if (disposableDomains.includes(domain)) {
            return helpers.error('validation.email.disposable');
        }
        return value.toLowerCase();
    },
    /**
     * Uzbekistan postal code validation
     */
    uzbekPostalCode: (value, helpers) => {
        if (!exports.UzbekistanPatterns.postalCode.test(value)) {
            return helpers.error('validation.uzbekistan.invalidPostalCode');
        }
        return value;
    },
    /**
     * URL validation with security checks
     */
    secureUrl: (value, helpers) => {
        if (!validator_1.default.isURL(value, { require_protocol: true, protocols: ['http', 'https'] })) {
            return helpers.error('validation.url.invalid');
        }
        // Block dangerous protocols
        if (value.match(/^(javascript|data|vbscript):/i)) {
            return helpers.error('validation.url.dangerousProtocol');
        }
        // Block internal/private IPs
        const url = new URL(value);
        if (url.hostname.match(/^(127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/)) {
            return helpers.error('validation.url.privateIp');
        }
        return value;
    },
    /**
     * JSON validation with size limits
     */
    secureJson: (value, helpers) => {
        if (value.length > 10000) { // 10KB limit
            return helpers.error('validation.json.tooLarge');
        }
        try {
            const parsed = JSON.parse(value);
            // Check for prototype pollution attempts
            if (hasPrototypePollution(parsed)) {
                logger_1.logger.warn('Prototype pollution attempt detected', {
                    value: value.substring(0, 200)
                });
                return helpers.error('validation.json.prototypePollution');
            }
            return value;
        }
        catch (error) {
            return helpers.error('validation.json.invalid');
        }
    },
    /**
     * File name validation
     */
    secureFileName: (value, helpers) => {
        // Block dangerous file extensions
        const dangerousExtensions = [
            '.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.vbs', '.js',
            '.jar', '.php', '.asp', '.jsp', '.sh', '.py', '.rb', '.pl'
        ];
        const extension = value.toLowerCase().substring(value.lastIndexOf('.'));
        if (dangerousExtensions.includes(extension)) {
            return helpers.error('validation.file.dangerousExtension');
        }
        // Block null bytes and path traversal
        if (value.includes('\0') || value.includes('..')) {
            return helpers.error('validation.file.maliciousPath');
        }
        // Sanitize filename
        const sanitized = value.replace(/[^a-zA-Z0-9.-_]/g, '_');
        return sanitized;
    }
};
// Helper function to check for prototype pollution
function hasPrototypePollution(obj, visited = new Set()) {
    if (visited.has(obj) || obj === null || typeof obj !== 'object') {
        return false;
    }
    visited.add(obj);
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    for (const key of Object.keys(obj)) {
        if (dangerousKeys.includes(key)) {
            return true;
        }
        if (typeof obj[key] === 'object' && hasPrototypePollution(obj[key], visited)) {
            return true;
        }
    }
    return false;
}
// Professional validation schemas
exports.ValidationSchemas = {
    // User registration validation
    userRegistration: joi_1.default.object({
        email: joi_1.default.string()
            .custom(exports.CustomValidators.businessEmail, 'Business email validation')
            .required()
            .messages({
            'validation.email.invalid': 'Email formati noto\'g\'ri',
            'validation.email.disposable': 'Vaqtinchalik email manzillari qabul qilinmaydi',
            'any.required': 'Email majburiy'
        }),
        password: joi_1.default.string()
            .custom(exports.CustomValidators.strongPassword, 'Strong password validation')
            .required()
            .messages({
            'validation.password.tooShort': 'Parol kamida {#minLength} belgi bo\'lishi kerak',
            'validation.password.missingUppercase': 'Parolda katta harf bo\'lishi kerak',
            'validation.password.missingLowercase': 'Parolda kichik harf bo\'lishi kerak',
            'validation.password.missingNumbers': 'Parolda raqam bo\'lishi kerak',
            'validation.password.missingSpecialChar': 'Parolda maxsus belgi bo\'lishi kerak',
            'validation.password.tooCommon': 'Parol juda oddiy',
            'any.required': 'Parol majburiy'
        }),
        firstName: joi_1.default.string()
            .custom(exports.CustomValidators.secureString, 'Secure string validation')
            .min(2)
            .max(50)
            .pattern(/^[a-zA-ZА-Яа-яЁё\s]+$/)
            .required()
            .messages({
            'string.min': 'Ism kamida 2 belgi bo\'lishi kerak',
            'string.max': 'Ism 50 belgidan oshmasligi kerak',
            'string.pattern.base': 'Ismda faqat harflar bo\'lishi mumkin',
            'any.required': 'Ism majburiy'
        }),
        lastName: joi_1.default.string()
            .custom(exports.CustomValidators.secureString, 'Secure string validation')
            .min(2)
            .max(50)
            .pattern(/^[a-zA-ZА-Яа-яЁё\s]+$/)
            .required()
            .messages({
            'string.min': 'Familiya kamida 2 belgi bo\'lishi kerak',
            'string.max': 'Familiya 50 belgidan oshmasligi kerak',
            'string.pattern.base': 'Familiyada faqat harflar bo\'lishi mumkin',
            'any.required': 'Familiya majburiy'
        }),
        phone: joi_1.default.string()
            .custom(exports.CustomValidators.uzbekPhoneNumber, 'Uzbekistan phone validation')
            .required()
            .messages({
            'validation.uzbekistan.invalidPhone': 'Telefon raqami +998XXXXXXXXX formatida bo\'lishi kerak',
            'any.required': 'Telefon raqami majburiy'
        }),
        dateOfBirth: joi_1.default.date()
            .max('now')
            .min('1900-01-01')
            .optional()
            .messages({
            'date.max': 'Tug\'ilgan sana bugungi kundan keyin bo\'la olmaydi',
            'date.min': 'Tug\'ilgan sana 1900 yildan oldin bo\'la olmaydi'
        }),
        agreeToTerms: joi_1.default.boolean()
            .valid(true)
            .required()
            .messages({
            'any.only': 'Foydalanish shartlarini qabul qilish majburiy',
            'any.required': 'Foydalanish shartlarini qabul qilish majburiy'
        })
    }).options({ abortEarly: false }),
    // User login validation
    userLogin: joi_1.default.object({
        email: joi_1.default.string()
            .email()
            .custom(exports.CustomValidators.secureString, 'Secure string validation')
            .required()
            .messages({
            'string.email': 'Email formati noto\'g\'ri',
            'any.required': 'Email majburiy'
        }),
        password: joi_1.default.string()
            .min(1)
            .max(200)
            .custom(exports.CustomValidators.secureString, 'Secure string validation')
            .required()
            .messages({
            'string.min': 'Parol kiritilmagan',
            'string.max': 'Parol juda uzun',
            'any.required': 'Parol majburiy'
        }),
        rememberMe: joi_1.default.boolean().optional(),
        deviceId: joi_1.default.string()
            .uuid()
            .optional()
    }).options({ abortEarly: false }),
    // Product validation
    productCreate: joi_1.default.object({
        name: joi_1.default.string()
            .custom(exports.CustomValidators.secureString, 'Secure string validation')
            .min(3)
            .max(200)
            .required()
            .messages({
            'string.min': 'Mahsulot nomi kamida 3 belgi bo\'lishi kerak',
            'string.max': 'Mahsulot nomi 200 belgidan oshmasligi kerak',
            'any.required': 'Mahsulot nomi majburiy'
        }),
        description: joi_1.default.string()
            .custom(exports.CustomValidators.secureString, 'Secure string validation')
            .min(10)
            .max(5000)
            .required()
            .messages({
            'string.min': 'Mahsulot tavsifi kamida 10 belgi bo\'lishi kerak',
            'string.max': 'Mahsulot tavsifi 5000 belgidan oshmasligi kerak',
            'any.required': 'Mahsulot tavsifi majburiy'
        }),
        price: joi_1.default.number()
            .positive()
            .precision(2)
            .max(999999999)
            .required()
            .messages({
            'number.positive': 'Narx musbat bo\'lishi kerak',
            'number.max': 'Narx juda yuqori',
            'any.required': 'Narx majburiy'
        }),
        category: joi_1.default.string()
            .custom(exports.CustomValidators.secureString, 'Secure string validation')
            .min(2)
            .max(100)
            .required(),
        tags: joi_1.default.array()
            .items(joi_1.default.string().custom(exports.CustomValidators.secureString, 'Secure string validation').max(50))
            .max(10)
            .optional(),
        images: joi_1.default.array()
            .items(joi_1.default.string().custom(exports.CustomValidators.secureUrl, 'Secure URL validation'))
            .max(10)
            .optional(),
        sku: joi_1.default.string()
            .custom(exports.CustomValidators.secureString, 'Secure string validation')
            .alphanum()
            .min(3)
            .max(50)
            .required(),
        stockQuantity: joi_1.default.number()
            .integer()
            .min(0)
            .max(999999)
            .required(),
        weight: joi_1.default.number()
            .positive()
            .precision(3)
            .max(10000)
            .optional(),
        dimensions: joi_1.default.object({
            length: joi_1.default.number().positive().precision(2).max(1000).optional(),
            width: joi_1.default.number().positive().precision(2).max(1000).optional(),
            height: joi_1.default.number().positive().precision(2).max(1000).optional()
        }).optional()
    }).options({ abortEarly: false }),
    // Order validation
    orderCreate: joi_1.default.object({
        items: joi_1.default.array()
            .items(joi_1.default.object({
            productId: joi_1.default.string().uuid().required(),
            quantity: joi_1.default.number().integer().min(1).max(1000).required(),
            price: joi_1.default.number().positive().precision(2).required()
        }))
            .min(1)
            .max(100)
            .required()
            .messages({
            'array.min': 'Buyurtmada kamida 1 ta mahsulot bo\'lishi kerak',
            'array.max': 'Buyurtmada 100 tadan ortiq mahsulot bo\'la olmaydi',
            'any.required': 'Buyurtma mahsulotlari majburiy'
        }),
        shippingAddress: joi_1.default.object({
            street: joi_1.default.string()
                .custom(exports.CustomValidators.secureString, 'Secure string validation')
                .min(5)
                .max(200)
                .required(),
            city: joi_1.default.string()
                .custom(exports.CustomValidators.secureString, 'Secure string validation')
                .min(2)
                .max(100)
                .required(),
            region: joi_1.default.string()
                .custom(exports.CustomValidators.secureString, 'Secure string validation')
                .min(2)
                .max(100)
                .required(),
            postalCode: joi_1.default.string()
                .custom(exports.CustomValidators.uzbekPostalCode, 'Uzbekistan postal code validation')
                .required(),
            country: joi_1.default.string()
                .valid('UZ')
                .required()
                .messages({
                'any.only': 'Faqat O\'zbekiston qo\'llab-quvvatlanadi'
            })
        }).required(),
        paymentMethod: joi_1.default.string()
            .valid('click', 'payme', 'apelsin', 'cash', 'bank_transfer')
            .required()
            .messages({
            'any.only': 'Yaroqsiz to\'lov usuli'
        }),
        notes: joi_1.default.string()
            .custom(exports.CustomValidators.secureString, 'Secure string validation')
            .max(500)
            .optional()
    }).options({ abortEarly: false }),
    // File upload validation
    fileUpload: joi_1.default.object({
        fileName: joi_1.default.string()
            .custom(exports.CustomValidators.secureFileName, 'Secure filename validation')
            .min(1)
            .max(255)
            .required(),
        fileSize: joi_1.default.number()
            .integer()
            .min(1)
            .max(10 * 1024 * 1024) // 10MB
            .required()
            .messages({
            'number.max': 'Fayl hajmi 10MB dan oshmasligi kerak'
        }),
        mimeType: joi_1.default.string()
            .valid('image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
            .required()
            .messages({
            'any.only': 'Fayl turi qo\'llab-quvvatlanmaydi'
        })
    }).options({ abortEarly: false }),
    // Search validation
    searchQuery: joi_1.default.object({
        query: joi_1.default.string()
            .custom(exports.CustomValidators.secureString, 'Secure string validation')
            .min(1)
            .max(200)
            .required()
            .messages({
            'string.min': 'Qidiruv so\'zi kiritilmagan',
            'string.max': 'Qidiruv so\'zi juda uzun'
        }),
        category: joi_1.default.string()
            .custom(exports.CustomValidators.secureString, 'Secure string validation')
            .max(100)
            .optional(),
        minPrice: joi_1.default.number()
            .min(0)
            .precision(2)
            .optional(),
        maxPrice: joi_1.default.number()
            .min(0)
            .precision(2)
            .optional(),
        sortBy: joi_1.default.string()
            .valid('price_asc', 'price_desc', 'name_asc', 'name_desc', 'date_asc', 'date_desc')
            .optional(),
        page: joi_1.default.number()
            .integer()
            .min(1)
            .max(1000)
            .default(1)
            .optional(),
        limit: joi_1.default.number()
            .integer()
            .min(1)
            .max(100)
            .default(20)
            .optional()
    }).custom((value, helpers) => {
        // Ensure maxPrice is greater than minPrice
        if (value.minPrice && value.maxPrice && value.minPrice >= value.maxPrice) {
            return helpers.error('validation.price.invalidRange');
        }
        return value;
    }).options({ abortEarly: false })
};
// Validation middleware factory
function createValidationMiddleware(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body);
        if (error) {
            logger_1.logger.warn('Validation failed', {
                path: req.path,
                method: req.method,
                errors: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                    value: detail.context?.value
                })),
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Ma\'lumotlar formati noto\'g\'ri',
                    details: error.details.map(detail => ({
                        field: detail.path.join('.'),
                        message: detail.message
                    }))
                }
            });
        }
        req.body = value;
        next();
    };
}
// Export commonly used validation middleware
exports.ValidationMiddleware = {
    userRegistration: createValidationMiddleware(exports.ValidationSchemas.userRegistration),
    userLogin: createValidationMiddleware(exports.ValidationSchemas.userLogin),
    productCreate: createValidationMiddleware(exports.ValidationSchemas.productCreate),
    orderCreate: createValidationMiddleware(exports.ValidationSchemas.orderCreate),
    fileUpload: createValidationMiddleware(exports.ValidationSchemas.fileUpload),
    searchQuery: createValidationMiddleware(exports.ValidationSchemas.searchQuery)
};
exports.default = exports.ValidationSchemas;
//# sourceMappingURL=professional-validation.js.map