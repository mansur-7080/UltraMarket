import { Router, Request, Response } from 'express';
import { getMetrics } from '../middleware/metrics';

const router = Router();

// Basic health check
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    service: 'api-gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Detailed health check
router.get('/detailed', (req: Request, res: Response) => {
  const healthData = {
    status: 'OK',
    service: 'api-gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      user: process.env.USER_SERVICE_URL || 'http://localhost:3001',
      product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
      auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3003',
      order: process.env.ORDER_SERVICE_URL || 'http://localhost:3004',
      cart: process.env.CART_SERVICE_URL || 'http://localhost:3005',
      payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3006',
      notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007',
      search: process.env.SEARCH_SERVICE_URL || 'http://localhost:3008',
      analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3009',
    },
  };

  res.json(healthData);
});

// Readiness check
router.get('/ready', (req: Request, res: Response) => {
  // Check if all required environment variables are set
  const requiredEnvVars = ['JWT_SECRET'];
  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    res.status(503).json({
      status: 'NOT_READY',
      message: 'Missing required environment variables',
      missing: missingVars,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.json({
    status: 'READY',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
  });
});

// Liveness check
router.get('/live', (req: Request, res: Response) => {
  res.json({
    status: 'ALIVE',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
  });
});

// Metrics endpoint
router.get('/metrics', getMetrics);

export { router as healthRoutes };
