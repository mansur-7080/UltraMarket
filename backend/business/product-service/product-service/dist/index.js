"use strict";
/**
 * UltraMarket Product Service
 * Professional product catalog and inventory management service
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const cors_1 = tslib_1.__importDefault(require("cors"));
const helmet_1 = tslib_1.__importDefault(require("helmet"));
const express_rate_limit_1 = tslib_1.__importDefault(require("express-rate-limit"));
const compression_1 = tslib_1.__importDefault(require("compression"));
const mongoose_1 = tslib_1.__importDefault(require("mongoose"));
const swagger_ui_express_1 = tslib_1.__importDefault(require("swagger-ui-express"));
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
// Routes
const product_routes_1 = tslib_1.__importDefault(require("./routes/product.routes"));
const category_routes_1 = tslib_1.__importDefault(require("./routes/category.routes"));
const inventory_routes_1 = tslib_1.__importDefault(require("./routes/inventory.routes"));
const review_routes_1 = tslib_1.__importDefault(require("./routes/review.routes"));
const search_routes_1 = tslib_1.__importDefault(require("./routes/search.routes"));
const health_routes_1 = tslib_1.__importDefault(require("./routes/health.routes"));
const admin_routes_1 = tslib_1.__importDefault(require("./routes/admin.routes"));
const enhanced_product_routes_1 = tslib_1.__importDefault(require("./routes/enhanced-product.routes"));
// Middleware
const error_middleware_1 = require("./middleware/error.middleware");
const logger_middleware_1 = require("./middleware/logger.middleware");
const security_middleware_1 = require("./middleware/security.middleware");
// Utils
const logger_1 = require("./utils/logger");
const env_validation_1 = require("./config/env.validation");
const swagger_1 = require("./config/swagger");
// Load environment variables
dotenv_1.default.config();
// Validate environment variables
(0, env_validation_1.validateEnv)();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3003;
// Apply security middleware with enhanced configuration
app.use((0, helmet_1.default)()); // Basic helmet configuration
// Set additional security headers
app.use((req, res, next) => {
    // Content-Security-Policy
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://storage.ultramarket.uz; connect-src 'self' https://api.ultramarket.uz; font-src 'self' https://fonts.gstatic.com; object-src 'none'; media-src 'self'; frame-src 'none'");
    // HSTS - Force HTTPS
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Referrer policy
    res.setHeader('Referrer-Policy', 'no-referrer');
    // Prevent XSS
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});
// Configure CORS with secure settings
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            logger_1.logger.warn('CORS blocked request', { origin });
            callback(new Error('CORS policy violation'), false);
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'Content-Disposition'],
    credentials: true,
    maxAge: 86400, // 24 hours
}));
// Compression middleware with security consideration
app.use((0, compression_1.default)({ level: 6, threshold: 1024 })); // Only compress responses larger than 1KB
// Configure rate limiting with different rules for different endpoints
const standardLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS', // Skip preflight requests
});
// More restrictive rate limit for authentication endpoints
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10, // Limit each IP to 10 auth attempts per window
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many authentication attempts, please try again later',
        },
    },
});
// Apply rate limiters
app.use('/api/v1/auth', authLimiter);
app.use(standardLimiter);
// Apply custom security middleware
app.use(security_middleware_1.securityMiddleware);
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Request logging
app.use(logger_middleware_1.requestLogger);
// API Documentation
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
// Routes
app.use('/api/v1/health', health_routes_1.default);
app.use('/api/v1/products', product_routes_1.default);
app.use('/api/v1/enhanced-products', enhanced_product_routes_1.default);
app.use('/api/v1/categories', category_routes_1.default);
app.use('/api/v1/inventory', inventory_routes_1.default);
app.use('/api/v1/reviews', review_routes_1.default);
app.use('/api/v1/search', search_routes_1.default);
app.use('/api/v1/admin', admin_routes_1.default);
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
    });
});
// Global error handler
app.use(error_middleware_1.errorHandler);
/**
 * Connect to MongoDB with professional error handling and retry logic
 */
const connectDB = async () => {
    const maxRetries = 5;
    let retries = 0;
    let connected = false;
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        logger_1.logger.error('MONGODB_URI environment variable is not defined');
        throw new Error('MONGODB_URI environment variable is required');
    }
    // Configure mongoose
    mongoose_1.default.set('strictQuery', true);
    // Set up connection monitoring
    mongoose_1.default.connection.on('connected', () => {
        logger_1.logger.info('MongoDB connection established');
        connected = true;
    });
    mongoose_1.default.connection.on('disconnected', () => {
        if (connected) {
            logger_1.logger.warn('MongoDB connection lost. Attempting to reconnect...');
        }
    });
    mongoose_1.default.connection.on('error', (err) => {
        logger_1.logger.error('MongoDB connection error', {
            error: err.message,
            stack: err.stack,
        });
    });
    // Connection with retry logic
    while (!connected && retries < maxRetries) {
        try {
            if (retries > 0) {
                logger_1.logger.info(`Retrying MongoDB connection (${retries}/${maxRetries})...`);
                // Exponential backoff: 1s, 2s, 4s, 8s, 16s
                await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retries - 1) * 1000));
            }
            await mongoose_1.default.connect(mongoUri, {
                maxPoolSize: 10,
                minPoolSize: 2,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                family: 4, // Use IPv4, skip trying IPv6
                connectTimeoutMS: 10000,
                // Add heartbeat to detect connection issues early
                heartbeatFrequencyMS: 10000,
                // Don't buffer commands during reconnect
                bufferCommands: false,
            });
            logger_1.logger.info('✅ Successfully connected to MongoDB');
            connected = true;
        }
        catch (error) {
            retries++;
            logger_1.logger.error(`❌ MongoDB connection attempt ${retries} failed:`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                retryCount: retries,
                maxRetries,
            });
            if (retries >= maxRetries) {
                logger_1.logger.error('Failed to connect to MongoDB after maximum retries');
                throw new Error('Failed to connect to MongoDB after maximum retries');
            }
        }
    }
};
/**
 * Professional graceful shutdown with controlled process termination
 * Ensures all connections are properly closed and pending requests completed
 */
const gracefulShutdown = async (signal) => {
    logger_1.logger.info(`Received ${signal}. Starting graceful shutdown...`, { signal });
    // Set a timeout to force shutdown if graceful shutdown takes too long
    const forceShutdownTimeout = setTimeout(() => {
        logger_1.logger.error('Graceful shutdown timed out after 30s, forcing exit');
        process.exit(1);
    }, 30000); // 30 seconds timeout
    let exitCode = 0;
    try {
        // Stop accepting new connections but finish existing requests
        logger_1.logger.info('Closing HTTP server - no longer accepting new connections');
        await new Promise((resolve) => {
            server.close((err) => {
                if (err) {
                    logger_1.logger.error('Error closing HTTP server:', { error: err.message });
                    exitCode = 1;
                }
                else {
                    logger_1.logger.info('HTTP server closed successfully');
                }
                resolve();
            });
        });
        // Close MongoDB connection
        if (mongoose_1.default.connection.readyState !== 0) {
            logger_1.logger.info('Closing MongoDB connection');
            await mongoose_1.default.connection.close(false); // false means don't force close
            logger_1.logger.info('MongoDB connection closed successfully');
        }
        // Close any other connections (Redis, etc.)
        // if (redisClient) {
        //   logger.info('Closing Redis connection');
        //   await redisClient.quit();
        //   logger.info('Redis connection closed successfully');
        // }
        // Log successful shutdown
        logger_1.logger.info('Graceful shutdown completed successfully', {
            shutdownDuration: `${Date.now() - new Date().getTime()}ms`,
            signal,
        });
        // Clear the force shutdown timeout
        clearTimeout(forceShutdownTimeout);
        // Exit with appropriate code
        process.exit(exitCode);
    }
    catch (error) {
        logger_1.logger.error('Error during graceful shutdown:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            signal,
        });
        // Clear the force shutdown timeout
        clearTimeout(forceShutdownTimeout);
        process.exit(1);
    }
};
// Start server
const server = app.listen(PORT, async () => {
    try {
        // Connect to database
        await connectDB();
        logger_1.logger.info(`🚀 Product Service running on port ${PORT}`);
        logger_1.logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
        logger_1.logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
        logger_1.logger.info(`🔗 Health check: http://localhost:${PORT}/api/v1/health`);
        logger_1.logger.info(`💾 MongoDB: ${process.env.MONGODB_URI ? 'Connected' : 'Not configured'}`);
    }
    catch (error) {
        logger_1.logger.error('Failed to start Product Service:', error);
        process.exit(1);
    }
});
// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=index.js.map