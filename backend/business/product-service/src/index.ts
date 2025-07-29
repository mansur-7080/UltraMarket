/**
 * UltraMarket Product Service
 * Professional product catalog and inventory management service
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { validateEnvironmentOnStartup } from '@ultramarket/shared/validation/environment';
import { logger } from '@ultramarket/shared/logging/logger';
import { errorHandler } from '@ultramarket/shared/middleware/error-handler';
import { securityMiddleware } from '@ultramarket/shared/middleware/security';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import { connectDatabase } from './config/database';

// Validate environment on startup
validateEnvironmentOnStartup('product-service');

const app = express();
const PORT = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 3003;
const HOST = process.env['HOST'] ?? 'localhost';

// Security middleware
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: process.env['CORS_ORIGIN'] ?? '*',
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] ?? '900000', 10),
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] ?? '1000', 10),
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(securityMiddleware());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'product-service',
    timestamp: new Date().toISOString(),
    version: process.env['APP_VERSION'] ?? '1.0.0',
  });
});

// API routes
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Initialize database connection
async function startServer() {
  try {
    await connectDatabase();

    // Start server
    app.listen(PORT, HOST, () => {
      logger.info('Product service started successfully', {
        port: PORT,
        host: HOST,
        environment: process.env['NODE_ENV'] ?? 'development',
      });
    });
  } catch (error) {
    logger.error('Failed to start product service', { error });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

export default app;
