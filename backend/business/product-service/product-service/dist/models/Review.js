"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Review = void 0;
const tslib_1 = require("tslib");
const mongoose_1 = tslib_1.__importStar(require("mongoose"));
// Review schema
const ReviewSchema = new mongoose_1.Schema({
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
    },
    userName: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    title: {
        type: String,
        required: true,
    },
    comment: {
        type: String,
        required: true,
    },
    isVerifiedPurchase: {
        type: Boolean,
        default: false,
    },
    isApproved: {
        type: Boolean,
        default: true,
    },
    helpfulVotes: {
        type: Number,
        default: 0,
    },
    media: [
        {
            type: String,
        },
    ],
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Create compound index for user reviews on a product
ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true });
// Create the Review model
exports.Review = mongoose_1.default.models.Review || mongoose_1.default.model('Review', ReviewSchema);
//# sourceMappingURL=Review.js.map