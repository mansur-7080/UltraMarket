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
const PORT = process.env['PORT'] || 3035;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'navigation-service',
        timestamp: new Date().toISOString(),
    });
});
app.get('/api/navigation/menu', (req, res) => {
    res.json({
        message: 'Navigation menu',
        data: {
            menu: [
                { id: 1, name: 'Home', path: '/' },
                { id: 2, name: 'Products', path: '/products' },
                { id: 3, name: 'About', path: '/about' }
            ]
        }
    });
});
app.listen(PORT, () => {
    console.log(`Navigation Service running on port ${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map