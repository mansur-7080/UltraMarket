/**
 * UltraMarket Product Service
 * Professional product catalog and inventory management service
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';

// Routes
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import inventoryRoutes from './routes/inventory.routes';
import reviewRoutes from './routes/review.routes';
import searchRoutes from './routes/search.routes';
import healthRoutes from './routes/health.routes';
import adminRoutes from './routes/admin.routes';
import enhancedProductRoutes from './routes/enhanced-product.routes';

// Middleware
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/logger.middleware';
import { securityMiddleware } from './middleware/security.middleware';

// Utils
import { logger } from './utils/logger';
import { validateEnv } from './config/env.validation';
import { swaggerSpec } from './config/swagger';

// Load environment variables
dotenv.config();

// Validate environment variables
validateEnv();

const app = express();
const PORT = process.env.PORT || 3003;

// Apply security middleware with enhanced configuration
app.use(helmet()); // Basic helmet configuration

// Set additional security headers
app.use((req, res, next) => {
  // Content-Security-Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://storage.ultramarket.uz; connect-src 'self' https://api.ultramarket.uz; font-src 'self' https://fonts.gstatic.com; object-src 'none'; media-src 'self'; frame-src 'none'"
  );

  // HSTS - Force HTTPS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'no-referrer');

  // Prevent XSS
  res.setHeader('X-XSS-Protection', '1; mode=block');

  next();
});

// Configure CORS with secure settings
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn('CORS blocked request', { origin });
        callback(new Error('CORS policy violation'), false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'Content-Disposition'],
    credentials: true,
    maxAge: 86400, // 24 hours
  })
);

// Compression middleware with security consideration
app.use(compression({ level: 6, threshold: 1024 })); // Only compress responses larger than 1KB

// Configure rate limiting with different rules for different endpoints
const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS', // Skip preflight requests
});

// More restrictive rate limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Limit each IP to 10 auth attempts per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later',
    },
  },
});

// Apply rate limiters
app.use('/api/v1/auth', authLimiter);
app.use(standardLimiter);

// Apply custom security middleware
app.use(securityMiddleware);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/enhanced-products', enhancedProductRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/admin', adminRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use(errorHandler);

/**
 * Connect to MongoDB with professional error handling and retry logic
 */
const connectDB = async () => {
  const maxRetries = 5;
  let retries = 0;
  let connected = false;

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    logger.error('MONGODB_URI environment variable is not defined');
    throw new Error('MONGODB_URI environment variable is required');
  }

  // Configure mongoose
  mongoose.set('strictQuery', true);

  // Set up connection monitoring
  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connection established');
    connected = true;
  });

  mongoose.connection.on('disconnected', () => {
    if (connected) {
      logger.warn('MongoDB connection lost. Attempting to reconnect...');
    }
  });

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error', {
      error: err.message,
      stack: err.stack,
    });
  });

  // Connection with retry logic
  while (!connected && retries < maxRetries) {
    try {
      if (retries > 0) {
        logger.info(`Retrying MongoDB connection (${retries}/${maxRetries})...`);
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retries - 1) * 1000));
      }

      await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4, // Use IPv4, skip trying IPv6
        connectTimeoutMS: 10000,
        // Add heartbeat to detect connection issues early
        heartbeatFrequencyMS: 10000,
        // Don't buffer commands during reconnect
        bufferCommands: false,
      });

      logger.info('✅ Successfully connected to MongoDB');
      connected = true;
    } catch (error) {
      retries++;
      logger.error(`❌ MongoDB connection attempt ${retries} failed:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount: retries,
        maxRetries,
      });

      if (retries >= maxRetries) {
        logger.error('Failed to connect to MongoDB after maximum retries');
        throw new Error('Failed to connect to MongoDB after maximum retries');
      }
    }
  }
};

/**
 * Professional graceful shutdown with controlled process termination
 * Ensures all connections are properly closed and pending requests completed
 */
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`, { signal });

  // Set a timeout to force shutdown if graceful shutdown takes too long
  const forceShutdownTimeout = setTimeout(() => {
    logger.error('Graceful shutdown timed out after 30s, forcing exit');
    process.exit(1);
  }, 30000); // 30 seconds timeout

  let exitCode = 0;

  try {
    // Stop accepting new connections but finish existing requests
    logger.info('Closing HTTP server - no longer accepting new connections');
    await new Promise<void>((resolve) => {
      server.close((err) => {
        if (err) {
          logger.error('Error closing HTTP server:', { error: err.message });
          exitCode = 1;
        } else {
          logger.info('HTTP server closed successfully');
        }
        resolve();
      });
    });

    // Close MongoDB connection
    if (mongoose.connection.readyState !== 0) {
      logger.info('Closing MongoDB connection');
      await mongoose.connection.close(false); // false means don't force close
      logger.info('MongoDB connection closed successfully');
    }

    // Close any other connections (Redis, etc.)
    // if (redisClient) {
    //   logger.info('Closing Redis connection');
    //   await redisClient.quit();
    //   logger.info('Redis connection closed successfully');
    // }

    // Log successful shutdown
    logger.info('Graceful shutdown completed successfully', {
      shutdownDuration: `${Date.now() - new Date().getTime()}ms`,
      signal,
    });

    // Clear the force shutdown timeout
    clearTimeout(forceShutdownTimeout);

    // Exit with appropriate code
    process.exit(exitCode);
  } catch (error) {
    logger.error('Error during graceful shutdown:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      signal,
    });

    // Clear the force shutdown timeout
    clearTimeout(forceShutdownTimeout);

    process.exit(1);
  }
};

// Start server
const server = app.listen(PORT, async () => {
  try {
    // Connect to database
    await connectDB();

    logger.info(`🚀 Product Service running on port ${PORT}`);
    logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    logger.info(`🔗 Health check: http://localhost:${PORT}/api/v1/health`);
    logger.info(`💾 MongoDB: ${process.env.MONGODB_URI ? 'Connected' : 'Not configured'}`);
  } catch (error) {
    logger.error('Failed to start Product Service:', error);
    process.exit(1);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

export default app;
