"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const notification_controller_1 = require("../controllers/notification.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const router = (0, express_1.Router)();
const notificationController = new notification_controller_1.NotificationController();
// Template validation schemas
const createTemplateValidation = [
    (0, express_validator_1.body)('name').isString().trim().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('type').isIn([
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
    (0, express_validator_1.body)('channel').isIn(['EMAIL', 'SMS', 'PUSH', 'WEBHOOK', 'IN_APP']),
    (0, express_validator_1.body)('subject').optional().isString().trim().isLength({ min: 1, max: 200 }),
    (0, express_validator_1.body)('message').isString().trim().isLength({ min: 1, max: 2000 }),
    (0, express_validator_1.body)('variables').optional().isArray(),
    (0, express_validator_1.body)('variables.*').isString(),
    (0, express_validator_1.body)('isActive').optional().isBoolean(),
];
const updateTemplateValidation = [
    (0, express_validator_1.param)('templateId').isString().trim(),
    (0, express_validator_1.body)('name').optional().isString().trim().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('type')
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
    (0, express_validator_1.body)('channel').optional().isIn(['EMAIL', 'SMS', 'PUSH', 'WEBHOOK', 'IN_APP']),
    (0, express_validator_1.body)('subject').optional().isString().trim().isLength({ min: 1, max: 200 }),
    (0, express_validator_1.body)('message').optional().isString().trim().isLength({ min: 1, max: 2000 }),
    (0, express_validator_1.body)('variables').optional().isArray(),
    (0, express_validator_1.body)('variables.*').isString(),
    (0, express_validator_1.body)('isActive').optional().isBoolean(),
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
router.get('/', rateLimit_middleware_1.rateLimitMiddleware.standard, (0, express_validator_1.query)('type')
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
]), (0, express_validator_1.query)('channel').optional().isIn(['EMAIL', 'SMS', 'PUSH', 'WEBHOOK', 'IN_APP']), (0, express_validator_1.query)('active').optional().isBoolean(), validation_middleware_1.validateRequest, notificationController.getTemplates.bind(notificationController));
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
router.get('/:templateId', rateLimit_middleware_1.rateLimitMiddleware.standard, (0, express_validator_1.param)('templateId').isString().trim(), validation_middleware_1.validateRequest, notificationController.getTemplate.bind(notificationController));
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
router.post('/', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['admin', 'manager']), rateLimit_middleware_1.rateLimitMiddleware.standard, createTemplateValidation, validation_middleware_1.validateRequest, notificationController.createTemplate.bind(notificationController));
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
router.put('/:templateId', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['admin', 'manager']), rateLimit_middleware_1.rateLimitMiddleware.standard, updateTemplateValidation, validation_middleware_1.validateRequest, notificationController.updateTemplate.bind(notificationController));
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
router.delete('/:templateId', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requireRole)(['admin']), rateLimit_middleware_1.rateLimitMiddleware.standard, (0, express_validator_1.param)('templateId').isString().trim(), validation_middleware_1.validateRequest, notificationController.deleteTemplate.bind(notificationController));
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
router.post('/:templateId/preview', rateLimit_middleware_1.rateLimitMiddleware.standard, (0, express_validator_1.param)('templateId').isString().trim(), (0, express_validator_1.body)('templateData').optional().isObject(), validation_middleware_1.validateRequest, notificationController.previewTemplate.bind(notificationController));
exports.default = router;
//# sourceMappingURL=template.routes.js.map