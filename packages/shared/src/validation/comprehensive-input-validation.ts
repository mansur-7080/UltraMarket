/**
 * Comprehensive Input Validation System
 * UltraMarket E-commerce Platform
 * 
 * Bu fayl barcha input validation va security issues ni hal qilish uchun
 */

import { z } from 'zod';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// Initialize DOMPurify for server-side usage
const window = new JSDOM('').window;
const domPurify = DOMPurify(window as any);

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
export const CommonValidationSchemas = {
  // O'zbek telefon raqami validation
  uzbekPhoneNumber: z.string().regex(
    /^\+998[0-9]{9}$/,
    'Telefon raqami +998XXXXXXXXX formatida bo\'lishi kerak'
  ),
  
  // Email validation
  email: z.string().email('Noto\'g\'ri email format'),
  
  // Strong password validation
  strongPassword: z.string()
    .min(8, 'Parol kamida 8 ta belgidan iborat bo\'lishi kerak')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Parol katta-kichik harf, raqam va maxsus belgini o\'z ichiga olishi kerak'),
  
  // UUID validation
  uuid: z.string().uuid('Noto\'g\'ri UUID format'),
  
  // Positive integer
  positiveInteger: z.number().int().positive('Musbat butun son bo\'lishi kerak'),
  
  // Price validation (O'zbekiston so'm)
  price: z.number()
    .positive('Narx musbat bo\'lishi kerak')
    .max(999999999, 'Narx juda katta')
    .multipleOf(0.01, 'Narx 2 xonali bo\'lishi kerak'),
  
  // Slug validation
  slug: z.string().regex(
    /^[a-z0-9-]+$/,
    'Slug faqat kichik harf, raqam va tire (-) belgilarini o\'z ichiga olishi mumkin'
  ),
  
  // HTML content sanitization
  htmlContent: z.string().transform((content) => {
    return domPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h3', 'h4'],
      ALLOWED_ATTR: []
    });
  }),
  
  // File upload validation
  fileUpload: z.object({
    mimetype: z.enum([
      'image/jpeg',
      'image/png', 
      'image/webp',
      'application/pdf'
    ]),
    size: z.number().max(10 * 1024 * 1024, 'Fayl hajmi 10MB dan oshmasligi kerak')
  })
};

// Product validation schema
export const ProductValidationSchema = z.object({
  name: z.string()
    .min(3, 'Mahsulot nomi kamida 3 ta belgidan iborat bo\'lishi kerak')
    .max(200, 'Mahsulot nomi 200 ta belgidan oshmasligi kerak')
    .transform(input => domPurify.sanitize(input, { ALLOWED_TAGS: [] })),
    
  slug: CommonValidationSchemas.slug,
  
  description: CommonValidationSchemas.htmlContent
    .optional()
    .transform(content => content && content.length > 2000 ? content.slice(0, 2000) : content),
    
  price: CommonValidationSchemas.price,
  
  comparePrice: CommonValidationSchemas.price.optional(),
  
  sku: z.string()
    .min(3, 'SKU kamida 3 ta belgidan iborat bo\'lishi kerak')
    .max(50, 'SKU 50 ta belgidan oshmasligi kerak')
    .regex(/^[A-Z0-9-_]+$/, 'SKU faqat katta harf, raqam, tire va pastki chiziq bo\'lishi mumkin'),
    
  categoryId: CommonValidationSchemas.uuid,
  
  tags: z.array(z.string().max(50)).max(10, '10 tadan ortiq tag bo\'lmasligi kerak').optional(),
  
  specifications: z.record(z.string().max(100), z.string().max(500)).optional(),
  
  isActive: z.boolean().default(true),
  
  isFeatured: z.boolean().default(false)
});

// User validation schema
export const UserValidationSchema = z.object({
  firstName: z.string()
    .min(2, 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak')
    .max(50, 'Ism 50 ta belgidan oshmasligi kerak')
    .transform(input => domPurify.sanitize(input, { ALLOWED_TAGS: [] })),
    
  lastName: z.string()
    .min(2, 'Familiya kamida 2 ta belgidan iborat bo\'lishi kerak')
    .max(50, 'Familiya 50 ta belgidan oshmasligi kerak')
    .transform(input => domPurify.sanitize(input, { ALLOWED_TAGS: [] })),
    
  email: CommonValidationSchemas.email,
  
  password: CommonValidationSchemas.strongPassword,
  
  phone: CommonValidationSchemas.uzbekPhoneNumber.optional(),
  
  dateOfBirth: z.string().datetime().optional(),
  
  gender: z.enum(['male', 'female', 'other']).optional(),
  
  role: z.enum(['CUSTOMER', 'ADMIN', 'MANAGER']).default('CUSTOMER')
});

// Order validation schema
export const OrderValidationSchema = z.object({
  items: z.array(z.object({
    productId: CommonValidationSchemas.uuid,
    quantity: CommonValidationSchemas.positiveInteger.max(100, 'Maksimal miqdor 100 ta'),
    price: CommonValidationSchemas.price
  })).min(1, 'Kamida 1 ta mahsulot bo\'lishi kerak').max(50, '50 tadan ortiq mahsulot bo\'lmasligi kerak'),
  
  shippingAddress: z.object({
    street: z.string().min(5, 'Ko\'cha manzili kamida 5 ta belgidan iborat bo\'lishi kerak').max(200),
    city: z.string().min(2).max(100),
    region: z.string().min(2).max(100),
    postalCode: z.string().regex(/^[0-9]{6}$/, 'Pochta indeksi 6 ta raqamdan iborat bo\'lishi kerak'),
    country: z.literal('UZ')
  }),
  
  paymentMethod: z.enum(['click', 'payme', 'uzcard', 'cash']),
  
  notes: z.string().max(500, 'Izoh 500 ta belgidan oshmasligi kerak').optional()
});

// XSS Prevention
export class XSSProtection {
  static sanitizeInput(input: string, allowedTags?: string[]): string {
    return domPurify.sanitize(input, {
      ALLOWED_TAGS: allowedTags || [],
      ALLOWED_ATTR: []
    });
  }
  
  static sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const sanitized = {} as T;
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key as keyof T] = this.sanitizeInput(value) as T[keyof T];
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key as keyof T] = this.sanitizeObject(value) as T[keyof T];
      } else {
        sanitized[key as keyof T] = value;
      }
    }
    
    return sanitized;
  }
}

// SQL Injection Prevention
export class SQLInjectionProtection {
  static validateParameterizedQuery(query: string): boolean {
    // Parametrized query patterns ni tekshirish
    const dangerousPatterns = [
      /'\s*;\s*(?:DROP|DELETE|UPDATE|INSERT|ALTER|CREATE)/i,
      /UNION\s+SELECT/i,
      /--.*$/m,
      /\/\*.*?\*\//g
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(query));
  }
  
  static sanitizeOrderBy(orderBy: string): string {
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

// Rate Limiting Middleware
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Juda ko\'p so\'rov yuborildi, biroz kuting',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
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

// Validation middleware generator
export const validateRequest = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Input sanitization
      req.body = XSSProtection.sanitizeObject(req.body);
      
      // Schema validation
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Kiritilgan ma\'lumotlar noto\'g\'ri',
            details: (error as any).errors?.map((err: any) => ({
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

// File upload validation
export const validateFileUpload = (req: any, res: Response, next: NextFunction) => {
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
    CommonValidationSchemas.fileUpload.parse({
      mimetype: req.file.mimetype,
      size: req.file.size
    });
    
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_FILE',
        message: 'Noto\'g\'ri fayl turi yoki hajmi'
      }
    });
  }
};

// Express middleware setup
export const setupValidationMiddleware = (app: any) => {
  // Global rate limiting
  app.use('/api', createRateLimit(15 * 60 * 1000, 1000)); // 1000 requests per 15 minutes
  
  // Strict rate limiting for auth endpoints
  app.use('/api/auth', createRateLimit(15 * 60 * 1000, 50)); // 50 requests per 15 minutes
  
  // File upload rate limiting
  app.use('/api/upload', createRateLimit(60 * 1000, 10)); // 10 uploads per minute
};

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