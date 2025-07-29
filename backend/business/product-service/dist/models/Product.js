"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const variantSchema = new mongoose_1.Schema({
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
const reviewSchema = new mongoose_1.Schema({
    userId: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, maxlength: 100 },
    comment: { type: String, required: true, maxlength: 1000 },
    verified: { type: Boolean, default: false },
    helpful: { type: Number, default: 0 },
    reported: { type: Number, default: 0 },
}, { timestamps: true });
const productSchema = new mongoose_1.Schema({
    name: { type: String, required: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 500 },
    sku: { type: String, required: true, unique: true },
    category: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategory: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Category' },
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
    relatedProducts: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Product' }],
    upsellProducts: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Product' }],
    crossSellProducts: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Product' }],
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
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
productSchema.virtual('inStock').get(function () {
    if (!this.inventory.tracked)
        return true;
    return this.inventory.quantity > 0 || this.inventory.allowBackorder;
});
productSchema.virtual('lowStock').get(function () {
    if (!this.inventory.tracked || !this.inventory.lowStockThreshold)
        return false;
    return this.inventory.quantity <= this.inventory.lowStockThreshold;
});
productSchema.pre('save', function (next) {
    if (!this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    if (this.status === 'active' && !this.publishedAt) {
        this.publishedAt = new Date();
    }
    if (this.compareAtPrice && this.compareAtPrice > this.price) {
        this.onSale = true;
    }
    else {
        this.onSale = false;
    }
    next();
});
productSchema.methods.addReview = function (review) {
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
    reviews.forEach((review) => {
        distribution[review.rating]++;
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
exports.Product = mongoose_1.default.model('Product', productSchema);
//# sourceMappingURL=Product.js.map