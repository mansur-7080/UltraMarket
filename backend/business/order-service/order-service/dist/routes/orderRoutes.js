"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var auth_1 = require("../middleware/auth");
var orderController_1 = require("../controllers/orderController");
var orderValidator_1 = require("../validators/orderValidator");
var router = (0, express_1.Router)();
// Public routes (with authentication)
router.get('/orders/:id', auth_1.authenticateToken, orderController_1.getOrderById);
router.get('/orders/user/:userId', auth_1.authenticateToken, orderController_1.getOrdersByUser);
router.get('/orders/history/:userId', auth_1.authenticateToken, orderController_1.getOrderHistory);
// Protected routes (require specific roles)
router.post('/orders', auth_1.authenticateToken, orderValidator_1.validateOrder, orderController_1.createOrder);
router.put('/orders/:id/status', auth_1.authenticateToken, (0, auth_1.authorizeRoles)('admin', 'manager'), orderValidator_1.validateOrderUpdate, orderController_1.updateOrderStatus);
router.delete('/orders/:id', auth_1.authenticateToken, (0, auth_1.authorizeRoles)('admin', 'manager'), orderController_1.cancelOrder);
router.post('/orders/:id/payment', auth_1.authenticateToken, orderController_1.processOrderPayment);
router.post('/orders/:id/refund', auth_1.authenticateToken, (0, auth_1.authorizeRoles)('admin', 'manager'), orderController_1.refundOrder);
// Admin only routes
router.get('/orders', auth_1.authenticateToken, (0, auth_1.authorizeRoles)('admin', 'manager'), orderController_1.getAllOrders);
router.get('/orders/export', auth_1.authenticateToken, (0, auth_1.authorizeRoles)('admin'), orderController_1.exportOrders);
exports.default = router;
