/**
 * UltraMarket Auth Service
 * Professional authentication and authorization service
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth.routes';
import { userRoutes } from './routes/user.routes';
import { adminRoutes } from './routes/admin.routes';
import { healthRoutes } from './routes/health.routes';
import { swaggerSetup } from './config/swagger';
import { validateEnv } from './config/env.validation';

// Load environment variables
dotenv.config();

// Validate environment variables
validateEnv();

const app = express();
const PORT = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 3001;

// Initialize database clients
import { databaseManager } from './config/database-setup';
import { memoryManager } from './utils/memory-manager';

export const prisma = databaseManager.getClient();
export const redis = createClient({
  url: process.env['REDIS_URL'] || 'redis://localhost:6379',
});

// Enhanced Security Headers
app.use(
  helmet({
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
      preload: true,
    },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    frameguard: { action: 'deny' },
    xssFilter: true,
  })
);

// Professional CORS configuration
const allowedOrigins = process.env['CORS_ORIGIN']?.split(',') || [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://ultramarket.com',
  'https://admin.ultramarket.com'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'X-API-Key',
      'X-Client-Version'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
    maxAge: 86400, // 24 hours
  })
);

// Enhanced Rate Limiting
const authLimiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_AUTH_WINDOW_MS'] || '900000'), // 15 minutes
  max: parseInt(process.env['RATE_LIMIT_AUTH_MAX_REQUESTS'] || '5'), // limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip + ':' + req.path;
  },
  skip: (req) => {
    // Skip rate limiting in test environment
    return process.env['NODE_ENV'] === 'test';
  },
});

const generalLimiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in test environment
    return process.env['NODE_ENV'] === 'test';
  },
});

// Apply rate limiting
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1', generalLimiter);

// JSON parsing middleware
app.use(express.json({ 
  limit: '1mb', // Reduced from 10mb for security
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '1mb',
  parameterLimit: 10 // Limit number of parameters
}));

// Compression middleware
app.use(compression());

// Enhanced Request logging with security
app.use((req, res, next) => {
  // Sanitize sensitive data
  const sanitizedHeaders = { ...req.headers };
  delete sanitizedHeaders.authorization;
  delete sanitizedHeaders.cookie;
  
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    headers: sanitizedHeaders,
    bodySize: req.headers['content-length'] || 0,
  });
  next();
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/health', healthRoutes);

// Swagger documentation
if (process.env['NODE_ENV'] === 'development') {
  swaggerSetup(app);
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
  });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');

  // Stop memory monitoring
  memoryManager.stopMonitoring();

  // Close database connections
  await databaseManager.disconnect();
  await redis.quit();

  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');

  // Stop memory monitoring
  memoryManager.stopMonitoring();

  // Close database connections
  await databaseManager.disconnect();
  await redis.quit();

  process.exit(0);
});

// Start server
const startServer = async () => {
  try {
    // Start memory monitoring
    memoryManager.startMonitoring(30000); // 30 seconds

    // Connect to Redis
    await redis.connect();
    logger.info('✅ Connected to Redis');

    // Connect to database
    await databaseManager.connect();

    // Start HTTP server only if not in test environment
    if (process.env['NODE_ENV'] !== 'test') {
      app.listen(PORT, () => {
        logger.info(`🚀 Auth Service running on port ${PORT}`);
        logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
        logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
      });
    } else {
      logger.info('🧪 Test environment - server not started');
    }
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    if (process.env['NODE_ENV'] !== 'test') {
      process.exit(1);
    }
  }
};

// Only start server if not in test environment
if (process.env['NODE_ENV'] !== 'test') {
  startServer();
}

export default app;
