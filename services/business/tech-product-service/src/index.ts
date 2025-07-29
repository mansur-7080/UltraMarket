import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { TechProductController } from './controllers/tech-product.controller';
import { SpecsComparisonController } from './controllers/specs-comparison.controller';
import { PCBuilderController } from './controllers/pc-builder.controller';
import { TechCategoryController } from './controllers/tech-category.controller';
import { errorHandler, logger } from './middleware';
import { createLogger } from '../../../libs/shared/src/utils/logger-replacement';

const appLogger = createLogger('tech-product-service');

const app = express();
const PORT = process.env.PORT || 3020;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Logging
app.use(logger);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'tech-product-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
  });
});

// Tech Product routes
app.get('/api/v1/tech-products', TechProductController.getProducts);
app.get('/api/v1/tech-products/search', TechProductController.searchProducts);
app.get('/api/v1/tech-products/filter', TechProductController.filterProducts);
app.get('/api/v1/tech-products/:id', TechProductController.getProduct);
app.get('/api/v1/tech-products/:id/specs', TechProductController.getDetailedSpecs);
app.get('/api/v1/tech-products/:id/compatibility', TechProductController.getCompatibility);
app.get('/api/v1/tech-products/:id/reviews', TechProductController.getProductReviews);
app.get('/api/v1/tech-products/:id/benchmarks', TechProductController.getBenchmarks);

// Category management
app.get('/api/v1/tech-categories', TechCategoryController.getCategories);
app.get('/api/v1/tech-categories/:category/products', TechCategoryController.getCategoryProducts);
app.get('/api/v1/tech-categories/:category/filters', TechCategoryController.getCategoryFilters);
app.get(
  '/api/v1/tech-categories/:category/specs-template',
  TechCategoryController.getSpecsTemplate
);

// PC Builder routes
app.post('/api/v1/pc-builder/validate', PCBuilderController.validateBuild);
app.post('/api/v1/pc-builder/estimate-power', PCBuilderController.estimatePowerConsumption);
app.post('/api/v1/pc-builder/calculate-performance', PCBuilderController.calculatePerformance);
app.post('/api/v1/pc-builder/optimize-budget', PCBuilderController.optimizeBudget);
app.post('/api/v1/pc-builder/save', PCBuilderController.saveBuild);
app.get('/api/v1/pc-builder/builds/:userId', PCBuilderController.getUserBuilds);
app.get('/api/v1/pc-builder/builds/public/trending', PCBuilderController.getTrendingBuilds);
app.get('/api/v1/pc-builder/components/:category', PCBuilderController.getCompatibleComponents);

// Comparison routes
app.post('/api/v1/compare/products', SpecsComparisonController.compareProducts);
app.get('/api/v1/compare/categories/:category', SpecsComparisonController.getComparableProducts);
app.post('/api/v1/compare/save', SpecsComparisonController.saveComparison);
app.get('/api/v1/compare/saved/:userId', SpecsComparisonController.getSavedComparisons);

// Uzbekistan specific routes
app.get('/api/v1/uzbekistan/vendors', TechProductController.getUzbekVendors);
app.get('/api/v1/uzbekistan/warranty/:productId', TechProductController.getWarrantyInfo);
app.get('/api/v1/uzbekistan/delivery-options/:productId', TechProductController.getDeliveryOptions);
app.get('/api/v1/uzbekistan/support-centers', TechProductController.getSupportCenters);

// Price tracking
app.get('/api/v1/price-history/:productId', TechProductController.getPriceHistory);
app.post('/api/v1/price-alerts', TechProductController.createPriceAlert);
app.get('/api/v1/price-alerts/:userId', TechProductController.getUserPriceAlerts);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    service: 'tech-product-service',
  });
});

app.listen(PORT, () => {
  appLogger.info('Tech Product Service started successfully', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    service: 'tech-product-service',
    endpoints: {
      health: `http://localhost:${PORT}/health`,
      pcBuilder: `http://localhost:${PORT}/api/v1/pc-builder`,
      comparison: `http://localhost:${PORT}/api/v1/compare`
    }
  });
});

export default app;
