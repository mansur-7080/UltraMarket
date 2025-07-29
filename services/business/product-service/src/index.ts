import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { connectDatabase } from './config/database';

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

// Mock products data
const mockProducts = [
  {
    id: '1',
    name: 'Gaming Laptop ASUS ROG',
    price: 15000000,
    category: 'laptops',
    description: 'Professional gaming laptop',
    inStock: true
  },
  {
    id: '2', 
    name: 'iPhone 15 Pro',
    price: 12000000,
    category: 'phones',
    description: 'Latest iPhone model',
    inStock: true
  }
];

// Product routes
app.get('/api/v1/products', (req, res) => {
  res.json({
    success: true,
    message: 'Products retrieved successfully',
    data: mockProducts
  });
});

app.get('/api/v1/products/:id', (req, res) => {
  const product = mockProducts.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  res.json({
    success: true,
    message: 'Product retrieved successfully',
    data: product
  });
});

app.post('/api/v1/products', (req, res) => {
  const { name, price, category, description } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({
      success: false,
      message: 'Name, price, and category are required'
    });
  }

  const newProduct = {
    id: (mockProducts.length + 1).toString(),
    name,
    price: parseInt(price),
    category,
    description: description || '',
    inStock: true
  };

  mockProducts.push(newProduct);

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: newProduct
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

// Initialize database connection and start server
async function startServer() {
  try {
    await connectDatabase();
    console.log('Database connected successfully');
  } catch (error) {
    console.warn('Database connection failed, using mock data:', error);
  }

  // Start server
  app.listen(PORT, HOST, () => {
    console.log(`Product service started successfully on ${HOST}:${PORT}`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

export default app;