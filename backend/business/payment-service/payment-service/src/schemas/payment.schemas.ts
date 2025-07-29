import Joi from 'joi';

// Create payment schema
export const createPaymentSchema = Joi.object({
  orderId: Joi.string().uuid().required().messages({
    'string.guid': 'Order ID must be a valid UUID',
    'any.required': 'Order ID is required',
  }),
  amount: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Amount must be positive',
    'any.required': 'Amount is required',
  }),
  currency: Joi.string().valid('UZS', 'USD', 'EUR').default('UZS').messages({
    'any.only': 'Currency must be one of: UZS, USD, EUR',
  }),
  paymentMethod: Joi.string().valid('CLICK', 'PAYME', 'CASH').required().messages({
    'any.only': 'Payment method must be one of: CLICK, PAYME, CASH',
    'any.required': 'Payment method is required',
  }),
  returnUrl: Joi.string().uri().optional().messages({
    'string.uri': 'Return URL must be a valid URL',
  }),
});

// Cancel payment schema
export const cancelPaymentSchema = Joi.object({
  reason: Joi.string().max(500).optional().messages({
    'string.max': 'Reason must not exceed 500 characters',
  }),
});

// Refund payment schema
export const refundPaymentSchema = Joi.object({
  amount: Joi.number().positive().precision(2).optional().messages({
    'number.positive': 'Refund amount must be positive',
  }),
  reason: Joi.string().min(3).max(500).required().messages({
    'string.min': 'Refund reason must be at least 3 characters',
    'string.max': 'Refund reason must not exceed 500 characters',
    'any.required': 'Refund reason is required',
  }),
});

// Get payments query schema
export const getPaymentsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1',
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit must not exceed 100',
  }),
  status: Joi.string()
    .valid('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')
    .optional()
    .messages({
      'any.only': 'Status must be one of: PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED',
    }),
  method: Joi.string().valid('CLICK', 'PAYME', 'CASH').optional().messages({
    'any.only': 'Method must be one of: CLICK, PAYME, CASH',
  }),
  startDate: Joi.date().iso().optional().messages({
    'date.format': 'Start date must be in ISO format',
  }),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional().messages({
    'date.format': 'End date must be in ISO format',
    'date.min': 'End date must be after start date',
  }),
});

// Payment statistics query schema
export const paymentStatisticsQuerySchema = Joi.object({
  startDate: Joi.date().iso().optional().messages({
    'date.format': 'Start date must be in ISO format',
  }),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional().messages({
    'date.format': 'End date must be in ISO format',
    'date.min': 'End date must be after start date',
  }),
  groupBy: Joi.string().valid('day', 'week', 'month', 'year').optional().messages({
    'any.only': 'Group by must be one of: day, week, month, year',
  }),
});

// Click prepare schema
export const clickPrepareSchema = Joi.object({
  click_trans_id: Joi.string().required().messages({
    'any.required': 'Click transaction ID is required',
  }),
  service_id: Joi.string().required().messages({
    'any.required': 'Service ID is required',
  }),
  click_paydoc_id: Joi.string().required().messages({
    'any.required': 'Click paydoc ID is required',
  }),
  merchant_trans_id: Joi.string().uuid().required().messages({
    'string.guid': 'Merchant transaction ID must be a valid UUID',
    'any.required': 'Merchant transaction ID is required',
  }),
  amount: Joi.number().positive().required().messages({
    'number.positive': 'Amount must be positive',
    'any.required': 'Amount is required',
  }),
  action: Joi.number().valid(0, 1).required().messages({
    'any.only': 'Action must be 0 or 1',
    'any.required': 'Action is required',
  }),
  error: Joi.number().required().messages({
    'any.required': 'Error code is required',
  }),
  error_note: Joi.string().allow('').required().messages({
    'any.required': 'Error note is required',
  }),
  sign_time: Joi.string().required().messages({
    'any.required': 'Sign time is required',
  }),
  sign_string: Joi.string().required().messages({
    'any.required': 'Sign string is required',
  }),
});

// Click complete schema
export const clickCompleteSchema = Joi.object({
  click_trans_id: Joi.string().required().messages({
    'any.required': 'Click transaction ID is required',
  }),
  service_id: Joi.string().required().messages({
    'any.required': 'Service ID is required',
  }),
  click_paydoc_id: Joi.string().required().messages({
    'any.required': 'Click paydoc ID is required',
  }),
  merchant_trans_id: Joi.string().uuid().required().messages({
    'string.guid': 'Merchant transaction ID must be a valid UUID',
    'any.required': 'Merchant transaction ID is required',
  }),
  amount: Joi.number().positive().required().messages({
    'number.positive': 'Amount must be positive',
    'any.required': 'Amount is required',
  }),
  action: Joi.number().valid(0, 1).required().messages({
    'any.only': 'Action must be 0 or 1',
    'any.required': 'Action is required',
  }),
  error: Joi.number().required().messages({
    'any.required': 'Error code is required',
  }),
  error_note: Joi.string().allow('').required().messages({
    'any.required': 'Error note is required',
  }),
  sign_time: Joi.string().required().messages({
    'any.required': 'Sign time is required',
  }),
  sign_string: Joi.string().required().messages({
    'any.required': 'Sign string is required',
  }),
});

// Payme webhook schema
export const paymeWebhookSchema = Joi.object({
  method: Joi.string()
    .valid(
      'CheckPerformTransaction',
      'CreateTransaction',
      'PerformTransaction',
      'CancelTransaction',
      'CheckTransaction',
      'GetStatement'
    )
    .required()
    .messages({
      'any.only': 'Method must be a valid Payme method',
      'any.required': 'Method is required',
    }),
  params: Joi.object().required().messages({
    'any.required': 'Params are required',
  }),
  id: Joi.number().required().messages({
    'any.required': 'ID is required',
  }),
});

// Webhook query schema
export const webhookQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1',
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit must not exceed 100',
  }),
  provider: Joi.string().valid('CLICK', 'PAYME').optional().messages({
    'any.only': 'Provider must be one of: CLICK, PAYME',
  }),
  event: Joi.string().optional(),
  startDate: Joi.date().iso().optional().messages({
    'date.format': 'Start date must be in ISO format',
  }),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional().messages({
    'date.format': 'End date must be in ISO format',
    'date.min': 'End date must be after start date',
  }),
});

// UUID parameter schema
export const uuidParamSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'ID must be a valid UUID',
    'any.required': 'ID is required',
  }),
});

// Payment ID parameter schema
export const paymentIdParamSchema = Joi.object({
  paymentId: Joi.string().uuid().required().messages({
    'string.guid': 'Payment ID must be a valid UUID',
    'any.required': 'Payment ID is required',
  }),
});

// Order ID parameter schema
export const orderIdParamSchema = Joi.object({
  orderId: Joi.string().uuid().required().messages({
    'string.guid': 'Order ID must be a valid UUID',
    'any.required': 'Order ID is required',
  }),
});
