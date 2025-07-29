import { Router } from 'express';

const router = Router();

// Placeholder routes - will be implemented fully
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'order-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

export default router;
