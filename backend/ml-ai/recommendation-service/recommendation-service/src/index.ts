import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { validateToken, requireRole } from '../../../../libs/shared/src/auth/jwt';
import { logError, logInfo, trackApiCall } from '../../../../libs/shared/src/logging/production-logger';
import { env } from '../../../../libs/shared/src/config/env-validator';
import { PrismaClient } from '@prisma/client';
import redis from 'redis';

const app = express();
const PORT = env.PORT || 3022;
const prisma = new PrismaClient();

// Redis client for caching recommendations
const redisClient = redis.createClient({
  url: `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`,
  password: env.REDIS_PASSWORD
});
redisClient.connect();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const recommendationLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 50, // Higher limit for recommendations
  message: {
    success: false,
    message: 'Too many recommendation requests, please try again later',
  },
});
app.use('/api/', recommendationLimiter);

// API timing middleware
app.use('/api/', (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    trackApiCall(req.method, req.path, res.statusCode, duration, {
      service: 'recommendation-service',
      userId: (req as any).user?.userId
    });
  });
  
  next();
});

// Health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redisClient.ping();
    
    res.status(200).json({
      status: 'ok',
      service: 'recommendation-service',
      timestamp: new Date().toISOString(),
      version: env.APP_VERSION,
      database: 'connected',
      redis: 'connected'
    });
  } catch (error) {
    logError('Health check failed', error as Error, { service: 'recommendation-service' });
    res.status(503).json({
      status: 'error',
      service: 'recommendation-service',
      timestamp: new Date().toISOString(),
      database: 'unknown',
      redis: 'unknown'
    });
  }
});

// Recommendation algorithms
class RecommendationEngine {
  // Collaborative filtering - users who bought this also bought
  static async getCollaborativeRecommendations(userId: string, limit: number = 10): Promise<any[]> {
    const userOrders = await prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } } },
      take: 50 // Last 50 orders
    });

    const userProductIds = userOrders
      .flatMap(order => order.items)
      .map(item => item.productId);

    if (userProductIds.length === 0) {
      return this.getPopularProducts(limit);
    }

    // Find users who bought similar products
    const similarUsers = await prisma.$queryRaw`
      SELECT o.user_id, COUNT(*) as common_products
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE oi.product_id = ANY(${userProductIds})
        AND o.user_id != ${userId}
      GROUP BY o.user_id
      ORDER BY common_products DESC
      LIMIT 100
    `;

    const similarUserIds = (similarUsers as any[]).map(u => u.user_id);

    // Get products bought by similar users but not by current user
    const recommendations = await prisma.$queryRaw`
      SELECT p.id, p.name, p.price, p.image_url, 
             COUNT(*) as recommendation_score,
             AVG(p.rating) as avg_rating
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.user_id = ANY(${similarUserIds})
        AND p.id != ALL(${userProductIds})
        AND p.status = 'ACTIVE'
        AND p.stock > 0
      GROUP BY p.id, p.name, p.price, p.image_url
      ORDER BY recommendation_score DESC, avg_rating DESC
      LIMIT ${limit}
    `;

    return recommendations as any[];
  }

  // Content-based filtering - similar products based on category and features
  static async getContentBasedRecommendations(productId: string, limit: number = 10): Promise<any[]> {
    const sourceProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true }
    });

    if (!sourceProduct) {
      return [];
    }

    const recommendations = await prisma.product.findMany({
      where: {
        AND: [
          { id: { not: productId } },
          { categoryId: sourceProduct.categoryId },
          { status: 'ACTIVE' },
          { stock: { gt: 0 } },
          {
            OR: [
              { brand: sourceProduct.brand },
              { 
                price: {
                  gte: sourceProduct.price * 0.7,
                  lte: sourceProduct.price * 1.3
                }
              }
            ]
          }
        ]
      },
      include: {
        category: true
      },
      orderBy: [
        { rating: 'desc' },
        { salesCount: 'desc' }
      ],
      take: limit
    });

    return recommendations;
  }

  // Trending products based on recent sales velocity
  static async getTrendingProducts(limit: number = 10): Promise<any[]> {
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const trending = await prisma.$queryRaw`
      SELECT p.id, p.name, p.price, p.image_url, p.rating,
             COUNT(oi.id) as recent_sales,
             COUNT(oi.id)::float / GREATEST(p.sales_count, 1) as velocity_score
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at >= ${last7Days}
        AND p.status = 'ACTIVE'
        AND p.stock > 0
      GROUP BY p.id, p.name, p.price, p.image_url, p.rating, p.sales_count
      HAVING COUNT(oi.id) >= 5
      ORDER BY velocity_score DESC, recent_sales DESC
      LIMIT ${limit}
    `;

    return trending as any[];
  }

  // Popular products fallback
  static async getPopularProducts(limit: number = 10): Promise<any[]> {
    return await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        stock: { gt: 0 }
      },
      orderBy: [
        { salesCount: 'desc' },
        { rating: 'desc' }
      ],
      take: limit
    });
  }

  // Seasonal recommendations based on time of year
  static async getSeasonalRecommendations(limit: number = 10): Promise<any[]> {
    const currentMonth = new Date().getMonth() + 1;
    let seasonalCategories: string[] = [];

    // Define seasonal categories
    if (currentMonth >= 12 || currentMonth <= 2) {
      // Winter
      seasonalCategories = ['electronics', 'home-appliances', 'winter-clothing'];
    } else if (currentMonth >= 3 && currentMonth <= 5) {
      // Spring
      seasonalCategories = ['garden', 'sports', 'home-improvement'];
    } else if (currentMonth >= 6 && currentMonth <= 8) {
      // Summer
      seasonalCategories = ['outdoor', 'summer-clothing', 'travel'];
    } else {
      // Fall
      seasonalCategories = ['electronics', 'books', 'fall-clothing'];
    }

    return await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        stock: { gt: 0 },
        category: {
          slug: { in: seasonalCategories }
        }
      },
      orderBy: [
        { rating: 'desc' },
        { salesCount: 'desc' }
      ],
      take: limit
    });
  }

  // Price-based recommendations
  static async getPriceSensitiveRecommendations(userId: string, limit: number = 10): Promise<any[]> {
    // Calculate user's average order value
    const userAvgOrder = await prisma.order.aggregate({
      where: { userId },
      _avg: { totalAmount: true }
    });

    const avgOrderValue = userAvgOrder._avg.totalAmount || 100; // Default fallback

    return await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        stock: { gt: 0 },
        price: {
          gte: avgOrderValue * 0.5,
          lte: avgOrderValue * 1.5
        }
      },
      orderBy: [
        { rating: 'desc' },
        { salesCount: 'desc' }
      ],
      take: limit
    });
  }
}

// Authentication required for personalized recommendations
app.use('/api/v1/recommendations', validateToken);

// Get personalized recommendations for user
app.get('/api/v1/recommendations/personalized', async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { limit = 10, type = 'mixed' } = req.query;
    const cacheKey = `recommendations_${userId}_${type}_${limit}`;
    
    // Try cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: JSON.parse(cached),
        cached: true
      });
    }

    let recommendations: any[] = [];

    switch (type) {
      case 'collaborative':
        recommendations = await RecommendationEngine.getCollaborativeRecommendations(userId, Number(limit));
        break;
      case 'price-sensitive':
        recommendations = await RecommendationEngine.getPriceSensitiveRecommendations(userId, Number(limit));
        break;
      case 'mixed':
      default:
        // Mix different recommendation types
        const [collaborative, trending, seasonal] = await Promise.all([
          RecommendationEngine.getCollaborativeRecommendations(userId, Math.ceil(Number(limit) * 0.5)),
          RecommendationEngine.getTrendingProducts(Math.ceil(Number(limit) * 0.3)),
          RecommendationEngine.getSeasonalRecommendations(Math.ceil(Number(limit) * 0.2))
        ]);
        
        recommendations = [...collaborative, ...trending, ...seasonal]
          .slice(0, Number(limit));
        break;
    }

    // Cache for 30 minutes
    await redisClient.setEx(cacheKey, 1800, JSON.stringify(recommendations));

    res.json({
      success: true,
      data: recommendations,
      cached: false,
      algorithm: type
    });
  } catch (error) {
    logError('Failed to get personalized recommendations', error as Error, {
      service: 'recommendation-service',
      action: 'get_personalized_recommendations',
      userId: (req as any).user?.userId
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations'
    });
  }
});

// Get product-based recommendations (for product detail pages)
app.get('/api/v1/recommendations/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 8 } = req.query;
    const cacheKey = `product_recommendations_${productId}_${limit}`;
    
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: JSON.parse(cached),
        cached: true
      });
    }

    const recommendations = await RecommendationEngine.getContentBasedRecommendations(
      productId, 
      Number(limit)
    );

    // Cache for 1 hour
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(recommendations));

    res.json({
      success: true,
      data: recommendations,
      cached: false,
      algorithm: 'content-based'
    });
  } catch (error) {
    logError('Failed to get product recommendations', error as Error, {
      service: 'recommendation-service',
      action: 'get_product_recommendations',
      productId: req.params.productId
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get product recommendations'
    });
  }
});

// Get trending products (public endpoint)
app.get('/api/v1/recommendations/trending', async (req, res) => {
  try {
    const { limit = 12 } = req.query;
    const cacheKey = `trending_products_${limit}`;
    
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: JSON.parse(cached),
        cached: true
      });
    }

    const trending = await RecommendationEngine.getTrendingProducts(Number(limit));

    // Cache for 15 minutes
    await redisClient.setEx(cacheKey, 900, JSON.stringify(trending));

    res.json({
      success: true,
      data: trending,
      cached: false,
      algorithm: 'trending'
    });
  } catch (error) {
    logError('Failed to get trending products', error as Error, {
      service: 'recommendation-service',
      action: 'get_trending_products'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get trending products'
    });
  }
});

// Track user interaction for improving recommendations
app.post('/api/v1/recommendations/track', async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { productId, action, metadata } = req.body;

    // Validate input
    if (!productId || !action) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and action are required'
      });
    }

    // Store interaction for ML training
    await prisma.userInteraction.create({
      data: {
        userId,
        productId,
        action, // view, click, add_to_cart, purchase
        metadata: metadata || {},
        timestamp: new Date()
      }
    });

    // Invalidate user's recommendation cache
    const keys = await redisClient.keys(`recommendations_${userId}_*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }

    logInfo('User interaction tracked', {
      service: 'recommendation-service',
      action: 'track_interaction',
      userId,
      metadata: { productId, action }
    });

    res.json({
      success: true,
      message: 'Interaction tracked successfully'
    });
  } catch (error) {
    logError('Failed to track user interaction', error as Error, {
      service: 'recommendation-service',
      action: 'track_interaction',
      userId: (req as any).user?.userId
    });
    res.status(500).json({
      success: false,
      message: 'Failed to track interaction'
    });
  }
});

// Admin endpoint for recommendation analytics
app.get('/api/v1/recommendations/analytics', requireRole(['ADMIN', 'ANALYST']), async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const days = parseInt(period.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await Promise.all([
      // Recommendation performance
      prisma.userInteraction.groupBy({
        by: ['action'],
        where: { timestamp: { gte: startDate } },
        _count: { action: true }
      }),
      
      // Top recommended products
      prisma.userInteraction.groupBy({
        by: ['productId'],
        where: { 
          timestamp: { gte: startDate },
          action: { in: ['click', 'add_to_cart', 'purchase'] }
        },
        _count: { productId: true },
        orderBy: { _count: { productId: 'desc' } },
        take: 10
      })
    ]);

    res.json({
      success: true,
      data: {
        period,
        interactions: analytics[0],
        topProducts: analytics[1],
        generatedAt: new Date()
      }
    });
  } catch (error) {
    logError('Failed to get recommendation analytics', error as Error, {
      service: 'recommendation-service',
      action: 'get_analytics',
      userId: (req as any).user?.userId
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendation analytics'
    });
  }
});

// Error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logError('Unhandled recommendation service error', error, {
    service: 'recommendation-service',
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Recommendation endpoint not found',
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logInfo('Recommendation service shutting down gracefully', { service: 'recommendation-service' });
  await prisma.$disconnect();
  await redisClient.quit();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logInfo('Recommendation service shutting down gracefully', { service: 'recommendation-service' });
  await prisma.$disconnect();
  await redisClient.quit();
  process.exit(0);
});

app.listen(PORT, () => {
  logInfo(`Recommendation service running on port ${PORT}`, {
    service: 'recommendation-service',
    port: PORT,
    environment: env.NODE_ENV
  });
});
