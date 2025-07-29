import Joi from 'joi';


// Enhanced password validation schema
export const passwordSchema = Joi.string()
  .min(12)
  .max(128)
  .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
  .required()
  .messages({
    'string.min': 'Password must be at least 12 characters long',
    'string.max': 'Password must not exceed 128 characters',
    'string.pattern.base':
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'any.required': 'Password is required',
  });

// JWT secret validation (minimum 32 characters)
export const jwtSecretSchema = Joi.string().min(32).required().messages({
  'string.min': 'JWT secret must be at least 32 characters long',
  'any.required': 'JWT secret is required',
});

// Database URL validation
export const databaseUrlSchema = Joi.string()
  .uri({ scheme: ['postgresql', 'mongodb', 'redis'] })
  .required()
  .messages({
    'string.uri': 'Database URL must be a valid URI',
    'any.required': 'Database URL is required',
  });

// Environment validation schemas
export const baseEnvironmentSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  CORS_ORIGIN: Joi.string().uri().default('http://localhost:3000'),
  API_RATE_LIMIT: Joi.number().integer().min(1).max(10000).default(100),
  API_RATE_WINDOW: Joi.number().integer().min(1).max(3600).default(900), // 15 minutes
});

// User Service specific environment validation
export const userServiceEnvironmentSchema = baseEnvironmentSchema.keys({
  DATABASE_URL: databaseUrlSchema,
  REDIS_URL: Joi.string().uri({ scheme: 'redis' }).required(),
  JWT_SECRET: jwtSecretSchema,
  JWT_REFRESH_SECRET: jwtSecretSchema,
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  BCRYPT_ROUNDS: Joi.number().integer().min(10).max(15).default(12),
  EMAIL_SERVICE_URL: Joi.string().uri().optional(),
  SMTP_HOST: Joi.string().hostname().optional(),
  SMTP_PORT: Joi.number().port().optional(),
  SMTP_USER: Joi.string().email().optional(),
  SMTP_PASS: Joi.string().optional(),
  UPLOAD_MAX_SIZE: Joi.number().integer().min(1).max(100).default(10), // MB
  SESSION_SECRET: Joi.string().min(32).required(),
  ENCRYPTION_KEY: Joi.string().length(32).required(),
});

// Product Service specific environment validation
export const productServiceEnvironmentSchema = baseEnvironmentSchema.keys({
  MONGODB_URL: Joi.string().uri({ scheme: 'mongodb' }).required(),
  REDIS_URL: Joi.string().uri({ scheme: 'redis' }).required(),
  ELASTICSEARCH_URL: Joi.string().uri().optional(),
  IMAGE_UPLOAD_PATH: Joi.string().default('/uploads/products'),
  MAX_PRODUCT_IMAGES: Joi.number().integer().min(1).max(20).default(10),
  PRODUCT_CACHE_TTL: Joi.number().integer().min(60).max(86400).default(3600), // 1 hour
});

// Cart Service specific environment validation
export const cartServiceEnvironmentSchema = baseEnvironmentSchema.keys({
  REDIS_URL: Joi.string().uri({ scheme: 'redis' }).required(),
  CART_EXPIRY_HOURS: Joi.number().integer().min(1).max(168).default(24), // 1 day
  MAX_CART_ITEMS: Joi.number().integer().min(1).max(1000).default(100),
  PRODUCT_SERVICE_URL: Joi.string().uri().required(),
  USER_SERVICE_URL: Joi.string().uri().required(),
});

// Order Service specific environment validation
export const orderServiceEnvironmentSchema = baseEnvironmentSchema.keys({
  DATABASE_URL: databaseUrlSchema,
  REDIS_URL: Joi.string().uri({ scheme: 'redis' }).required(),
  PAYMENT_SERVICE_URL: Joi.string().uri().required(),
  INVENTORY_SERVICE_URL: Joi.string().uri().required(),
  NOTIFICATION_SERVICE_URL: Joi.string().uri().required(),
  ORDER_TIMEOUT_MINUTES: Joi.number().integer().min(5).max(60).default(30),
});

// API Gateway specific environment validation
export const apiGatewayEnvironmentSchema = baseEnvironmentSchema.keys({
  JWT_SECRET: jwtSecretSchema,
  RATE_LIMIT_GLOBAL: Joi.number().integer().min(1).max(10000).default(1000),
  RATE_LIMIT_PER_IP: Joi.number().integer().min(1).max(1000).default(100),
  TIMEOUT_SECONDS: Joi.number().integer().min(1).max(300).default(30),
  MAX_REQUEST_SIZE: Joi.string().default('10mb'),
  CORS_CREDENTIALS: Joi.boolean().default(true),
});

// Input validation schemas
export const emailSchema = Joi.string()
  .email({ tlds: { allow: false } })
  .max(254)
  .required()
  .messages({
    'string.email': 'Please provide a valid email address',
    'string.max': 'Email address is too long',
    'any.required': 'Email address is required',
  });

export const usernameSchema = Joi.string().alphanum().min(3).max(30).required().messages({
  'string.alphanum': 'Username must contain only alphanumeric characters',
  'string.min': 'Username must be at least 3 characters long',
  'string.max': 'Username must not exceed 30 characters',
  'any.required': 'Username is required',
});

export const phoneSchema = Joi.string()
  .pattern(/^\+?[1-9]\d{1,14}$/)
  .messages({
    'string.pattern.base': 'Please provide a valid phone number',
  });

export const uuidSchema = Joi.string()
  .uuid({ version: ['uuidv4'] })
  .required()
  .messages({
    'string.guid': 'Please provide a valid UUID',
    'any.required': 'ID is required',
  });

// Sanitization functions
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

export const sanitizeHtml = (html: string): string => {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
};

// Validation helper functions
export const validateEnvironment = (
  schema: Joi.ObjectSchema,
  env: Record<string, any> = process.env
) => {
  const { error, value } = schema.validate(env, {
    allowUnknown: true,
    stripUnknown: false,
    abortEarly: false,
  });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message).join(', ');
    throw new Error(`Environment validation failed: ${errorMessages}`);
  }

  return value;
};

export const validateRequest = (schema: Joi.Schema, data: any) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessages = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    throw new ValidationError('Request validation failed', errorMessages);
  }

  return value;
};

// Custom validation error class
export class ValidationError extends Error {
  public details: Array<{ field: string; message: string }>;

  constructor(message: string, details: Array<{ field: string; message: string }>) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

// Rate limiting validation
export const rateLimitSchema = Joi.object({
  windowMs: Joi.number().integer().min(1000).max(3600000).default(900000), // 15 minutes
  max: Joi.number().integer().min(1).max(10000).default(100),
  message: Joi.string().default('Too many requests from this IP, please try again later'),
  standardHeaders: Joi.boolean().default(true),
  legacyHeaders: Joi.boolean().default(false),
});

// File upload validation
export const fileUploadSchema = Joi.object({
  fieldName: Joi.string().required(),
  maxFiles: Joi.number().integer().min(1).max(20).default(5),
  maxSize: Joi.number().integer().min(1024).max(104857600).default(10485760), // 10MB
  allowedMimeTypes: Joi.array()
    .items(Joi.string())
    .default(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  allowedExtensions: Joi.array()
    .items(Joi.string())
    .default(['.jpg', '.jpeg', '.png', '.gif', '.webp']),
});

// Export all schemas for easy access
export const schemas = {
  password: passwordSchema,
  jwtSecret: jwtSecretSchema,
  databaseUrl: databaseUrlSchema,
  email: emailSchema,
  username: usernameSchema,
  phone: phoneSchema,
  uuid: uuidSchema,
  rateLimit: rateLimitSchema,
  fileUpload: fileUploadSchema,
  environment: {
    base: baseEnvironmentSchema,
    userService: userServiceEnvironmentSchema,
    productService: productServiceEnvironmentSchema,
    cartService: cartServiceEnvironmentSchema,
    orderService: orderServiceEnvironmentSchema,
    apiGateway: apiGatewayEnvironmentSchema,
  },
};
