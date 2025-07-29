import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { NotificationController } from '../controllers/notification.controller';
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware';
import { validateRequest } from '../middleware/validation.middleware';

const router = Router();
const notificationController = new NotificationController();

/**
 * @swagger
 * /api/v1/webhooks/sms/delivery:
 *   post:
 *     summary: Handle SMS delivery status webhook
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               messageId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [delivered, failed, pending]
 *               provider:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook data
 *       500:
 *         description: Internal server error
 */
router.post(
  '/sms/delivery',
  rateLimitMiddleware.standard,
  body('messageId').isString().trim(),
  body('status').isIn(['delivered', 'failed', 'pending']),
  body('provider').isString().trim(),
  body('timestamp').optional().isISO8601(),
  body('metadata').optional().isObject(),
  validateRequest,
  notificationController.handleSmsDeliveryWebhook.bind(notificationController)
);

/**
 * @swagger
 * /api/v1/webhooks/email/delivery:
 *   post:
 *     summary: Handle email delivery status webhook
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               messageId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [delivered, bounced, complaint, failed]
 *               provider:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook data
 *       500:
 *         description: Internal server error
 */
router.post(
  '/email/delivery',
  rateLimitMiddleware.standard,
  body('messageId').isString().trim(),
  body('status').isIn(['delivered', 'bounced', 'complaint', 'failed']),
  body('provider').isString().trim(),
  body('timestamp').optional().isISO8601(),
  body('metadata').optional().isObject(),
  validateRequest,
  notificationController.handleEmailDeliveryWebhook.bind(notificationController)
);

/**
 * @swagger
 * /api/v1/webhooks/push/delivery:
 *   post:
 *     summary: Handle push notification delivery status webhook
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               messageId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [delivered, failed, invalid_token]
 *               provider:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook data
 *       500:
 *         description: Internal server error
 */
router.post(
  '/push/delivery',
  rateLimitMiddleware.standard,
  body('messageId').isString().trim(),
  body('status').isIn(['delivered', 'failed', 'invalid_token']),
  body('provider').isString().trim(),
  body('timestamp').optional().isISO8601(),
  body('metadata').optional().isObject(),
  validateRequest,
  notificationController.handlePushDeliveryWebhook.bind(notificationController)
);

export default router;
