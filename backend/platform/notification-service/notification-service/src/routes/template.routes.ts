import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { NotificationController } from '../controllers/notification.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware';
import { validateRequest } from '../middleware/validation.middleware';

const router = Router();
const notificationController = new NotificationController();

// Template validation schemas
const createTemplateValidation = [
  body('name').isString().trim().isLength({ min: 1, max: 100 }),
  body('type').isIn([
    'ORDER_CONFIRMATION',
    'ORDER_SHIPPED',
    'ORDER_DELIVERED',
    'ORDER_CANCELLED',
    'PAYMENT_SUCCESS',
    'PAYMENT_FAILED',
    'ACCOUNT_VERIFICATION',
    'PASSWORD_RESET',
    'SECURITY_ALERT',
    'PROMOTION',
    'NEWSLETTER',
    'WELCOME',
    'CUSTOM',
  ]),
  body('channel').isIn(['EMAIL', 'SMS', 'PUSH', 'WEBHOOK', 'IN_APP']),
  body('subject').optional().isString().trim().isLength({ min: 1, max: 200 }),
  body('message').isString().trim().isLength({ min: 1, max: 2000 }),
  body('variables').optional().isArray(),
  body('variables.*').isString(),
  body('isActive').optional().isBoolean(),
];

const updateTemplateValidation = [
  param('templateId').isString().trim(),
  body('name').optional().isString().trim().isLength({ min: 1, max: 100 }),
  body('type')
    .optional()
    .isIn([
      'ORDER_CONFIRMATION',
      'ORDER_SHIPPED',
      'ORDER_DELIVERED',
      'ORDER_CANCELLED',
      'PAYMENT_SUCCESS',
      'PAYMENT_FAILED',
      'ACCOUNT_VERIFICATION',
      'PASSWORD_RESET',
      'SECURITY_ALERT',
      'PROMOTION',
      'NEWSLETTER',
      'WELCOME',
      'CUSTOM',
    ]),
  body('channel').optional().isIn(['EMAIL', 'SMS', 'PUSH', 'WEBHOOK', 'IN_APP']),
  body('subject').optional().isString().trim().isLength({ min: 1, max: 200 }),
  body('message').optional().isString().trim().isLength({ min: 1, max: 2000 }),
  body('variables').optional().isArray(),
  body('variables.*').isString(),
  body('isActive').optional().isBoolean(),
];

/**
 * @swagger
 * /api/v1/templates:
 *   get:
 *     summary: Get all notification templates
 *     tags: [Templates]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [ORDER_CONFIRMATION, ORDER_SHIPPED, ORDER_DELIVERED, ORDER_CANCELLED, PAYMENT_SUCCESS, PAYMENT_FAILED, ACCOUNT_VERIFICATION, PASSWORD_RESET, SECURITY_ALERT, PROMOTION, NEWSLETTER, WELCOME, CUSTOM]
 *       - in: query
 *         name: channel
 *         schema:
 *           type: string
 *           enum: [EMAIL, SMS, PUSH, WEBHOOK, IN_APP]
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  rateLimitMiddleware.standard,
  query('type')
    .optional()
    .isIn([
      'ORDER_CONFIRMATION',
      'ORDER_SHIPPED',
      'ORDER_DELIVERED',
      'ORDER_CANCELLED',
      'PAYMENT_SUCCESS',
      'PAYMENT_FAILED',
      'ACCOUNT_VERIFICATION',
      'PASSWORD_RESET',
      'SECURITY_ALERT',
      'PROMOTION',
      'NEWSLETTER',
      'WELCOME',
      'CUSTOM',
    ]),
  query('channel').optional().isIn(['EMAIL', 'SMS', 'PUSH', 'WEBHOOK', 'IN_APP']),
  query('active').optional().isBoolean(),
  validateRequest,
  notificationController.getTemplates.bind(notificationController)
);

/**
 * @swagger
 * /api/v1/templates/{templateId}:
 *   get:
 *     summary: Get template by ID
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template retrieved successfully
 *       404:
 *         description: Template not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:templateId',
  rateLimitMiddleware.standard,
  param('templateId').isString().trim(),
  validateRequest,
  notificationController.getTemplate.bind(notificationController)
);

/**
 * @swagger
 * /api/v1/templates:
 *   post:
 *     summary: Create notification template
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - channel
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               type:
 *                 type: string
 *                 enum: [ORDER_CONFIRMATION, ORDER_SHIPPED, ORDER_DELIVERED, ORDER_CANCELLED, PAYMENT_SUCCESS, PAYMENT_FAILED, ACCOUNT_VERIFICATION, PASSWORD_RESET, SECURITY_ALERT, PROMOTION, NEWSLETTER, WELCOME, CUSTOM]
 *               channel:
 *                 type: string
 *                 enum: [EMAIL, SMS, PUSH, WEBHOOK, IN_APP]
 *               subject:
 *                 type: string
 *                 maxLength: 200
 *               message:
 *                 type: string
 *                 maxLength: 2000
 *               variables:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Template created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  authMiddleware,
  requireRole(['admin', 'manager']),
  rateLimitMiddleware.standard,
  createTemplateValidation,
  validateRequest,
  notificationController.createTemplate.bind(notificationController)
);

/**
 * @swagger
 * /api/v1/templates/{templateId}:
 *   put:
 *     summary: Update notification template
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               type:
 *                 type: string
 *                 enum: [ORDER_CONFIRMATION, ORDER_SHIPPED, ORDER_DELIVERED, ORDER_CANCELLED, PAYMENT_SUCCESS, PAYMENT_FAILED, ACCOUNT_VERIFICATION, PASSWORD_RESET, SECURITY_ALERT, PROMOTION, NEWSLETTER, WELCOME, CUSTOM]
 *               channel:
 *                 type: string
 *                 enum: [EMAIL, SMS, PUSH, WEBHOOK, IN_APP]
 *               subject:
 *                 type: string
 *                 maxLength: 200
 *               message:
 *                 type: string
 *                 maxLength: 2000
 *               variables:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Template updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Template not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/:templateId',
  authMiddleware,
  requireRole(['admin', 'manager']),
  rateLimitMiddleware.standard,
  updateTemplateValidation,
  validateRequest,
  notificationController.updateTemplate.bind(notificationController)
);

/**
 * @swagger
 * /api/v1/templates/{templateId}:
 *   delete:
 *     summary: Delete notification template
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template deleted successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Template not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/:templateId',
  authMiddleware,
  requireRole(['admin']),
  rateLimitMiddleware.standard,
  param('templateId').isString().trim(),
  validateRequest,
  notificationController.deleteTemplate.bind(notificationController)
);

/**
 * @swagger
 * /api/v1/templates/{templateId}/preview:
 *   post:
 *     summary: Preview template with sample data
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               templateData:
 *                 type: object
 *                 description: Sample data for template variables
 *     responses:
 *       200:
 *         description: Template preview generated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Template not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/:templateId/preview',
  rateLimitMiddleware.standard,
  param('templateId').isString().trim(),
  body('templateData').optional().isObject(),
  validateRequest,
  notificationController.previewTemplate.bind(notificationController)
);

export default router;
