/**
 * UltraMarket File Service
 * Professional file management service with image processing and CDN integration
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import multer from 'multer';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';

// Routes
import fileRoutes from './routes/file.routes';
import uploadRoutes from './routes/upload.routes';
import imageRoutes from './routes/image.routes';
import healthRoutes from './routes/health.routes';

// Middleware
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/logger.middleware';
import { securityMiddleware } from './middleware/security.middleware';

// Utils
import { logger } from './utils/logger';
import { validateEnv } from './config/env.validation';
import { swaggerSpec } from './config/swagger';
import { connectStorage } from './config/storage';

// Load environment variables
dotenv.config();

// Validate environment variables
validateEnv();

const app = express();
const PORT = process.env.PORT || 3009;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  })
);

// Compression middleware
app.use(compression());

// Rate limiting for file operations
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs (file operations)
  message: {
    error: 'Too many file requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Special rate limiting for uploads
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each IP to 50 uploads per hour
  message: {
    error: 'Too many upload requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

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
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/upload', uploadLimiter, uploadRoutes);
app.use('/api/v1/images', imageRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'UltraMarket File Service',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      health: '/api/v1/health',
      files: '/api/v1/files',
      upload: '/api/v1/upload',
      images: '/api/v1/images',
    },
  });
});

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

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Close server
  server.close(() => {
    logger.info('HTTP server closed.');
  });

  try {
    // Close storage connections
    await connectStorage.close();
    logger.info('Storage connections closed.');

    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Start server
const server = app.listen(PORT, async () => {
  try {
    // Initialize storage connections
    await connectStorage();

    logger.info(`🚀 File Service running on port ${PORT}`);
    logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    logger.info(`🔗 Health check: http://localhost:${PORT}/api/v1/health`);
    logger.info(`📁 Files: http://localhost:${PORT}/api/v1/files`);
    logger.info(`⬆️ Upload: http://localhost:${PORT}/api/v1/upload`);
    logger.info(`🖼️ Images: http://localhost:${PORT}/api/v1/images`);
    logger.info(`💾 Storage: Connected`);
  } catch (error) {
    logger.error('Failed to start File Service:', error);
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
