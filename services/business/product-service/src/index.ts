/**
 * 🛍️ UltraMarket Product Service
 * Professional TypeScript Product Management Microservice
 * Enterprise-Grade E-Commerce Product Platform
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';
import Redis from 'redis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import shared libraries
import { logger } from '@ultramarket/shared/logging/logger';
import { errorHandler } from '@ultramarket/shared/middleware/error-handler';
import { validateEnvironment } from '@ultramarket/shared/validation/environment';

// Import local modules
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import brandRoutes from './routes/brand.routes';
import { connectDatabase } from './config/database';
import { initializeRedis } from './config/redis';
import { ProductService } from './services/product.service';

// Validate environment on startup
validateEnvironment('product-service');

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3003;
const HOST = process.env.HOST ?? 'localhost';

// Initialize services
let prisma: PrismaClient;
let redis: Redis.RedisClientType;
let productService: ProductService;

// ===== MIDDLEWARE SETUP =====

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(compression());

app.use(cors({
  origin: process.env.CORS_ORIGIN ?? '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000', 10), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? '1000', 10),
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook verification if needed
    (req as any).rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
});

// ===== HEALTH CHECK ENDPOINT =====

app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis connection
    await redis.ping();
    
    res.status(200).json({
      success: true,
      status: 'healthy',
      service: 'product-service',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION ?? '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: {
        database: 'connected',
        redis: 'connected'
      }
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      service: 'product-service',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// ===== METRICS ENDPOINT =====

app.get('/metrics', async (req, res) => {
  try {
    const metrics = await productService.getMetrics();
    res.status(200).json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get metrics', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get metrics',
      timestamp: new Date().toISOString()
    });
  }
});

// ===== API ROUTES =====

app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/brands', brandRoutes);

// ===== ERROR HANDLING =====

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// ===== DATABASE AND SERVICE INITIALIZATION =====

async function initializeServices() {
  try {
    logger.info('Initializing Product Service...');
    
    // Initialize Prisma
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error'] 
        : ['error'],
      errorFormat: 'pretty'
    });
    
    // Connect to database
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
    
    // Initialize Redis
    redis = await initializeRedis();
    logger.info('✅ Redis connected successfully');
    
    // Initialize Product Service
    productService = new ProductService(prisma, redis);
    logger.info('✅ Product Service initialized');
    
    // Generate Prisma client if needed
    if (process.env.NODE_ENV === 'development') {
      logger.info('Generating Prisma client...');
      // In production, this would be done during build
    }
    
    logger.info('🚀 All Product Service dependencies initialized successfully');
    
  } catch (error) {
    logger.error('❌ Failed to initialize Product Service', error);
    process.exit(1);
  }
}

// ===== START THE SERVICE =====

async function startServer() {
  try {
    await initializeServices();
    
    const server = createServer(app);
    
    server.listen(PORT, HOST, () => {
      logger.info('🚀 UltraMarket Product Service started successfully', {
        port: PORT,
        host: HOST,
        environment: process.env.NODE_ENV ?? 'development',
        urls: {
          service: `http://${HOST}:${PORT}`,
          health: `http://${HOST}:${PORT}/health`,
          products: `http://${HOST}:${PORT}/api/v1/products`,
          categories: `http://${HOST}:${PORT}/api/v1/categories`,
          brands: `http://${HOST}:${PORT}/api/v1/brands`,
          metrics: `http://${HOST}:${PORT}/metrics`
        },
        processId: process.pid,
        features: {
          database: 'PostgreSQL + Prisma',
          cache: 'Redis',
          search: 'Database + Optional Elasticsearch',
          imageProcessing: 'Sharp',
          validation: 'Zod + Express Validator',
          logging: 'Winston with structured logging'
        }
      });
    });
    
    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        try {
          logger.info('Closing HTTP server...');
          
          if (prisma) {
            logger.info('Disconnecting from database...');
            await prisma.$disconnect();
          }
          
          if (redis) {
            logger.info('Disconnecting from Redis...');
            await redis.quit();
          }
          
          logger.info('✅ All connections closed. Exiting gracefully...');
          process.exit(0);
        } catch (error) {
          logger.error('❌ Error during shutdown', error);
          process.exit(1);
        }
      });
      
      // Force exit after 30 seconds
      setTimeout(() => {
        logger.error('❌ Forced exit after timeout');
        process.exit(1);
      }, 30000);
    };
    
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', error);
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { reason, promise });
      process.exit(1);
    });
    
  } catch (error) {
    logger.error('❌ Failed to start Product Service', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;
