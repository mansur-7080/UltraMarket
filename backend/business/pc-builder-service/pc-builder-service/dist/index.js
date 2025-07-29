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
const PORT = process.env['PORT'] || 3030;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'pc-builder-service',
        timestamp: new Date().toISOString(),
    });
});
app.get('/api/pc-builder/configurations', (req, res) => {
    res.json({
        message: 'PC Builder configurations',
        data: {
            configurations: [
                { id: 1, name: 'Gaming PC', budget: 1500 },
                { id: 2, name: 'Workstation', budget: 2000 },
                { id: 3, name: 'Budget PC', budget: 500 }
            ]
        }
    });
});
app.listen(PORT, () => {
    console.log(`PC Builder Service running on port ${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map