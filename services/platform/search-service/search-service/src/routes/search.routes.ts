import { Router } from 'express';
import { body, query } from 'express-validator';
import { SearchController } from '../controllers/search.controller';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit.middleware';

const router = Router();
const searchController = new SearchController();

/**
 * @swagger
 * /api/v1/search/products:
 *   get:
 *     summary: Search products
 *     description: Search products with advanced filtering and pagination
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Filter by brand
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: rating
 *         schema:
 *           type: number
 *         description: Minimum rating filter
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [relevance, price_asc, price_desc, rating, newest]
 *         description: Sort order
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
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *         description: Filter by stock availability
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     aggregations:
 *                       type: object
 *                     took:
 *                       type: integer
 */
router.get(
  '/products',
  rateLimitMiddleware.search,
  optionalAuthMiddleware,
  [
    query('q').optional().isString().trim(),
    query('category').optional().isString(),
    query('brand').optional().isString(),
    query('minPrice').optional().isFloat({ min: 0 }),
    query('maxPrice').optional().isFloat({ min: 0 }),
    query('rating').optional().isFloat({ min: 0, max: 5 }),
    query('sortBy').optional().isIn(['relevance', 'price_asc', 'price_desc', 'rating', 'newest']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('inStock').optional().isBoolean(),
  ],
  searchController.searchProducts.bind(searchController)
);

/**
 * @swagger
 * /api/v1/search/suggestions:
 *   get:
 *     summary: Get search suggestions
 *     description: Get autocomplete suggestions for search queries
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query (minimum 2 characters)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 20
 *         description: Maximum number of suggestions
 *     responses:
 *       200:
 *         description: Search suggestions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     query:
 *                       type: string
 *                     suggestions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           text:
 *                             type: string
 *                           type:
 *                             type: string
 *                             enum: [product, category, brand]
 *                           score:
 *                             type: number
 */
router.get(
  '/suggestions',
  rateLimitMiddleware.suggestions,
  [
    query('q').isString().isLength({ min: 2 }).withMessage('Query must be at least 2 characters'),
    query('limit').optional().isInt({ min: 1, max: 20 }),
  ],
  searchController.getSearchSuggestions.bind(searchController)
);

/**
 * @swagger
 * /api/v1/search/popular:
 *   get:
 *     summary: Get popular search queries
 *     description: Get most popular search queries within a timeframe
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *         description: Maximum number of queries
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           default: 7d
 *           enum: [1h, 1d, 7d, 30d]
 *         description: Time period
 *     responses:
 *       200:
 *         description: Popular queries
 */
router.get(
  '/popular',
  rateLimitMiddleware.analytics,
  [
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('timeframe').optional().isIn(['1h', '1d', '7d', '30d']),
  ],
  searchController.getPopularQueries.bind(searchController)
);

/**
 * @swagger
 * /api/v1/search/filters:
 *   get:
 *     summary: Get search filters
 *     description: Get available filters and facets for search
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Filter by brand
 *     responses:
 *       200:
 *         description: Available filters
 */
router.get(
  '/filters',
  rateLimitMiddleware.filters,
  [query('category').optional().isString(), query('brand').optional().isString()],
  searchController.getSearchFilters.bind(searchController)
);

/**
 * @swagger
 * /api/v1/search/track/click:
 *   post:
 *     summary: Track search result click
 *     description: Track when a user clicks on a search result
 *     tags: [Search]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *               - productId
 *             properties:
 *               query:
 *                 type: string
 *                 description: Original search query
 *               productId:
 *                 type: string
 *                 description: ID of clicked product
 *               position:
 *                 type: integer
 *                 description: Position of product in search results
 *     responses:
 *       200:
 *         description: Click tracked successfully
 */
router.post(
  '/track/click',
  rateLimitMiddleware.tracking,
  optionalAuthMiddleware,
  [
    body('query').isString().notEmpty().withMessage('Query is required'),
    body('productId').isString().notEmpty().withMessage('Product ID is required'),
    body('position').optional().isInt({ min: 0 }),
  ],
  searchController.trackSearchClick.bind(searchController)
);

/**
 * @swagger
 * /api/v1/search/analytics:
 *   get:
 *     summary: Get search analytics
 *     description: Get search analytics data (admin only)
 *     tags: [Search, Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           default: day
 *           enum: [hour, day, week, month]
 *         description: Group results by time period
 *       - in: query
 *         name: metrics
 *         schema:
 *           type: string
 *           default: searches,clicks,conversions
 *         description: Comma-separated list of metrics
 *     responses:
 *       200:
 *         description: Analytics data
 */
router.get(
  '/analytics',
  authMiddleware,
  rateLimitMiddleware.analytics,
  [
    query('startDate').isISO8601().withMessage('Valid start date is required'),
    query('endDate').isISO8601().withMessage('Valid end date is required'),
    query('groupBy').optional().isIn(['hour', 'day', 'week', 'month']),
    query('metrics').optional().isString(),
  ],
  searchController.getSearchAnalytics.bind(searchController)
);

/**
 * @swagger
 * /api/v1/search/index/bulk:
 *   post:
 *     summary: Bulk index products
 *     description: Bulk index products for search (admin only)
 *     tags: [Search, Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - products
 *             properties:
 *               products:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Bulk indexing completed
 */
router.post(
  '/index/bulk',
  authMiddleware,
  rateLimitMiddleware.indexing,
  [
    body('products').isArray({ min: 1 }).withMessage('Products array is required'),
    body('products.*.id').isString().notEmpty(),
    body('products.*.name').isString().notEmpty(),
    body('products.*.price').isFloat({ min: 0 }),
  ],
  searchController.bulkIndexProducts.bind(searchController)
);

/**
 * @swagger
 * /api/v1/search/index/clear:
 *   delete:
 *     summary: Clear search index
 *     description: Clear all products from search index (development only)
 *     tags: [Search, Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Index cleared successfully
 *       403:
 *         description: Not allowed in production
 */
router.delete(
  '/index/clear',
  authMiddleware,
  rateLimitMiddleware.admin,
  searchController.clearSearchIndex.bind(searchController)
);

/**
 * @swagger
 * /api/v1/search/health:
 *   get:
 *     summary: Get search service health
 *     description: Get health status of search service and Elasticsearch
 *     tags: [Search, Health]
 *     responses:
 *       200:
 *         description: Health status
 */
router.get('/health', searchController.getSearchHealth.bind(searchController));

export default router;
