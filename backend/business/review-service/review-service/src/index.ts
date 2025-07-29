/**
 * UltraMarket Review Service
 * Professional review and rating management service
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';

// Routes
import reviewRoutes from './routes/review.routes';
import moderationRoutes from './routes/moderation.routes';
import analyticsRoutes from './routes/analytics.routes';
import healthRoutes from './routes/health.routes';

// Middleware
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/logger.middleware';
import { securityMiddleware } from './middleware/security.middleware';

// Utils
import { logger } from './utils/logger';
import { validateEnv } from './config/env.validation';
import { swaggerSpec } from './config/swagger';
import { connectDB } from './config/database';

// Load environment variables
dotenv.config();

// Validate environment variables
validateEnv();

const app = express();
const PORT = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 3010;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env['ALLOWED_ORIGINS']?.split(',') || ['http://localhost:3000'],
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Logging middleware
app.use(requestLogger);

// Security middleware
app.use(securityMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'review-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/moderation', moderationRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/health', healthRoutes);

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  server.close(() => {
    logger.info('HTTP server closed');
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after 10 seconds');
    process.exit(1);
  }, 10000);
};

// Start server
const server = app.listen(PORT, async () => {
  try {
    // Connect to database
    await connectDB();

    logger.info(`🚀 Review Service running on port ${PORT}`);
    logger.info(`📍 Environment: ${process.env['NODE_ENV'] || 'development'}`);
    logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    logger.info(`🔗 Health check: http://localhost:${PORT}/api/v1/health`);
    logger.info(`⭐ Reviews: http://localhost:${PORT}/api/v1/reviews`);
    logger.info(`🛡️ Moderation: http://localhost:${PORT}/api/v1/moderation`);
    logger.info(`📊 Analytics: http://localhost:${PORT}/api/v1/analytics`);
    logger.info(`💾 Database: MongoDB Connected`);
  } catch (error) {
    logger.error('Failed to start Review Service:', error);
    process.exit(1);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
