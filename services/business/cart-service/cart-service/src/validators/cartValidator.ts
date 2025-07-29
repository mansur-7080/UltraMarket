import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// Schema for cart item
const cartItemSchema = Joi.object({
  productId: Joi.string().required(),
  productName: Joi.string().required(),
  price: Joi.number().positive().required(),
  quantity: Joi.number().integer().min(1).required(),
  image: Joi.string().optional(),
  sku: Joi.string().optional(),
  subtotal: Joi.number().optional(),
  addedAt: Joi.string().optional(),
  updatedAt: Joi.string().optional(),
});

export const validateAddItem = (req: Request, res: Response, next: NextFunction) => {
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

export const validateUpdateQuantity = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    quantity: Joi.number().integer().min(0).required(),
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

export const validateCoupon = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    couponCode: Joi.string().required(),
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
