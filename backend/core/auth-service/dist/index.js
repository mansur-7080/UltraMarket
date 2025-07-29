"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const redis_1 = require("redis");
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_routes_1 = require("./routes/auth.routes");
const user_routes_1 = require("./routes/user.routes");
const admin_routes_1 = require("./routes/admin.routes");
const health_routes_1 = require("./routes/health.routes");
const swagger_1 = require("./config/swagger");
const env_validation_1 = require("./config/env.validation");
dotenv_1.default.config();
(0, env_validation_1.validateEnv)();
const app = (0, express_1.default)();
const PORT = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 3001;
const database_setup_1 = require("./config/database-setup");
const memory_manager_1 = require("./utils/memory-manager");
exports.prisma = database_setup_1.databaseManager.getClient();
exports.redis = (0, redis_1.createClient)({
    url: process.env['REDIS_URL'] || 'redis://localhost:6379',
});
app.use((0, helmet_1.default)({
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
}));
const allowedOrigins = process.env['CORS_ORIGIN']?.split(',') || [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://ultramarket.com',
    'https://admin.ultramarket.com'
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
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
    maxAge: 86400,
}));
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        error: 'Too many authentication attempts, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip + ':' + req.path;
    },
});
const generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1', generalLimiter);
app.use(express_1.default.json({
    limit: '1mb',
    verify: (req, res, buf) => {
        try {
            JSON.parse(buf.toString());
        }
        catch (e) {
            throw new Error('Invalid JSON');
        }
    }
}));
app.use(express_1.default.urlencoded({
    extended: true,
    limit: '1mb',
    parameterLimit: 10
}));
app.use((0, compression_1.default)());
app.use((req, res, next) => {
    const sanitizedHeaders = { ...req.headers };
    delete sanitizedHeaders.authorization;
    delete sanitizedHeaders.cookie;
    logger_1.logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        headers: sanitizedHeaders,
        bodySize: req.headers['content-length'] || 0,
    });
    next();
});
app.use('/api/v1/auth', auth_routes_1.authRoutes);
app.use('/api/v1/users', user_routes_1.userRoutes);
app.use('/api/v1/admin', admin_routes_1.adminRoutes);
app.use('/health', health_routes_1.healthRoutes);
if (process.env['NODE_ENV'] === 'development') {
    (0, swagger_1.swaggerSetup)(app);
}
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.originalUrl,
    });
});
app.use(errorHandler_1.errorHandler);
process.on('SIGTERM', async () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    memory_manager_1.memoryManager.stopMonitoring();
    await database_setup_1.databaseManager.disconnect();
    await exports.redis.quit();
    process.exit(0);
});
process.on('SIGINT', async () => {
    logger_1.logger.info('SIGINT received, shutting down gracefully');
    memory_manager_1.memoryManager.stopMonitoring();
    await database_setup_1.databaseManager.disconnect();
    await exports.redis.quit();
    process.exit(0);
});
const startServer = async () => {
    try {
        memory_manager_1.memoryManager.startMonitoring(30000);
        await exports.redis.connect();
        logger_1.logger.info('✅ Connected to Redis');
        await database_setup_1.databaseManager.connect();
        app.listen(PORT, () => {
            logger_1.logger.info(`🚀 Auth Service running on port ${PORT}`);
            logger_1.logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
            logger_1.logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
        });
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
//# sourceMappingURL=index.js.map