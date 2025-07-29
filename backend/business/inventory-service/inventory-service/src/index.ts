/**
 * UltraMarket Inventory Service
 * Professional inventory management with real-time stock tracking and alerts
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { Server } from 'socket.io';
import { createServer } from 'http';
import Bull from 'bull';

// Routes
import inventoryRoutes from './routes/inventory.routes';
import stockRoutes from './routes/stock.routes';
import alertRoutes from './routes/alert.routes';
import healthRoutes from './routes/health.routes';
import analyticsRoutes from './routes/analytics.routes';
import warehouseRoutes from './routes/warehouse.routes';

// Middleware
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/logger.middleware';
import { authMiddleware } from './middleware/auth.middleware';
import { validateInventory } from './middleware/validation.middleware';

// Services
import { InventoryService } from './services/inventory.service';
import { StockService } from './services/stock.service';
import { AlertService } from './services/alert.service';
import { WarehouseService } from './services/warehouse.service';
import { ReportService } from './services/report.service';
import { QueueService } from './services/queue.service';

// Utils
import { logger } from './utils/logger';
import { validateEnv } from './config/env.validation';
import { swaggerSpec } from './config/swagger';

// Load environment variables
dotenv.config();

// Validate environment variables
validateEnv();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3008;

// Initialize clients
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Initialize Bull queues
const stockUpdateQueue = new Bull(
  'stock updates',
  process.env.REDIS_URL || 'redis://localhost:6379'
);
const alertQueue = new Bull('inventory alerts', process.env.REDIS_URL || 'redis://localhost:6379');
const reportQueue = new Bull(
  'inventory reports',
  process.env.REDIS_URL || 'redis://localhost:6379'
);

// Initialize services
const warehouseService = new WarehouseService(prisma, redisClient);
const stockService = new StockService(prisma, redisClient, io);
const alertService = new AlertService(prisma, redisClient, io);
const reportService = new ReportService(prisma, redisClient);
const queueService = new QueueService(stockUpdateQueue, alertQueue, reportQueue);
const inventoryService = new InventoryService(
  prisma,
  redisClient,
  stockService,
  alertService,
  warehouseService,
  reportService,
  queueService,
  io
);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'wss:', 'ws:'],
      },
    },
  })
);

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Rate limiting with different limits for different endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Higher limit for inventory operations
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const inventoryLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // Limit inventory updates
  message: {
    success: false,
    message: 'Too many inventory requests, please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/v1/inventory', inventoryLimiter);
app.use('/api/v1/stock', inventoryLimiter);
app.use(generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Logging middleware
app.use(requestLogger);

// API Documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'UltraMarket Inventory Service API',
  })
);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    // Check Redis connection
    await redisClient.ping();

    // Check queue health
    const queueHealth = await queueService.getQueueHealth();

    // Check warehouse connectivity
    const warehouseHealth = await warehouseService.checkConnectivity();

    res.status(200).json({
      success: true,
      message: 'Inventory Service is healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'connected',
        redis: 'connected',
        queues: queueHealth,
        warehouses: warehouseHealth,
      },
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Service unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// API routes
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/stock', stockRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/warehouses', warehouseRoutes);
app.use('/api/v1/health', healthRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use(errorHandler);

// Socket.IO connection handling for real-time inventory updates
io.on('connection', (socket) => {
  logger.info('Client connected to inventory service', {
    socketId: socket.id,
    clientIP: socket.handshake.address,
  });

  // Join inventory rooms for real-time updates
  socket.on('join-inventory-updates', (warehouseId) => {
    if (warehouseId) {
      socket.join(`warehouse:${warehouseId}`);
      logger.info('Client joined warehouse room', {
        socketId: socket.id,
        warehouseId,
      });
    }
  });

  // Join product stock updates
  socket.on('join-product-stock', (productId) => {
    if (productId) {
      socket.join(`product:${productId}`);
      logger.info('Client joined product stock room', {
        socketId: socket.id,
        productId,
      });
    }
  });

  // Join alert notifications
  socket.on('join-alerts', (userId) => {
    if (userId) {
      socket.join(`alerts:${userId}`);
      logger.info('Client joined alerts room', {
        socketId: socket.id,
        userId,
      });
    }
  });

  // Leave rooms
  socket.on('leave-inventory-updates', (warehouseId) => {
    if (warehouseId) {
      socket.leave(`warehouse:${warehouseId}`);
    }
  });

  socket.on('leave-product-stock', (productId) => {
    if (productId) {
      socket.leave(`product:${productId}`);
    }
  });

  socket.on('leave-alerts', (userId) => {
    if (userId) {
      socket.leave(`alerts:${userId}`);
    }
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected from inventory service', {
      socketId: socket.id,
    });
  });
});

// Queue processors
stockUpdateQueue.process('update-stock', 10, async (job) => {
  const { productId, warehouseId, quantity, operation, metadata } = job.data;
  return await stockService.processStockUpdate(
    productId,
    warehouseId,
    quantity,
    operation,
    metadata
  );
});

alertQueue.process('send-alert', 5, async (job) => {
  const { alertData } = job.data;
  return await alertService.sendAlert(alertData);
});

reportQueue.process('generate-report', 2, async (job) => {
  const { reportType, parameters } = job.data;
  return await reportService.generateReport(reportType, parameters);
});

// Queue event handlers
stockUpdateQueue.on('completed', (job, result) => {
  logger.info('Stock update job completed', {
    jobId: job.id,
    result,
  });

  // Emit real-time update
  io.to(`product:${job.data.productId}`).emit('stock-updated', result);
  io.to(`warehouse:${job.data.warehouseId}`).emit('warehouse-updated', result);
});

stockUpdateQueue.on('failed', (job, err) => {
  logger.error('Stock update job failed', {
    jobId: job.id,
    error: err.message,
  });
});

alertQueue.on('completed', (job, result) => {
  logger.info('Alert job completed', {
    jobId: job.id,
    result,
  });
});

alertQueue.on('failed', (job, err) => {
  logger.error('Alert job failed', {
    jobId: job.id,
    error: err.message,
  });
});

reportQueue.on('completed', (job, result) => {
  logger.info('Report generation job completed', {
    jobId: job.id,
    reportType: job.data.reportType,
  });
});

reportQueue.on('failed', (job, err) => {
  logger.error('Report generation job failed', {
    jobId: job.id,
    error: err.message,
  });
});

// Scheduled tasks
setInterval(
  async () => {
    try {
      // Check for low stock alerts
      await alertService.checkLowStockAlerts();

      // Update inventory analytics
      await inventoryService.updateAnalytics();

      // Clean up old data
      await inventoryService.cleanupOldData();

      logger.debug('Scheduled inventory tasks completed');
    } catch (error) {
      logger.error('Scheduled inventory tasks failed:', error);
    }
  },
  5 * 60 * 1000
); // Every 5 minutes

// Daily reports
setInterval(
  async () => {
    try {
      await reportService.generateDailyReports();
      logger.info('Daily inventory reports generated');
    } catch (error) {
      logger.error('Daily report generation failed:', error);
    }
  },
  24 * 60 * 60 * 1000
); // Every 24 hours

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  server.close(async () => {
    try {
      // Close Bull queues
      await stockUpdateQueue.close();
      await alertQueue.close();
      await reportQueue.close();

      // Close database connections
      await prisma.$disconnect();
      await redisClient.quit();

      logger.info('Inventory Service shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async () => {
  try {
    // Connect to Redis
    await redisClient.connect();
    logger.info('✅ Redis connected successfully');

    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    // Initialize services
    await inventoryService.initialize();
    await warehouseService.initialize();
    await stockService.initialize();
    await alertService.initialize();

    // Start queue monitoring
    await queueService.startMonitoring();

    server.listen(PORT, () => {
      logger.info(`🚀 Inventory Service running on port ${PORT}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      logger.info(`📦 Inventory: http://localhost:${PORT}/api/v1/inventory`);
      logger.info(`📊 Stock: http://localhost:${PORT}/api/v1/stock`);
      logger.info(`🚨 Alerts: http://localhost:${PORT}/api/v1/alerts`);
      logger.info(`📈 Analytics: http://localhost:${PORT}/api/v1/analytics`);
      logger.info(`🏭 Warehouses: http://localhost:${PORT}/api/v1/warehouses`);
      logger.info(`⚡ Real-time: WebSocket on port ${PORT}`);
      logger.info(`💾 Database: PostgreSQL Connected`);
      logger.info(`🔄 Cache: Redis Connected`);
      logger.info(`📬 Queues: Stock, Alerts, Reports Active`);
      logger.info(`🏪 Warehouses: Multi-warehouse support`);
      logger.info(`🚨 Alerts: Low stock, Out of stock, Reorder`);
      logger.info(`📊 Analytics: Real-time inventory insights`);
    });
  } catch (error) {
    logger.error('Failed to start Inventory Service:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export {
  app,
  server,
  io,
  prisma,
  redisClient,
  inventoryService,
  stockService,
  alertService,
  warehouseService,
  reportService,
  queueService,
  stockUpdateQueue,
  alertQueue,
  reportQueue,
};
