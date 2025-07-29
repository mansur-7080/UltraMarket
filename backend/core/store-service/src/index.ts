import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3025;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'store-service',
    timestamp: new Date().toISOString(),
  });
});

// Store endpoints
app.get('/api/stores', (req, res) => {
  res.json({
    message: 'Store management',
    data: {
      stores: [
        { id: 1, name: 'Main Store', location: 'Tashkent' },
        { id: 2, name: 'Branch Store', location: 'Samarkand' }
      ]
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Store Service running on port ${PORT}`);
});

export default app; 