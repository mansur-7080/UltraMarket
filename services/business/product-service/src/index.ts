import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 3002;
const HOST = process.env['HOST'] ?? 'localhost';

// Security middleware
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: process.env['CORS_ORIGIN'] ?? '*',
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] ?? '900000', 10),
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] ?? '1000', 10),
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'product-service',
    timestamp: new Date().toISOString(),
    version: process.env['APP_VERSION'] ?? '1.0.0',
  });
});

// Product routes
app.get('/api/v1/products', (req, res) => {
  res.json({
    success: true,
    message: 'Products retrieved successfully',
    data: [
      { id: '1', name: 'Sample Product 1', price: 100 },
      { id: '2', name: 'Sample Product 2', price: 200 }
    ]
  });
});

app.get('/api/v1/products/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    success: true,
    message: 'Product retrieved successfully',
    data: { id, name: `Sample Product ${id}`, price: 100 }
  });
});

// Category routes
app.get('/api/v1/categories', (req, res) => {
  res.json({
    success: true,
    message: 'Categories retrieved successfully',
    data: [
      { id: '1', name: 'Electronics' },
      { id: '2', name: 'Clothing' }
    ]
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`Product service started successfully on ${HOST}:${PORT}`);
});

export default app;