"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLanguageCode = exports.validateRating = exports.sanitizeInput = exports.validateUrl = exports.validateEmail = exports.validateObjectId = exports.reviewSchemas = exports.fileUploadSchema = exports.analyticsQuerySchema = exports.bulkModerationSchema = exports.moderationSchema = exports.userIdParamSchema = exports.productIdParamSchema = exports.reviewIdParamSchema = exports.searchQuerySchema = exports.reviewQuerySchema = exports.replyReviewSchema = exports.flagReviewSchema = exports.helpfulVoteSchema = exports.updateReviewSchema = exports.createReviewSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const objectIdPattern = /^[0-9a-fA-F]{24}$/;
const urlPattern = /^https?:\/\/.+/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const objectIdSchema = joi_1.default.string().pattern(objectIdPattern).message('Invalid ID format');
const urlSchema = joi_1.default.string().uri().pattern(urlPattern).message('Invalid URL format');
const emailSchema = joi_1.default.string().email().pattern(emailPattern).message('Invalid email format');
exports.createReviewSchema = joi_1.default.object({
    productId: objectIdSchema.required().messages({
        'any.required': 'Product ID is required',
        'string.empty': 'Product ID cannot be empty',
    }),
    orderId: objectIdSchema.optional().messages({
        'string.empty': 'Order ID cannot be empty',
    }),
    rating: joi_1.default.number().integer().min(1).max(5).required().messages({
        'any.required': 'Rating is required',
        'number.base': 'Rating must be a number',
        'number.integer': 'Rating must be an integer',
        'number.min': 'Rating must be at least 1',
        'number.max': 'Rating must be at most 5',
    }),
    title: joi_1.default.string().trim().min(5).max(100).required().messages({
        'any.required': 'Title is required',
        'string.empty': 'Title cannot be empty',
        'string.min': 'Title must be at least 5 characters long',
        'string.max': 'Title cannot exceed 100 characters',
    }),
    content: joi_1.default.string().trim().min(10).max(2000).required().messages({
        'any.required': 'Review content is required',
        'string.empty': 'Review content cannot be empty',
        'string.min': 'Review content must be at least 10 characters long',
        'string.max': 'Review content cannot exceed 2000 characters',
    }),
    pros: joi_1.default.array()
        .items(joi_1.default.string().trim().max(200).messages({
        'string.max': 'Each pro point cannot exceed 200 characters',
    }))
        .max(10)
        .optional()
        .messages({
        'array.max': 'Maximum 10 pro points allowed',
    }),
    cons: joi_1.default.array()
        .items(joi_1.default.string().trim().max(200).messages({
        'string.max': 'Each con point cannot exceed 200 characters',
    }))
        .max(10)
        .optional()
        .messages({
        'array.max': 'Maximum 10 con points allowed',
    }),
    images: joi_1.default.array()
        .items(urlSchema.messages({
        'string.uri': 'Each image must be a valid URL',
    }))
        .max(5)
        .optional()
        .messages({
        'array.max': 'Maximum 5 images allowed',
    }),
    videos: joi_1.default.array()
        .items(urlSchema.messages({
        'string.uri': 'Each video must be a valid URL',
    }))
        .max(2)
        .optional()
        .messages({
        'array.max': 'Maximum 2 videos allowed',
    }),
    tags: joi_1.default.array()
        .items(joi_1.default.string().trim().lowercase().max(50).messages({
        'string.max': 'Each tag cannot exceed 50 characters',
    }))
        .max(20)
        .optional()
        .messages({
        'array.max': 'Maximum 20 tags allowed',
    }),
    language: joi_1.default.string().lowercase().min(2).max(5).default('en').optional().messages({
        'string.min': 'Language code must be at least 2 characters',
        'string.max': 'Language code cannot exceed 5 characters',
    }),
}).options({ stripUnknown: true });
exports.updateReviewSchema = joi_1.default.object({
    rating: joi_1.default.number().integer().min(1).max(5).optional().messages({
        'number.base': 'Rating must be a number',
        'number.integer': 'Rating must be an integer',
        'number.min': 'Rating must be at least 1',
        'number.max': 'Rating must be at most 5',
    }),
    title: joi_1.default.string().trim().min(5).max(100).optional().messages({
        'string.empty': 'Title cannot be empty',
        'string.min': 'Title must be at least 5 characters long',
        'string.max': 'Title cannot exceed 100 characters',
    }),
    content: joi_1.default.string().trim().min(10).max(2000).optional().messages({
        'string.empty': 'Review content cannot be empty',
        'string.min': 'Review content must be at least 10 characters long',
        'string.max': 'Review content cannot exceed 2000 characters',
    }),
    pros: joi_1.default.array()
        .items(joi_1.default.string().trim().max(200).messages({
        'string.max': 'Each pro point cannot exceed 200 characters',
    }))
        .max(10)
        .optional()
        .messages({
        'array.max': 'Maximum 10 pro points allowed',
    }),
    cons: joi_1.default.array()
        .items(joi_1.default.string().trim().max(200).messages({
        'string.max': 'Each con point cannot exceed 200 characters',
    }))
        .max(10)
        .optional()
        .messages({
        'array.max': 'Maximum 10 con points allowed',
    }),
    images: joi_1.default.array()
        .items(urlSchema.messages({
        'string.uri': 'Each image must be a valid URL',
    }))
        .max(5)
        .optional()
        .messages({
        'array.max': 'Maximum 5 images allowed',
    }),
    videos: joi_1.default.array()
        .items(urlSchema.messages({
        'string.uri': 'Each video must be a valid URL',
    }))
        .max(2)
        .optional()
        .messages({
        'array.max': 'Maximum 2 videos allowed',
    }),
    tags: joi_1.default.array()
        .items(joi_1.default.string().trim().lowercase().max(50).messages({
        'string.max': 'Each tag cannot exceed 50 characters',
    }))
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
exports.helpfulVoteSchema = joi_1.default.object({
    vote: joi_1.default.string().valid('yes', 'no').required().messages({
        'any.required': 'Vote is required',
        'any.only': 'Vote must be either "yes" or "no"',
    }),
}).options({ stripUnknown: true });
exports.flagReviewSchema = joi_1.default.object({
    reason: joi_1.default.string()
        .valid('inappropriate_language', 'spam', 'fake_review', 'off_topic', 'personal_information', 'copyright', 'other')
        .required()
        .messages({
        'any.required': 'Reason is required',
        'any.only': 'Invalid flag reason',
    }),
    description: joi_1.default.string().trim().max(300).optional().messages({
        'string.max': 'Description cannot exceed 300 characters',
    }),
}).options({ stripUnknown: true });
exports.replyReviewSchema = joi_1.default.object({
    content: joi_1.default.string().trim().min(1).max(1000).required().messages({
        'any.required': 'Reply content is required',
        'string.empty': 'Reply content cannot be empty',
        'string.min': 'Reply content must be at least 1 character long',
        'string.max': 'Reply content cannot exceed 1000 characters',
    }),
    userType: joi_1.default.string().valid('customer', 'merchant', 'admin').required().messages({
        'any.required': 'User type is required',
        'any.only': 'User type must be customer, merchant, or admin',
    }),
}).options({ stripUnknown: true });
exports.reviewQuerySchema = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).default(1).optional().messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1',
    }),
    limit: joi_1.default.number().integer().min(1).max(100).default(20).optional().messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100',
    }),
    productId: objectIdSchema.optional(),
    userId: objectIdSchema.optional(),
    rating: joi_1.default.number().integer().min(1).max(5).optional().messages({
        'number.base': 'Rating must be a number',
        'number.integer': 'Rating must be an integer',
        'number.min': 'Rating must be at least 1',
        'number.max': 'Rating must be at most 5',
    }),
    verified: joi_1.default.boolean().optional().messages({
        'boolean.base': 'Verified must be a boolean',
    }),
    moderationStatus: joi_1.default.string()
        .valid('pending', 'approved', 'rejected', 'flagged')
        .optional()
        .messages({
        'any.only': 'Invalid moderation status',
    }),
    sortBy: joi_1.default.string()
        .valid('createdAt', 'rating', 'helpful')
        .default('createdAt')
        .optional()
        .messages({
        'any.only': 'Invalid sort field',
    }),
    sortOrder: joi_1.default.string().valid('asc', 'desc').default('desc').optional().messages({
        'any.only': 'Sort order must be asc or desc',
    }),
}).options({ stripUnknown: true });
exports.searchQuerySchema = joi_1.default.object({
    q: joi_1.default.string().trim().min(1).max(100).required().messages({
        'any.required': 'Search query is required',
        'string.empty': 'Search query cannot be empty',
        'string.min': 'Search query must be at least 1 character long',
        'string.max': 'Search query cannot exceed 100 characters',
    }),
    productId: objectIdSchema.optional(),
    rating: joi_1.default.number().integer().min(1).max(5).optional().messages({
        'number.base': 'Rating must be a number',
        'number.integer': 'Rating must be an integer',
        'number.min': 'Rating must be at least 1',
        'number.max': 'Rating must be at most 5',
    }),
    page: joi_1.default.number().integer().min(1).default(1).optional().messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1',
    }),
    limit: joi_1.default.number().integer().min(1).max(100).default(20).optional().messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100',
    }),
}).options({ stripUnknown: true });
exports.reviewIdParamSchema = joi_1.default.object({
    id: objectIdSchema.required().messages({
        'any.required': 'Review ID is required',
    }),
}).options({ stripUnknown: true });
exports.productIdParamSchema = joi_1.default.object({
    productId: objectIdSchema.required().messages({
        'any.required': 'Product ID is required',
    }),
}).options({ stripUnknown: true });
exports.userIdParamSchema = joi_1.default.object({
    userId: objectIdSchema.required().messages({
        'any.required': 'User ID is required',
    }),
}).options({ stripUnknown: true });
exports.moderationSchema = joi_1.default.object({
    status: joi_1.default.string().valid('pending', 'approved', 'rejected', 'flagged').required().messages({
        'any.required': 'Moderation status is required',
        'any.only': 'Invalid moderation status',
    }),
    notes: joi_1.default.string().trim().max(500).optional().messages({
        'string.max': 'Moderation notes cannot exceed 500 characters',
    }),
    moderatorId: objectIdSchema.optional(),
}).options({ stripUnknown: true });
exports.bulkModerationSchema = joi_1.default.object({
    reviewIds: joi_1.default.array().items(objectIdSchema).min(1).max(50).required().messages({
        'any.required': 'Review IDs are required',
        'array.min': 'At least one review ID is required',
        'array.max': 'Maximum 50 review IDs allowed',
    }),
    status: joi_1.default.string().valid('pending', 'approved', 'rejected', 'flagged').required().messages({
        'any.required': 'Moderation status is required',
        'any.only': 'Invalid moderation status',
    }),
    notes: joi_1.default.string().trim().max(500).optional().messages({
        'string.max': 'Moderation notes cannot exceed 500 characters',
    }),
}).options({ stripUnknown: true });
exports.analyticsQuerySchema = joi_1.default.object({
    productId: objectIdSchema.optional(),
    startDate: joi_1.default.date().iso().optional().messages({
        'date.base': 'Start date must be a valid date',
        'date.format': 'Start date must be in ISO format',
    }),
    endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).optional().messages({
        'date.base': 'End date must be a valid date',
        'date.format': 'End date must be in ISO format',
        'date.min': 'End date must be after start date',
    }),
    groupBy: joi_1.default.string().valid('day', 'week', 'month', 'year').default('day').optional().messages({
        'any.only': 'Group by must be day, week, month, or year',
    }),
}).options({ stripUnknown: true });
exports.fileUploadSchema = joi_1.default.object({
    files: joi_1.default.array()
        .items(joi_1.default.object({
        fieldname: joi_1.default.string().required(),
        originalname: joi_1.default.string().required(),
        encoding: joi_1.default.string().required(),
        mimetype: joi_1.default.string()
            .valid('image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm')
            .required(),
        size: joi_1.default.number()
            .max(10 * 1024 * 1024)
            .required(),
        buffer: joi_1.default.binary().required(),
    }))
        .max(5)
        .optional()
        .messages({
        'array.max': 'Maximum 5 files allowed',
    }),
}).options({ stripUnknown: true });
exports.reviewSchemas = {
    createReview: exports.createReviewSchema,
    updateReview: exports.updateReviewSchema,
    helpfulVote: exports.helpfulVoteSchema,
    flagReview: exports.flagReviewSchema,
    replyReview: exports.replyReviewSchema,
    reviewQuery: exports.reviewQuerySchema,
    searchQuery: exports.searchQuerySchema,
    reviewIdParam: exports.reviewIdParamSchema,
    productIdParam: exports.productIdParamSchema,
    userIdParam: exports.userIdParamSchema,
    moderation: exports.moderationSchema,
    bulkModeration: exports.bulkModerationSchema,
    analyticsQuery: exports.analyticsQuerySchema,
    fileUpload: exports.fileUploadSchema,
};
const validateObjectId = (id) => {
    return objectIdPattern.test(id);
};
exports.validateObjectId = validateObjectId;
const validateEmail = (email) => {
    return emailPattern.test(email);
};
exports.validateEmail = validateEmail;
const validateUrl = (url) => {
    return urlPattern.test(url);
};
exports.validateUrl = validateUrl;
const sanitizeInput = (input) => {
    return input
        .trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '');
};
exports.sanitizeInput = sanitizeInput;
const validateRating = (rating) => {
    return Number.isInteger(rating) && rating >= 1 && rating <= 5;
};
exports.validateRating = validateRating;
const validateLanguageCode = (code) => {
    return /^[a-z]{2}(-[A-Z]{2})?$/.test(code);
};
exports.validateLanguageCode = validateLanguageCode;
exports.default = exports.reviewSchemas;
//# sourceMappingURL=review.schemas.js.map