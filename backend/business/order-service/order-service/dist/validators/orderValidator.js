"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRefund = exports.validatePayment = exports.validateOrderUpdate = exports.validateOrder = void 0;
var joi_1 = __importDefault(require("joi"));
var orderItemSchema = joi_1.default.object({
    productId: joi_1.default.string().required(),
    quantity: joi_1.default.number().integer().min(1).required(),
    price: joi_1.default.number().positive().required(),
});
var addressSchema = joi_1.default.object({
    street: joi_1.default.string().required(),
    city: joi_1.default.string().required(),
    state: joi_1.default.string().required(),
    zipCode: joi_1.default.string().required(),
    country: joi_1.default.string().required(),
});
var validateOrder = function (req, res, next) {
    var schema = joi_1.default.object({
        items: joi_1.default.array().items(orderItemSchema).min(1).required(),
        shippingAddress: addressSchema.required(),
        billingAddress: addressSchema.optional(),
        paymentMethod: joi_1.default.string()
            .valid('CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'DIGITAL_WALLET', 'CASH_ON_DELIVERY')
            .required(),
        notes: joi_1.default.string().optional(),
    });
    var error = schema.validate(req.body).error;
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details.map(function (detail) { return detail.message; }),
        });
    }
    next();
};
exports.validateOrder = validateOrder;
var validateOrderUpdate = function (req, res, next) {
    var schema = joi_1.default.object({
        status: joi_1.default.string()
            .valid('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'PAID')
            .required(),
        notes: joi_1.default.string().optional(),
    });
    var error = schema.validate(req.body).error;
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details.map(function (detail) { return detail.message; }),
        });
    }
    next();
};
exports.validateOrderUpdate = validateOrderUpdate;
var validatePayment = function (req, res, next) {
    var schema = joi_1.default.object({
        paymentMethod: joi_1.default.string()
            .valid('CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'DIGITAL_WALLET', 'CASH_ON_DELIVERY')
            .required(),
        paymentDetails: joi_1.default.object({
            cardNumber: joi_1.default.string().when('paymentMethod', {
                is: joi_1.default.string().valid('CREDIT_CARD', 'DEBIT_CARD'),
                then: joi_1.default.required(),
                otherwise: joi_1.default.optional(),
            }),
            expiryMonth: joi_1.default.number()
                .integer()
                .min(1)
                .max(12)
                .when('paymentMethod', {
                is: joi_1.default.string().valid('CREDIT_CARD', 'DEBIT_CARD'),
                then: joi_1.default.required(),
                otherwise: joi_1.default.optional(),
            }),
            expiryYear: joi_1.default.number()
                .integer()
                .min(new Date().getFullYear())
                .when('paymentMethod', {
                is: joi_1.default.string().valid('CREDIT_CARD', 'DEBIT_CARD'),
                then: joi_1.default.required(),
                otherwise: joi_1.default.optional(),
            }),
            cvv: joi_1.default.string()
                .min(3)
                .max(4)
                .when('paymentMethod', {
                is: joi_1.default.string().valid('CREDIT_CARD', 'DEBIT_CARD'),
                then: joi_1.default.required(),
                otherwise: joi_1.default.optional(),
            }),
        }).required(),
    });
    var error = schema.validate(req.body).error;
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details.map(function (detail) { return detail.message; }),
        });
    }
    next();
};
exports.validatePayment = validatePayment;
var validateRefund = function (req, res, next) {
    var schema = joi_1.default.object({
        reason: joi_1.default.string().required(),
        amount: joi_1.default.number().positive().required(),
    });
    var error = schema.validate(req.body).error;
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details.map(function (detail) { return detail.message; }),
        });
    }
    next();
};
exports.validateRefund = validateRefund;
