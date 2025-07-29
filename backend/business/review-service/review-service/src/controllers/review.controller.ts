import { Request, Response } from 'express';
import { Review, IReview } from '../models/Review';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/errors';
import { ReviewService } from '../services/review.service';

export class ReviewController {
  private reviewService: ReviewService;

  constructor() {
    this.reviewService = new ReviewService();
  }

  /**
   * Get all reviews with filters and pagination
   */
  public getAllReviews = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        page = 1,
        limit = 20,
        productId,
        userId,
        rating,
        verified,
        moderationStatus,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const filters: any = {};
      if (productId) filters.productId = productId;
      if (userId) filters.userId = userId;
      if (rating) filters.rating = parseInt(rating as string);
      if (verified !== undefined) filters.verified = verified === 'true';
      if (moderationStatus) filters.moderationStatus = moderationStatus;

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
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
    } catch (error) {
      logger.error('Error getting all reviews:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get reviews',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get review by ID
   */
  public getReviewById = async (req: Request, res: Response): Promise<void> => {
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
    } catch (error) {
      logger.error('Error getting review by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get review',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Create a new review
   */
  public createReview = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const reviewData = { ...req.body, userId };

      // Check if user already reviewed this product
      const existingReview = await Review.findOne({
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
    } catch (error) {
      logger.error('Error creating review:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create review',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Update a review
   */
  public updateReview = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const updateData = req.body;

      const review = await Review.findById(id);
      if (!review) {
        res.status(404).json({
          success: false,
          message: 'Review not found',
        });
        return;
      }

      // Check if user owns the review
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
    } catch (error) {
      logger.error('Error updating review:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update review',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Delete a review
   */
  public deleteReview = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const review = await Review.findById(id);
      if (!review) {
        res.status(404).json({
          success: false,
          message: 'Review not found',
        });
        return;
      }

      // Check if user owns the review
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
    } catch (error) {
      logger.error('Error deleting review:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete review',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get reviews for a specific product
   */
  public getProductReviews = async (req: Request, res: Response): Promise<void> => {
    try {
      const { productId } = req.params;
      const {
        page = 1,
        limit = 20,
        rating,
        verified,
        sortBy = 'helpful',
        sortOrder = 'desc',
      } = req.query;

      const filters: any = { productId, moderationStatus: 'approved' };
      if (rating) filters.rating = parseInt(rating as string);
      if (verified !== undefined) filters.verified = verified === 'true';

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
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
    } catch (error) {
      logger.error('Error getting product reviews:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get product reviews',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get review statistics for a product
   */
  public getProductReviewStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { productId } = req.params;
      const stats = await this.reviewService.getProductReviewStats(productId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting product review stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get product review statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get reviews by a specific user
   */
  public getUserReviews = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const currentUserId = (req as any).user.id;

      // Users can only see their own reviews unless they're admin
      if (userId !== currentUserId && (req as any).user.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Not authorized to view these reviews',
        });
        return;
      }

      const { page = 1, limit = 20 } = req.query;

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
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
    } catch (error) {
      logger.error('Error getting user reviews:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user reviews',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get review statistics for a user
   */
  public getUserReviewStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const currentUserId = (req as any).user.id;

      // Users can only see their own stats unless they're admin
      if (userId !== currentUserId && (req as any).user.role !== 'admin') {
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
    } catch (error) {
      logger.error('Error getting user review stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user review statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Vote on review helpfulness
   */
  public voteHelpful = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { vote } = req.body;
      const userId = (req as any).user.id;

      const review = await Review.findById(id);
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
    } catch (error) {
      logger.error('Error voting on review:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record vote',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Remove helpful vote
   */
  public removeHelpfulVote = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const review = await Review.findById(id);
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
    } catch (error) {
      logger.error('Error removing vote:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove vote',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Flag a review for moderation
   */
  public flagReview = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason, description } = req.body;
      const userId = (req as any).user.id;

      const review = await Review.findById(id);
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
      } catch (error) {
        if (error instanceof Error && error.message.includes('already flagged')) {
          res.status(409).json({
            success: false,
            message: 'You have already flagged this review',
          });
          return;
        }
        throw error;
      }
    } catch (error) {
      logger.error('Error flagging review:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to flag review',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Add a reply to a review
   */
  public addReply = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { content, userType } = req.body;
      const userId = (req as any).user.id;

      const review = await Review.findById(id);
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
    } catch (error) {
      logger.error('Error adding reply:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add reply',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Search reviews by text
   */
  public searchReviews = async (req: Request, res: Response): Promise<void> => {
    try {
      const { q, productId, rating, page = 1, limit = 20 } = req.query;

      if (!q) {
        res.status(400).json({
          success: false,
          message: 'Search query is required',
        });
        return;
      }

      const filters: any = { moderationStatus: 'approved' };
      if (productId) filters.productId = productId;
      if (rating) filters.rating = parseInt(rating as string);

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        searchQuery: q as string,
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
    } catch (error) {
      logger.error('Error searching reviews:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search reviews',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get featured reviews
   */
  public getFeaturedReviews = async (req: Request, res: Response): Promise<void> => {
    try {
      const { productId, limit = 10 } = req.query;

      const filters: any = {
        featured: true,
        moderationStatus: 'approved',
      };
      if (productId) filters.productId = productId;

      const options = {
        limit: parseInt(limit as string),
      };

      const reviews = await this.reviewService.getFeaturedReviews(filters, options);

      res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      logger.error('Error getting featured reviews:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get featured reviews',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}
