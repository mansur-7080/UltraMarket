import mongoose, { Document, Schema } from 'mongoose';

// Interfaces
export interface IProductVariant {
  sku: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  cost?: number;
  inventory: {
    quantity: number;
    tracked: boolean;
    allowBackorder: boolean;
    lowStockThreshold?: number;
  };
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  attributes: Record<string, string>; // size: "M", color: "Red"
  images: string[];
  isActive: boolean;
}

export interface IProductReview {
  userId: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  helpful: number;
  reported: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProduct extends Document {
  // Basic Information
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  sku: string;

  // Categorization
  category: mongoose.Types.ObjectId;
  subcategory?: mongoose.Types.ObjectId;
  brand?: string;
  tags: string[];

  // Pricing
  price: number;
  compareAtPrice?: number;
  cost?: number;
  currency: string;
  taxable: boolean;

  // Inventory
  inventory: {
    quantity: number;
    tracked: boolean;
    allowBackorder: boolean;
    lowStockThreshold?: number;
  };

  // Physical properties
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };

  // Media
  images: string[];
  videos?: string[];

  // Variants
  hasVariants: boolean;
  variants: IProductVariant[];
  options: Array<{
    name: string;
    values: string[];
  }>;

  // SEO
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
  };

  // Status
  status: 'draft' | 'active' | 'archived';
  publishedAt?: Date;

  // Vendor
  vendorId?: string;
  vendor?: {
    name: string;
    email: string;
  };

  // Reviews and ratings
  reviews: IProductReview[];
  rating: {
    average: number;
    count: number;
    distribution: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  };

  // Analytics
  analytics: {
    views: number;
    purchases: number;
    addedToCart: number;
    wishlisted: number;
  };

  // Features
  featured: boolean;
  trending: boolean;
  newArrival: boolean;
  onSale: boolean;

  // Shipping
  shipping: {
    required: boolean;
    weight?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
    freeShipping: boolean;
    shippingClass?: string;
  };

  // Related products
  relatedProducts: mongoose.Types.ObjectId[];
  upsellProducts: mongoose.Types.ObjectId[];
  crossSellProducts: mongoose.Types.ObjectId[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Variant Schema
const variantSchema = new Schema<IProductVariant>({
  sku: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  cost: { type: Number, min: 0 },
  inventory: {
    quantity: { type: Number, required: true, min: 0 },
    tracked: { type: Boolean, default: true },
    allowBackorder: { type: Boolean, default: false },
    lowStockThreshold: { type: Number, min: 0 },
  },
  weight: { type: Number, min: 0 },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
  },
  attributes: { type: Map, of: String },
  images: [{ type: String }],
  isActive: { type: Boolean, default: true },
});

// Review Schema
const reviewSchema = new Schema<IProductReview>(
  {
    userId: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, maxlength: 100 },
    comment: { type: String, required: true, maxlength: 1000 },
    verified: { type: Boolean, default: false },
    helpful: { type: Number, default: 0 },
    reported: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Main Product Schema
const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 500 },
    sku: { type: String, required: true, unique: true },

    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategory: { type: Schema.Types.ObjectId, ref: 'Category' },
    brand: { type: String },
    tags: [{ type: String }],

    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    cost: { type: Number, min: 0 },
    currency: { type: String, default: 'USD' },
    taxable: { type: Boolean, default: true },

    inventory: {
      quantity: { type: Number, required: true, min: 0 },
      tracked: { type: Boolean, default: true },
      allowBackorder: { type: Boolean, default: false },
      lowStockThreshold: { type: Number, min: 0 },
    },

    weight: { type: Number, min: 0 },
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
      unit: { type: String, default: 'cm' },
    },

    images: [{ type: String }],
    videos: [{ type: String }],

    hasVariants: { type: Boolean, default: false },
    variants: [variantSchema],
    options: [
      {
        name: { type: String, required: true },
        values: [{ type: String }],
      },
    ],

    seo: {
      title: { type: String },
      description: { type: String },
      keywords: [{ type: String }],
    },

    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'draft',
    },
    publishedAt: { type: Date },

    vendorId: { type: String },
    vendor: {
      name: { type: String },
      email: { type: String },
    },

    reviews: [reviewSchema],
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
      distribution: {
        1: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        5: { type: Number, default: 0 },
      },
    },

    analytics: {
      views: { type: Number, default: 0 },
      purchases: { type: Number, default: 0 },
      addedToCart: { type: Number, default: 0 },
      wishlisted: { type: Number, default: 0 },
    },

    featured: { type: Boolean, default: false },
    trending: { type: Boolean, default: false },
    newArrival: { type: Boolean, default: false },
    onSale: { type: Boolean, default: false },

    shipping: {
      required: { type: Boolean, default: true },
      weight: { type: Number, min: 0 },
      dimensions: {
        length: { type: Number, min: 0 },
        width: { type: Number, min: 0 },
        height: { type: Number, min: 0 },
      },
      freeShipping: { type: Boolean, default: false },
      shippingClass: { type: String },
    },

    relatedProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    upsellProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    crossSellProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'rating.average': -1 });
productSchema.index({ featured: 1, status: 1 });
productSchema.index({ trending: 1, status: 1 });
productSchema.index({ newArrival: 1, status: 1 });
productSchema.index({ onSale: 1, status: 1 });
productSchema.index({ vendorId: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ updatedAt: -1 });

// Virtual for in stock status
productSchema.virtual('inStock').get(function () {
  if (!this.inventory.tracked) return true;
  return this.inventory.quantity > 0 || this.inventory.allowBackorder;
});

// Virtual for low stock status
productSchema.virtual('lowStock').get(function () {
  if (!this.inventory.tracked || !this.inventory.lowStockThreshold) return false;
  return this.inventory.quantity <= this.inventory.lowStockThreshold;
});

// Pre-save middleware
productSchema.pre('save', function (next) {
  // Auto-generate slug if not provided
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // Set published date when status changes to active
  if (this.status === 'active' && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  // Update onSale status based on compareAtPrice
  if (this.compareAtPrice && this.compareAtPrice > this.price) {
    this.onSale = true;
  } else {
    this.onSale = false;
  }

  next();
});

// Methods
productSchema.methods.addReview = function (
  review: Omit<IProductReview, 'createdAt' | 'updatedAt'>
) {
  this.reviews.push(review);
  this.updateRating();
  return this.save();
};

productSchema.methods.updateRating = function () {
  const reviews = this.reviews;
  const count = reviews.length;

  if (count === 0) {
    this.rating = {
      average: 0,
      count: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
    return;
  }

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;

  reviews.forEach((review: IProductReview) => {
    distribution[review.rating as keyof typeof distribution]++;
    total += review.rating;
  });

  this.rating = {
    average: Number((total / count).toFixed(2)),
    count,
    distribution,
  };
};

productSchema.methods.incrementView = function () {
  this.analytics.views++;
  return this.save();
};

productSchema.methods.incrementPurchase = function () {
  this.analytics.purchases++;
  return this.save();
};

productSchema.methods.incrementCartAdd = function () {
  this.analytics.addedToCart++;
  return this.save();
};

productSchema.methods.incrementWishlist = function () {
  this.analytics.wishlisted++;
  return this.save();
};

export const Product = mongoose.model<IProduct>('Product', productSchema);
