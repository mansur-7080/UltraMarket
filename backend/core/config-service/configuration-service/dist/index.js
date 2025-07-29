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
const logger_1 = require("@shared/logger");
(0, dotenv_1.config)();
const app = (0, express_1.default)();
const PORT = process.env['PORT'] || 3020;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env['ALLOWED_ORIGINS']?.split(',') || ['http://localhost:3000'],
    credentials: true,
}));
const configLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many configuration requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/config', configLimiter);
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
class ConfigurationService {
    configs = new Map();
    constructor() {
        this.initializeDefaultConfigs();
    }
    initializeDefaultConfigs() {
        this.setConfig('app.name', 'UltraMarket', 'string', 'application', 'Application name', true);
        this.setConfig('app.version', '1.0.0', 'string', 'application', 'Application version', true);
        this.setConfig('app.maintenance', false, 'boolean', 'application', 'Maintenance mode', true);
        this.setConfig('features.cart.enabled', true, 'boolean', 'features', 'Cart feature enabled', true);
        this.setConfig('features.payments.enabled', true, 'boolean', 'features', 'Payments feature enabled', true);
        this.setConfig('features.recommendations.enabled', true, 'boolean', 'features', 'Recommendations enabled', true);
        this.setConfig('business.tax.rate', 0.12, 'number', 'business', "O'zbekiston NDS (12%)", false);
        this.setConfig('business.shipping.free_threshold', 300000, 'number', 'business', 'Bepul yetkazib berish chegarasi (UZS)', true);
        this.setConfig('business.currency', 'UZS', 'string', 'business', 'Asosiy valyuta', true);
        this.setConfig('business.country', 'UZ', 'string', 'business', 'Davlat kodi', false);
        this.setConfig('business.timezone', 'Asia/Tashkent', 'string', 'business', 'Vaqt zonasi', false);
        this.setConfig('business.language', 'uz', 'string', 'business', 'Asosiy til', true);
        this.setConfig('business.supported_languages', ['uz', 'ru', 'en'], 'object', 'business', "Qo'llab-quvvatlanadigan tillar", true);
        this.setConfig('security.session.timeout', 1800, 'number', 'security', 'Session timeout in seconds', false);
        this.setConfig('security.password.min_length', 8, 'number', 'security', 'Minimum password length', false);
        this.setConfig('security.rate_limit.requests_per_minute', 100, 'number', 'security', 'Rate limit per minute', false);
    }
    setConfig(key, value, type, category, description, isPublic = false) {
        this.configs.set(key, {
            key,
            value,
            type,
            category,
            description,
            isPublic,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
    getConfig(key) {
        return this.configs.get(key);
    }
    getAllConfigs(category, publicOnly = true) {
        const configs = Array.from(this.configs.values());
        let filtered = configs;
        if (publicOnly) {
            filtered = filtered.filter((config) => config.isPublic);
        }
        if (category) {
            filtered = filtered.filter((config) => config.category === category);
        }
        return filtered;
    }
    updateConfig(key, value) {
        const existing = this.configs.get(key);
        if (!existing) {
            return false;
        }
        this.configs.set(key, {
            ...existing,
            value,
            updatedAt: new Date(),
        });
        return true;
    }
    deleteConfig(key) {
        return this.configs.delete(key);
    }
    getCategories() {
        const categories = new Set();
        this.configs.forEach((config) => categories.add(config.category));
        return Array.from(categories);
    }
}
const configService = new ConfigurationService();
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'config-service',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});
app.get('/api/config', (req, res) => {
    try {
        const { category, include_private } = req.query;
        const includePrivate = include_private === 'true';
        const configs = configService.getAllConfigs(category, !includePrivate);
        res.json({
            success: true,
            data: configs,
            total: configs.length,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get configurations', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Failed to get configurations' },
        });
    }
});
app.get('/api/config/:key', (req, res) => {
    try {
        const { key } = req.params;
        const config = configService.getConfig(key);
        if (!config) {
            return res.status(404).json({
                success: false,
                error: { code: 'CONFIG_NOT_FOUND', message: 'Configuration not found' },
            });
        }
        res.json({
            success: true,
            data: config,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get configuration', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Failed to get configuration' },
        });
    }
});
app.put('/api/config/:key', (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;
        if (value === undefined) {
            return res.status(400).json({
                success: false,
                error: { code: 'MISSING_VALUE', message: 'Configuration value is required' },
            });
        }
        const updated = configService.updateConfig(key, value);
        if (!updated) {
            return res.status(404).json({
                success: false,
                error: { code: 'CONFIG_NOT_FOUND', message: 'Configuration not found' },
            });
        }
        logger_1.logger.info('Configuration updated', { key, value });
        res.json({
            success: true,
            message: 'Configuration updated successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to update configuration', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Failed to update configuration' },
        });
    }
});
app.get('/api/config/categories/list', (req, res) => {
    try {
        const categories = configService.getCategories();
        res.json({
            success: true,
            data: categories,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get categories', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: 'Failed to get categories' },
        });
    }
});
app.use((error, req, res, next) => {
    logger_1.logger.error('Config service error', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
    });
    res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
    });
});
app.listen(PORT, () => {
    logger_1.logger.info('Configuration Service started successfully', {
        port: PORT,
        service: 'config-service',
        operation: 'startup',
        timestamp: new Date().toISOString(),
    });
});
exports.default = app;
//# sourceMappingURL=index.js.map