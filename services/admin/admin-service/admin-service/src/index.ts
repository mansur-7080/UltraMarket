import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { validateToken, requireAdmin } from '../../../../libs/shared/src/auth/jwt';
import { logError, logInfo, trackApiCall } from '../../../../libs/shared/src/logging/production-logger';
import { env } from '../../../../libs/shared/src/config/env-validator';
import { PrismaClient } from '@prisma/client';

const app = express();
const PORT = env.PORT || 3019;
const prisma = new PrismaClient();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
    },
  },
}));

app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
});
app.use('/api/', limiter);

// API timing middleware
app.use('/api/', (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    trackApiCall(req.method, req.path, res.statusCode, duration, {
      service: 'admin-service',
      userId: (req as any).user?.userId
    });
  });
  
  next();
});

// Health check
app.get('/health', async (req, res) => {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'ok',
      service: 'admin-service',
      timestamp: new Date().toISOString(),
      version: env.APP_VERSION,
      database: 'connected'
    });
  } catch (error) {
    logError('Health check failed', error as Error, { service: 'admin-service' });
    res.status(503).json({
      status: 'error',
      service: 'admin-service',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    });
  }
});

// All admin routes require authentication and admin role
app.use('/api/v1/admin', validateToken, requireAdmin);

// Admin dashboard
app.get('/api/v1/admin/dashboard', async (req, res) => {
  try {
    const stats = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { totalAmount: true }
      }),
      // Count active microservices (this would be replaced with actual service discovery)
      Promise.resolve(15)
    ]);

    const [totalUsers, totalOrders, revenueData, activeServices] = stats;
    const totalRevenue = revenueData._sum.totalAmount || 0;

    // Get recent activity
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { firstName: true, lastName: true } } }
    });

    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, firstName: true, lastName: true, email: true, createdAt: true }
    });

    const recentActivity = [
      ...recentOrders.map(order => ({
        type: 'order',
        description: `New order #${order.orderNumber} by ${order.user.firstName} ${order.user.lastName}`,
        timestamp: order.createdAt,
        amount: order.totalAmount
      })),
      ...recentUsers.map(user => ({
        type: 'user',
        description: `New user registration: ${user.firstName} ${user.lastName}`,
        timestamp: user.createdAt,
        email: user.email
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

    // System health (in production, this would come from monitoring services)
    const systemHealth = {
      cpu: Math.round(Math.random() * 100),
      memory: Math.round(Math.random() * 100),
      storage: Math.round(Math.random() * 100),
      uptime: '99.9%',
      database: 'healthy',
      redis: 'healthy',
      services: activeServices
    };

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalOrders,
          totalRevenue,
          activeServices,
        },
        recentActivity,
        systemHealth,
      },
    });
  } catch (error) {
    logError('Failed to fetch dashboard data', error as Error, {
      service: 'admin-service',
      action: 'get_dashboard',
      userId: (req as any).user?.userId
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
    });
  }
});

// User management
app.get('/api/v1/admin/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, role } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: offset,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          isEmailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          _count: {
            select: {
              orders: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    logError('Failed to fetch users', error as Error, {
      service: 'admin-service',
      action: 'get_users',
      userId: (req as any).user?.userId
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
});

// Update user status
app.patch('/api/v1/admin/users/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'SUSPENDED', 'BANNED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be ACTIVE, SUSPENDED, or BANNED',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true
      }
    });

    logInfo(`User status updated: ${userId} -> ${status}`, {
      service: 'admin-service',
      action: 'update_user_status',
      userId: (req as any).user?.userId,
      metadata: { targetUserId: userId, newStatus: status }
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'User status updated successfully',
    });
  } catch (error) {
    logError('Failed to update user status', error as Error, {
      service: 'admin-service',
      action: 'update_user_status',
      userId: (req as any).user?.userId,
      metadata: { targetUserId: req.params.userId }
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
    });
  }
});

// Order management
app.get('/api/v1/admin/orders', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, dateFrom, dateTo } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
      if (dateTo) where.createdAt.lte = new Date(dateTo as string);
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: offset,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          items: {
            select: {
              quantity: true,
              price: true,
              product: {
                select: {
                  name: true,
                  sku: true
                }
              }
            }
          }
        }
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    logError('Failed to fetch orders', error as Error, {
      service: 'admin-service',
      action: 'get_orders',
      userId: (req as any).user?.userId
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
    });
  }
});

// System logs endpoint
app.get('/api/v1/admin/logs', async (req, res) => {
  try {
    const { page = 1, limit = 50, level, service, dateFrom, dateTo } = req.query;
    
    // In production, this would read from actual log files or log aggregation service
    res.json({
      success: true,
      data: {
        logs: [
          {
            timestamp: new Date().toISOString(),
            level: 'info',
            service: 'auth-service',
            message: 'User login successful',
            metadata: { userId: 'user123' }
          },
          {
            timestamp: new Date().toISOString(),
            level: 'error',
            service: 'payment-service',
            message: 'Payment gateway timeout',
            metadata: { orderId: 'order456' }
          }
        ],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: 1000,
          pages: 20,
        },
      },
      message: 'Logs retrieved successfully (mock data)',
    });
  } catch (error) {
    logError('Failed to fetch system logs', error as Error, {
      service: 'admin-service',
      action: 'get_logs',
      userId: (req as any).user?.userId
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system logs',
    });
  }
});

// Error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logError('Unhandled admin service error', error, {
    service: 'admin-service',
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
    message: 'Endpoint not found',
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logInfo('Admin service shutting down gracefully', { service: 'admin-service' });
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logInfo('Admin service shutting down gracefully', { service: 'admin-service' });
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  logInfo(`Admin service running on port ${PORT}`, {
    service: 'admin-service',
    port: PORT,
    environment: env.NODE_ENV
  });
});
