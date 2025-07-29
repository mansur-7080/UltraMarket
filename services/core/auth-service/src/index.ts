import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDatabase } from './config/database';

const app = express();
const PORT = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 3001;
const HOST = process.env['HOST'] ?? '0.0.0.0';
const JWT_SECRET = process.env['JWT_SECRET'] || 'your-secret-key';

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
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    version: process.env['APP_VERSION'] ?? '1.0.0',
  });
});

// Auth routes
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // TODO: Check user in database
    // For now, using mock authentication
    if (email === 'admin@ultramarket.uz' && password === 'admin123') {
      const token = jwt.sign(
        { userId: '1', email: email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: { 
          token,
          user: {
            id: '1',
            email: email,
            name: 'Admin User'
          }
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // TODO: Save user to database
    // For now, return mock response
    const token = jwt.sign(
      { userId: '2', email: email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { 
        token,
        user: {
          id: '2',
          email: email,
          name: name
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.post('/api/v1/auth/verify', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({
      success: true,
      message: 'Token is valid',
      data: { user: decoded }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
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
      console.log(`Auth service started successfully on ${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start auth service', error);
    // Start server even if database fails
    app.listen(PORT, HOST, () => {
      console.log(`Auth service started successfully on ${HOST}:${PORT} (mock mode)`);
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