import { IReview } from '../models/Review';
export interface ReviewFilters {
    productId?: string;
    userId?: string;
    rating?: number;
    verified?: boolean;
    moderationStatus?: string;
    featured?: boolean;
}
export interface ReviewOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    searchQuery?: string;
}
export interface ReviewResult {
    reviews: IReview[];
    total: number;
    page: number;
    limit: number;
    pages: number;
}
export declare class ReviewService {
    getAllReviews(filters: ReviewFilters, options: ReviewOptions): Promise<ReviewResult>;
    getReviewById(id: string): Promise<IReview | null>;
    createReview(reviewData: Partial<IReview>): Promise<IReview>;
    updateReview(id: string, updateData: Partial<IReview>): Promise<IReview>;
    deleteReview(id: string): Promise<void>;
    getProductReviews(productId: string, filters: ReviewFilters, options: ReviewOptions): Promise<ReviewResult>;
    getProductReviewStats(productId: string): Promise<any>;
    getUserReviews(userId: string, options: ReviewOptions): Promise<ReviewResult>;
    getUserReviewStats(userId: string): Promise<any>;
    searchReviews(filters: ReviewFilters, options: ReviewOptions): Promise<ReviewResult>;
    getFeaturedReviews(filters: ReviewFilters, options: ReviewOptions): Promise<IReview[]>;
    moderateReview(id: string, status: 'pending' | 'approved' | 'rejected' | 'flagged', notes?: string, moderatorId?: string): Promise<IReview>;
    getModerationQueue(status?: string, limit?: number, skip?: number): Promise<IReview[]>;
    private buildQuery;
    getReviewAnalytics(productId?: string): Promise<any>;
}
//# sourceMappingURL=review.service.d.ts.map