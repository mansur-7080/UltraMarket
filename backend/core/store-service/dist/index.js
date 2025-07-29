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
        service: 'store-service',
        timestamp: new Date().toISOString(),
    });
});
app.get('/api/stores', (req, res) => {
    res.json({
        message: 'Store management',
        data: {
            stores: [
                { id: 1, name: 'Main Store', location: 'Tashkent' },
                { id: 2, name: 'Branch Store', location: 'Samarkand' }
            ]
        }
    });
});
app.listen(PORT, () => {
    console.log(`Store Service running on port ${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map