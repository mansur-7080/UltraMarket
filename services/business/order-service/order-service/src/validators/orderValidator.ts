import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const orderItemSchema = Joi.object({
  productId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
  price: Joi.number().positive().required(),
});

const addressSchema = Joi.object({
  street: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  zipCode: Joi.string().required(),
  country: Joi.string().required(),
});

export const validateOrder = (req: Request, res: Response, next: NextFunction): Response | void => {
  const schema = Joi.object({
    items: Joi.array().items(orderItemSchema).min(1).required(),
    shippingAddress: addressSchema.required(),
    billingAddress: addressSchema.optional(),
    paymentMethod: Joi.string()
      .valid('CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'DIGITAL_WALLET', 'CASH_ON_DELIVERY')
      .required(),
    notes: Joi.string().optional(),
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

export const validateOrderUpdate = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  const schema = Joi.object({
    status: Joi.string()
      .valid(
        'PENDING',
        'CONFIRMED',
        'PROCESSING',
        'SHIPPED',
        'DELIVERED',
        'CANCELLED',
        'REFUNDED',
        'PAID'
      )
      .required(),
    notes: Joi.string().optional(),
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

export const validatePayment = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  const schema = Joi.object({
    paymentMethod: Joi.string()
      .valid('CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'DIGITAL_WALLET', 'CASH_ON_DELIVERY')
      .required(),
    paymentDetails: Joi.object({
      cardNumber: Joi.string().when('paymentMethod', {
        is: Joi.string().valid('CREDIT_CARD', 'DEBIT_CARD'),
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
      expiryMonth: Joi.number()
        .integer()
        .min(1)
        .max(12)
        .when('paymentMethod', {
          is: Joi.string().valid('CREDIT_CARD', 'DEBIT_CARD'),
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
      expiryYear: Joi.number()
        .integer()
        .min(new Date().getFullYear())
        .when('paymentMethod', {
          is: Joi.string().valid('CREDIT_CARD', 'DEBIT_CARD'),
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
      cvv: Joi.string()
        .min(3)
        .max(4)
        .when('paymentMethod', {
          is: Joi.string().valid('CREDIT_CARD', 'DEBIT_CARD'),
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
    }).required(),
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

export const validateRefund = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  const schema = Joi.object({
    reason: Joi.string().required(),
    amount: Joi.number().positive().required(),
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
