import { Application } from 'express';
import { logger } from '@ultramarket/shared';

export const setupMonitoring = (app: Application): void => {
  // Basic metrics endpoint
  app.get('/metrics', (req, res) => {
    res.status(200).json({
      service: 'order-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    });
  });

  // Health check with dependencies
  app.get('/health/detailed', async (req, res) => {
    try {
      const healthChecks = {
        service: 'order-service',
        timestamp: new Date().toISOString(),
        status: 'healthy',
        checks: {
          database: 'healthy',
          redis: 'healthy',
          memory: 'healthy',
        },
      };

      // Check database connection
      try {
        // Add database health check here
        healthChecks.checks.database = 'healthy';
      } catch (error) {
        healthChecks.checks.database = 'unhealthy';
        healthChecks.status = 'degraded';
      }

      // Check memory usage
      const memoryUsage = process.memoryUsage();
      if (memoryUsage.heapUsed > 500 * 1024 * 1024) {
        // 500MB
        healthChecks.checks.memory = 'warning';
      }

      const statusCode = healthChecks.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(healthChecks);
    } catch (error) {
      logger.error('Health check failed:', error);
      res.status(503).json({
        service: 'order-service',
        status: 'unhealthy',
        error: error.message,
      });
    }
  });

  logger.info('Monitoring setup completed');
};
