"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const notification_controller_1 = require("../controllers/notification.controller");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const router = (0, express_1.Router)();
const notificationController = new notification_controller_1.NotificationController();
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
router.post('/sms/delivery', rateLimit_middleware_1.rateLimitMiddleware.standard, (0, express_validator_1.body)('messageId').isString().trim(), (0, express_validator_1.body)('status').isIn(['delivered', 'failed', 'pending']), (0, express_validator_1.body)('provider').isString().trim(), (0, express_validator_1.body)('timestamp').optional().isISO8601(), (0, express_validator_1.body)('metadata').optional().isObject(), validation_middleware_1.validateRequest, notificationController.handleSmsDeliveryWebhook.bind(notificationController));
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
router.post('/email/delivery', rateLimit_middleware_1.rateLimitMiddleware.standard, (0, express_validator_1.body)('messageId').isString().trim(), (0, express_validator_1.body)('status').isIn(['delivered', 'bounced', 'complaint', 'failed']), (0, express_validator_1.body)('provider').isString().trim(), (0, express_validator_1.body)('timestamp').optional().isISO8601(), (0, express_validator_1.body)('metadata').optional().isObject(), validation_middleware_1.validateRequest, notificationController.handleEmailDeliveryWebhook.bind(notificationController));
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
router.post('/push/delivery', rateLimit_middleware_1.rateLimitMiddleware.standard, (0, express_validator_1.body)('messageId').isString().trim(), (0, express_validator_1.body)('status').isIn(['delivered', 'failed', 'invalid_token']), (0, express_validator_1.body)('provider').isString().trim(), (0, express_validator_1.body)('timestamp').optional().isISO8601(), (0, express_validator_1.body)('metadata').optional().isObject(), validation_middleware_1.validateRequest, notificationController.handlePushDeliveryWebhook.bind(notificationController));
exports.default = router;
//# sourceMappingURL=webhook.routes.js.map