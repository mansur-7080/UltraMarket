"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("../controllers/notification.controller");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const router = (0, express_1.Router)();
const notificationController = new notification_controller_1.NotificationController();
/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Get service health status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, unhealthy]
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     uptime:
 *                       type: number
 *                     version:
 *                       type: string
 *                     environment:
 *                       type: string
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                         responseTime:
 *                           type: number
 *                     services:
 *                       type: object
 *                       properties:
 *                         email:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                             provider:
 *                               type: string
 *                         sms:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                             providers:
 *                               type: array
 *                               items:
 *                                 type: string
 *                         push:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                             provider:
 *                               type: string
 *       500:
 *         description: Service is unhealthy
 */
router.get('/', rateLimit_middleware_1.rateLimitMiddleware.standard, notificationController.getHealth.bind(notificationController));
/**
 * @swagger
 * /api/v1/health/detailed:
 *   get:
 *     summary: Get detailed health status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Detailed health information
 *       500:
 *         description: Service is unhealthy
 */
router.get('/detailed', rateLimit_middleware_1.rateLimitMiddleware.standard, notificationController.getDetailedHealth.bind(notificationController));
exports.default = router;
//# sourceMappingURL=health.routes.js.map