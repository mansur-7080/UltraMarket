import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3035;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'navigation-service',
    timestamp: new Date().toISOString(),
  });
});

// Navigation endpoints
app.get('/api/navigation/menu', (req, res) => {
  res.json({
    message: 'Navigation menu',
    data: {
      menu: [
        { id: 1, name: 'Home', path: '/' },
        { id: 2, name: 'Products', path: '/products' },
        { id: 3, name: 'About', path: '/about' }
      ]
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Navigation Service running on port ${PORT}`);
});

export default app; 