import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { validateQuery, validateParams } from '../middleware/validation.middleware';
import {
  webhookQuerySchema,
  uuidParamSchema,
  paymentIdParamSchema,
} from '../schemas/payment.schemas';

const router = Router();
const webhookController = new WebhookController();

// Get webhooks by payment ID
router.get(
  '/payment/:paymentId',
  authenticateToken,
  validateParams(paymentIdParamSchema),
  validateQuery(webhookQuerySchema),
  webhookController.getWebhooksByPayment
);

// Get webhook by ID
router.get(
  '/:id',
  authenticateToken,
  requireAdmin,
  validateParams(uuidParamSchema),
  webhookController.getWebhook
);

// Get all webhooks (Admin only)
router.get(
  '/',
  authenticateToken,
  requireAdmin,
  validateQuery(webhookQuerySchema),
  webhookController.getAllWebhooks
);

// Get webhook statistics (Admin only)
router.get(
  '/admin/statistics',
  authenticateToken,
  requireAdmin,
  validateQuery(webhookQuerySchema),
  webhookController.getWebhookStatistics
);

// Retry webhook processing (Admin only)
router.post(
  '/:id/retry',
  authenticateToken,
  requireAdmin,
  validateParams(uuidParamSchema),
  webhookController.retryWebhook
);

export default router;
