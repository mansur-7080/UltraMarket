import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { createClient } from 'redis';
import { PrismaClient } from '@prisma/client';
import { logger } from './utils/logger';

// Import routes
import { authRoutes } from './routes/auth.routes';
import { healthRoutes } from './routes/health.routes';

// Initialize Prisma and Redis clients
const prisma = new PrismaClient({
  log: ['warn', 'error']
});

const redis = createClient({
  url: process.env['REDIS_URL'] || 'redis://localhost:6379'
});

// Create Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env['CORS_ORIGIN']?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request processed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });

  next();
});

// Health check routes
app.use('/health', healthRoutes);

// API routes
app.use('/api/v1/auth', authRoutes);

// 404 handler
app.use('*', (req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });
  
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'ROUTE_NOT_FOUND',
      path: req.originalUrl
    }
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    ip: req.ip
  });

  const isDevelopment = process.env['NODE_ENV'] === 'development';
  
  res.status(500).json({
    success: false,
    error: {
      message: isDevelopment ? error.message : 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
      ...(isDevelopment && { stack: error.stack })
    }
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    await prisma.$disconnect();
    logger.info('Database connections closed');
    
    await redis.quit();
    logger.info('Redis connections closed');
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error });
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

// Initialize connections
const initializeConnections = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Test Redis connection
    await redis.connect();
    logger.info('Redis connected successfully');

    // Start server
    const port = parseInt(process.env['PORT'] || '3001');
    const host = process.env['HOST'] || '0.0.0.0';
    
    app.listen(port, host, () => {
      logger.info(`🚀 Auth Service started successfully!`);
      logger.info(`📍 Environment: ${process.env['NODE_ENV'] || 'development'}`);
      logger.info(`🌐 Server: http://${host}:${port}`);
      logger.info(`💚 Health Check: http://${host}:${port}/health`);
      logger.info(`👤 Process ID: ${process.pid}`);
    });

  } catch (error) {
    logger.error('Failed to initialize connections', { error });
    process.exit(1);
  }
};

// Start the application
initializeConnections(); 