import { Router } from 'express';
import { testConnection } from '../config/database';

const router = Router();

/**
 * @route   GET /api/v1/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const dbStatus = await testConnection();

    const healthStatus = {
      service: 'UltraMarket User Service',
      version: '1.0.0',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: dbStatus ? 'healthy' : 'unhealthy',
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
    };

    const statusCode = dbStatus ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      service: 'UltraMarket User Service',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @route   GET /api/v1/health/ready
 * @desc    Readiness probe endpoint
 * @access  Public
 */
router.get('/ready', async (req, res) => {
  try {
    const dbStatus = await testConnection();

    if (dbStatus) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @route   GET /api/v1/health/live
 * @desc    Liveness probe endpoint
 * @access  Public
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * @route   GET /api/v1/health/metrics
 * @desc    Metrics endpoint for Prometheus
 * @access  Public
 */
router.get('/metrics', (req, res) => {
  const metrics = {
    // Process metrics
    process_cpu_usage: process.cpuUsage(),
    process_memory_usage: process.memoryUsage(),
    process_uptime: process.uptime(),

    // Node.js metrics
    node_version: process.version,
    node_platform: process.platform,
    node_arch: process.arch,

    // Environment metrics
    environment: process.env.NODE_ENV || 'development',
    pid: process.pid,

    // Custom metrics
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(metrics);
});

export default router;
