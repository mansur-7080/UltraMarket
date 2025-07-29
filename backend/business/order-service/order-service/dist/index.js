"use strict";
/**
 * UltraMarket Order Service
 * Professional order management with complete workflow and payment integration
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var cors_1 = __importDefault(require("cors"));
var helmet_1 = __importDefault(require("helmet"));
var express_rate_limit_1 = __importDefault(require("express-rate-limit"));
var compression_1 = __importDefault(require("compression"));
var dotenv_1 = __importDefault(require("dotenv"));
var swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
// Routes
var order_routes_1 = __importDefault(require("./routes/order.routes"));
var payment_routes_1 = __importDefault(require("./routes/payment.routes"));
var health_routes_1 = __importDefault(require("./routes/health.routes"));
var webhook_routes_1 = __importDefault(require("./routes/webhook.routes"));
// Middleware
var error_middleware_1 = require("./middleware/error.middleware");
var logger_middleware_1 = require("./middleware/logger.middleware");
var security_middleware_1 = require("./middleware/security.middleware");
// Utils
var logger_1 = require("./utils/logger");
var env_validation_1 = require("./config/env.validation");
var swagger_1 = require("./config/swagger");
var database_1 = require("./config/database");
// Load environment variables
dotenv_1.default.config();
// Validate environment variables
(0, env_validation_1.validateEnv)();
var app = (0, express_1.default)();
var PORT = process.env.PORT || 3005;
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: ((_a = process.env.ALLOWED_ORIGINS) === null || _a === void 0 ? void 0 : _a.split(',')) || ['http://localhost:3000'],
    credentials: true,
}));
// Compression middleware
app.use((0, compression_1.default)());
// Rate limiting
var limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
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
app.use('/api/v1/orders', order_routes_1.default);
app.use('/api/v1/payments', payment_routes_1.default);
app.use('/api/v1/webhooks', webhook_routes_1.default);
// 404 handler
app.use('*', function (req, res) {
    res.status(404).json({
        success: false,
        message: "Route ".concat(req.method, " ").concat(req.originalUrl, " not found"),
        timestamp: new Date().toISOString(),
    });
});
// Global error handler
app.use(error_middleware_1.errorHandler);
// Graceful shutdown
var gracefulShutdown = function (signal) { return __awaiter(void 0, void 0, void 0, function () {
    var error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                logger_1.logger.info("Received ".concat(signal, ". Starting graceful shutdown..."));
                // Close server
                server.close(function () {
                    logger_1.logger.info('HTTP server closed.');
                });
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                // Close database connection
                return [4 /*yield*/, database_1.connectDB.close()];
            case 2:
                // Close database connection
                _a.sent();
                logger_1.logger.info('Database connection closed.');
                process.exit(0);
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                logger_1.logger.error('Error during graceful shutdown:', error_1);
                process.exit(1);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
// Start server
var server = app.listen(PORT, function () { return __awaiter(void 0, void 0, void 0, function () {
    var error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                // Connect to database
                return [4 /*yield*/, (0, database_1.connectDB)()];
            case 1:
                // Connect to database
                _a.sent();
                logger_1.logger.info("\uD83D\uDE80 Order Service running on port ".concat(PORT));
                logger_1.logger.info("\uD83D\uDCCD Environment: ".concat(process.env.NODE_ENV || 'development'));
                logger_1.logger.info("\uD83D\uDCDA API Documentation: http://localhost:".concat(PORT, "/api-docs"));
                logger_1.logger.info("\uD83D\uDD17 Health check: http://localhost:".concat(PORT, "/api/v1/health"));
                logger_1.logger.info("\uD83D\uDED2 Orders: http://localhost:".concat(PORT, "/api/v1/orders"));
                logger_1.logger.info("\uD83D\uDCB3 Payments: http://localhost:".concat(PORT, "/api/v1/payments"));
                logger_1.logger.info("\uD83D\uDD17 Webhooks: http://localhost:".concat(PORT, "/api/v1/webhooks"));
                logger_1.logger.info("\uD83D\uDCBE Database: PostgreSQL Connected");
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                logger_1.logger.error('Failed to start Order Service:', error_2);
                process.exit(1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Handle graceful shutdown
process.on('SIGTERM', function () { return gracefulShutdown('SIGTERM'); });
process.on('SIGINT', function () { return gracefulShutdown('SIGINT'); });
// Handle unhandled promise rejections
process.on('unhandledRejection', function (reason, promise) {
    logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Handle uncaught exceptions
process.on('uncaughtException', function (error) {
    logger_1.logger.error('Uncaught Exception:', error);
    process.exit(1);
});
exports.default = app;
