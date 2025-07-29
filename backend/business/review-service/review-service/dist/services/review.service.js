"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
const Review_1 = require("../models/Review");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class ReviewService {
    async getAllReviews(filters, options) {
        try {
            const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
            const skip = (page - 1) * limit;
            const query = this.buildQuery(filters);
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
            const [reviews, total] = await Promise.all([
                Review_1.Review.find(query).sort(sort).skip(skip).limit(limit).exec(),
                Review_1.Review.countDocuments(query),
            ]);
            const pages = Math.ceil(total / limit);
            logger_1.logger.info(`Retrieved ${reviews.length} reviews`, {
                filters,
                options,
                total,
                pages,
            });
            return {
                reviews,
                total,
                page,
                limit,
                pages,
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting all reviews:', error);
            throw (0, errors_1.handleDatabaseError)(error);
        }
    }
    async getReviewById(id) {
        try {
            const review = await Review_1.Review.findById(id).exec();
            if (review) {
                logger_1.logger.info(`Retrieved review ${id}`);
            }
            else {
                logger_1.logger.warn(`Review ${id} not found`);
            }
            return review;
        }
        catch (error) {
            logger_1.logger.error(`Error getting review ${id}:`, error);
            throw (0, errors_1.handleDatabaseError)(error);
        }
    }
    async createReview(reviewData) {
        try {
            if (reviewData.userId && reviewData.productId) {
                const existingReview = await Review_1.Review.findOne({
                    userId: reviewData.userId,
                    productId: reviewData.productId,
                });
                if (existingReview) {
                    throw new errors_1.ReviewAlreadyExistsError();
                }
            }
            const review = new Review_1.Review(reviewData);
            const savedReview = await review.save();
            logger_1.logger.info(`Created new review ${savedReview.id}`, {
                userId: reviewData.userId,
                productId: reviewData.productId,
                rating: reviewData.rating,
            });
            return savedReview;
        }
        catch (error) {
            logger_1.logger.error('Error creating review:', error);
            if (error instanceof errors_1.ReviewAlreadyExistsError) {
                throw error;
            }
            throw (0, errors_1.handleDatabaseError)(error);
        }
    }
    async updateReview(id, updateData) {
        try {
            const review = await Review_1.Review.findById(id);
            if (!review) {
                throw new errors_1.ReviewNotFoundError();
            }
            Object.assign(review, updateData);
            const updatedReview = await review.save();
            logger_1.logger.info(`Updated review ${id}`, {
                updatedFields: Object.keys(updateData),
            });
            return updatedReview;
        }
        catch (error) {
            logger_1.logger.error(`Error updating review ${id}:`, error);
            if (error instanceof errors_1.ReviewNotFoundError) {
                throw error;
            }
            throw (0, errors_1.handleDatabaseError)(error);
        }
    }
    async deleteReview(id) {
        try {
            const review = await Review_1.Review.findById(id);
            if (!review) {
                throw new errors_1.ReviewNotFoundError();
            }
            await Review_1.Review.findByIdAndDelete(id);
            logger_1.logger.info(`Deleted review ${id}`);
        }
        catch (error) {
            logger_1.logger.error(`Error deleting review ${id}:`, error);
            if (error instanceof errors_1.ReviewNotFoundError) {
                throw error;
            }
            throw (0, errors_1.handleDatabaseError)(error);
        }
    }
    async getProductReviews(productId, filters, options) {
        try {
            const productFilters = { ...filters, productId };
            return await this.getAllReviews(productFilters, options);
        }
        catch (error) {
            logger_1.logger.error(`Error getting product reviews for ${productId}:`, error);
            throw error;
        }
    }
    async getProductReviewStats(productId) {
        try {
            const stats = await Review_1.Review.getProductStats(productId);
            logger_1.logger.info(`Retrieved product review stats for ${productId}`);
            return (stats[0] || {
                averageRating: 0,
                totalReviews: 0,
                verifiedReviews: 0,
                verificationRate: 0,
                ratingBreakdown: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
            });
        }
        catch (error) {
            logger_1.logger.error(`Error getting product review stats for ${productId}:`, error);
            throw (0, errors_1.handleDatabaseError)(error);
        }
    }
    async getUserReviews(userId, options) {
        try {
            const filters = { userId };
            return await this.getAllReviews(filters, options);
        }
        catch (error) {
            logger_1.logger.error(`Error getting user reviews for ${userId}:`, error);
            throw error;
        }
    }
    async getUserReviewStats(userId) {
        try {
            const stats = await Review_1.Review.getUserReviewStats(userId);
            logger_1.logger.info(`Retrieved user review stats for ${userId}`);
            return (stats[0] || {
                totalReviews: 0,
                averageRating: 0,
                verifiedReviews: 0,
                helpfulVotes: 0,
                approvedReviews: 0,
            });
        }
        catch (error) {
            logger_1.logger.error(`Error getting user review stats for ${userId}:`, error);
            throw (0, errors_1.handleDatabaseError)(error);
        }
    }
    async searchReviews(filters, options) {
        try {
            const { searchQuery, ...paginationOptions } = options;
            if (!searchQuery) {
                throw new errors_1.ReviewError('Search query is required');
            }
            const query = {
                ...this.buildQuery(filters),
                $text: { $search: searchQuery },
            };
            const { page = 1, limit = 20 } = paginationOptions;
            const skip = (page - 1) * limit;
            const [reviews, total] = await Promise.all([
                Review_1.Review.find(query, { score: { $meta: 'textScore' } })
                    .sort({ score: { $meta: 'textScore' } })
                    .skip(skip)
                    .limit(limit)
                    .exec(),
                Review_1.Review.countDocuments(query),
            ]);
            const pages = Math.ceil(total / limit);
            logger_1.logger.info(`Search found ${reviews.length} reviews`, {
                searchQuery,
                filters,
                total,
            });
            return {
                reviews,
                total,
                page,
                limit,
                pages,
            };
        }
        catch (error) {
            logger_1.logger.error('Error searching reviews:', error);
            throw (0, errors_1.handleDatabaseError)(error);
        }
    }
    async getFeaturedReviews(filters, options) {
        try {
            const { limit = 10 } = options;
            const featuredFilters = { ...filters, featured: true };
            const query = this.buildQuery(featuredFilters);
            const reviews = await Review_1.Review.find(query)
                .sort({ 'helpful.yes': -1, createdAt: -1 })
                .limit(limit)
                .exec();
            logger_1.logger.info(`Retrieved ${reviews.length} featured reviews`);
            return reviews;
        }
        catch (error) {
            logger_1.logger.error('Error getting featured reviews:', error);
            throw (0, errors_1.handleDatabaseError)(error);
        }
    }
    async moderateReview(id, status, notes, moderatorId) {
        try {
            const review = await Review_1.Review.findById(id);
            if (!review) {
                throw new errors_1.ReviewNotFoundError();
            }
            await review.updateModerationStatus(status, notes, moderatorId);
            logger_1.logger.info(`Moderated review ${id}`, {
                status,
                moderatorId,
                notes,
            });
            return review;
        }
        catch (error) {
            logger_1.logger.error(`Error moderating review ${id}:`, error);
            if (error instanceof errors_1.ReviewNotFoundError) {
                throw error;
            }
            throw (0, errors_1.handleDatabaseError)(error);
        }
    }
    async getModerationQueue(status = 'pending', limit = 50, skip = 0) {
        try {
            const reviews = await Review_1.Review.getModerationQueue(status, limit, skip);
            logger_1.logger.info(`Retrieved ${reviews.length} reviews for moderation`, {
                status,
                limit,
                skip,
            });
            return reviews;
        }
        catch (error) {
            logger_1.logger.error('Error getting moderation queue:', error);
            throw (0, errors_1.handleDatabaseError)(error);
        }
    }
    buildQuery(filters) {
        const query = {};
        if (filters.productId) {
            query.productId = filters.productId;
        }
        if (filters.userId) {
            query.userId = filters.userId;
        }
        if (filters.rating) {
            query.rating = filters.rating;
        }
        if (filters.verified !== undefined) {
            query.verified = filters.verified;
        }
        if (filters.moderationStatus) {
            query.moderationStatus = filters.moderationStatus;
        }
        if (filters.featured !== undefined) {
            query.featured = filters.featured;
        }
        return query;
    }
    async getReviewAnalytics(productId) {
        try {
            const matchStage = { moderationStatus: 'approved' };
            if (productId) {
                matchStage.productId = productId;
            }
            const analytics = await Review_1.Review.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        totalReviews: { $sum: 1 },
                        averageRating: { $avg: '$rating' },
                        verifiedReviews: { $sum: { $cond: ['$verified', 1, 0] } },
                        totalHelpfulVotes: { $sum: { $add: ['$helpful.yes', '$helpful.no'] } },
                        ratingDistribution: {
                            $push: '$rating',
                        },
                    },
                },
                {
                    $addFields: {
                        verificationRate: { $divide: ['$verifiedReviews', '$totalReviews'] },
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
            logger_1.logger.info('Retrieved review analytics', { productId });
            return (analytics[0] || {
                totalReviews: 0,
                averageRating: 0,
                verifiedReviews: 0,
                verificationRate: 0,
                totalHelpfulVotes: 0,
                ratingBreakdown: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting review analytics:', error);
            throw (0, errors_1.handleDatabaseError)(error);
        }
    }
}
exports.ReviewService = ReviewService;
//# sourceMappingURL=review.service.js.map