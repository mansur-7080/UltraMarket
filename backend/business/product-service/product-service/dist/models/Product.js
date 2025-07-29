"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
const tslib_1 = require("tslib");
const mongoose_1 = tslib_1.__importStar(require("mongoose"));
const ProductSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
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
        of: mongoose_1.Schema.Types.Mixed,
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
                of: mongoose_1.Schema.Types.Mixed,
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
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
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
ProductSchema.methods.updateStock = function (quantity) {
    this.stock = Math.max(0, this.stock - quantity);
    return this.save();
};
ProductSchema.methods.updateRating = function (newRating) {
    const totalRating = this.ratings.average * this.ratings.count + newRating;
    this.ratings.count += 1;
    this.ratings.average = totalRating / this.ratings.count;
    return this.save();
};
// Static methods
ProductSchema.statics.findByCategory = function (categoryId) {
    return this.find({ categoryId, isActive: true });
};
ProductSchema.statics.findFeatured = function () {
    return this.find({ isFeatured: true, isActive: true });
};
ProductSchema.statics.search = function (query) {
    return this.find({
        $text: { $search: query },
        isActive: true,
    });
};
exports.Product = mongoose_1.default.model('Product', ProductSchema);
//# sourceMappingURL=Product.js.map