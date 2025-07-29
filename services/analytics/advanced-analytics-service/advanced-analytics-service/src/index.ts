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
const PORT = env.PORT || 3020;
const prisma = new PrismaClient();

// Redis client for caching analytics data
const redisClient = redis.createClient({
  url: `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`,
  password: env.REDIS_PASSWORD
});
redisClient.connect();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.ultramarket.uz"],
      scriptSrc: ["'self'"],
    },
  },
}));

app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));

// Rate limiting for analytics endpoints
const analyticsLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 100, // More requests allowed for analytics
  message: {
    success: false,
    message: 'Too many analytics requests, please try again later',
  },
});
app.use('/api/', analyticsLimiter);

// API timing middleware
app.use('/api/', (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    trackApiCall(req.method, req.path, res.statusCode, duration, {
      service: 'advanced-analytics-service',
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
      service: 'advanced-analytics-service',
      timestamp: new Date().toISOString(),
      version: env.APP_VERSION,
      database: 'connected',
      redis: 'connected'
    });
  } catch (error) {
    logError('Health check failed', error as Error, { service: 'advanced-analytics-service' });
    res.status(503).json({
      status: 'error',
      service: 'advanced-analytics-service',
      timestamp: new Date().toISOString(),
      database: 'unknown',
      redis: 'unknown'
    });
  }
});

// Authentication required for all analytics endpoints
app.use('/api/v1/analytics', validateToken);

// Sales Analytics
app.get('/api/v1/analytics/sales', requireRole(['ADMIN', 'ANALYST']), async (req, res) => {
  try {
    const { period = '30d', granularity = 'day' } = req.query;
    const cacheKey = `sales_analytics_${period}_${granularity}`;
    
    // Try to get from cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: JSON.parse(cached),
        cached: true
      });
    }

    const endDate = new Date();
    const startDate = new Date();
    
    // Calculate start date based on period
    switch(period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Aggregated sales data
    const salesData = await prisma.order.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      }
    });

    // Daily sales trend
    const dailySales = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        SUM(total_amount) as revenue
      FROM orders 
      WHERE created_at >= ${startDate} AND created_at <= ${endDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Top products
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      },
      _sum: {
        quantity: true,
        price: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 10
    });

    const analytics = {
      period,
      dateRange: { start: startDate, end: endDate },
      summary: {
        totalRevenue: salesData.reduce((sum, item) => sum + (item._sum.totalAmount || 0), 0),
        totalOrders: salesData.reduce((sum, item) => sum + item._count.id, 0),
        averageOrderValue: 0 // Will be calculated
      },
      salesByStatus: salesData,
      dailyTrend: dailySales,
      topProducts,
      generatedAt: new Date()
    };

    // Calculate average order value
    analytics.summary.averageOrderValue = analytics.summary.totalOrders > 0 
      ? analytics.summary.totalRevenue / analytics.summary.totalOrders 
      : 0;

    // Cache for 15 minutes
    await redisClient.setEx(cacheKey, 900, JSON.stringify(analytics));

    res.json({
      success: true,
      data: analytics,
      cached: false
    });
  } catch (error) {
    logError('Failed to generate sales analytics', error as Error, {
      service: 'advanced-analytics-service',
      action: 'get_sales_analytics',
      userId: (req as any).user?.userId
    });
    res.status(500).json({
      success: false,
      message: 'Failed to generate sales analytics'
    });
  }
});

// User Behavior Analytics
app.get('/api/v1/analytics/users', requireRole(['ADMIN', 'ANALYST']), async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const cacheKey = `user_analytics_${period}`;
    
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: JSON.parse(cached),
        cached: true
      });
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(period.replace('d', '')));

    // User registrations over time
    const userRegistrations = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_users
      FROM users 
      WHERE created_at >= ${startDate} AND created_at <= ${endDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // User activity metrics
    const userActivity = await prisma.user.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    // User engagement (orders per user)
    const userEngagement = await prisma.$queryRaw`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        COUNT(o.id) as order_count,
        SUM(o.total_amount) as total_spent,
        MAX(o.created_at) as last_order_date
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.created_at >= ${startDate}
      GROUP BY u.id, u.first_name, u.last_name, u.email
      ORDER BY order_count DESC
      LIMIT 100
    `;

    const analytics = {
      period,
      dateRange: { start: startDate, end: endDate },
      registrationTrend: userRegistrations,
      usersByStatus: userActivity,
      topCustomers: userEngagement,
      generatedAt: new Date()
    };

    await redisClient.setEx(cacheKey, 900, JSON.stringify(analytics));

    res.json({
      success: true,
      data: analytics,
      cached: false
    });
  } catch (error) {
    logError('Failed to generate user analytics', error as Error, {
      service: 'advanced-analytics-service',
      action: 'get_user_analytics',
      userId: (req as any).user?.userId
    });
    res.status(500).json({
      success: false,
      message: 'Failed to generate user analytics'
    });
  }
});

// Product Performance Analytics
app.get('/api/v1/analytics/products', requireRole(['ADMIN', 'ANALYST']), async (req, res) => {
  try {
    const { period = '30d', category } = req.query;
    const cacheKey = `product_analytics_${period}_${category || 'all'}`;
    
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: JSON.parse(cached),
        cached: true
      });
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(period.replace('d', '')));

    // Build where clause for category filter
    const whereClause = category ? 
      { 
        order: { createdAt: { gte: startDate, lte: endDate } },
        product: { categoryId: category as string }
      } : 
      { order: { createdAt: { gte: startDate, lte: endDate } } };

    // Product sales performance
    const productPerformance = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: whereClause,
      _sum: {
        quantity: true,
        price: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          price: 'desc'
        }
      },
      take: 50
    });

    // Category performance
    const categoryPerformance = await prisma.$queryRaw`
      SELECT 
        c.id,
        c.name,
        COUNT(oi.id) as total_sales,
        SUM(oi.quantity) as units_sold,
        SUM(oi.price * oi.quantity) as revenue
      FROM categories c
      JOIN products p ON c.id = p.category_id
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at >= ${startDate} AND o.created_at <= ${endDate}
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `;

    // Product inventory alerts
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: {
          lte: 10 // Low stock threshold
        }
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        category: {
          select: {
            name: true
          }
        }
      },
      take: 20
    });

    const analytics = {
      period,
      dateRange: { start: startDate, end: endDate },
      topProducts: productPerformance,
      categoryPerformance,
      lowStockAlerts: lowStockProducts,
      generatedAt: new Date()
    };

    await redisClient.setEx(cacheKey, 900, JSON.stringify(analytics));

    res.json({
      success: true,
      data: analytics,
      cached: false
    });
  } catch (error) {
    logError('Failed to generate product analytics', error as Error, {
      service: 'advanced-analytics-service',
      action: 'get_product_analytics',
      userId: (req as any).user?.userId
    });
    res.status(500).json({
      success: false,
      message: 'Failed to generate product analytics'
    });
  }
});

// Real-time Dashboard Data
app.get('/api/v1/analytics/realtime', requireRole(['ADMIN', 'ANALYST']), async (req, res) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

    // Real-time metrics
    const [
      ordersLast24h,
      ordersLastHour,
      activeSessions,
      recentOrders,
      systemMetrics
    ] = await Promise.all([
      prisma.order.count({
        where: { createdAt: { gte: last24Hours } }
      }),
      prisma.order.count({
        where: { createdAt: { gte: lastHour } }
      }),
      // In production, this would come from session store
      Promise.resolve(Math.floor(Math.random() * 500) + 100),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { firstName: true, lastName: true }
          }
        }
      }),
      // System metrics would come from monitoring service
      Promise.resolve({
        cpuUsage: Math.round(Math.random() * 100),
        memoryUsage: Math.round(Math.random() * 100),
        diskUsage: Math.round(Math.random() * 100),
        networkLatency: Math.round(Math.random() * 100) + 10
      })
    ]);

    res.json({
      success: true,
      data: {
        metrics: {
          ordersLast24h,
          ordersLastHour,
          activeSessions,
          systemMetrics
        },
        recentActivity: recentOrders,
        timestamp: now
      }
    });
  } catch (error) {
    logError('Failed to get realtime analytics', error as Error, {
      service: 'advanced-analytics-service',
      action: 'get_realtime_analytics',
      userId: (req as any).user?.userId
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get realtime analytics'
    });
  }
});

// Custom Analytics Query Endpoint (Admin only)
app.post('/api/v1/analytics/custom', requireRole(['ADMIN']), async (req, res) => {
  try {
    const { query, parameters } = req.body;
    
    // Validate query for security (basic validation)
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid SQL query required'
      });
    }

    // Restrict to SELECT queries only for security
    if (!query.trim().toLowerCase().startsWith('select')) {
      return res.status(400).json({
        success: false,
        message: 'Only SELECT queries are allowed'
      });
    }

    // Execute raw query (be very careful with this in production)
    const result = await prisma.$queryRawUnsafe(query, ...(parameters || []));

    logInfo('Custom analytics query executed', {
      service: 'advanced-analytics-service',
      action: 'custom_query',
      userId: (req as any).user?.userId,
      metadata: { query: query.substring(0, 100) }
    });

    res.json({
      success: true,
      data: result,
      executedAt: new Date()
    });
  } catch (error) {
    logError('Custom analytics query failed', error as Error, {
      service: 'advanced-analytics-service',
      action: 'custom_query',
      userId: (req as any).user?.userId
    });
    res.status(500).json({
      success: false,
      message: 'Query execution failed'
    });
  }
});

// Error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logError('Unhandled analytics service error', error, {
    service: 'advanced-analytics-service',
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
    message: 'Analytics endpoint not found',
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logInfo('Advanced analytics service shutting down gracefully', { service: 'advanced-analytics-service' });
  await prisma.$disconnect();
  await redisClient.quit();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logInfo('Advanced analytics service shutting down gracefully', { service: 'advanced-analytics-service' });
  await prisma.$disconnect();
  await redisClient.quit();
  process.exit(0);
});

app.listen(PORT, () => {
  logInfo(`Advanced analytics service running on port ${PORT}`, {
    service: 'advanced-analytics-service',
    port: PORT,
    environment: env.NODE_ENV
  });
});