/**
 * 🌐 UltraMarket API Gateway
 * Professional TypeScript API Gateway Microservice
 * Enterprise-Grade Service Mesh Communication
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { createProxyMiddleware, responseInterceptor } from 'http-proxy-middleware';
import Redis from 'redis';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ===== TYPESCRIPT INTERFACES & TYPES =====

interface ServiceConfig {
  name: string;
  url: string;
  path: string;
  health: string;
  timeout: number;
  retries: number;
  priority: number;
  version: string;
  tags: string[];
  authentication: boolean;
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

interface ServiceInstance {
  id: string;
  config: ServiceConfig;
  status: ServiceStatus;
  metrics: ServiceMetrics;
  circuitBreaker: CircuitBreakerState;
}

interface ServiceStatus {
  status: 'healthy' | 'unhealthy' | 'degraded' | 'unknown';
  lastCheck: Date;
  responseTime: number;
  errorRate: number;
  uptime: number;
  version?: string;
  metadata?: Record<string, any>;
}

interface ServiceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastResponseTime: number;
  requestsPerSecond: number;
  errorsPerSecond: number;
  lastRequestTime: Date;
}

interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  successCount: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
  threshold: number;
  timeout: number;
}

interface ProxyRequest extends Request {
  correlationId: string;
  user?: any;
  startTime: number;
  service?: string;
  route?: string;
}

interface GatewayMetrics {
  totalRequests: number;
  activeConnections: number;
  responseTimeP95: number;
  errorRate: number;
  throughput: number;
  cacheHitRate: number;
  serviceDiscoveryUpdates: number;
}

interface RouteConfig {
  path: string;
  service: string;
  methods: string[];
  authentication: boolean;
  rateLimit?: {
    windowMs: number;
    max: number;
  };
  cache?: {
    ttl: number;
    strategy: 'memory' | 'redis';
  };
  transform?: {
    request?: (req: any) => any;
    response?: (res: any) => any;
  };
}

enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

// ===== CONFIGURATION =====

const CONFIG = {
  GATEWAY: {
    PORT: parseInt(process.env.GATEWAY_PORT || '3000'),
    NAME: 'ultramarket-api-gateway',
    VERSION: '2.0.0',
    ENVIRONMENT: process.env.NODE_ENV || 'development'
  },
  SECURITY: {
    JWT_SECRET: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
    CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
    RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100')
  },
  SERVICES: {
    DISCOVERY_INTERVAL: parseInt(process.env.SERVICE_DISCOVERY_INTERVAL || '30000'), // 30 seconds
    HEALTH_CHECK_INTERVAL: parseInt(process.env.HEALTH_CHECK_INTERVAL || '10000'), // 10 seconds
    CIRCUIT_BREAKER_THRESHOLD: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || '5'),
    CIRCUIT_BREAKER_TIMEOUT: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT || '60000') // 1 minute
  },
  CACHE: {
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    DEFAULT_TTL: parseInt(process.env.CACHE_TTL || '300'), // 5 minutes
    KEY_PREFIX: 'ultramarket:gateway:'
  }
};

// ===== SERVICE REGISTRY =====

const SERVICE_REGISTRY: Map<string, ServiceInstance[]> = new Map();

const registerService = (config: ServiceConfig): ServiceInstance => {
  const instance: ServiceInstance = {
    id: crypto.randomBytes(8).toString('hex'),
    config,
    status: {
      status: 'unknown',
      lastCheck: new Date(),
      responseTime: 0,
      errorRate: 0,
      uptime: 0
    },
    metrics: {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastResponseTime: 0,
      requestsPerSecond: 0,
      errorsPerSecond: 0,
      lastRequestTime: new Date()
    },
    circuitBreaker: {
      state: 'CLOSED',
      failureCount: 0,
      successCount: 0,
      threshold: CONFIG.SERVICES.CIRCUIT_BREAKER_THRESHOLD,
      timeout: CONFIG.SERVICES.CIRCUIT_BREAKER_TIMEOUT
    }
  };

  const serviceName = config.name;
  if (!SERVICE_REGISTRY.has(serviceName)) {
    SERVICE_REGISTRY.set(serviceName, []);
  }
  SERVICE_REGISTRY.get(serviceName)!.push(instance);

  return instance;
};

// Register core services
const CORE_SERVICES: ServiceConfig[] = [
  {
    name: 'auth-service',
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    path: '/auth',
    health: '/health',
    timeout: 5000,
    retries: 3,
    priority: 1,
    version: '2.0.0',
    tags: ['core', 'authentication'],
    authentication: false
  },
  {
    name: 'user-service',
    url: process.env.USER_SERVICE_URL || 'http://localhost:3002',
    path: '/users',
    health: '/health',
    timeout: 5000,
    retries: 3,
    priority: 1,
    version: '1.0.0',
    tags: ['core', 'user-management'],
    authentication: true
  },
  {
    name: 'product-service',
    url: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003',
    path: '/products',
    health: '/health',
    timeout: 5000,
    retries: 3,
    priority: 2,
    version: '1.0.0',
    tags: ['business', 'catalog'],
    authentication: false,
    rateLimit: {
      windowMs: 60000, // 1 minute
      max: 1000 // 1000 requests per minute
    }
  },
  {
    name: 'cart-service',
    url: process.env.CART_SERVICE_URL || 'http://localhost:3004',
    path: '/cart',
    health: '/health',
    timeout: 5000,
    retries: 3,
    priority: 2,
    version: '1.0.0',
    tags: ['business', 'shopping'],
    authentication: true
  },
  {
    name: 'order-service',
    url: process.env.ORDER_SERVICE_URL || 'http://localhost:3005',
    path: '/orders',
    health: '/health',
    timeout: 5000,
    retries: 3,
    priority: 1,
    version: '1.0.0',
    tags: ['business', 'orders'],
    authentication: true
  },
  {
    name: 'payment-service',
    url: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3006',
    path: '/payments',
    health: '/health',
    timeout: 10000, // Longer timeout for payments
    retries: 5,
    priority: 1,
    version: '1.0.0',
    tags: ['business', 'payments'],
    authentication: true
  },
  {
    name: 'notification-service',
    url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007',
    path: '/notifications',
    health: '/health',
    timeout: 5000,
    retries: 3,
    priority: 3,
    version: '1.0.0',
    tags: ['platform', 'notifications'],
    authentication: true
  },
  {
    name: 'analytics-service',
    url: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3008',
    path: '/analytics',
    health: '/health',
    timeout: 8000,
    retries: 3,
    priority: 3,
    version: '1.0.0',
    tags: ['analytics', 'insights'],
    authentication: true
  }
];

// ===== INITIALIZE SERVICES =====

// Express App
const app = express();

// Redis Client for caching
const redis = Redis.createClient({
  url: CONFIG.CACHE.REDIS_URL,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('Redis connection refused');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

// Logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-gateway' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new DailyRotateFile({
      filename: 'logs/api-gateway-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    }),
    new DailyRotateFile({
      level: 'error',
      filename: 'logs/api-gateway-error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d'
    })
  ]
});

// Gateway Metrics
const gatewayMetrics: GatewayMetrics = {
  totalRequests: 0,
  activeConnections: 0,
  responseTimeP95: 0,
  errorRate: 0,
  throughput: 0,
  cacheHitRate: 0,
  serviceDiscoveryUpdates: 0
};

// ===== UTILITY FUNCTIONS =====

const generateCorrelationId = (): string => {
  return `gw_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
};

const selectHealthyService = (serviceName: string): ServiceInstance | null => {
  const instances = SERVICE_REGISTRY.get(serviceName);
  if (!instances || instances.length === 0) {
    return null;
  }

  // Filter healthy instances
  const healthyInstances = instances.filter(
    instance => 
      instance.status.status === 'healthy' &&
      instance.circuitBreaker.state === 'CLOSED'
  );

  if (healthyInstances.length === 0) {
    return null;
  }

  // Load balancing: round-robin with weighted selection
  const totalWeight = healthyInstances.reduce((sum, instance) => {
    return sum + (instance.config.priority * (1 / (instance.status.responseTime + 1)));
  }, 0);

  let random = Math.random() * totalWeight;
  for (const instance of healthyInstances) {
    const weight = instance.config.priority * (1 / (instance.status.responseTime + 1));
    random -= weight;
    if (random <= 0) {
      return instance;
    }
  }

  return healthyInstances[0]; // Fallback
};

const updateCircuitBreaker = (instance: ServiceInstance, success: boolean): void => {
  const cb = instance.circuitBreaker;

  if (success) {
    cb.successCount++;
    if (cb.state === 'HALF_OPEN' && cb.successCount >= 3) {
      cb.state = 'CLOSED';
      cb.failureCount = 0;
      cb.successCount = 0;
    }
  } else {
    cb.failureCount++;
    cb.lastFailureTime = new Date();

    if (cb.state === 'CLOSED' && cb.failureCount >= cb.threshold) {
      cb.state = 'OPEN';
      cb.nextAttemptTime = new Date(Date.now() + cb.timeout);
    } else if (cb.state === 'HALF_OPEN') {
      cb.state = 'OPEN';
      cb.nextAttemptTime = new Date(Date.now() + cb.timeout);
    }
  }

  // Auto-transition from OPEN to HALF_OPEN
  if (cb.state === 'OPEN' && cb.nextAttemptTime && Date.now() >= cb.nextAttemptTime.getTime()) {
    cb.state = 'HALF_OPEN';
    cb.successCount = 0;
  }
};

// ===== MIDDLEWARE =====

// Request correlation and timing
app.use((req: ProxyRequest, res: Response, next: NextFunction) => {
  req.correlationId = req.headers['x-correlation-id'] as string || generateCorrelationId();
  req.startTime = performance.now();

  res.setHeader('X-Correlation-ID', req.correlationId);
  res.setHeader('X-Gateway-Version', CONFIG.GATEWAY.VERSION);

  gatewayMetrics.totalRequests++;
  gatewayMetrics.activeConnections++;

  // Log request
  logger.info('Gateway request', {
    correlationId: req.correlationId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.on('finish', () => {
    gatewayMetrics.activeConnections--;
    const responseTime = performance.now() - req.startTime;
    
    logger.info('Gateway response', {
      correlationId: req.correlationId,
      statusCode: res.statusCode,
      responseTime: `${responseTime.toFixed(2)}ms`,
      service: req.service,
      route: req.route
    });
  });

  next();
});

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
  origin: CONFIG.SECURITY.CORS_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Correlation-ID',
    'Accept',
    'Origin',
    'Cache-Control'
  ],
  exposedHeaders: ['X-Correlation-ID', 'X-Gateway-Version', 'X-Cache-Status']
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ 
  limit: '10mb',
  type: ['application/json', 'text/plain']
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: CONFIG.SECURITY.RATE_LIMIT_WINDOW,
  max: CONFIG.SECURITY.RATE_LIMIT_MAX,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later',
    retryAfter: CONFIG.SECURITY.RATE_LIMIT_WINDOW / 1000
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test'
});

app.use('/api', globalLimiter);

// ===== AUTHENTICATION MIDDLEWARE =====

const authenticateToken = async (req: ProxyRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        correlationId: req.correlationId
      });
    }

    // Verify with auth service
    const authService = selectHealthyService('auth-service');
    if (!authService) {
      return res.status(503).json({
        success: false,
        error: 'Authentication service unavailable',
        correlationId: req.correlationId
      });
    }

    const verifyResponse = await fetch(`${authService.config.url}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Correlation-ID': req.correlationId
      },
      signal: AbortSignal.timeout(authService.config.timeout)
    });

    if (!verifyResponse.ok) {
      updateCircuitBreaker(authService, false);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        correlationId: req.correlationId
      });
    }

    const authData = await verifyResponse.json();
    updateCircuitBreaker(authService, true);

    req.user = authData.data.user;
    next();
  } catch (error) {
    logger.error('Authentication error', {
      correlationId: req.correlationId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Authentication service error',
      correlationId: req.correlationId
    });
  }
};

// ===== CACHING MIDDLEWARE =====

const cacheMiddleware = (ttl: number = CONFIG.CACHE.DEFAULT_TTL) => {
  return async (req: ProxyRequest, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `${CONFIG.CACHE.KEY_PREFIX}${req.url}`;

    try {
      const cachedResponse = await redis.get(cacheKey);
      if (cachedResponse) {
        gatewayMetrics.cacheHitRate++;
        res.setHeader('X-Cache-Status', 'HIT');
        return res.json(JSON.parse(cachedResponse));
      }

      res.setHeader('X-Cache-Status', 'MISS');

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(body: any) {
        if (res.statusCode === 200) {
          redis.setEx(cacheKey, ttl, JSON.stringify(body));
        }
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      logger.warn('Cache error', { error: error.message });
      next();
    }
  };
};

// ===== SERVICE HEALTH MONITORING =====

const checkServiceHealth = async (instance: ServiceInstance): Promise<boolean> => {
  const startTime = performance.now();

  try {
    const response = await fetch(`${instance.config.url}${instance.config.health}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(instance.config.timeout)
    });

    const responseTime = performance.now() - startTime;

    if (response.ok) {
      const healthData = await response.json();
      
      instance.status = {
        status: 'healthy',
        lastCheck: new Date(),
        responseTime,
        errorRate: 0,
        uptime: healthData.uptime || 0,
        version: healthData.version,
        metadata: healthData
      };

      updateCircuitBreaker(instance, true);
      return true;
    } else {
      throw new Error(`Health check failed with status: ${response.status}`);
    }
  } catch (error) {
    const responseTime = performance.now() - startTime;
    
    instance.status = {
      status: 'unhealthy',
      lastCheck: new Date(),
      responseTime,
      errorRate: instance.status.errorRate + 0.1,
      uptime: 0,
      metadata: { error: error.message }
    };

    updateCircuitBreaker(instance, false);
    return false;
  }
};

// ===== STARTUP MESSAGE =====
console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║            🌐 ULTRAMARKET API GATEWAY SERVICE 🌐            ║
║                                                               ║
║              Professional TypeScript Implementation           ║
║                Enterprise Service Mesh Gateway                ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);

// ===== REGISTER SERVICES =====

CORE_SERVICES.forEach(serviceConfig => {
  registerService(serviceConfig);
  logger.info(`Registered service: ${serviceConfig.name} at ${serviceConfig.url}`);
});

// ===== HEALTH CHECK ENDPOINT =====

app.get('/health', (req: Request, res: Response) => {
  const healthyServices = Array.from(SERVICE_REGISTRY.entries()).map(([name, instances]) => {
    const healthyCount = instances.filter(i => i.status.status === 'healthy').length;
    return {
      name,
      healthy: healthyCount,
      total: instances.length,
      status: healthyCount > 0 ? 'healthy' : 'unhealthy'
    };
  });

  res.json({
    service: 'ultramarket-api-gateway',
    status: 'healthy',
    version: CONFIG.GATEWAY.VERSION,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    features: [
      '🌐 Enterprise Service Mesh Gateway',
      '🔄 Intelligent Load Balancing',
      '🛡️ Circuit Breaker Pattern',
      '⚡ Redis Caching Layer',
      '📊 Real-time Health Monitoring',
      '🔐 JWT Authentication Proxy',
      '📝 Comprehensive Request Logging',
      '🎯 TypeScript Type Safety',
      '⚖️ Advanced Rate Limiting',
      '🔍 Service Discovery'
    ],
    metrics: gatewayMetrics,
    services: healthyServices,
    environment: {
      nodeVersion: process.version,
      nodeEnv: CONFIG.GATEWAY.ENVIRONMENT,
      port: CONFIG.GATEWAY.PORT,
      processId: process.pid
    }
  });
});

// ===== SERVICE DISCOVERY ENDPOINT =====

app.get('/services', (req: Request, res: Response) => {
  const serviceMap = Array.from(SERVICE_REGISTRY.entries()).map(([name, instances]) => ({
    name,
    instances: instances.map(instance => ({
      id: instance.id,
      url: instance.config.url,
      status: instance.status,
      metrics: instance.metrics,
      circuitBreaker: instance.circuitBreaker,
      config: {
        version: instance.config.version,
        tags: instance.config.tags,
        priority: instance.config.priority,
        authentication: instance.config.authentication
      }
    }))
  }));

  res.json({
    success: true,
    data: {
      totalServices: SERVICE_REGISTRY.size,
      services: serviceMap,
      lastUpdate: new Date().toISOString()
    }
  });
});

// ===== DYNAMIC PROXY ROUTES =====

// Create proxy middleware for each service
CORE_SERVICES.forEach(serviceConfig => {
  const serviceLimiter = serviceConfig.rateLimit ? rateLimit({
    windowMs: serviceConfig.rateLimit.windowMs,
    max: serviceConfig.rateLimit.max,
    message: {
      success: false,
      error: `Too many requests to ${serviceConfig.name}`,
      service: serviceConfig.name
    },
    skip: (req) => process.env.NODE_ENV === 'test'
  }) : (req: Request, res: Response, next: NextFunction) => next();

  // Authentication middleware for protected services
  const authMiddleware = serviceConfig.authentication ? authenticateToken : 
    (req: Request, res: Response, next: NextFunction) => next();

  // Cache middleware for cacheable services
  const cache = serviceConfig.tags.includes('catalog') ? cacheMiddleware(300) : // 5 minutes for catalog
    (req: Request, res: Response, next: NextFunction) => next();

  app.use(`/api${serviceConfig.path}`, serviceLimiter, authMiddleware, cache, 
    createProxyMiddleware({
      target: serviceConfig.url,
      changeOrigin: true,
      pathRewrite: {
        [`^/api${serviceConfig.path}`]: serviceConfig.path
      },
      timeout: serviceConfig.timeout,
      onProxyReq: (proxyReq, req: ProxyRequest) => {
        req.service = serviceConfig.name;
        req.route = serviceConfig.path;
        
        // Add correlation ID to upstream request
        proxyReq.setHeader('X-Correlation-ID', req.correlationId);
        proxyReq.setHeader('X-Gateway-Source', CONFIG.GATEWAY.NAME);
        
        // Forward user context if available
        if (req.user) {
          proxyReq.setHeader('X-User-ID', req.user.id);
          proxyReq.setHeader('X-User-Role', req.user.role);
        }

        logger.debug('Proxying request', {
          correlationId: req.correlationId,
          service: serviceConfig.name,
          target: serviceConfig.url,
          path: proxyReq.path
        });
      },
      onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req: ProxyRequest, res) => {
        // Update service metrics
        const instance = selectHealthyService(serviceConfig.name);
        if (instance) {
          const responseTime = performance.now() - req.startTime;
          
          instance.metrics.totalRequests++;
          instance.metrics.lastResponseTime = responseTime;
          instance.metrics.lastRequestTime = new Date();
          
          if (proxyRes.statusCode! >= 200 && proxyRes.statusCode! < 400) {
            instance.metrics.successfulRequests++;
            updateCircuitBreaker(instance, true);
          } else {
            instance.metrics.failedRequests++;
            updateCircuitBreaker(instance, false);
          }

          // Update average response time
          instance.metrics.averageResponseTime = 
            (instance.metrics.averageResponseTime + responseTime) / 2;
        }

        return responseBuffer;
      }),
      onError: (err, req: ProxyRequest, res) => {
        logger.error('Proxy error', {
          correlationId: req.correlationId,
          service: serviceConfig.name,
          error: err.message
        });

        // Update circuit breaker on error
        const instance = selectHealthyService(serviceConfig.name);
        if (instance) {
          instance.metrics.failedRequests++;
          updateCircuitBreaker(instance, false);
        }

        res.status(503).json({
          success: false,
          error: `Service ${serviceConfig.name} unavailable`,
          correlationId: req.correlationId,
          service: serviceConfig.name
        });
      }
    })
  );

  logger.info(`Configured proxy route: /api${serviceConfig.path} -> ${serviceConfig.url}`);
});

// ===== START HEALTH MONITORING =====

const startHealthMonitoring = () => {
  setInterval(async () => {
    for (const [serviceName, instances] of SERVICE_REGISTRY.entries()) {
      for (const instance of instances) {
        await checkServiceHealth(instance);
      }
    }
    gatewayMetrics.serviceDiscoveryUpdates++;
  }, CONFIG.SERVICES.HEALTH_CHECK_INTERVAL);

  logger.info(`Health monitoring started (interval: ${CONFIG.SERVICES.HEALTH_CHECK_INTERVAL}ms)`);
};

// ===== INITIALIZE CONNECTIONS =====

const initializeServices = async () => {
  try {
    // Connect to Redis
    await redis.connect();
    logger.info('Redis connected for caching');

    // Start health monitoring
    startHealthMonitoring();

    logger.info('All gateway services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize gateway services', error);
    process.exit(1);
  }
};

// ===== ERROR HANDLERS =====

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    availableRoutes: CORE_SERVICES.map(s => `/api${s.path}`),
    correlationId: (req as ProxyRequest).correlationId
  });
});

// Global error handler
app.use((error: any, req: ProxyRequest, res: Response, next: NextFunction) => {
  logger.error('Gateway error', {
    correlationId: req.correlationId,
    error: error.message,
    stack: error.stack
  });

  res.status(500).json({
    success: false,
    error: 'Internal gateway error',
    correlationId: req.correlationId
  });
});

// ===== START THE GATEWAY =====

initializeServices().then(() => {
  const server = createServer(app);

  server.listen(CONFIG.GATEWAY.PORT, () => {
    logger.info(`🚀 UltraMarket API Gateway started on port ${CONFIG.GATEWAY.PORT}`);
    logger.info(`🔗 Gateway URL: http://localhost:${CONFIG.GATEWAY.PORT}`);
    logger.info(`📊 Health Check: http://localhost:${CONFIG.GATEWAY.PORT}/health`);
    logger.info(`🌐 Service Discovery: http://localhost:${CONFIG.GATEWAY.PORT}/services`);
    logger.info(`🎯 Process ID: ${process.pid}`);
    logger.info(`🛡️ Security: CORS, Helmet, Rate Limiting enabled`);
    logger.info(`⚡ Features: Load Balancing, Circuit Breaker, Caching`);
    logger.info(`🔍 Monitoring: Health checks every ${CONFIG.SERVICES.HEALTH_CHECK_INTERVAL}ms`);
    logger.info(`📝 Logging: Winston with daily rotation`);
    
    // Log registered routes
    logger.info('Registered routes:');
    CORE_SERVICES.forEach(service => {
      logger.info(`  /api${service.path} -> ${service.url} [${service.authentication ? 'Protected' : 'Public'}]`);
    });
  });

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);
    
    server.close(async () => {
      try {
        await redis.quit();
        logger.info('All connections closed. Exiting...');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', error);
        process.exit(1);
      }
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
});

export default app;
