/**
 * 📊 METRICS ROUTES - UltraMarket Auth
 * 
 * Prometheus metrics endpoint
 * 
 * @author UltraMarket Development Team
 * @version 1.0.0
 * @date 2024-12-28
 */

import { Router, Request, Response } from 'express';
import { prometheusMetrics } from '../monitoring/prometheus.metrics';

const router = Router();

/**
 * GET /metrics
 * Prometheus metrics endpoint
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const metrics = await prometheusMetrics.getMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get metrics',
        code: 'METRICS_ERROR'
      }
    });
  }
});

/**
 * GET /metrics/json
 * Metrics in JSON format
 */
router.get('/json', async (req: Request, res: Response) => {
  try {
    const metrics = await prometheusMetrics.getMetricsJSON();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get metrics',
        code: 'METRICS_ERROR'
      }
    });
  }
});

export { router as metricsRoutes }; 