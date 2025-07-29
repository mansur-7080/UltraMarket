import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Create metrics
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
});

// Register default metrics
client.register.setDefaultLabels({
  service: 'api-gateway',
});

// Collect default metrics
client.collectDefaultMetrics();

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Increment active connections
  activeConnections.inc();

  // Override res.end to capture metrics
  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any) {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path;

    // Record metrics
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode,
      },
      duration
    );

    // Decrement active connections
    activeConnections.dec();

    // Call original end
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Metrics endpoint
export const getMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const metrics = await client.register.metrics();
    res.set('Content-Type', client.register.contentType);
    res.end(metrics);
  } catch (error) {
    res.status(500).end('Error collecting metrics');
  }
};
