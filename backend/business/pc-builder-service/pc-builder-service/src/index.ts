import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3030;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'pc-builder-service',
    timestamp: new Date().toISOString(),
  });
});

// PC Builder endpoints
app.get('/api/pc-builder/configurations', (req, res) => {
  res.json({
    message: 'PC Builder configurations',
    data: {
      configurations: [
        { id: 1, name: 'Gaming PC', budget: 1500 },
        { id: 2, name: 'Workstation', budget: 2000 },
        { id: 3, name: 'Budget PC', budget: 500 }
      ]
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`PC Builder Service running on port ${PORT}`);
});

export default app; 