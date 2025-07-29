import { Review, IReview } from '../models/Review';
import { logger } from '../utils/logger';
import {
  ReviewError,
  ReviewNotFoundError,
  ReviewAlreadyExistsError,
  DatabaseError,
  handleDatabaseError,
} from '../utils/errors';

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

export class ReviewService {
  /**
   * Get all reviews with filters and pagination
   */
  async getAllReviews(filters: ReviewFilters, options: ReviewOptions): Promise<ReviewResult> {
    try {
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
      const skip = (page - 1) * limit;

      // Build query
      const query = this.buildQuery(filters);

      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query with pagination
      const [reviews, total] = await Promise.all([
        Review.find(query).sort(sort).skip(skip).limit(limit).exec(),
        Review.countDocuments(query),
      ]);

      const pages = Math.ceil(total / limit);

      logger.info(`Retrieved ${reviews.length} reviews`, {
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
    } catch (error) {
      logger.error('Error getting all reviews:', error);
      throw handleDatabaseError(error);
    }
  }

  /**
   * Get review by ID
   */
  async getReviewById(id: string): Promise<IReview | null> {
    try {
      const review = await Review.findById(id).exec();

      if (review) {
        logger.info(`Retrieved review ${id}`);
      } else {
        logger.warn(`Review ${id} not found`);
      }

      return review;
    } catch (error) {
      logger.error(`Error getting review ${id}:`, error);
      throw handleDatabaseError(error);
    }
  }

  /**
   * Create a new review
   */
  async createReview(reviewData: Partial<IReview>): Promise<IReview> {
    try {
      // Check if user already reviewed this product
      if (reviewData.userId && reviewData.productId) {
        const existingReview = await Review.findOne({
          userId: reviewData.userId,
          productId: reviewData.productId,
        });

        if (existingReview) {
          throw new ReviewAlreadyExistsError();
        }
      }

      // Create new review
      const review = new Review(reviewData);
      const savedReview = await review.save();

      logger.info(`Created new review ${savedReview.id}`, {
        userId: reviewData.userId,
        productId: reviewData.productId,
        rating: reviewData.rating,
      });

      return savedReview;
    } catch (error) {
      logger.error('Error creating review:', error);
      if (error instanceof ReviewAlreadyExistsError) {
        throw error;
      }
      throw handleDatabaseError(error);
    }
  }

  /**
   * Update a review
   */
  async updateReview(id: string, updateData: Partial<IReview>): Promise<IReview> {
    try {
      const review = await Review.findById(id);

      if (!review) {
        throw new ReviewNotFoundError();
      }

      // Update review fields
      Object.assign(review, updateData);
      const updatedReview = await review.save();

      logger.info(`Updated review ${id}`, {
        updatedFields: Object.keys(updateData),
      });

      return updatedReview;
    } catch (error) {
      logger.error(`Error updating review ${id}:`, error);
      if (error instanceof ReviewNotFoundError) {
        throw error;
      }
      throw handleDatabaseError(error);
    }
  }

  /**
   * Delete a review
   */
  async deleteReview(id: string): Promise<void> {
    try {
      const review = await Review.findById(id);

      if (!review) {
        throw new ReviewNotFoundError();
      }

      await Review.findByIdAndDelete(id);

      logger.info(`Deleted review ${id}`);
    } catch (error) {
      logger.error(`Error deleting review ${id}:`, error);
      if (error instanceof ReviewNotFoundError) {
        throw error;
      }
      throw handleDatabaseError(error);
    }
  }

  /**
   * Get reviews for a specific product
   */
  async getProductReviews(
    productId: string,
    filters: ReviewFilters,
    options: ReviewOptions
  ): Promise<ReviewResult> {
    try {
      const productFilters = { ...filters, productId };
      return await this.getAllReviews(productFilters, options);
    } catch (error) {
      logger.error(`Error getting product reviews for ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Get review statistics for a product
   */
  async getProductReviewStats(productId: string): Promise<any> {
    try {
      const stats = await Review.getProductStats(productId);

      logger.info(`Retrieved product review stats for ${productId}`);

      return (
        stats[0] || {
          averageRating: 0,
          totalReviews: 0,
          verifiedReviews: 0,
          verificationRate: 0,
          ratingBreakdown: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
        }
      );
    } catch (error) {
      logger.error(`Error getting product review stats for ${productId}:`, error);
      throw handleDatabaseError(error);
    }
  }

  /**
   * Get reviews by a specific user
   */
  async getUserReviews(userId: string, options: ReviewOptions): Promise<ReviewResult> {
    try {
      const filters = { userId };
      return await this.getAllReviews(filters, options);
    } catch (error) {
      logger.error(`Error getting user reviews for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get review statistics for a user
   */
  async getUserReviewStats(userId: string): Promise<any> {
    try {
      const stats = await Review.getUserReviewStats(userId);

      logger.info(`Retrieved user review stats for ${userId}`);

      return (
        stats[0] || {
          totalReviews: 0,
          averageRating: 0,
          verifiedReviews: 0,
          helpfulVotes: 0,
          approvedReviews: 0,
        }
      );
    } catch (error) {
      logger.error(`Error getting user review stats for ${userId}:`, error);
      throw handleDatabaseError(error);
    }
  }

  /**
   * Search reviews by text
   */
  async searchReviews(filters: ReviewFilters, options: ReviewOptions): Promise<ReviewResult> {
    try {
      const { searchQuery, ...paginationOptions } = options;

      if (!searchQuery) {
        throw new ReviewError('Search query is required');
      }

      // Build text search query
      const query = {
        ...this.buildQuery(filters),
        $text: { $search: searchQuery },
      };

      const { page = 1, limit = 20 } = paginationOptions;
      const skip = (page - 1) * limit;

      // Execute search with text score sorting
      const [reviews, total] = await Promise.all([
        Review.find(query, { score: { $meta: 'textScore' } })
          .sort({ score: { $meta: 'textScore' } })
          .skip(skip)
          .limit(limit)
          .exec(),
        Review.countDocuments(query),
      ]);

      const pages = Math.ceil(total / limit);

      logger.info(`Search found ${reviews.length} reviews`, {
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
    } catch (error) {
      logger.error('Error searching reviews:', error);
      throw handleDatabaseError(error);
    }
  }

  /**
   * Get featured reviews
   */
  async getFeaturedReviews(filters: ReviewFilters, options: ReviewOptions): Promise<IReview[]> {
    try {
      const { limit = 10 } = options;
      const featuredFilters = { ...filters, featured: true };

      const query = this.buildQuery(featuredFilters);

      const reviews = await Review.find(query)
        .sort({ 'helpful.yes': -1, createdAt: -1 })
        .limit(limit)
        .exec();

      logger.info(`Retrieved ${reviews.length} featured reviews`);

      return reviews;
    } catch (error) {
      logger.error('Error getting featured reviews:', error);
      throw handleDatabaseError(error);
    }
  }

  /**
   * Moderate a review
   */
  async moderateReview(
    id: string,
    status: 'pending' | 'approved' | 'rejected' | 'flagged',
    notes?: string,
    moderatorId?: string
  ): Promise<IReview> {
    try {
      const review = await Review.findById(id);

      if (!review) {
        throw new ReviewNotFoundError();
      }

      await review.updateModerationStatus(status, notes, moderatorId);

      logger.info(`Moderated review ${id}`, {
        status,
        moderatorId,
        notes,
      });

      return review;
    } catch (error) {
      logger.error(`Error moderating review ${id}:`, error);
      if (error instanceof ReviewNotFoundError) {
        throw error;
      }
      throw handleDatabaseError(error);
    }
  }

  /**
   * Get moderation queue
   */
  async getModerationQueue(
    status: string = 'pending',
    limit: number = 50,
    skip: number = 0
  ): Promise<IReview[]> {
    try {
      const reviews = await Review.getModerationQueue(status, limit, skip);

      logger.info(`Retrieved ${reviews.length} reviews for moderation`, {
        status,
        limit,
        skip,
      });

      return reviews;
    } catch (error) {
      logger.error('Error getting moderation queue:', error);
      throw handleDatabaseError(error);
    }
  }

  /**
   * Build MongoDB query from filters
   */
  private buildQuery(filters: ReviewFilters): any {
    const query: any = {};

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

  /**
   * Get review analytics
   */
  async getReviewAnalytics(productId?: string): Promise<any> {
    try {
      const matchStage: any = { moderationStatus: 'approved' };
      if (productId) {
        matchStage.productId = productId;
      }

      const analytics = await Review.aggregate([
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

      logger.info('Retrieved review analytics', { productId });

      return (
        analytics[0] || {
          totalReviews: 0,
          averageRating: 0,
          verifiedReviews: 0,
          verificationRate: 0,
          totalHelpfulVotes: 0,
          ratingBreakdown: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
        }
      );
    } catch (error) {
      logger.error('Error getting review analytics:', error);
      throw handleDatabaseError(error);
    }
  }
}
