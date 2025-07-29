"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const shared_1 = require("@ultramarket/shared");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env['PORT'] || 3006;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'notification-service',
        timestamp: new Date().toISOString(),
    });
});
// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'UltraMarket Notification Service',
        version: '1.0.0',
    });
});
// Start server
app.listen(PORT, () => {
    shared_1.logger.info(`Notification Service running on port ${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map