/**
 * UltraMarket API Gateway
 * Professional API Gateway with routing, load balancing, and security
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { validateEnvironmentOnStartup } from '@ultramarket/shared/validation/environment';
import { logger } from '@ultramarket/shared/logging/logger';
import { errorHandler } from '@ultramarket/shared/middleware/error-handler';
import { securityMiddleware } from '@ultramarket/shared/middleware/security';
import { validateToken } from '@ultramarket/shared/auth/jwt';

// Validate environment on startup
validateEnvironmentOnStartup('api-gateway');

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = process.env.HOST ?? 'localhost';

// Service configurations
const services = {
  auth: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3002',
    health: '/health',
  },
  user: {
    url: process.env.USER_SERVICE_URL || 'http://localhost:3001',
    health: '/health',
  },
  product: {
    url: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003',
    health: '/health',
  },
  order: {
    url: process.env.ORDER_SERVICE_URL || 'http://localhost:3004',
    health: '/health',
  },
  payment: {
    url: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005',
    health: '/health',
  },
  search: {
    url: process.env.SEARCH_SERVICE_URL || 'http://localhost:3006',
    health: '/health',
  },
  notification: {
    url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007',
    health: '/health',
  },
  analytics: {
    url: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3008',
    health: '/health',
  },
};

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? '*',
    credentials: true,
  })
);

// Compression middleware
app.use(compression());

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? '1000', 10),
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});
app.use(globalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(securityMiddleware());

// Request logging middleware
app.use((req, res, next) => {
  logger.info('API Gateway Request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION ?? '1.0.0',
  });
});

// Service health check
app.get('/health/services', async (req, res) => {
  try {
    const healthChecks = await Promise.allSettled(
      Object.entries(services).map(async ([name, service]) => {
        try {
          const response = await fetch(`${service.url}${service.health}`);
          const data = await response.json();
          return {
            name,
            status: response.ok ? 'healthy' : 'unhealthy',
            data,
          };
        } catch (error) {
          return {
            name,
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    const results = healthChecks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        const serviceName = Object.keys(services)[index];
        return {
          name: serviceName,
          status: 'unhealthy',
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
        };
      }
    });

    const allHealthy = results.every((result) => result.status === 'healthy');

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'degraded',
      services: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Service health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      status: 'error',
      message: 'Failed to check service health',
    });
  }
});

// API Documentation
app.get('/api/docs', (req, res) => {
  res.json({
    message: 'UltraMarket API Documentation',
    version: '1.0.0',
    endpoints: {
      auth: {
        base: '/api/v1/auth',
        endpoints: [
          'POST /register - Register new user',
          'POST /login - User login',
          'POST /refresh - Refresh token',
          'POST /logout - User logout',
          'GET /profile - Get user profile',
          'PUT /profile - Update user profile',
        ],
      },
      products: {
        base: '/api/v1/products',
        endpoints: [
          'GET / - Get all products',
          'GET /:id - Get product by ID',
          'GET /sku/:sku - Get product by SKU',
          'GET /featured/list - Get featured products',
          'GET /category/:categoryId - Get products by category',
          'POST / - Create product (Admin)',
          'PUT /:id - Update product (Admin)',
          'DELETE /:id - Delete product (Admin)',
        ],
      },
      categories: {
        base: '/api/v1/categories',
        endpoints: [
          'GET / - Get all categories',
          'GET /tree - Get category tree',
          'GET /root - Get root categories',
          'GET /:id - Get category by ID',
          'GET /slug/:slug - Get category by slug',
          'GET /:id/children - Get child categories',
          'GET /:id/stats - Get category statistics',
          'POST / - Create category (Admin)',
          'PUT /:id - Update category (Admin)',
          'DELETE /:id - Delete category (Admin)',
        ],
      },
      search: {
        base: '/api/v1/search',
        endpoints: [
          'GET /products - Search products',
          'GET /categories - Search categories',
          'GET /autocomplete/products - Product autocomplete',
          'GET /autocomplete/categories - Category autocomplete',
          'GET /suggestions - Get search suggestions',
          'GET /analytics - Get search analytics',
        ],
      },
      orders: {
        base: '/api/v1/orders',
        endpoints: [
          'GET / - Get user orders',
          'GET /:id - Get order by ID',
          'POST / - Create order',
          'PUT /:id - Update order',
          'DELETE /:id - Cancel order',
        ],
      },
      cart: {
        base: '/api/v1/cart',
        endpoints: [
          'GET / - Get user cart',
          'POST /items - Add item to cart',
          'PUT /items/:id - Update cart item',
          'DELETE /items/:id - Remove item from cart',
          'DELETE / - Clear cart',
        ],
      },
      checkout: {
        base: '/api/v1/checkout',
        endpoints: [
          'POST / - Process checkout',
          'POST /validate - Validate checkout',
          'GET /shipping - Get shipping options',
          'GET /payment-methods - Get payment methods',
        ],
      },
    },
  });
});

// Authentication routes
app.use(
  '/api/v1/auth',
  createProxyMiddleware({
    target: services.auth.url,
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/auth': '/api/v1/auth',
    },
    onError: (err, req, res) => {
      logger.error('Auth service proxy error', { error: err.message });
      res.status(503).json({
        success: false,
        message: 'Authentication service unavailable',
      });
    },
  })
);

// Product routes
app.use(
  '/api/v1/products',
  createProxyMiddleware({
    target: services.product.url,
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/products': '/api/v1/products',
    },
    onError: (err, req, res) => {
      logger.error('Product service proxy error', { error: err.message });
      res.status(503).json({
        success: false,
        message: 'Product service unavailable',
      });
    },
  })
);

// Category routes
app.use(
  '/api/v1/categories',
  createProxyMiddleware({
    target: services.product.url,
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/categories': '/api/v1/categories',
    },
    onError: (err, req, res) => {
      logger.error('Category service proxy error', { error: err.message });
      res.status(503).json({
        success: false,
        message: 'Category service unavailable',
      });
    },
  })
);

// Search routes
app.use(
  '/api/v1/search',
  createProxyMiddleware({
    target: services.product.url,
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/search': '/api/v1/search',
    },
    onError: (err, req, res) => {
      logger.error('Search service proxy error', { error: err.message });
      res.status(503).json({
        success: false,
        message: 'Search service unavailable',
      });
    },
  })
);

// Order routes (protected)
app.use(
  '/api/v1/orders',
  validateToken,
  createProxyMiddleware({
    target: services.order.url,
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/orders': '/api/v1/orders',
    },
    onError: (err, req, res) => {
      logger.error('Order service proxy error', { error: err.message });
      res.status(503).json({
        success: false,
        message: 'Order service unavailable',
      });
    },
  })
);

// Cart routes (protected)
app.use(
  '/api/v1/cart',
  validateToken,
  createProxyMiddleware({
    target: services.order.url,
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/cart': '/api/v1/cart',
    },
    onError: (err, req, res) => {
      logger.error('Cart service proxy error', { error: err.message });
      res.status(503).json({
        success: false,
        message: 'Cart service unavailable',
      });
    },
  })
);

// Checkout routes (protected)
app.use(
  '/api/v1/checkout',
  validateToken,
  createProxyMiddleware({
    target: services.order.url,
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/checkout': '/api/v1/checkout',
    },
    onError: (err, req, res) => {
      logger.error('Checkout service proxy error', { error: err.message });
      res.status(503).json({
        success: false,
        message: 'Checkout service unavailable',
      });
    },
  })
);

// Payment routes (protected)
app.use(
  '/api/v1/payments',
  validateToken,
  createProxyMiddleware({
    target: services.payment.url,
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/payments': '/api/v1/payments',
    },
    onError: (err, req, res) => {
      logger.error('Payment service proxy error', { error: err.message });
      res.status(503).json({
        success: false,
        message: 'Payment service unavailable',
      });
    },
  })
);

// Notification routes (protected)
app.use(
  '/api/v1/notifications',
  validateToken,
  createProxyMiddleware({
    target: services.notification.url,
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/notifications': '/api/v1/notifications',
    },
    onError: (err, req, res) => {
      logger.error('Notification service proxy error', { error: err.message });
      res.status(503).json({
        success: false,
        message: 'Notification service unavailable',
      });
    },
  })
);

// Analytics routes (protected)
app.use(
  '/api/v1/analytics',
  validateToken,
  createProxyMiddleware({
    target: services.analytics.url,
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/analytics': '/api/v1/analytics',
    },
    onError: (err, req, res) => {
      logger.error('Analytics service proxy error', { error: err.message });
      res.status(503).json({
        success: false,
        message: 'Analytics service unavailable',
      });
    },
  })
);

// Admin routes (protected)
app.use(
  '/api/v1/admin',
  validateToken,
  createProxyMiddleware({
    target: services.product.url,
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/admin': '/api/v1/admin',
    },
    onError: (err, req, res) => {
      logger.error('Admin service proxy error', { error: err.message });
      res.status(503).json({
        success: false,
        message: 'Admin service unavailable',
      });
    },
  })
);

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

// Start server
app.listen(PORT, HOST, () => {
  logger.info('API Gateway started successfully', {
    port: PORT,
    host: HOST,
    environment: process.env.NODE_ENV ?? 'development',
  });

  logger.info('Service configurations', {
    auth: services.auth.url,
    product: services.product.url,
    order: services.order.url,
    payment: services.payment.url,
    search: services.search.url,
    notification: services.notification.url,
    analytics: services.analytics.url,
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
