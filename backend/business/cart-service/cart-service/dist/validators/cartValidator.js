"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCoupon = exports.validateUpdateQuantity = exports.validateAddItem = void 0;
const joi_1 = __importDefault(require("joi"));
const cartItemSchema = joi_1.default.object({
    productId: joi_1.default.string().required(),
    productName: joi_1.default.string().required(),
    price: joi_1.default.number().positive().required(),
    quantity: joi_1.default.number().integer().min(1).required(),
    image: joi_1.default.string().optional(),
    sku: joi_1.default.string().optional(),
    subtotal: joi_1.default.number().optional(),
    addedAt: joi_1.default.string().optional(),
    updatedAt: joi_1.default.string().optional(),
});
const validateAddItem = (req, res, next) => {
    const { error } = cartItemSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details.map((detail) => detail.message),
        });
    }
    next();
};
exports.validateAddItem = validateAddItem;
const validateUpdateQuantity = (req, res, next) => {
    const schema = joi_1.default.object({
        quantity: joi_1.default.number().integer().min(0).required(),
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details.map((detail) => detail.message),
        });
    }
    next();
};
exports.validateUpdateQuantity = validateUpdateQuantity;
const validateCoupon = (req, res, next) => {
    const schema = joi_1.default.object({
        couponCode: joi_1.default.string().required(),
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details.map((detail) => detail.message),
        });
    }
    next();
};
exports.validateCoupon = validateCoupon;
//# sourceMappingURL=cartValidator.js.map