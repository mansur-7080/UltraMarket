"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env['PORT'] || 3025;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'dynamic-pricing-service',
        timestamp: new Date().toISOString(),
    });
});
app.get('/api/pricing/calculate', (req, res) => {
    res.json({
        message: 'Dynamic pricing calculation',
        data: {
            basePrice: 100,
            dynamicPrice: 95,
            discount: 5,
            factors: ['demand', 'competition', 'time']
        }
    });
});
app.listen(PORT, () => {
    console.log(`Dynamic Pricing Service running on port ${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map