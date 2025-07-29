import Joi from 'joi';
import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';
import { logger } from '../logging/logger';

// Uzbekistan-specific validation patterns
export const UzbekistanPatterns = {
  phone: /^\+998\d{9}$/,
  passportSeries: /^[A-Z]{2}\d{7}$/,
  innNumber: /^\d{9}$/,
  bankCard: /^\d{16}$/,
  postalCode: /^\d{6}$/,
};

// Security validation patterns
export const SecurityPatterns = {
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
export const CustomValidators = {
  /**
   * Secure string validation with XSS prevention
   */
  secureString: (value: string, helpers: Joi.CustomHelpers) => {
    // Check for SQL injection patterns
    for (const pattern of SecurityPatterns.sqlInjection) {
      if (pattern.test(value)) {
        logger.warn('SQL injection attempt detected', { 
          value: value.substring(0, 100),
          pattern: pattern.toString()
        });
        return helpers.error('validation.security.sqlInjection');
      }
    }

    // Check for XSS patterns
    for (const pattern of SecurityPatterns.xssPatterns) {
      if (pattern.test(value)) {
        logger.warn('XSS attempt detected', { 
          value: value.substring(0, 100),
          pattern: pattern.toString()
        });
        return helpers.error('validation.security.xss');
      }
    }

    // Check for path traversal
    for (const pattern of SecurityPatterns.pathTraversal) {
      if (pattern.test(value)) {
        logger.warn('Path traversal attempt detected', { 
          value: value.substring(0, 100),
          pattern: pattern.toString()
        });
        return helpers.error('validation.security.pathTraversal');
      }
    }

    // Check for command injection
    for (const pattern of SecurityPatterns.commandInjection) {
      if (pattern.test(value)) {
        logger.warn('Command injection attempt detected', { 
          value: value.substring(0, 100),
          pattern: pattern.toString()
        });
        return helpers.error('validation.security.commandInjection');
      }
    }

    // Sanitize the string
    const sanitized = DOMPurify.sanitize(value);
    
    return sanitized;
  },

  /**
   * Uzbekistan phone number validation
   */
  uzbekPhoneNumber: (value: string, helpers: Joi.CustomHelpers) => {
    if (!UzbekistanPatterns.phone.test(value)) {
      return helpers.error('validation.uzbekistan.invalidPhone');
    }
    return value;
  },

  /**
   * Strong password validation
   */
  strongPassword: (value: string, helpers: Joi.CustomHelpers) => {
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
  businessEmail: (value: string, helpers: Joi.CustomHelpers) => {
    if (!validator.isEmail(value)) {
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
  uzbekPostalCode: (value: string, helpers: Joi.CustomHelpers) => {
    if (!UzbekistanPatterns.postalCode.test(value)) {
      return helpers.error('validation.uzbekistan.invalidPostalCode');
    }
    return value;
  },

  /**
   * URL validation with security checks
   */
  secureUrl: (value: string, helpers: Joi.CustomHelpers) => {
    if (!validator.isURL(value, { require_protocol: true, protocols: ['http', 'https'] })) {
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
  secureJson: (value: string, helpers: Joi.CustomHelpers) => {
    if (value.length > 10000) { // 10KB limit
      return helpers.error('validation.json.tooLarge');
    }

    try {
      const parsed = JSON.parse(value);
      
      // Check for prototype pollution attempts
      if (hasPrototypePollution(parsed)) {
        logger.warn('Prototype pollution attempt detected', { 
          value: value.substring(0, 200) 
        });
        return helpers.error('validation.json.prototypePollution');
      }

      return value;
    } catch (error) {
      return helpers.error('validation.json.invalid');
    }
  },

  /**
   * File name validation
   */
  secureFileName: (value: string, helpers: Joi.CustomHelpers) => {
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
function hasPrototypePollution(obj: any, visited = new Set()): boolean {
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
export const ValidationSchemas = {
  // User registration validation
  userRegistration: Joi.object({
    email: Joi.string()
      .custom(CustomValidators.businessEmail, 'Business email validation')
      .required()
      .messages({
        'validation.email.invalid': 'Email formati noto\'g\'ri',
        'validation.email.disposable': 'Vaqtinchalik email manzillari qabul qilinmaydi',
        'any.required': 'Email majburiy'
      }),

    password: Joi.string()
      .custom(CustomValidators.strongPassword, 'Strong password validation')
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

    firstName: Joi.string()
      .custom(CustomValidators.secureString, 'Secure string validation')
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

    lastName: Joi.string()
      .custom(CustomValidators.secureString, 'Secure string validation')
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

    phone: Joi.string()
      .custom(CustomValidators.uzbekPhoneNumber, 'Uzbekistan phone validation')
      .required()
      .messages({
        'validation.uzbekistan.invalidPhone': 'Telefon raqami +998XXXXXXXXX formatida bo\'lishi kerak',
        'any.required': 'Telefon raqami majburiy'
      }),

    dateOfBirth: Joi.date()
      .max('now')
      .min('1900-01-01')
      .optional()
      .messages({
        'date.max': 'Tug\'ilgan sana bugungi kundan keyin bo\'la olmaydi',
        'date.min': 'Tug\'ilgan sana 1900 yildan oldin bo\'la olmaydi'
      }),

    agreeToTerms: Joi.boolean()
      .valid(true)
      .required()
      .messages({
        'any.only': 'Foydalanish shartlarini qabul qilish majburiy',
        'any.required': 'Foydalanish shartlarini qabul qilish majburiy'
      })
  }).options({ abortEarly: false }),

  // User login validation
  userLogin: Joi.object({
    email: Joi.string()
      .email()
      .custom(CustomValidators.secureString, 'Secure string validation')
      .required()
      .messages({
        'string.email': 'Email formati noto\'g\'ri',
        'any.required': 'Email majburiy'
      }),

    password: Joi.string()
      .min(1)
      .max(200)
      .custom(CustomValidators.secureString, 'Secure string validation')
      .required()
      .messages({
        'string.min': 'Parol kiritilmagan',
        'string.max': 'Parol juda uzun',
        'any.required': 'Parol majburiy'
      }),

    rememberMe: Joi.boolean().optional(),
    
    deviceId: Joi.string()
      .uuid()
      .optional()
  }).options({ abortEarly: false }),

  // Product validation
  productCreate: Joi.object({
    name: Joi.string()
      .custom(CustomValidators.secureString, 'Secure string validation')
      .min(3)
      .max(200)
      .required()
      .messages({
        'string.min': 'Mahsulot nomi kamida 3 belgi bo\'lishi kerak',
        'string.max': 'Mahsulot nomi 200 belgidan oshmasligi kerak',
        'any.required': 'Mahsulot nomi majburiy'
      }),

    description: Joi.string()
      .custom(CustomValidators.secureString, 'Secure string validation')
      .min(10)
      .max(5000)
      .required()
      .messages({
        'string.min': 'Mahsulot tavsifi kamida 10 belgi bo\'lishi kerak',
        'string.max': 'Mahsulot tavsifi 5000 belgidan oshmasligi kerak',
        'any.required': 'Mahsulot tavsifi majburiy'
      }),

    price: Joi.number()
      .positive()
      .precision(2)
      .max(999999999)
      .required()
      .messages({
        'number.positive': 'Narx musbat bo\'lishi kerak',
        'number.max': 'Narx juda yuqori',
        'any.required': 'Narx majburiy'
      }),

    category: Joi.string()
      .custom(CustomValidators.secureString, 'Secure string validation')
      .min(2)
      .max(100)
      .required(),

    tags: Joi.array()
      .items(Joi.string().custom(CustomValidators.secureString, 'Secure string validation').max(50))
      .max(10)
      .optional(),

    images: Joi.array()
      .items(Joi.string().custom(CustomValidators.secureUrl, 'Secure URL validation'))
      .max(10)
      .optional(),

    sku: Joi.string()
      .custom(CustomValidators.secureString, 'Secure string validation')
      .alphanum()
      .min(3)
      .max(50)
      .required(),

    stockQuantity: Joi.number()
      .integer()
      .min(0)
      .max(999999)
      .required(),

    weight: Joi.number()
      .positive()
      .precision(3)
      .max(10000)
      .optional(),

    dimensions: Joi.object({
      length: Joi.number().positive().precision(2).max(1000).optional(),
      width: Joi.number().positive().precision(2).max(1000).optional(),
      height: Joi.number().positive().precision(2).max(1000).optional()
    }).optional()
  }).options({ abortEarly: false }),

  // Order validation
  orderCreate: Joi.object({
    items: Joi.array()
      .items(Joi.object({
        productId: Joi.string().uuid().required(),
        quantity: Joi.number().integer().min(1).max(1000).required(),
        price: Joi.number().positive().precision(2).required()
      }))
      .min(1)
      .max(100)
      .required()
      .messages({
        'array.min': 'Buyurtmada kamida 1 ta mahsulot bo\'lishi kerak',
        'array.max': 'Buyurtmada 100 tadan ortiq mahsulot bo\'la olmaydi',
        'any.required': 'Buyurtma mahsulotlari majburiy'
      }),

    shippingAddress: Joi.object({
      street: Joi.string()
        .custom(CustomValidators.secureString, 'Secure string validation')
        .min(5)
        .max(200)
        .required(),
      city: Joi.string()
        .custom(CustomValidators.secureString, 'Secure string validation')
        .min(2)
        .max(100)
        .required(),
      region: Joi.string()
        .custom(CustomValidators.secureString, 'Secure string validation')
        .min(2)
        .max(100)
        .required(),
      postalCode: Joi.string()
        .custom(CustomValidators.uzbekPostalCode, 'Uzbekistan postal code validation')
        .required(),
      country: Joi.string()
        .valid('UZ')
        .required()
        .messages({
          'any.only': 'Faqat O\'zbekiston qo\'llab-quvvatlanadi'
        })
    }).required(),

    paymentMethod: Joi.string()
      .valid('click', 'payme', 'apelsin', 'cash', 'bank_transfer')
      .required()
      .messages({
        'any.only': 'Yaroqsiz to\'lov usuli'
      }),

    notes: Joi.string()
      .custom(CustomValidators.secureString, 'Secure string validation')
      .max(500)
      .optional()
  }).options({ abortEarly: false }),

  // File upload validation
  fileUpload: Joi.object({
    fileName: Joi.string()
      .custom(CustomValidators.secureFileName, 'Secure filename validation')
      .min(1)
      .max(255)
      .required(),

    fileSize: Joi.number()
      .integer()
      .min(1)
      .max(10 * 1024 * 1024) // 10MB
      .required()
      .messages({
        'number.max': 'Fayl hajmi 10MB dan oshmasligi kerak'
      }),

    mimeType: Joi.string()
      .valid(
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      )
      .required()
      .messages({
        'any.only': 'Fayl turi qo\'llab-quvvatlanmaydi'
      })
  }).options({ abortEarly: false }),

  // Search validation
  searchQuery: Joi.object({
    query: Joi.string()
      .custom(CustomValidators.secureString, 'Secure string validation')
      .min(1)
      .max(200)
      .required()
      .messages({
        'string.min': 'Qidiruv so\'zi kiritilmagan',
        'string.max': 'Qidiruv so\'zi juda uzun'
      }),

    category: Joi.string()
      .custom(CustomValidators.secureString, 'Secure string validation')
      .max(100)
      .optional(),

    minPrice: Joi.number()
      .min(0)
      .precision(2)
      .optional(),

    maxPrice: Joi.number()
      .min(0)
      .precision(2)
      .optional(),

    sortBy: Joi.string()
      .valid('price_asc', 'price_desc', 'name_asc', 'name_desc', 'date_asc', 'date_desc')
      .optional(),

    page: Joi.number()
      .integer()
      .min(1)
      .max(1000)
      .default(1)
      .optional(),

    limit: Joi.number()
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
export function createValidationMiddleware(schema: Joi.ObjectSchema) {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body);

    if (error) {
      logger.warn('Validation failed', {
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
export const ValidationMiddleware = {
  userRegistration: createValidationMiddleware(ValidationSchemas.userRegistration),
  userLogin: createValidationMiddleware(ValidationSchemas.userLogin),
  productCreate: createValidationMiddleware(ValidationSchemas.productCreate),
  orderCreate: createValidationMiddleware(ValidationSchemas.orderCreate),
  fileUpload: createValidationMiddleware(ValidationSchemas.fileUpload),
  searchQuery: createValidationMiddleware(ValidationSchemas.searchQuery)
};

export default ValidationSchemas; 