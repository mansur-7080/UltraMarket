import Joi from 'joi';

// Common validation patterns
const uuidSchema = Joi.string().uuid({ version: 'uuidv4' });
const emailSchema = Joi.string().email().lowercase().trim();
const phoneSchema = Joi.string()
  .pattern(/^\+998[0-9]{9}$/)
  .message('Phone number must be in format +998XXXXXXXXX');
const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .message(
    'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character'
  );

// User schemas
export const createUserSchema = Joi.object({
  email: emailSchema.required(),
  username: Joi.string().alphanum().min(3).max(30).lowercase().trim().required(),
  password: passwordSchema.required(),
  firstName: Joi.string().trim().min(2).max(50).required(),
  lastName: Joi.string().trim().min(2).max(50).required(),
  phoneNumber: phoneSchema.optional(),
  bio: Joi.string().max(500).optional(),
  profileImage: Joi.string().uri().optional(),
});

export const updateUserSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).lowercase().trim(),
  firstName: Joi.string().trim().min(2).max(50),
  lastName: Joi.string().trim().min(2).max(50),
  phoneNumber: phoneSchema.allow(null),
  bio: Joi.string().max(500).allow(null),
  profileImage: Joi.string().uri().allow(null),
}).min(1);

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: passwordSchema.required(),
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({ 'any.only': 'Passwords do not match' }),
});

export const updateEmailSchema = Joi.object({
  email: emailSchema.required(),
  password: Joi.string().required(),
});

// Address schemas
export const createAddressSchema = Joi.object({
  type: Joi.string().valid('SHIPPING', 'BILLING').required(),
  region: Joi.string().trim().min(2).max(50).required(),
  district: Joi.string().trim().min(2).max(50).required(),
  city: Joi.string().trim().min(2).max(50).optional(),
  mahalla: Joi.string().trim().min(2).max(50).optional(),
  street: Joi.string().trim().min(2).max(100).required(),
  house: Joi.string().trim().min(1).max(20).required(),
  apartment: Joi.string().trim().min(1).max(20).optional(),
  postalCode: Joi.string().trim().min(5).max(10).optional(),
  landmark: Joi.string().trim().max(100).optional(),
  instructions: Joi.string().trim().max(200).optional(),
  isDefault: Joi.boolean().default(false),
});

export const updateAddressSchema = Joi.object({
  type: Joi.string().valid('SHIPPING', 'BILLING'),
  region: Joi.string().trim().min(2).max(50),
  district: Joi.string().trim().min(2).max(50),
  city: Joi.string().trim().min(2).max(50).allow(null),
  mahalla: Joi.string().trim().min(2).max(50).allow(null),
  street: Joi.string().trim().min(2).max(100),
  house: Joi.string().trim().min(1).max(20),
  apartment: Joi.string().trim().min(1).max(20).allow(null),
  postalCode: Joi.string().trim().min(5).max(10).allow(null),
  landmark: Joi.string().trim().max(100).allow(null),
  instructions: Joi.string().trim().max(200).allow(null),
  isDefault: Joi.boolean(),
}).min(1);

// Query schemas
export const getUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().min(1).max(100).optional(),
  role: Joi.string().valid('CUSTOMER', 'SELLER', 'ADMIN', 'SUPER_ADMIN').optional(),
  isActive: Joi.boolean().optional(),
  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'email', 'firstName', 'lastName')
    .default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

export const getAddressesQuerySchema = Joi.object({
  type: Joi.string().valid('SHIPPING', 'BILLING').optional(),
  isActive: Joi.boolean().optional(),
});

// Parameter schemas
export const userIdParamSchema = Joi.object({
  userId: uuidSchema.required(),
});

export const addressIdParamSchema = Joi.object({
  addressId: uuidSchema.required(),
});

export const userIdAndAddressIdParamSchema = Joi.object({
  userId: uuidSchema.required(),
  addressId: uuidSchema.required(),
});

// Admin schemas
export const adminUpdateUserSchema = Joi.object({
  email: emailSchema,
  username: Joi.string().alphanum().min(3).max(30).lowercase().trim(),
  firstName: Joi.string().trim().min(2).max(50),
  lastName: Joi.string().trim().min(2).max(50),
  phoneNumber: phoneSchema.allow(null),
  role: Joi.string().valid('CUSTOMER', 'SELLER', 'ADMIN', 'SUPER_ADMIN'),
  isActive: Joi.boolean(),
  isEmailVerified: Joi.boolean(),
  bio: Joi.string().max(500).allow(null),
  profileImage: Joi.string().uri().allow(null),
}).min(1);

export const adminCreateUserSchema = Joi.object({
  email: emailSchema.required(),
  username: Joi.string().alphanum().min(3).max(30).lowercase().trim().required(),
  password: passwordSchema.required(),
  firstName: Joi.string().trim().min(2).max(50).required(),
  lastName: Joi.string().trim().min(2).max(50).required(),
  phoneNumber: phoneSchema.optional(),
  role: Joi.string().valid('CUSTOMER', 'SELLER', 'ADMIN', 'SUPER_ADMIN').default('CUSTOMER'),
  isActive: Joi.boolean().default(true),
  isEmailVerified: Joi.boolean().default(false),
  bio: Joi.string().max(500).optional(),
  profileImage: Joi.string().uri().optional(),
});
