import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createClient } from 'redis';
import { PrismaClient } from '@prisma/client';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import cluster from 'cluster';
import os from 'os';
import { logger } from './utils/logger';
import productionConfig from './config/production.config';

// Import routes
import { authRoutes } from './routes/auth.routes';
import { userRoutes } from './routes/user.routes';
import { adminRoutes } from './routes/admin.routes';
import { healthRoutes } from './routes/health.routes';

// Import middleware
import { 
  ipFilter, 
  inputSanitizer, 
  advancedRateLimit, 
  requestSizeLimiter, 
  securityHeaders, 
  apiKeyValidator,
  securityLogger 
} from './middleware/security.middleware';

// Import services
import { emailService } from './services/email.service';

// Initialize Prisma and Redis clients
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: productionConfig.database.url
    }
  },
  log: productionConfig.logging.level === 'debug' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error']
});

const redis = createClient({
  url: productionConfig.redis.url,
  password: productionConfig.redis.password,
  database: productionConfig.redis.db,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis connection failed after 10 retries');
        return new Error('Redis connection failed');
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: productionConfig.api.docs.title,
      description: productionConfig.api.docs.description,
      version: productionConfig.api.docs.version,
      contact: {
        name: 'UltraMarket Support',
        email: 'support@ultramarket.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${productionConfig.server.port}`,
        description: 'Development server'
      },
      {
        url: 'https://api.ultramarket.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Cluster configuration for production
if (cluster.isPrimary && productionConfig.server.environment === 'production') {
  const numCPUs = os.cpus().length;
  logger.info(`Master process ${process.pid} is running`);
  logger.info(`Starting ${numCPUs} workers`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });

  cluster.on('online', (worker) => {
    logger.info(`Worker ${worker.process.pid} is online`);
  });
} else {
  // Worker process
  const app = express();

  // Trust proxy for production
  if (productionConfig.server.environment === 'production') {
    app.set('trust proxy', 1);
  }

  // Security middleware
  app.use(helmet(productionConfig.security.helmet));
  
  // CORS configuration
  app.use(cors(productionConfig.server.cors));

  // Compression
  if (productionConfig.features.compression) {
    app.use(compression({
      level: productionConfig.security.compression?.level || 6,
      threshold: productionConfig.security.compression?.threshold || 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      }
    }));
  }

  // Request size limiting
  if (productionConfig.features.requestSizeLimit) {
    app.use(requestSizeLimiter(productionConfig.security.requestSizeLimit || '10mb'));
  }

  // IP filtering
  if (productionConfig.features.ipFilter) {
    app.use(ipFilter);
  }

  // Input sanitization
  app.use(inputSanitizer);

  // Security logging
  app.use(securityLogger);

  // Rate limiting
  if (productionConfig.api.rateLimit.enabled) {
    app.use(advancedRateLimit({
      windowMs: productionConfig.api.rateLimit.windowMs,
      maxRequests: productionConfig.api.rateLimit.maxRequests
    }));
  }

  // API key validation
  if (productionConfig.features.apiKeyValidation) {
    app.use(apiKeyValidator);
  }

  // Security headers
  app.use(securityHeaders);

  // Body parsing with security
  app.use(express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      try {
        JSON.parse(buf.toString());
      } catch (e) {
        throw new Error('Invalid JSON');
      }
    }
  }));

  app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
  }));

  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info('Request processed', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        contentLength: res.get('Content-Length')
      });
    });

    next();
  });

  // Health check routes (before authentication)
  app.use('/health', healthRoutes);

  // API documentation
  if (productionConfig.api.docs.enabled) {
    app.use(productionConfig.api.docs.path, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: productionConfig.api.docs.title
    }));
  }

  // API routes with versioning
  app.use(`/${productionConfig.api.prefix}/${productionConfig.api.version}/auth`, authRoutes);
  app.use(`/${productionConfig.api.prefix}/${productionConfig.api.version}/users`, userRoutes);
  app.use(`/${productionConfig.api.prefix}/${productionConfig.api.version}/admin`, adminRoutes);

  // 404 handler
  app.use('*', (req, res) => {
    logger.warn('Route not found', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip
    });
    
    res.status(404).json({
      success: false,
      error: {
        message: 'Route not found',
        code: 'ROUTE_NOT_FOUND',
        path: req.originalUrl
      }
    });
  });

  // Global error handler
  app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error', {
      error: error.message,
      stack: error.stack,
      method: req.method,
      url: req.url,
      ip: req.ip
    });

    // Don't leak error details in production
    const isDevelopment = productionConfig.server.environment === 'development';
    
    res.status(500).json({
      success: false,
      error: {
        message: isDevelopment ? error.message : 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
        ...(isDevelopment && { stack: error.stack })
      }
    });
  });

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    // Stop accepting new requests
    const server = app.listen(productionConfig.server.port, productionConfig.server.host, () => {
      logger.info(`Auth Service running on ${productionConfig.server.host}:${productionConfig.server.port}`);
    });

    server.close(async () => {
      logger.info('HTTP server closed');
      
      try {
        // Close database connections
        await prisma.$disconnect();
        logger.info('Database connections closed');
        
        // Close Redis connections
        await redis.quit();
        logger.info('Redis connections closed');
        
        // Close email service connections
        await emailService.close();
        logger.info('Email service connections closed');
        
        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown', { error });
        process.exit(1);
      }
    });

    // Force shutdown after timeout
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, productionConfig.features.gracefulShutdownTimeout || 30000);
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason, promise });
    process.exit(1);
  });

  // Initialize connections
  const initializeConnections = async () => {
    try {
      // Test database connection
      await prisma.$connect();
      logger.info('Database connected successfully');

      // Test Redis connection
      await redis.connect();
      logger.info('Redis connected successfully');

      // Test email service
      await emailService.testConnection();
      logger.info('Email service connected successfully');

      // Start server
      const server = app.listen(productionConfig.server.port, productionConfig.server.host, () => {
        logger.info(`🚀 Auth Service started successfully!`);
        logger.info(`📍 Environment: ${productionConfig.server.environment}`);
        logger.info(`🌐 Server: http://${productionConfig.server.host}:${productionConfig.server.port}`);
        logger.info(`📚 API Docs: http://${productionConfig.server.host}:${productionConfig.server.port}${productionConfig.api.docs.path}`);
        logger.info(`💚 Health Check: http://${productionConfig.server.host}:${productionConfig.server.port}/health`);
        logger.info(`📊 Metrics: http://${productionConfig.server.host}:${productionConfig.server.port}/health/metrics`);
        logger.info(`👤 Process ID: ${process.pid}`);
        logger.info(`🔄 Worker: ${cluster.isWorker ? 'Yes' : 'No'}`);
      });

      // Handle server errors
      server.on('error', (error) => {
        logger.error('Server error', { error });
        process.exit(1);
      });

    } catch (error) {
      logger.error('Failed to initialize connections', { error });
      process.exit(1);
    }
  };

  // Start the application
  initializeConnections();
} 