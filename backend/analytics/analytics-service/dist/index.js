"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const app = (0, express_1.default)();
const PORT = process.env['PORT'] || 3020;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, compression_1.default)());
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'analytics-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
app.get('/api/analytics/dashboard', (req, res) => {
    res.json({
        message: 'Analytics dashboard data',
        data: {
            totalOrders: 1250,
            totalRevenue: 45000000,
            activeUsers: 850,
            conversionRate: 3.2,
        },
    });
});
app.get('/api/analytics/reports', (req, res) => {
    res.json({
        message: 'Analytics reports',
        reports: [
            { id: 1, name: 'Sales Report', type: 'sales' },
            { id: 2, name: 'User Activity Report', type: 'users' },
            { id: 3, name: 'Product Performance Report', type: 'products' },
        ],
    });
});
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env['NODE_ENV'] === 'production' ? 'Something went wrong!' : err.message,
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found',
    });
});
app.listen(PORT, () => {
    console.log(`Analytics Service running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});
exports.default = app;
//# sourceMappingURL=index.js.map