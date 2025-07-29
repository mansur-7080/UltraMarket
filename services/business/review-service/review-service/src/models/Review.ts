import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  id: string;
  userId: string;
  productId: string;
  orderId?: string;
  rating: number;
  title: string;
  content: string;
  pros?: string[];
  cons?: string[];
  verified: boolean;
  helpful: {
    yes: number;
    no: number;
    userVotes: Map<string, 'yes' | 'no'>;
  };
  images?: string[];
  videos?: string[];
  moderationStatus: 'pending' | 'approved' | 'rejected' | 'flagged';
  moderationNotes?: string;
  tags?: string[];
  language: string;
  sentiment?: {
    score: number; // -1 to 1
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    deviceInfo?: Record<string, unknown>;
    location?: {
      country: string;
      city?: string;
    };
  };
  editHistory?: Array<{
    date: Date;
    changes: string[];
    moderatorId?: string;
  }>;
  flags: Array<{
    userId: string;
    reason: string;
    description?: string;
    createdAt: Date;
  }>;
  replies?: Array<{
    id: string;
    userId: string;
    userType: 'customer' | 'merchant' | 'admin';
    content: string;
    createdAt: Date;
    helpful: {
      yes: number;
      no: number;
    };
  }>;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    productId: {
      type: String,
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: (v: number) => Number.isInteger(v),
        message: 'Rating must be an integer between 1 and 5',
      },
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, 'Review content cannot exceed 2000 characters'],
      minlength: [10, 'Review content must be at least 10 characters'],
    },
    pros: [
      {
        type: String,
        trim: true,
        maxlength: [200, 'Pro point cannot exceed 200 characters'],
      },
    ],
    cons: [
      {
        type: String,
        trim: true,
        maxlength: [200, 'Con point cannot exceed 200 characters'],
      },
    ],
    verified: {
      type: Boolean,
      default: false,
    },
    helpful: {
      yes: {
        type: Number,
        default: 0,
        min: 0,
      },
      no: {
        type: Number,
        default: 0,
        min: 0,
      },
      userVotes: {
        type: Map,
        of: String,
        default: new Map(),
      },
    },
    images: [
      {
        type: String,
        validate: {
          validator: (v: string) => /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v),
          message: 'Invalid image URL format',
        },
      },
    ],
    videos: [
      {
        type: String,
        validate: {
          validator: (v: string) => /^https?:\/\/.+\.(mp4|avi|mov|wmv|webm)$/i.test(v),
          message: 'Invalid video URL format',
        },
      },
    ],
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged'],
      default: 'pending',
      index: true,
    },
    moderationNotes: {
      type: String,
      maxlength: [500, 'Moderation notes cannot exceed 500 characters'],
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [50, 'Tag cannot exceed 50 characters'],
      },
    ],
    language: {
      type: String,
      required: true,
      default: 'en',
      lowercase: true,
      minlength: 2,
      maxlength: 5,
    },
    sentiment: {
      score: {
        type: Number,
        min: -1,
        max: 1,
      },
      label: {
        type: String,
        enum: ['positive', 'negative', 'neutral'],
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1,
      },
    },
    metadata: {
      ipAddress: {
        type: String,
        validate: {
          validator: (v: string) =>
            !v ||
            /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(v),
          message: 'Invalid IP address format',
        },
      },
      userAgent: String,
      deviceInfo: Schema.Types.Mixed,
      location: {
        country: {
          type: String,
          uppercase: true,
          minlength: 2,
          maxlength: 2,
        },
        city: String,
      },
    },
    editHistory: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        changes: [String],
        moderatorId: String,
      },
    ],
    flags: [
      {
        userId: {
          type: String,
          required: true,
        },
        reason: {
          type: String,
          required: true,
          enum: [
            'inappropriate_language',
            'spam',
            'fake_review',
            'off_topic',
            'personal_information',
            'copyright',
            'other',
          ],
        },
        description: {
          type: String,
          maxlength: [300, 'Flag description cannot exceed 300 characters'],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    replies: [
      {
        id: {
          type: String,
          default: () => new mongoose.Types.ObjectId().toString(),
        },
        userId: {
          type: String,
          required: true,
        },
        userType: {
          type: String,
          enum: ['customer', 'merchant', 'admin'],
          required: true,
        },
        content: {
          type: String,
          required: true,
          trim: true,
          maxlength: [1000, 'Reply cannot exceed 1000 characters'],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        helpful: {
          yes: {
            type: Number,
            default: 0,
            min: 0,
          },
          no: {
            type: Number,
            default: 0,
            min: 0,
          },
        },
      },
    ],
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for optimal query performance
ReviewSchema.index({ productId: 1, rating: -1 });
ReviewSchema.index({ productId: 1, createdAt: -1 });
ReviewSchema.index({ userId: 1, createdAt: -1 });
ReviewSchema.index({ moderationStatus: 1, createdAt: -1 });
ReviewSchema.index({ verified: 1, rating: -1 });
ReviewSchema.index({ featured: 1, rating: -1 });
ReviewSchema.index({ 'helpful.yes': -1 });

// Compound indexes for complex queries
ReviewSchema.index({
  productId: 1,
  moderationStatus: 1,
  rating: -1,
  createdAt: -1,
});

// Text search index
ReviewSchema.index(
  {
    title: 'text',
    content: 'text',
    tags: 'text',
  },
  {
    weights: {
      title: 3,
      content: 2,
      tags: 1,
    },
  }
);

// Virtual for helpfulness ratio
ReviewSchema.virtual('helpfulnessRatio').get(function (this: IReview) {
  const total = this.helpful.yes + this.helpful.no;
  return total > 0 ? this.helpful.yes / total : 0;
});

// Virtual for total helpfulness votes
ReviewSchema.virtual('totalHelpfulVotes').get(function (this: IReview) {
  return this.helpful.yes + this.helpful.no;
});

// Virtual for review age in days
ReviewSchema.virtual('ageInDays').get(function (this: IReview) {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
});

// Instance methods
ReviewSchema.methods.addHelpfulVote = function (userId: string, vote: 'yes' | 'no') {
  const existingVote = this.helpful.userVotes.get(userId);

  if (existingVote) {
    // Remove previous vote
    if (existingVote === 'yes') {
      this.helpful.yes = Math.max(0, this.helpful.yes - 1);
    } else {
      this.helpful.no = Math.max(0, this.helpful.no - 1);
    }
  }

  // Add new vote
  if (vote === 'yes') {
    this.helpful.yes += 1;
  } else {
    this.helpful.no += 1;
  }

  this.helpful.userVotes.set(userId, vote);
  return this.save();
};

ReviewSchema.methods.removeHelpfulVote = function (userId: string) {
  const existingVote = this.helpful.userVotes.get(userId);

  if (existingVote) {
    if (existingVote === 'yes') {
      this.helpful.yes = Math.max(0, this.helpful.yes - 1);
    } else {
      this.helpful.no = Math.max(0, this.helpful.no - 1);
    }

    this.helpful.userVotes.delete(userId);
    return this.save();
  }

  return Promise.resolve(this);
};

ReviewSchema.methods.addFlag = function (userId: string, reason: string, description?: string) {
  // Check if user already flagged this review
  const existingFlag = this.flags.find((flag) => flag.userId === userId);
  if (existingFlag) {
    throw new Error('User has already flagged this review');
  }

  this.flags.push({
    userId,
    reason,
    description,
    createdAt: new Date(),
  });

  // Auto-flag for moderation if too many flags
  if (this.flags.length >= 3 && this.moderationStatus === 'approved') {
    this.moderationStatus = 'flagged';
  }

  return this.save();
};

ReviewSchema.methods.addReply = function (
  userId: string,
  userType: 'customer' | 'merchant' | 'admin',
  content: string
) {
  const reply = {
    id: new mongoose.Types.ObjectId().toString(),
    userId,
    userType,
    content: content.trim(),
    createdAt: new Date(),
    helpful: { yes: 0, no: 0 },
  };

  this.replies = this.replies || [];
  this.replies.push(reply);

  return this.save();
};

ReviewSchema.methods.updateModerationStatus = function (
  status: 'pending' | 'approved' | 'rejected' | 'flagged',
  notes?: string,
  moderatorId?: string
) {
  const oldStatus = this.moderationStatus;
  this.moderationStatus = status;
  this.moderationNotes = notes;

  // Add to edit history
  this.editHistory = this.editHistory || [];
  this.editHistory.push({
    date: new Date(),
    changes: [`Moderation status changed from ${oldStatus} to ${status}`],
    moderatorId,
  });

  return this.save();
};

// Static methods
ReviewSchema.statics.getProductStats = function (productId: string) {
  return this.aggregate([
    {
      $match: {
        productId,
        moderationStatus: 'approved',
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating',
        },
        verifiedReviews: {
          $sum: { $cond: ['$verified', 1, 0] },
        },
        totalHelpfulVotes: {
          $sum: { $add: ['$helpful.yes', '$helpful.no'] },
        },
      },
    },
    {
      $addFields: {
        verificationRate: {
          $divide: ['$verifiedReviews', '$totalReviews'],
        },
        ratingBreakdown: {
          $reduce: {
            input: [1, 2, 3, 4, 5],
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $arrayToObject: [
                    [
                      {
                        k: { $toString: '$$this' },
                        v: {
                          $size: {
                            $filter: {
                              input: '$ratingDistribution',
                              cond: { $eq: ['$$item', '$$this'] },
                            },
                          },
                        },
                      },
                    ],
                  ],
                },
              ],
            },
          },
        },
      },
    },
  ]);
};

ReviewSchema.statics.getUserReviewStats = function (userId: string) {
  return this.aggregate([
    {
      $match: { userId },
    },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        verifiedReviews: {
          $sum: { $cond: ['$verified', 1, 0] },
        },
        helpfulVotes: {
          $sum: '$helpful.yes',
        },
        approvedReviews: {
          $sum: { $cond: [{ $eq: ['$moderationStatus', 'approved'] }, 1, 0] },
        },
      },
    },
  ]);
};

ReviewSchema.statics.getModerationQueue = function (
  status: string = 'pending',
  limit: number = 50,
  skip: number = 0
) {
  return this.find({ moderationStatus: status })
    .sort({ createdAt: 1 })
    .limit(limit)
    .skip(skip)
    .populate('user', 'name email')
    .populate('product', 'name images');
};

// Pre-save middleware
ReviewSchema.pre('save', function (this: IReview, next) {
  // Auto-approve reviews from verified purchases
  if (this.isNew && this.orderId && this.moderationStatus === 'pending') {
    // Logic to verify if order exists and is completed
    // This would typically call an order service
    this.verified = true;
  }

  // Sanitize content
  this.content = this.content?.trim();
  this.title = this.title?.trim();

  // Auto-detect language if not set
  if (!this.language) {
    this.language = 'en'; // Default, could use language detection library
  }

  next();
});

// Pre-remove middleware
ReviewSchema.pre('deleteOne', { document: true, query: false }, function (next) {
  // Could trigger events or cleanup related data
  next();
});

export const Review = mongoose.model<IReview>('Review', ReviewSchema);
