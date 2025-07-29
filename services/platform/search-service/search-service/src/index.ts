import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from '@ultramarket/shared';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3007;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'search-service',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'UltraMarket Search Service',
    version: '1.0.0',
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Search Service running on port ${PORT}`);
});

export default app;
