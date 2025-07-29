"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCreateUserSchema = exports.adminUpdateUserSchema = exports.userIdAndAddressIdParamSchema = exports.addressIdParamSchema = exports.userIdParamSchema = exports.getAddressesQuerySchema = exports.getUsersQuerySchema = exports.updateAddressSchema = exports.createAddressSchema = exports.updateEmailSchema = exports.changePasswordSchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const uuidSchema = joi_1.default.string().uuid({ version: 'uuidv4' });
const emailSchema = joi_1.default.string().email().lowercase().trim();
const phoneSchema = joi_1.default.string()
    .pattern(/^\+998[0-9]{9}$/)
    .message('Phone number must be in format +998XXXXXXXXX');
const passwordSchema = joi_1.default.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .message('Password must contain at least 8 characters, including uppercase, lowercase, number, and special character');
exports.createUserSchema = joi_1.default.object({
    email: emailSchema.required(),
    username: joi_1.default.string().alphanum().min(3).max(30).lowercase().trim().required(),
    password: passwordSchema.required(),
    firstName: joi_1.default.string().trim().min(2).max(50).required(),
    lastName: joi_1.default.string().trim().min(2).max(50).required(),
    phoneNumber: phoneSchema.optional(),
    bio: joi_1.default.string().max(500).optional(),
    profileImage: joi_1.default.string().uri().optional(),
});
exports.updateUserSchema = joi_1.default.object({
    username: joi_1.default.string().alphanum().min(3).max(30).lowercase().trim(),
    firstName: joi_1.default.string().trim().min(2).max(50),
    lastName: joi_1.default.string().trim().min(2).max(50),
    phoneNumber: phoneSchema.allow(null),
    bio: joi_1.default.string().max(500).allow(null),
    profileImage: joi_1.default.string().uri().allow(null),
}).min(1);
exports.changePasswordSchema = joi_1.default.object({
    currentPassword: joi_1.default.string().required(),
    newPassword: passwordSchema.required(),
    confirmPassword: joi_1.default.string()
        .valid(joi_1.default.ref('newPassword'))
        .required()
        .messages({ 'any.only': 'Passwords do not match' }),
});
exports.updateEmailSchema = joi_1.default.object({
    email: emailSchema.required(),
    password: joi_1.default.string().required(),
});
exports.createAddressSchema = joi_1.default.object({
    type: joi_1.default.string().valid('SHIPPING', 'BILLING').required(),
    region: joi_1.default.string().trim().min(2).max(50).required(),
    district: joi_1.default.string().trim().min(2).max(50).required(),
    city: joi_1.default.string().trim().min(2).max(50).optional(),
    mahalla: joi_1.default.string().trim().min(2).max(50).optional(),
    street: joi_1.default.string().trim().min(2).max(100).required(),
    house: joi_1.default.string().trim().min(1).max(20).required(),
    apartment: joi_1.default.string().trim().min(1).max(20).optional(),
    postalCode: joi_1.default.string().trim().min(5).max(10).optional(),
    landmark: joi_1.default.string().trim().max(100).optional(),
    instructions: joi_1.default.string().trim().max(200).optional(),
    isDefault: joi_1.default.boolean().default(false),
});
exports.updateAddressSchema = joi_1.default.object({
    type: joi_1.default.string().valid('SHIPPING', 'BILLING'),
    region: joi_1.default.string().trim().min(2).max(50),
    district: joi_1.default.string().trim().min(2).max(50),
    city: joi_1.default.string().trim().min(2).max(50).allow(null),
    mahalla: joi_1.default.string().trim().min(2).max(50).allow(null),
    street: joi_1.default.string().trim().min(2).max(100),
    house: joi_1.default.string().trim().min(1).max(20),
    apartment: joi_1.default.string().trim().min(1).max(20).allow(null),
    postalCode: joi_1.default.string().trim().min(5).max(10).allow(null),
    landmark: joi_1.default.string().trim().max(100).allow(null),
    instructions: joi_1.default.string().trim().max(200).allow(null),
    isDefault: joi_1.default.boolean(),
}).min(1);
exports.getUsersQuerySchema = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).default(1),
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    search: joi_1.default.string().trim().min(1).max(100).optional(),
    role: joi_1.default.string().valid('CUSTOMER', 'SELLER', 'ADMIN', 'SUPER_ADMIN').optional(),
    isActive: joi_1.default.boolean().optional(),
    sortBy: joi_1.default.string()
        .valid('createdAt', 'updatedAt', 'email', 'firstName', 'lastName')
        .default('createdAt'),
    sortOrder: joi_1.default.string().valid('asc', 'desc').default('desc'),
});
exports.getAddressesQuerySchema = joi_1.default.object({
    type: joi_1.default.string().valid('SHIPPING', 'BILLING').optional(),
    isActive: joi_1.default.boolean().optional(),
});
exports.userIdParamSchema = joi_1.default.object({
    userId: uuidSchema.required(),
});
exports.addressIdParamSchema = joi_1.default.object({
    addressId: uuidSchema.required(),
});
exports.userIdAndAddressIdParamSchema = joi_1.default.object({
    userId: uuidSchema.required(),
    addressId: uuidSchema.required(),
});
exports.adminUpdateUserSchema = joi_1.default.object({
    email: emailSchema,
    username: joi_1.default.string().alphanum().min(3).max(30).lowercase().trim(),
    firstName: joi_1.default.string().trim().min(2).max(50),
    lastName: joi_1.default.string().trim().min(2).max(50),
    phoneNumber: phoneSchema.allow(null),
    role: joi_1.default.string().valid('CUSTOMER', 'SELLER', 'ADMIN', 'SUPER_ADMIN'),
    isActive: joi_1.default.boolean(),
    isEmailVerified: joi_1.default.boolean(),
    bio: joi_1.default.string().max(500).allow(null),
    profileImage: joi_1.default.string().uri().allow(null),
}).min(1);
exports.adminCreateUserSchema = joi_1.default.object({
    email: emailSchema.required(),
    username: joi_1.default.string().alphanum().min(3).max(30).lowercase().trim().required(),
    password: passwordSchema.required(),
    firstName: joi_1.default.string().trim().min(2).max(50).required(),
    lastName: joi_1.default.string().trim().min(2).max(50).required(),
    phoneNumber: phoneSchema.optional(),
    role: joi_1.default.string().valid('CUSTOMER', 'SELLER', 'ADMIN', 'SUPER_ADMIN').default('CUSTOMER'),
    isActive: joi_1.default.boolean().default(true),
    isEmailVerified: joi_1.default.boolean().default(false),
    bio: joi_1.default.string().max(500).optional(),
    profileImage: joi_1.default.string().uri().optional(),
});
//# sourceMappingURL=user.schemas.js.map