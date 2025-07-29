import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { logger } from '@shared/logger';

config();

const app = express();
const PORT = process.env['PORT'] || 3020;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env['ALLOWED_ORIGINS']?.split(',') || ['http://localhost:3000'],
    credentials: true,
  })
);

// Rate limiting
const configLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: { error: 'Too many configuration requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/config', configLimiter);

// General middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Configuration store
interface ConfigItem {
  key: string;
  value: string | number | boolean | object;
  type: 'string' | 'number' | 'boolean' | 'object';
  category: string;
  description?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class ConfigurationService {
  private configs: Map<string, ConfigItem> = new Map();

  constructor() {
    this.initializeDefaultConfigs();
  }

  private initializeDefaultConfigs() {
    // Application settings
    this.setConfig('app.name', 'UltraMarket', 'string', 'application', 'Application name', true);
    this.setConfig('app.version', '1.0.0', 'string', 'application', 'Application version', true);
    this.setConfig('app.maintenance', false, 'boolean', 'application', 'Maintenance mode', true);

    // Feature flags
    this.setConfig(
      'features.cart.enabled',
      true,
      'boolean',
      'features',
      'Cart feature enabled',
      true
    );
    this.setConfig(
      'features.payments.enabled',
      true,
      'boolean',
      'features',
      'Payments feature enabled',
      true
    );
    this.setConfig(
      'features.recommendations.enabled',
      true,
      'boolean',
      'features',
      'Recommendations enabled',
      true
    );

    // Business settings
    this.setConfig('business.tax.rate', 0.12, 'number', 'business', "O'zbekiston NDS (12%)", false);
    this.setConfig(
      'business.shipping.free_threshold',
      300000,
      'number',
      'business',
      'Bepul yetkazib berish chegarasi (UZS)',
      true
    );
    this.setConfig('business.currency', 'UZS', 'string', 'business', 'Asosiy valyuta', true);
    this.setConfig('business.country', 'UZ', 'string', 'business', 'Davlat kodi', false);
    this.setConfig(
      'business.timezone',
      'Asia/Tashkent',
      'string',
      'business',
      'Vaqt zonasi',
      false
    );
    this.setConfig('business.language', 'uz', 'string', 'business', 'Asosiy til', true);
    this.setConfig(
      'business.supported_languages',
      ['uz', 'ru', 'en'],
      'object',
      'business',
      "Qo'llab-quvvatlanadigan tillar",
      true
    );

    // Security settings
    this.setConfig(
      'security.session.timeout',
      1800,
      'number',
      'security',
      'Session timeout in seconds',
      false
    );
    this.setConfig(
      'security.password.min_length',
      8,
      'number',
      'security',
      'Minimum password length',
      false
    );
    this.setConfig(
      'security.rate_limit.requests_per_minute',
      100,
      'number',
      'security',
      'Rate limit per minute',
      false
    );
  }

  private setConfig(
    key: string,
    value: string | number | boolean | object,
    type: 'string' | 'number' | 'boolean' | 'object',
    category: string,
    description?: string,
    isPublic: boolean = false
  ) {
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

  getConfig(key: string): ConfigItem | undefined {
    return this.configs.get(key);
  }

  getAllConfigs(category?: string, publicOnly: boolean = true): ConfigItem[] {
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

  updateConfig(key: string, value: string | number | boolean | object): boolean {
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

  deleteConfig(key: string): boolean {
    return this.configs.delete(key);
  }

  getCategories(): string[] {
    const categories = new Set<string>();
    this.configs.forEach((config) => categories.add(config.category));
    return Array.from(categories);
  }
}

const configService = new ConfigurationService();

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'config-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Get all configurations
app.get('/api/config', (req, res) => {
  try {
    const { category, include_private } = req.query;
    const includePrivate = include_private === 'true';

    const configs = configService.getAllConfigs(category as string, !includePrivate);

    res.json({
      success: true,
      data: configs,
      total: configs.length,
    });
  } catch (error) {
    logger.error('Failed to get configurations', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get configurations' },
    });
  }
});

// Get specific configuration
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
  } catch (error) {
    logger.error('Failed to get configuration', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get configuration' },
    });
  }
});

// Update configuration
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

    logger.info('Configuration updated', { key, value });

    res.json({
      success: true,
      message: 'Configuration updated successfully',
    });
  } catch (error) {
    logger.error('Failed to update configuration', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update configuration' },
    });
  }
});

// Get categories
app.get('/api/config/categories/list', (req, res) => {
  try {
    const categories = configService.getCategories();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error('Failed to get categories', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get categories' },
    });
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Config service error', {
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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
  });
});

// Start server
app.listen(PORT, () => {
  logger.info('Configuration Service started successfully', {
    port: PORT,
    service: 'config-service',
    operation: 'startup',
    timestamp: new Date().toISOString(),
  });
});

export default app;
