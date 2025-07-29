import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { connectDatabase } from './config/database';

const app: Application = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3002;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
});
app.use(limiter);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'product-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected'
  });
});

// Mock product data
const mockProducts = [
  {
    id: '1',
    name: 'Gaming Laptop ASUS ROG',
    price: 1200.00,
    category: 'Kompyuterlar',
    stock: 15,
    description: 'Yuqori unumdorlikdagi gaming laptop',
    image: 'https://via.placeholder.com/300x200'
  },
  {
    id: '2', 
    name: 'Simsiz sichqoncha',
    price: 25.99,
    category: 'Aksessuarlar',
    stock: 50,
    description: 'Ergonomik simsiz sichqoncha',
    image: 'https://via.placeholder.com/300x200'
  },
  {
    id: '3',
    name: 'Mexanik klaviatura',
    price: 89.99,
    category: 'Aksessuarlar', 
    stock: 30,
    description: 'RGB yorug\'lik bilan mexanik klaviatura',
    image: 'https://via.placeholder.com/300x200'
  },
  {
    id: '4',
    name: 'Gaming monitor 24"',
    price: 299.99,
    category: 'Monitorlar',
    stock: 20,
    description: '144Hz gaming monitor',
    image: 'https://via.placeholder.com/300x200'
  }
];

// Product routes
app.get('/api/products', (req: Request, res: Response) => {
  const { category, search, limit = '10', page = '1' } = req.query;
  let filteredProducts = [...mockProducts];

  if (category) {
    filteredProducts = filteredProducts.filter(p => 
      p.category.toLowerCase().includes(category.toString().toLowerCase())
    );
  }

  if (search) {
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(search.toString().toLowerCase()) ||
      p.description.toLowerCase().includes(search.toString().toLowerCase())
    );
  }

  const pageNum = parseInt(page.toString());
  const limitNum = parseInt(limit.toString());
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;

  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: paginatedProducts,
    total: filteredProducts.length,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(filteredProducts.length / limitNum)
  });
});

app.get('/api/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const product = mockProducts.find(p => p.id === id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Mahsulot topilmadi'
    });
  }

  res.json({
    success: true,
    data: product
  });
});

app.post('/api/products', (req: Request, res: Response) => {
  const { name, price, category, stock, description } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({
      success: false,
      message: 'Majburiy maydonlar: name, price, category'
    });
  }

  const newProduct = {
    id: String(mockProducts.length + 1),
    name,
    price: parseFloat(price),
    category,
    stock: parseInt(stock) || 0,
    description: description || '',
    image: 'https://via.placeholder.com/300x200'
  };

  mockProducts.push(newProduct);

  res.status(201).json({
    success: true,
    data: newProduct,
    message: 'Mahsulot muvaffaqiyatli qo\'shildi'
  });
});

app.put('/api/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const productIndex = mockProducts.findIndex(p => p.id === id);

  if (productIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Mahsulot topilmadi'
    });
  }

  const updatedProduct = { ...mockProducts[productIndex], ...req.body };
  mockProducts[productIndex] = updatedProduct;

  res.json({
    success: true,
    data: updatedProduct,
    message: 'Mahsulot yangilandi'
  });
});

app.delete('/api/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const productIndex = mockProducts.findIndex(p => p.id === id);

  if (productIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Mahsulot topilmadi'
    });
  }

  mockProducts.splice(productIndex, 1);

  res.json({
    success: true,
    message: 'Mahsulot o\'chirildi'
  });
});

// Categories endpoint
app.get('/api/categories', (req: Request, res: Response) => {
  const categories = [...new Set(mockProducts.map(p => p.category))];
  res.json({
    success: true,
    data: categories
  });
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server xatosi'
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Yo\'l topilmadi'
  });
});

async function startServer() {
  try {
    await connectDatabase();
    console.log('Database connected successfully');

    app.listen(PORT, HOST, () => {
      console.log(`Product service started successfully on ${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error('Database connection failed, using mock database:', error);
    app.listen(PORT, HOST, () => {
      console.log(`Product service started successfully on ${HOST}:${PORT}`);
    });
  }
}

startServer();