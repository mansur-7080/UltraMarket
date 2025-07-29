import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import axios from 'axios';

const app = express();
const PORT = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 3007;
const HOST = process.env['HOST') ?? '0.0.0.0';

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
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    version: process.env['APP_VERSION'] ?? '1.0.0',
  });
});

// Gateway routes
app.use('/auth/*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `http://localhost:3001${req.url.replace('/auth', '')}`,
      data: req.body,
      headers: req.headers,
    });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Auth service error',
      error: error.message
    });
  }
});

app.use('/products/*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `http://localhost:3002${req.url.replace('/products', '')}`,
      data: req.body,
      headers: req.headers,
    });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Product service error',
      error: error.message
    });
  }
});

// Admin panel route
app.get('/admin', (req, res) => {
  res.json({
    success: true,
    message: 'Admin panel endpoint ready',
    data: { adminUrl: 'http://localhost:5174' }
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
  console.log(`API Gateway started successfully on ${HOST}:${PORT}`);
});

export default app;