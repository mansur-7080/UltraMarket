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
    service: 'dynamic-pricing-service',
    timestamp: new Date().toISOString(),
  });
});

// Dynamic pricing endpoints
app.get('/api/pricing/calculate', (req, res) => {
  res.json({
    message: 'Dynamic pricing calculation',
    data: {
      basePrice: 100,
      dynamicPrice: 95,
      discount: 5,
      factors: ['demand', 'competition', 'time']
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Dynamic Pricing Service running on port ${PORT}`);
});

export default app; 