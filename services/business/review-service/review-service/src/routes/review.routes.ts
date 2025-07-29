import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  createReviewSchema,
  updateReviewSchema,
  helpfulVoteSchema,
  flagReviewSchema,
  replyReviewSchema,
} from '../schemas/review.schemas';

const router = Router();
const reviewController = new ReviewController();

/**
 * @swagger
 * /api/v1/reviews:
 *   get:
 *     summary: Get all reviews with filters and pagination
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         description: Filter by product ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Filter by rating
 *       - in: query
 *         name: verified
 *         schema:
 *           type: boolean
 *         description: Filter by verified status
 *       - in: query
 *         name: moderationStatus
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, flagged]
 *         description: Filter by moderation status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, rating, helpful]
 *           default: createdAt
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/', reviewController.getAllReviews);

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   get:
 *     summary: Get review by ID
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review retrieved successfully
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', reviewController.getReviewById);

/**
 * @swagger
 * /api/v1/reviews:
 *   post:
 *     summary: Create a new review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - rating
 *               - title
 *               - content
 *             properties:
 *               productId:
 *                 type: string
 *               orderId:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *                 maxLength: 100
 *               content:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *               pros:
 *                 type: array
 *                 items:
 *                   type: string
 *                   maxLength: 200
 *               cons:
 *                 type: array
 *                 items:
 *                   type: string
 *                   maxLength: 200
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               videos:
 *                 type: array
 *                 items:
 *                   type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               language:
 *                 type: string
 *                 default: en
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Review already exists for this product
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  authMiddleware,
  validateRequest(createReviewSchema),
  reviewController.createReview
);

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   put:
 *     summary: Update a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *                 maxLength: 100
 *               content:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *               pros:
 *                 type: array
 *                 items:
 *                   type: string
 *                   maxLength: 200
 *               cons:
 *                 type: array
 *                 items:
 *                   type: string
 *                   maxLength: 200
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               videos:
 *                 type: array
 *                 items:
 *                   type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to update this review
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/:id',
  authMiddleware,
  validateRequest(updateReviewSchema),
  reviewController.updateReview
);

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to delete this review
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', authMiddleware, reviewController.deleteReview);

/**
 * @swagger
 * /api/v1/reviews/products/{productId}:
 *   get:
 *     summary: Get reviews for a specific product
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Filter by rating
 *       - in: query
 *         name: verified
 *         schema:
 *           type: boolean
 *         description: Filter by verified status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, rating, helpful]
 *           default: helpful
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Product reviews retrieved successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.get('/products/:productId', reviewController.getProductReviews);

/**
 * @swagger
 * /api/v1/reviews/products/{productId}/stats:
 *   get:
 *     summary: Get review statistics for a product
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product review statistics retrieved successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.get('/products/:productId/stats', reviewController.getProductReviewStats);

/**
 * @swagger
 * /api/v1/reviews/users/{userId}:
 *   get:
 *     summary: Get reviews by a specific user
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: User reviews retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/users/:userId', authMiddleware, reviewController.getUserReviews);

/**
 * @swagger
 * /api/v1/reviews/users/{userId}/stats:
 *   get:
 *     summary: Get review statistics for a user
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User review statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/users/:userId/stats', authMiddleware, reviewController.getUserReviewStats);

/**
 * @swagger
 * /api/v1/reviews/{id}/helpful:
 *   post:
 *     summary: Vote on review helpfulness
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vote
 *             properties:
 *               vote:
 *                 type: string
 *                 enum: [yes, no]
 *     responses:
 *       200:
 *         description: Vote recorded successfully
 *       400:
 *         description: Invalid vote data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/:id/helpful',
  authMiddleware,
  validateRequest(helpfulVoteSchema),
  reviewController.voteHelpful
);

/**
 * @swagger
 * /api/v1/reviews/{id}/helpful:
 *   delete:
 *     summary: Remove helpful vote
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Vote removed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id/helpful', authMiddleware, reviewController.removeHelpfulVote);

/**
 * @swagger
 * /api/v1/reviews/{id}/flag:
 *   post:
 *     summary: Flag a review for moderation
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 enum: [inappropriate_language, spam, fake_review, off_topic, personal_information, copyright, other]
 *               description:
 *                 type: string
 *                 maxLength: 300
 *     responses:
 *       200:
 *         description: Review flagged successfully
 *       400:
 *         description: Invalid flag data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Review not found
 *       409:
 *         description: Review already flagged by this user
 *       500:
 *         description: Internal server error
 */
router.post(
  '/:id/flag',
  authMiddleware,
  validateRequest(flagReviewSchema),
  reviewController.flagReview
);

/**
 * @swagger
 * /api/v1/reviews/{id}/replies:
 *   post:
 *     summary: Add a reply to a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - userType
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *               userType:
 *                 type: string
 *                 enum: [customer, merchant, admin]
 *     responses:
 *       201:
 *         description: Reply added successfully
 *       400:
 *         description: Invalid reply data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/:id/replies',
  authMiddleware,
  validateRequest(replyReviewSchema),
  reviewController.addReply
);

/**
 * @swagger
 * /api/v1/reviews/search:
 *   get:
 *     summary: Search reviews by text
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         description: Filter by product ID
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Filter by rating
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *       400:
 *         description: Invalid search query
 *       500:
 *         description: Internal server error
 */
router.get('/search', reviewController.searchReviews);

/**
 * @swagger
 * /api/v1/reviews/featured:
 *   get:
 *     summary: Get featured reviews
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         description: Filter by product ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of featured reviews to return
 *     responses:
 *       200:
 *         description: Featured reviews retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/featured', reviewController.getFeaturedReviews);

export default router;
