import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { connectDatabase } from './config/database';
import Product from './models/Product';
import Category from './models/Category';

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
app.get('/api/v1/products', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    
    // Mock data for now
    const mockProducts = [
      { id: '1', name: 'Sample Product 1', price: 100, category: 'Electronics' },
      { id: '2', name: 'Sample Product 2', price: 200, category: 'Clothing' }
    ];

    res.json({
      success: true,
      message: 'Products retrieved successfully',
      data: {
        products: mockProducts,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: mockProducts.length,
          pages: 1
        }
      }
    });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.get('/api/v1/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock data for now
    const mockProduct = { id, name: `Sample Product ${id}`, price: 100 };

    res.json({
      success: true,
      message: 'Product retrieved successfully',
      data: mockProduct
    });
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.post('/api/v1/products', async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body;
    
    if (!name || !description || !price || !category || !image) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, price, category, and image are required'
      });
    }

    // Mock response for now
    const mockProduct = {
      id: Date.now().toString(),
      name,
      description,
      price: parseFloat(price),
      category,
      image,
      stock: stock || 0
    };

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: mockProduct
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Category routes
app.get('/api/v1/categories', async (req, res) => {
  try {
    // Mock data for now
    const mockCategories = [
      { id: '1', name: 'Electronics', description: 'Electronic devices' },
      { id: '2', name: 'Clothing', description: 'Fashion items' }
    ];
    
    res.json({
      success: true,
      message: 'Categories retrieved successfully',
      data: mockCategories
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.get('/api/v1/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock data for now
    const mockCategory = { id, name: `Category ${id}`, description: 'Sample category' };

    res.json({
      success: true,
      message: 'Category retrieved successfully',
      data: mockCategory
    });
  } catch (error) {
    console.error('Error getting category:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
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

    // Start server
    app.listen(PORT, HOST, () => {
      console.log(`Product service started successfully on ${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start product service', error);
    // Start server even if database fails
    app.listen(PORT, HOST, () => {
      console.log(`Product service started successfully on ${HOST}:${PORT} (mock mode)`);
    });
  }
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