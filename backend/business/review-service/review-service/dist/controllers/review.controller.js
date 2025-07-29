"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewController = void 0;
const Review_1 = require("../models/Review");
const logger_1 = require("../utils/logger");
const review_service_1 = require("../services/review.service");
class ReviewController {
    reviewService;
    constructor() {
        this.reviewService = new review_service_1.ReviewService();
    }
    getAllReviews = async (req, res) => {
        try {
            const { page = 1, limit = 20, productId, userId, rating, verified, moderationStatus, sortBy = 'createdAt', sortOrder = 'desc', } = req.query;
            const filters = {};
            if (productId)
                filters.productId = productId;
            if (userId)
                filters.userId = userId;
            if (rating)
                filters.rating = parseInt(rating);
            if (verified !== undefined)
                filters.verified = verified === 'true';
            if (moderationStatus)
                filters.moderationStatus = moderationStatus;
            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                sortBy: sortBy,
                sortOrder: sortOrder,
            };
            const result = await this.reviewService.getAllReviews(filters, options);
            res.status(200).json({
                success: true,
                data: result.reviews,
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    pages: result.pages,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting all reviews:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get reviews',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };
    getReviewById = async (req, res) => {
        try {
            const { id } = req.params;
            const review = await this.reviewService.getReviewById(id);
            if (!review) {
                res.status(404).json({
                    success: false,
                    message: 'Review not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: review,
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting review by ID:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get review',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };
    createReview = async (req, res) => {
        try {
            const userId = req.user.id;
            const reviewData = { ...req.body, userId };
            const existingReview = await Review_1.Review.findOne({
                userId,
                productId: reviewData.productId,
            });
            if (existingReview) {
                res.status(409).json({
                    success: false,
                    message: 'You have already reviewed this product',
                });
                return;
            }
            const review = await this.reviewService.createReview(reviewData);
            res.status(201).json({
                success: true,
                data: review,
                message: 'Review created successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Error creating review:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create review',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };
    updateReview = async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const updateData = req.body;
            const review = await Review_1.Review.findById(id);
            if (!review) {
                res.status(404).json({
                    success: false,
                    message: 'Review not found',
                });
                return;
            }
            if (review.userId !== userId) {
                res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this review',
                });
                return;
            }
            const updatedReview = await this.reviewService.updateReview(id, updateData);
            res.status(200).json({
                success: true,
                data: updatedReview,
                message: 'Review updated successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Error updating review:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update review',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };
    deleteReview = async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const review = await Review_1.Review.findById(id);
            if (!review) {
                res.status(404).json({
                    success: false,
                    message: 'Review not found',
                });
                return;
            }
            if (review.userId !== userId) {
                res.status(403).json({
                    success: false,
                    message: 'Not authorized to delete this review',
                });
                return;
            }
            await this.reviewService.deleteReview(id);
            res.status(200).json({
                success: true,
                message: 'Review deleted successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Error deleting review:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete review',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };
    getProductReviews = async (req, res) => {
        try {
            const { productId } = req.params;
            const { page = 1, limit = 20, rating, verified, sortBy = 'helpful', sortOrder = 'desc', } = req.query;
            const filters = { productId, moderationStatus: 'approved' };
            if (rating)
                filters.rating = parseInt(rating);
            if (verified !== undefined)
                filters.verified = verified === 'true';
            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                sortBy: sortBy,
                sortOrder: sortOrder,
            };
            const result = await this.reviewService.getProductReviews(productId, filters, options);
            res.status(200).json({
                success: true,
                data: result.reviews,
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    pages: result.pages,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting product reviews:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get product reviews',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };
    getProductReviewStats = async (req, res) => {
        try {
            const { productId } = req.params;
            const stats = await this.reviewService.getProductReviewStats(productId);
            res.status(200).json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting product review stats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get product review statistics',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };
    getUserReviews = async (req, res) => {
        try {
            const { userId } = req.params;
            const currentUserId = req.user.id;
            if (userId !== currentUserId && req.user.role !== 'admin') {
                res.status(403).json({
                    success: false,
                    message: 'Not authorized to view these reviews',
                });
                return;
            }
            const { page = 1, limit = 20 } = req.query;
            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
            };
            const result = await this.reviewService.getUserReviews(userId, options);
            res.status(200).json({
                success: true,
                data: result.reviews,
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    pages: result.pages,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting user reviews:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get user reviews',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };
    getUserReviewStats = async (req, res) => {
        try {
            const { userId } = req.params;
            const currentUserId = req.user.id;
            if (userId !== currentUserId && req.user.role !== 'admin') {
                res.status(403).json({
                    success: false,
                    message: 'Not authorized to view these statistics',
                });
                return;
            }
            const stats = await this.reviewService.getUserReviewStats(userId);
            res.status(200).json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting user review stats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get user review statistics',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };
    voteHelpful = async (req, res) => {
        try {
            const { id } = req.params;
            const { vote } = req.body;
            const userId = req.user.id;
            const review = await Review_1.Review.findById(id);
            if (!review) {
                res.status(404).json({
                    success: false,
                    message: 'Review not found',
                });
                return;
            }
            await review.addHelpfulVote(userId, vote);
            res.status(200).json({
                success: true,
                message: 'Vote recorded successfully',
                data: {
                    helpful: review.helpful,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error voting on review:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to record vote',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };
    removeHelpfulVote = async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const review = await Review_1.Review.findById(id);
            if (!review) {
                res.status(404).json({
                    success: false,
                    message: 'Review not found',
                });
                return;
            }
            await review.removeHelpfulVote(userId);
            res.status(200).json({
                success: true,
                message: 'Vote removed successfully',
                data: {
                    helpful: review.helpful,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error removing vote:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to remove vote',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };
    flagReview = async (req, res) => {
        try {
            const { id } = req.params;
            const { reason, description } = req.body;
            const userId = req.user.id;
            const review = await Review_1.Review.findById(id);
            if (!review) {
                res.status(404).json({
                    success: false,
                    message: 'Review not found',
                });
                return;
            }
            try {
                await review.addFlag(userId, reason, description);
                res.status(200).json({
                    success: true,
                    message: 'Review flagged successfully',
                });
            }
            catch (error) {
                if (error instanceof Error && error.message.includes('already flagged')) {
                    res.status(409).json({
                        success: false,
                        message: 'You have already flagged this review',
                    });
                    return;
                }
                throw error;
            }
        }
        catch (error) {
            logger_1.logger.error('Error flagging review:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to flag review',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };
    addReply = async (req, res) => {
        try {
            const { id } = req.params;
            const { content, userType } = req.body;
            const userId = req.user.id;
            const review = await Review_1.Review.findById(id);
            if (!review) {
                res.status(404).json({
                    success: false,
                    message: 'Review not found',
                });
                return;
            }
            await review.addReply(userId, userType, content);
            res.status(201).json({
                success: true,
                message: 'Reply added successfully',
                data: review.replies,
            });
        }
        catch (error) {
            logger_1.logger.error('Error adding reply:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add reply',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };
    searchReviews = async (req, res) => {
        try {
            const { q, productId, rating, page = 1, limit = 20 } = req.query;
            if (!q) {
                res.status(400).json({
                    success: false,
                    message: 'Search query is required',
                });
                return;
            }
            const filters = { moderationStatus: 'approved' };
            if (productId)
                filters.productId = productId;
            if (rating)
                filters.rating = parseInt(rating);
            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                searchQuery: q,
            };
            const result = await this.reviewService.searchReviews(filters, options);
            res.status(200).json({
                success: true,
                data: result.reviews,
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    pages: result.pages,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error searching reviews:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to search reviews',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };
    getFeaturedReviews = async (req, res) => {
        try {
            const { productId, limit = 10 } = req.query;
            const filters = {
                featured: true,
                moderationStatus: 'approved',
            };
            if (productId)
                filters.productId = productId;
            const options = {
                limit: parseInt(limit),
            };
            const reviews = await this.reviewService.getFeaturedReviews(filters, options);
            res.status(200).json({
                success: true,
                data: reviews,
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting featured reviews:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get featured reviews',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };
}
exports.ReviewController = ReviewController;
//# sourceMappingURL=review.controller.js.map