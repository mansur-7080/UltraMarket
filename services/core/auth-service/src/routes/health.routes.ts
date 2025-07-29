import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { redis } from '../index';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route GET /health
 * @desc Basic health check
 * @access Public
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const health = {
      status: 'healthy',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };

    res.status(200).json(health);
  } catch (error) {
    logger.error('Health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(503).json({
      status: 'unhealthy',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable',
    });
  }
});

/**
 * @route GET /health/detailed
 * @desc Detailed health check with dependencies
 * @access Public
 */
router.get('/detailed', async (req: Request, res: Response) => {
  const checks = {
    service: 'healthy',
    database: 'unknown',
    redis: 'unknown',
  };

  let overallStatus = 'healthy';

  try {
    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = 'healthy';
    } catch (error) {
      checks.database = 'unhealthy';
      overallStatus = 'unhealthy';
      logger.error('Database health check failed', { error });
    }

    // Check Redis connection
    try {
      await redis.ping();
      checks.redis = 'healthy';
    } catch (error) {
      checks.redis = 'unhealthy';
      overallStatus = 'unhealthy';
      logger.error('Redis health check failed', { error });
    }

    const health = {
      status: overallStatus,
      service: 'auth-service',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      checks,
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
      },
    };

    const statusCode = overallStatus === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Detailed health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(503).json({
      status: 'unhealthy',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable',
      checks,
    });
  }
});

/**
 * @route GET /health/ready
 * @desc Readiness probe
 * @access Public
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check if service is ready to accept requests
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();

    res.status(200).json({
      status: 'ready',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Readiness check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(503).json({
      status: 'not-ready',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
      error: 'Service not ready',
    });
  }
});

/**
 * @route GET /health/live
 * @desc Liveness probe
 * @access Public
 */
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export { router as healthRoutes };
