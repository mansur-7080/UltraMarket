import Joi from 'joi';

// Common validation patterns
const objectIdPattern = /^[0-9a-fA-F]{24}$/;
const urlPattern = /^https?:\/\/.+/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Common schemas
const objectIdSchema = Joi.string().pattern(objectIdPattern).message('Invalid ID format');
const urlSchema = Joi.string().uri().pattern(urlPattern).message('Invalid URL format');
const emailSchema = Joi.string().email().pattern(emailPattern).message('Invalid email format');

// Review creation schema
export const createReviewSchema = Joi.object({
  productId: objectIdSchema.required().messages({
    'any.required': 'Product ID is required',
    'string.empty': 'Product ID cannot be empty',
  }),

  orderId: objectIdSchema.optional().messages({
    'string.empty': 'Order ID cannot be empty',
  }),

  rating: Joi.number().integer().min(1).max(5).required().messages({
    'any.required': 'Rating is required',
    'number.base': 'Rating must be a number',
    'number.integer': 'Rating must be an integer',
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating must be at most 5',
  }),

  title: Joi.string().trim().min(5).max(100).required().messages({
    'any.required': 'Title is required',
    'string.empty': 'Title cannot be empty',
    'string.min': 'Title must be at least 5 characters long',
    'string.max': 'Title cannot exceed 100 characters',
  }),

  content: Joi.string().trim().min(10).max(2000).required().messages({
    'any.required': 'Review content is required',
    'string.empty': 'Review content cannot be empty',
    'string.min': 'Review content must be at least 10 characters long',
    'string.max': 'Review content cannot exceed 2000 characters',
  }),

  pros: Joi.array()
    .items(
      Joi.string().trim().max(200).messages({
        'string.max': 'Each pro point cannot exceed 200 characters',
      })
    )
    .max(10)
    .optional()
    .messages({
      'array.max': 'Maximum 10 pro points allowed',
    }),

  cons: Joi.array()
    .items(
      Joi.string().trim().max(200).messages({
        'string.max': 'Each con point cannot exceed 200 characters',
      })
    )
    .max(10)
    .optional()
    .messages({
      'array.max': 'Maximum 10 con points allowed',
    }),

  images: Joi.array()
    .items(
      urlSchema.messages({
        'string.uri': 'Each image must be a valid URL',
      })
    )
    .max(5)
    .optional()
    .messages({
      'array.max': 'Maximum 5 images allowed',
    }),

  videos: Joi.array()
    .items(
      urlSchema.messages({
        'string.uri': 'Each video must be a valid URL',
      })
    )
    .max(2)
    .optional()
    .messages({
      'array.max': 'Maximum 2 videos allowed',
    }),

  tags: Joi.array()
    .items(
      Joi.string().trim().lowercase().max(50).messages({
        'string.max': 'Each tag cannot exceed 50 characters',
      })
    )
    .max(20)
    .optional()
    .messages({
      'array.max': 'Maximum 20 tags allowed',
    }),

  language: Joi.string().lowercase().min(2).max(5).default('en').optional().messages({
    'string.min': 'Language code must be at least 2 characters',
    'string.max': 'Language code cannot exceed 5 characters',
  }),
}).options({ stripUnknown: true });

// Review update schema
export const updateReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).optional().messages({
    'number.base': 'Rating must be a number',
    'number.integer': 'Rating must be an integer',
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating must be at most 5',
  }),

  title: Joi.string().trim().min(5).max(100).optional().messages({
    'string.empty': 'Title cannot be empty',
    'string.min': 'Title must be at least 5 characters long',
    'string.max': 'Title cannot exceed 100 characters',
  }),

  content: Joi.string().trim().min(10).max(2000).optional().messages({
    'string.empty': 'Review content cannot be empty',
    'string.min': 'Review content must be at least 10 characters long',
    'string.max': 'Review content cannot exceed 2000 characters',
  }),

  pros: Joi.array()
    .items(
      Joi.string().trim().max(200).messages({
        'string.max': 'Each pro point cannot exceed 200 characters',
      })
    )
    .max(10)
    .optional()
    .messages({
      'array.max': 'Maximum 10 pro points allowed',
    }),

  cons: Joi.array()
    .items(
      Joi.string().trim().max(200).messages({
        'string.max': 'Each con point cannot exceed 200 characters',
      })
    )
    .max(10)
    .optional()
    .messages({
      'array.max': 'Maximum 10 con points allowed',
    }),

  images: Joi.array()
    .items(
      urlSchema.messages({
        'string.uri': 'Each image must be a valid URL',
      })
    )
    .max(5)
    .optional()
    .messages({
      'array.max': 'Maximum 5 images allowed',
    }),

  videos: Joi.array()
    .items(
      urlSchema.messages({
        'string.uri': 'Each video must be a valid URL',
      })
    )
    .max(2)
    .optional()
    .messages({
      'array.max': 'Maximum 2 videos allowed',
    }),

  tags: Joi.array()
    .items(
      Joi.string().trim().lowercase().max(50).messages({
        'string.max': 'Each tag cannot exceed 50 characters',
      })
    )
    .max(20)
    .optional()
    .messages({
      'array.max': 'Maximum 20 tags allowed',
    }),
})
  .min(1)
  .options({ stripUnknown: true })
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

// Helpful vote schema
export const helpfulVoteSchema = Joi.object({
  vote: Joi.string().valid('yes', 'no').required().messages({
    'any.required': 'Vote is required',
    'any.only': 'Vote must be either "yes" or "no"',
  }),
}).options({ stripUnknown: true });

// Flag review schema
export const flagReviewSchema = Joi.object({
  reason: Joi.string()
    .valid(
      'inappropriate_language',
      'spam',
      'fake_review',
      'off_topic',
      'personal_information',
      'copyright',
      'other'
    )
    .required()
    .messages({
      'any.required': 'Reason is required',
      'any.only': 'Invalid flag reason',
    }),

  description: Joi.string().trim().max(300).optional().messages({
    'string.max': 'Description cannot exceed 300 characters',
  }),
}).options({ stripUnknown: true });

// Reply to review schema
export const replyReviewSchema = Joi.object({
  content: Joi.string().trim().min(1).max(1000).required().messages({
    'any.required': 'Reply content is required',
    'string.empty': 'Reply content cannot be empty',
    'string.min': 'Reply content must be at least 1 character long',
    'string.max': 'Reply content cannot exceed 1000 characters',
  }),

  userType: Joi.string().valid('customer', 'merchant', 'admin').required().messages({
    'any.required': 'User type is required',
    'any.only': 'User type must be customer, merchant, or admin',
  }),
}).options({ stripUnknown: true });

// Query parameters schemas
export const reviewQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).optional().messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1',
  }),

  limit: Joi.number().integer().min(1).max(100).default(20).optional().messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),

  productId: objectIdSchema.optional(),

  userId: objectIdSchema.optional(),

  rating: Joi.number().integer().min(1).max(5).optional().messages({
    'number.base': 'Rating must be a number',
    'number.integer': 'Rating must be an integer',
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating must be at most 5',
  }),

  verified: Joi.boolean().optional().messages({
    'boolean.base': 'Verified must be a boolean',
  }),

  moderationStatus: Joi.string()
    .valid('pending', 'approved', 'rejected', 'flagged')
    .optional()
    .messages({
      'any.only': 'Invalid moderation status',
    }),

  sortBy: Joi.string()
    .valid('createdAt', 'rating', 'helpful')
    .default('createdAt')
    .optional()
    .messages({
      'any.only': 'Invalid sort field',
    }),

  sortOrder: Joi.string().valid('asc', 'desc').default('desc').optional().messages({
    'any.only': 'Sort order must be asc or desc',
  }),
}).options({ stripUnknown: true });

// Search query schema
export const searchQuerySchema = Joi.object({
  q: Joi.string().trim().min(1).max(100).required().messages({
    'any.required': 'Search query is required',
    'string.empty': 'Search query cannot be empty',
    'string.min': 'Search query must be at least 1 character long',
    'string.max': 'Search query cannot exceed 100 characters',
  }),

  productId: objectIdSchema.optional(),

  rating: Joi.number().integer().min(1).max(5).optional().messages({
    'number.base': 'Rating must be a number',
    'number.integer': 'Rating must be an integer',
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating must be at most 5',
  }),

  page: Joi.number().integer().min(1).default(1).optional().messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1',
  }),

  limit: Joi.number().integer().min(1).max(100).default(20).optional().messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),
}).options({ stripUnknown: true });

// URL parameters schemas
export const reviewIdParamSchema = Joi.object({
  id: objectIdSchema.required().messages({
    'any.required': 'Review ID is required',
  }),
}).options({ stripUnknown: true });

export const productIdParamSchema = Joi.object({
  productId: objectIdSchema.required().messages({
    'any.required': 'Product ID is required',
  }),
}).options({ stripUnknown: true });

export const userIdParamSchema = Joi.object({
  userId: objectIdSchema.required().messages({
    'any.required': 'User ID is required',
  }),
}).options({ stripUnknown: true });

// Moderation schema
export const moderationSchema = Joi.object({
  status: Joi.string().valid('pending', 'approved', 'rejected', 'flagged').required().messages({
    'any.required': 'Moderation status is required',
    'any.only': 'Invalid moderation status',
  }),

  notes: Joi.string().trim().max(500).optional().messages({
    'string.max': 'Moderation notes cannot exceed 500 characters',
  }),

  moderatorId: objectIdSchema.optional(),
}).options({ stripUnknown: true });

// Bulk operations schema
export const bulkModerationSchema = Joi.object({
  reviewIds: Joi.array().items(objectIdSchema).min(1).max(50).required().messages({
    'any.required': 'Review IDs are required',
    'array.min': 'At least one review ID is required',
    'array.max': 'Maximum 50 review IDs allowed',
  }),

  status: Joi.string().valid('pending', 'approved', 'rejected', 'flagged').required().messages({
    'any.required': 'Moderation status is required',
    'any.only': 'Invalid moderation status',
  }),

  notes: Joi.string().trim().max(500).optional().messages({
    'string.max': 'Moderation notes cannot exceed 500 characters',
  }),
}).options({ stripUnknown: true });

// Analytics query schema
export const analyticsQuerySchema = Joi.object({
  productId: objectIdSchema.optional(),

  startDate: Joi.date().iso().optional().messages({
    'date.base': 'Start date must be a valid date',
    'date.format': 'Start date must be in ISO format',
  }),

  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional().messages({
    'date.base': 'End date must be a valid date',
    'date.format': 'End date must be in ISO format',
    'date.min': 'End date must be after start date',
  }),

  groupBy: Joi.string().valid('day', 'week', 'month', 'year').default('day').optional().messages({
    'any.only': 'Group by must be day, week, month, or year',
  }),
}).options({ stripUnknown: true });

// File upload schema
export const fileUploadSchema = Joi.object({
  files: Joi.array()
    .items(
      Joi.object({
        fieldname: Joi.string().required(),
        originalname: Joi.string().required(),
        encoding: Joi.string().required(),
        mimetype: Joi.string()
          .valid('image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm')
          .required(),
        size: Joi.number()
          .max(10 * 1024 * 1024)
          .required(), // 10MB max
        buffer: Joi.binary().required(),
      })
    )
    .max(5)
    .optional()
    .messages({
      'array.max': 'Maximum 5 files allowed',
    }),
}).options({ stripUnknown: true });

// Export all schemas
export const reviewSchemas = {
  createReview: createReviewSchema,
  updateReview: updateReviewSchema,
  helpfulVote: helpfulVoteSchema,
  flagReview: flagReviewSchema,
  replyReview: replyReviewSchema,
  reviewQuery: reviewQuerySchema,
  searchQuery: searchQuerySchema,
  reviewIdParam: reviewIdParamSchema,
  productIdParam: productIdParamSchema,
  userIdParam: userIdParamSchema,
  moderation: moderationSchema,
  bulkModeration: bulkModerationSchema,
  analyticsQuery: analyticsQuerySchema,
  fileUpload: fileUploadSchema,
};

// Validation helper functions
export const validateObjectId = (id: string): boolean => {
  return objectIdPattern.test(id);
};

export const validateEmail = (email: string): boolean => {
  return emailPattern.test(email);
};

export const validateUrl = (url: string): boolean => {
  return urlPattern.test(url);
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '');
};

export const validateRating = (rating: number): boolean => {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
};

export const validateLanguageCode = (code: string): boolean => {
  return /^[a-z]{2}(-[A-Z]{2})?$/.test(code);
};

export default reviewSchemas;
