import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: mongoose.Types.ObjectId;
  parent?: ICategory;
  children?: ICategory[];
  level: number;
  sortOrder: number;
  productCount: number;
  isActive: boolean;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    image: {
      type: String,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
    level: {
      type: Number,
      default: 0,
      min: 0,
    },
    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
    productCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
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
        },
      ],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ parentId: 1 });
categorySchema.index({ level: 1 });
categorySchema.index({ sortOrder: 1 });
categorySchema.index({ isActive: 1 });

// Virtual for parent
categorySchema.virtual('parent', {
  ref: 'Category',
  localField: 'parentId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for children
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentId',
});

// Pre-save middleware
categorySchema.pre('save', function (next) {
  // Auto-generate slug if not provided
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // Calculate level based on parent
  if (this.parentId) {
    Category.findById(this.parentId).then((parent) => {
      if (parent) {
        this.level = parent.level + 1;
      }
    });
  } else {
    this.level = 0;
  }

  next();
});

// Static methods
categorySchema.statics.findBySlug = function (slug: string) {
  return this.findOne({ slug, isActive: true });
};

categorySchema.statics.findRootCategories = function () {
  return this.find({ parentId: null, isActive: true }).sort({ sortOrder: 1, name: 1 });
};

categorySchema.statics.findChildren = function (parentId: string) {
  return this.find({ parentId, isActive: true }).sort({ sortOrder: 1, name: 1 });
};

categorySchema.statics.getCategoryTree = async function () {
  const categories = await this.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });

  const categoryMap = new Map();
  const rootCategories: any[] = [];

  // First pass: create map of all categories
  categories.forEach((category: any) => {
    categoryMap.set(category._id.toString(), {
      ...category.toObject(),
      children: [],
    });
  });

  // Second pass: build tree structure
  categories.forEach((category: any) => {
    const categoryObj = categoryMap.get(category._id.toString());

    if (category.parentId) {
      const parent = categoryMap.get(category.parentId.toString());
      if (parent) {
        parent.children.push(categoryObj);
      }
    } else {
      rootCategories.push(categoryObj);
    }
  });

  return rootCategories;
};

// Instance methods
categorySchema.methods.updateProductCount = async function () {
  const Product = mongoose.model('Product');
  const count = await Product.countDocuments({ category: this._id, status: 'active' });
  this.productCount = count;
  return this.save();
};

categorySchema.methods.getAncestors = async function () {
  const ancestors = [];
  let current = this;

  while (current.parentId) {
    const parent = await Category.findById(current.parentId);
    if (parent) {
      ancestors.unshift(parent);
      current = parent;
    } else {
      break;
    }
  }

  return ancestors;
};

categorySchema.methods.getDescendants = async function () {
  const descendants = [];
  const queue = [this._id];

  while (queue.length > 0) {
    const currentId = queue.shift();
    const children = await Category.find({ parentId: currentId, isActive: true });

    children.forEach((child: any) => {
      descendants.push(child);
      queue.push(child._id);
    });
  }

  return descendants;
};

export const Category = mongoose.model<ICategory>('Category', categorySchema);
