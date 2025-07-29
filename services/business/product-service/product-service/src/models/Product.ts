import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  shortDescription: string;
  sku: string;
  categoryId: mongoose.Types.ObjectId;
  brand: string;
  price: number;
  compareAtPrice?: number;
  cost?: number;
  currency: string;
  images: string[];
  thumbnail: string;
  tags: string[];
  attributes: {
    [key: string]: string | number | boolean;
  };
  variants: {
    id: string;
    name: string;
    sku: string;
    price: number;
    comparePrice?: number;
    stock: number;
    attributes: {
      [key: string]: string | number | boolean;
    };
  }[];
  stock: number;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  isActive: boolean;
  isFeatured: boolean;
  isDigital: boolean;
  requiresShipping: boolean;
  taxRate: number;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  ratings: {
    average: number;
    count: number;
  };
  sales: {
    total: number;
    lastMonth: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    shortDescription: {
      type: String,
      required: true,
      maxlength: 500,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    compareAtPrice: {
      type: Number,
      min: 0,
    },
    cost: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      enum: ['USD', 'EUR', 'UZS'],
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    thumbnail: {
      type: String,
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    attributes: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
    variants: [
      {
        id: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        sku: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        comparePrice: {
          type: Number,
          min: 0,
        },
        stock: {
          type: Number,
          required: true,
          min: 0,
          default: 0,
        },
        attributes: {
          type: Map,
          of: Schema.Types.Mixed,
          default: {},
        },
      },
    ],
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    weight: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    dimensions: {
      length: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      width: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      height: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isDigital: {
      type: Boolean,
      default: false,
    },
    requiresShipping: {
      type: Boolean,
      default: true,
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    seo: {
      title: {
        type: String,
        maxlength: 60,
      },
      description: {
        type: String,
        maxlength: 160,
      },
      keywords: [
        {
          type: String,
          trim: true,
        },
      ],
    },
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    sales: {
      total: {
        type: Number,
        default: 0,
        min: 0,
      },
      lastMonth: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ isFeatured: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ 'ratings.average': -1 });
ProductSchema.index({ 'sales.total': -1 });
ProductSchema.index({ createdAt: -1 });

// Virtual for category
ProductSchema.virtual('category', {
  ref: 'Category',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true,
});

// Pre-save middleware
ProductSchema.pre('save', function (next) {
  // Auto-generate SKU if not provided
  if (!this.sku) {
    this.sku = `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Set default SEO title if not provided
  if (!this.seo?.title) {
    this.seo = this.seo || {};
    this.seo.title = this.name;
  }

  next();
});

// Instance methods
ProductSchema.methods.updateStock = function (quantity: number) {
  this.stock = Math.max(0, this.stock - quantity);
  return this.save();
};

ProductSchema.methods.updateRating = function (newRating: number) {
  const totalRating = this.ratings.average * this.ratings.count + newRating;
  this.ratings.count += 1;
  this.ratings.average = totalRating / this.ratings.count;
  return this.save();
};

// Static methods
ProductSchema.statics.findByCategory = function (categoryId: string) {
  return this.find({ categoryId, isActive: true });
};

ProductSchema.statics.findFeatured = function () {
  return this.find({ isFeatured: true, isActive: true });
};

ProductSchema.statics.search = function (query: string) {
  return this.find({
    $text: { $search: query },
    isActive: true,
  });
};

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
