import mongoose, { Document, Model } from 'mongoose';
export interface IReview extends Document {
    productId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    userName: string;
    rating: number;
    title: string;
    comment: string;
    isVerifiedPurchase: boolean;
    isApproved: boolean;
    helpfulVotes: number;
    media?: string[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const Review: Model<IReview>;
//# sourceMappingURL=Review.d.ts.map