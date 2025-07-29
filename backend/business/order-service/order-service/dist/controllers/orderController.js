"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportOrders = exports.refundOrder = exports.processOrderPayment = exports.getOrderHistory = exports.getOrdersByUser = exports.cancelOrder = exports.updateOrderStatus = exports.getAllOrders = exports.getOrderById = exports.createOrder = void 0;
var shared_1 = require("@ultramarket/shared");
var orderService_1 = require("../services/orderService");
var paymentService_1 = require("../services/paymentService");
var notificationService_1 = require("../services/notificationService");
var order_types_1 = require("../types/order.types");
var orderService = new orderService_1.OrderService();
var paymentService = new paymentService_1.PaymentService();
var notificationService = new notificationService_1.NotificationService();
var createOrder = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, orderData, order, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                userId = req.user.userId;
                orderData = req.body;
                return [4 /*yield*/, orderService.createOrder(__assign(__assign({}, orderData), { userId: userId }))];
            case 1:
                order = _a.sent();
                // Send notification
                return [4 /*yield*/, notificationService.sendOrderConfirmation(order)];
            case 2:
                // Send notification
                _a.sent();
                shared_1.logger.info("Order created successfully: ".concat(order.id));
                res.status(201).json({
                    success: true,
                    message: 'Order created successfully',
                    data: order,
                });
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                shared_1.logger.error('Error creating order:', error_1);
                res.status(500).json({
                    success: false,
                    message: 'Failed to create order',
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.createOrder = createOrder;
var getOrderById = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, userId, role, order, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                id = req.params.id;
                _a = req.user, userId = _a.userId, role = _a.role;
                if (!id || !userId || !role) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Missing required parameters',
                        })];
                }
                return [4 /*yield*/, orderService.getOrderById(id, userId, role)];
            case 1:
                order = _b.sent();
                if (!order) {
                    return [2 /*return*/, res.status(404).json({
                            success: false,
                            message: 'Order not found',
                        })];
                }
                return [2 /*return*/, res.status(200).json({
                        success: true,
                        data: order,
                    })];
            case 2:
                error_2 = _b.sent();
                shared_1.logger.error('Error fetching order:', error_2);
                return [2 /*return*/, res.status(500).json({
                        success: false,
                        message: 'Failed to fetch order',
                    })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getOrderById = getOrderById;
var getAllOrders = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, page, _c, limit, status_1, userId, role, orders, error_3;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 2, , 3]);
                _a = req.query, _b = _a.page, page = _b === void 0 ? 1 : _b, _c = _a.limit, limit = _c === void 0 ? 10 : _c, status_1 = _a.status, userId = _a.userId;
                role = req.user.role;
                return [4 /*yield*/, orderService.getAllOrders({
                        page: Number(page),
                        limit: Number(limit),
                        status: status_1,
                        userId: userId,
                        role: role,
                    })];
            case 1:
                orders = _d.sent();
                res.status(200).json({
                    success: true,
                    data: orders,
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _d.sent();
                shared_1.logger.error('Error fetching orders:', error_3);
                res.status(500).json({
                    success: false,
                    message: 'Failed to fetch orders',
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getAllOrders = getAllOrders;
var updateOrderStatus = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, status_2, notes, userId, order, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                id = req.params.id;
                _a = req.body, status_2 = _a.status, notes = _a.notes;
                userId = req.user.userId;
                if (!id || !status_2 || !userId) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Missing required parameters',
                        })];
                }
                return [4 /*yield*/, orderService.updateOrderStatus(id, status_2, notes || '', userId)];
            case 1:
                order = _b.sent();
                // Send notification
                return [4 /*yield*/, notificationService.sendOrderStatusUpdate(order)];
            case 2:
                // Send notification
                _b.sent();
                shared_1.logger.info("Order status updated: ".concat(id, " -> ").concat(status_2));
                return [2 /*return*/, res.status(200).json({
                        success: true,
                        message: 'Order status updated successfully',
                        data: order,
                    })];
            case 3:
                error_4 = _b.sent();
                shared_1.logger.error('Error updating order status:', error_4);
                return [2 /*return*/, res.status(500).json({
                        success: false,
                        message: 'Failed to update order status',
                    })];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.updateOrderStatus = updateOrderStatus;
var cancelOrder = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, reason, userId, order, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                id = req.params.id;
                reason = req.body.reason;
                userId = req.user.userId;
                if (!id || !reason || !userId) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Missing required parameters',
                        })];
                }
                return [4 /*yield*/, orderService.cancelOrder(id, reason, userId)];
            case 1:
                order = _a.sent();
                // Send notification
                return [4 /*yield*/, notificationService.sendOrderCancellation(order)];
            case 2:
                // Send notification
                _a.sent();
                shared_1.logger.info("Order cancelled: ".concat(id));
                return [2 /*return*/, res.status(200).json({
                        success: true,
                        message: 'Order cancelled successfully',
                        data: order,
                    })];
            case 3:
                error_5 = _a.sent();
                shared_1.logger.error('Error cancelling order:', error_5);
                return [2 /*return*/, res.status(500).json({
                        success: false,
                        message: 'Failed to cancel order',
                    })];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.cancelOrder = cancelOrder;
var getOrdersByUser = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, _b, page, _c, limit, orders, error_6;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 2, , 3]);
                userId = req.params.userId;
                _a = req.query, _b = _a.page, page = _b === void 0 ? 1 : _b, _c = _a.limit, limit = _c === void 0 ? 10 : _c;
                if (!userId) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'User ID is required',
                        })];
                }
                return [4 /*yield*/, orderService.getOrdersByUser(userId, {
                        page: Number(page),
                        limit: Number(limit),
                    })];
            case 1:
                orders = _d.sent();
                return [2 /*return*/, res.status(200).json({
                        success: true,
                        data: orders,
                    })];
            case 2:
                error_6 = _d.sent();
                shared_1.logger.error('Error fetching user orders:', error_6);
                return [2 /*return*/, res.status(500).json({
                        success: false,
                        message: 'Failed to fetch user orders',
                    })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getOrdersByUser = getOrdersByUser;
var getOrderHistory = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, _b, page, _c, limit, history_1, error_7;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 2, , 3]);
                userId = req.params.userId;
                _a = req.query, _b = _a.page, page = _b === void 0 ? 1 : _b, _c = _a.limit, limit = _c === void 0 ? 10 : _c;
                if (!userId) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'User ID is required',
                        })];
                }
                return [4 /*yield*/, orderService.getOrderHistory(userId, {
                        page: Number(page),
                        limit: Number(limit),
                    })];
            case 1:
                history_1 = _d.sent();
                return [2 /*return*/, res.status(200).json({
                        success: true,
                        data: history_1,
                    })];
            case 2:
                error_7 = _d.sent();
                shared_1.logger.error('Error fetching order history:', error_7);
                return [2 /*return*/, res.status(500).json({
                        success: false,
                        message: 'Failed to fetch order history',
                    })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getOrderHistory = getOrderHistory;
var processOrderPayment = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, paymentMethod, paymentDetails, userId, payment, error_8;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                id = req.params.id;
                _a = req.body, paymentMethod = _a.paymentMethod, paymentDetails = _a.paymentDetails;
                userId = req.user.userId;
                if (!id || !paymentMethod) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Missing required parameters',
                        })];
                }
                return [4 /*yield*/, paymentService.processPayment(id, paymentMethod, paymentDetails)];
            case 1:
                payment = _b.sent();
                // Update order status
                return [4 /*yield*/, orderService.updateOrderStatus(id, order_types_1.OrderStatus.PAID, 'Payment processed successfully', userId)];
            case 2:
                // Update order status
                _b.sent();
                shared_1.logger.info("Payment processed for order: ".concat(id));
                return [2 /*return*/, res.status(200).json({
                        success: true,
                        message: 'Payment processed successfully',
                        data: payment,
                    })];
            case 3:
                error_8 = _b.sent();
                shared_1.logger.error('Error processing payment:', error_8);
                return [2 /*return*/, res.status(500).json({
                        success: false,
                        message: 'Failed to process payment',
                    })];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.processOrderPayment = processOrderPayment;
var refundOrder = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, reason, amount, userId, refund, error_9;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                id = req.params.id;
                _a = req.body, reason = _a.reason, amount = _a.amount;
                userId = req.user.userId;
                if (!id || !amount || !reason || !userId) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: 'Missing required parameters',
                        })];
                }
                return [4 /*yield*/, paymentService.processRefund(id, amount, reason, userId)];
            case 1:
                refund = _b.sent();
                // Update order status
                return [4 /*yield*/, orderService.updateOrderStatus(id, order_types_1.OrderStatus.REFUNDED, "Refund processed: ".concat(reason), userId)];
            case 2:
                // Update order status
                _b.sent();
                shared_1.logger.info("Refund processed for order: ".concat(id));
                return [2 /*return*/, res.status(200).json({
                        success: true,
                        message: 'Refund processed successfully',
                        data: refund,
                    })];
            case 3:
                error_9 = _b.sent();
                shared_1.logger.error('Error processing refund:', error_9);
                return [2 /*return*/, res.status(500).json({
                        success: false,
                        message: 'Failed to process refund',
                    })];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.refundOrder = refundOrder;
var exportOrders = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, format, dateFrom, dateTo, exportData, error_10;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                _a = req.query, _b = _a.format, format = _b === void 0 ? 'csv' : _b, dateFrom = _a.dateFrom, dateTo = _a.dateTo;
                return [4 /*yield*/, orderService.exportOrders({
                        format: format,
                        dateFrom: dateFrom,
                        dateTo: dateTo,
                    })];
            case 1:
                exportData = _c.sent();
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', "attachment; filename=orders-".concat(Date.now(), ".csv"));
                res.status(200).send(exportData);
                return [3 /*break*/, 3];
            case 2:
                error_10 = _c.sent();
                shared_1.logger.error('Error exporting orders:', error_10);
                res.status(500).json({
                    success: false,
                    message: 'Failed to export orders',
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.exportOrders = exportOrders;
