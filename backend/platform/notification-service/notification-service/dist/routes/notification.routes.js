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
// Validation schemas
const sendNotificationValidation = [
    (0, express_validator_1.body)('userId').optional().isString().trim(),
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
    (0, express_validator_1.body)('channel').isIn(['EMAIL', 'SMS', 'PUSH', 'WEBHOOK', 'IN_APP', 'ALL']),
    (0, express_validator_1.body)('title').isString().trim().isLength({ min: 1, max: 200 }),
    (0, express_validator_1.body)('message').isString().trim().isLength({ min: 1, max: 1000 }),
    (0, express_validator_1.body)('priority').optional().isIn(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
    (0, express_validator_1.body)('scheduledFor').optional().isISO8601(),
    (0, express_validator_1.body)('templateId').optional().isString(),
    (0, express_validator_1.body)('templateData').optional().isObject(),
    (0, express_validator_1.body)('metadata').optional().isObject(),
];
const bulkNotificationValidation = [
    (0, express_validator_1.body)('notifications').isArray({ min: 1, max: 100 }),
    (0, express_validator_1.body)('notifications.*.userId').optional().isString().trim(),
    (0, express_validator_1.body)('notifications.*.type').isIn([
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
    (0, express_validator_1.body)('notifications.*.channel').isIn(['EMAIL', 'SMS', 'PUSH', 'WEBHOOK', 'IN_APP', 'ALL']),
    (0, express_validator_1.body)('notifications.*.title').isString().trim().isLength({ min: 1, max: 200 }),
    (0, express_validator_1.body)('notifications.*.message').isString().trim().isLength({ min: 1, max: 1000 }),
];
const scheduleNotificationValidation = [
    ...sendNotificationValidation,
    (0, express_validator_1.body)('scheduledFor')
        .isISO8601()
        .custom((value) => {
        if (new Date(value) <= new Date()) {
            throw new Error('Scheduled date must be in the future');
        }
        return true;
    }),
];
// Routes
/**
 * @swagger
 * /api/v1/notifications/send:
 *   post:
 *     summary: Send single notification
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - channel
 *               - title
 *               - message
 *             properties:
 *               userId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [ORDER_CONFIRMATION, ORDER_SHIPPED, ORDER_DELIVERED, ORDER_CANCELLED, PAYMENT_SUCCESS, PAYMENT_FAILED, ACCOUNT_VERIFICATION, PASSWORD_RESET, SECURITY_ALERT, PROMOTION, NEWSLETTER, WELCOME, CUSTOM]
 *               channel:
 *                 type: string
 *                 enum: [EMAIL, SMS, PUSH, WEBHOOK, IN_APP, ALL]
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *               priority:
 *                 type: string
 *                 enum: [LOW, NORMAL, HIGH, URGENT]
 *               scheduledFor:
 *                 type: string
 *                 format: date-time
 *               templateId:
 *                 type: string
 *               templateData:
 *                 type: object
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Notification sent successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post('/send', rateLimit_middleware_1.rateLimitMiddleware.standard, sendNotificationValidation, validation_middleware_1.validateRequest, notificationController.sendNotification.bind(notificationController));
/**
 * @swagger
 * /api/v1/notifications/send-bulk:
 *   post:
 *     summary: Send bulk notifications
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notifications
 *             properties:
 *               notifications:
 *                 type: array
 *                 maxItems: 100
 *                 items:
 *                   type: object
 *                   required:
 *                     - type
 *                     - channel
 *                     - title
 *                     - message
 *                   properties:
 *                     userId:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [ORDER_CONFIRMATION, ORDER_SHIPPED, ORDER_DELIVERED, ORDER_CANCELLED, PAYMENT_SUCCESS, PAYMENT_FAILED, ACCOUNT_VERIFICATION, PASSWORD_RESET, SECURITY_ALERT, PROMOTION, NEWSLETTER, WELCOME, CUSTOM]
 *                     channel:
 *                       type: string
 *                       enum: [EMAIL, SMS, PUSH, WEBHOOK, IN_APP, ALL]
 *                     title:
 *                       type: string
 *                       maxLength: 200
 *                     message:
 *                       type: string
 *                       maxLength: 1000
 *     responses:
 *       200:
 *         description: Bulk notifications sent successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post('/send-bulk', rateLimit_middleware_1.rateLimitMiddleware.bulk, bulkNotificationValidation, validation_middleware_1.validateRequest, notificationController.sendBulkNotifications.bind(notificationController));
/**
 * @swagger
 * /api/v1/notifications/schedule:
 *   post:
 *     summary: Schedule notification
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - channel
 *               - title
 *               - message
 *               - scheduledFor
 *             properties:
 *               userId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [ORDER_CONFIRMATION, ORDER_SHIPPED, ORDER_DELIVERED, ORDER_CANCELLED, PAYMENT_SUCCESS, PAYMENT_FAILED, ACCOUNT_VERIFICATION, PASSWORD_RESET, SECURITY_ALERT, PROMOTION, NEWSLETTER, WELCOME, CUSTOM]
 *               channel:
 *                 type: string
 *                 enum: [EMAIL, SMS, PUSH, WEBHOOK, IN_APP, ALL]
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *               scheduledFor:
 *                 type: string
 *                 format: date-time
 *               templateId:
 *                 type: string
 *               templateData:
 *                 type: object
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Notification scheduled successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post('/schedule', rateLimit_middleware_1.rateLimitMiddleware.standard, scheduleNotificationValidation, validation_middleware_1.validateRequest, notificationController.scheduleNotification.bind(notificationController));
/**
 * @swagger
 * /api/v1/notifications/user/{userId}:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, QUEUED, SENDING, SENT, DELIVERED, READ, FAILED, CANCELLED, SCHEDULED]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [ORDER_CONFIRMATION, ORDER_SHIPPED, ORDER_DELIVERED, ORDER_CANCELLED, PAYMENT_SUCCESS, PAYMENT_FAILED, ACCOUNT_VERIFICATION, PASSWORD_RESET, SECURITY_ALERT, PROMOTION, NEWSLETTER, WELCOME, CUSTOM]
 *     responses:
 *       200:
 *         description: User notifications retrieved successfully
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 */
router.get('/user/:userId', rateLimit_middleware_1.rateLimitMiddleware.standard, (0, express_validator_1.param)('userId').isString().trim(), (0, express_validator_1.query)('page').optional().isInt({ min: 1 }), (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }), (0, express_validator_1.query)('status')
    .optional()
    .isIn([
    'PENDING',
    'QUEUED',
    'SENDING',
    'SENT',
    'DELIVERED',
    'READ',
    'FAILED',
    'CANCELLED',
    'SCHEDULED',
]), (0, express_validator_1.query)('type')
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
]), validation_middleware_1.validateRequest, notificationController.getUserNotifications.bind(notificationController));
/**
 * @swagger
 * /api/v1/notifications/{notificationId}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:notificationId/read', rateLimit_middleware_1.rateLimitMiddleware.standard, (0, express_validator_1.param)('notificationId').isString().trim(), validation_middleware_1.validateRequest, notificationController.markAsRead.bind(notificationController));
/**
 * @swagger
 * /api/v1/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.patch('/read-all', auth_middleware_1.authMiddleware, rateLimit_middleware_1.rateLimitMiddleware.standard, notificationController.markAllAsRead.bind(notificationController));
/**
 * @swagger
 * /api/v1/notifications/stats:
 *   get:
 *     summary: Get notification statistics
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
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
 *     responses:
 *       200:
 *         description: Notification statistics retrieved successfully
 *       400:
 *         description: Invalid date parameters
 *       500:
 *         description: Internal server error
 */
router.get('/stats', rateLimit_middleware_1.rateLimitMiddleware.standard, (0, express_validator_1.query)('startDate').isISO8601(), (0, express_validator_1.query)('endDate').isISO8601(), (0, express_validator_1.query)('type')
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
]), (0, express_validator_1.query)('channel').optional().isIn(['EMAIL', 'SMS', 'PUSH', 'WEBHOOK', 'IN_APP']), validation_middleware_1.validateRequest, notificationController.getStats.bind(notificationController));
/**
 * @swagger
 * /api/v1/notifications/analytics:
 *   get:
 *     summary: Get notification analytics
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
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
 *     responses:
 *       200:
 *         description: Notification analytics retrieved successfully
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 */
router.get('/analytics', rateLimit_middleware_1.rateLimitMiddleware.standard, (0, express_validator_1.query)('startDate').isISO8601(), (0, express_validator_1.query)('endDate').isISO8601(), (0, express_validator_1.query)('type')
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
]), (0, express_validator_1.query)('channel').optional().isIn(['EMAIL', 'SMS', 'PUSH', 'WEBHOOK', 'IN_APP']), validation_middleware_1.validateRequest, notificationController.getAnalytics.bind(notificationController));
/**
 * @swagger
 * /api/v1/notifications/failed:
 *   get:
 *     summary: Get failed notifications
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *           maximum: 1000
 *     responses:
 *       200:
 *         description: Failed notifications retrieved successfully
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 */
router.get('/failed', rateLimit_middleware_1.rateLimitMiddleware.standard, (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 1000 }), validation_middleware_1.validateRequest, notificationController.getFailedNotifications.bind(notificationController));
/**
 * @swagger
 * /api/v1/notifications/retry-failed:
 *   post:
 *     summary: Retry failed notifications
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Failed notifications retry initiated
 *       500:
 *         description: Internal server error
 */
router.post('/retry-failed', rateLimit_middleware_1.rateLimitMiddleware.strict, notificationController.retryFailedNotifications.bind(notificationController));
/**
 * @swagger
 * /api/v1/notifications/templates:
 *   get:
 *     summary: Get notification templates
 *     tags: [Notifications]
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
router.get('/templates', rateLimit_middleware_1.rateLimitMiddleware.standard, (0, express_validator_1.query)('type')
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
exports.default = router;
//# sourceMappingURL=notification.routes.js.map