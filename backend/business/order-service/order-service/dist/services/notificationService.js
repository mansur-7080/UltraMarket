"use strict";
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
exports.NotificationService = void 0;
var shared_1 = require("@ultramarket/shared");
var NotificationService = /** @class */ (function () {
    function NotificationService() {
    }
    NotificationService.prototype.sendOrderConfirmation = function (order) {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 3, , 4]);
                        // Send email notification
                        return [4 /*yield*/, this.sendEmail({
                                to: ((_a = order.user) === null || _a === void 0 ? void 0 : _a.email) || '',
                                subject: 'Order Confirmation',
                                template: 'order-confirmation',
                                data: {
                                    orderId: order.id,
                                    total: order.total,
                                    status: order.status,
                                    user: order.user,
                                },
                            })];
                    case 1:
                        // Send email notification
                        _c.sent();
                        // Send SMS notification
                        return [4 /*yield*/, this.sendSMS({
                                to: ((_b = order.user) === null || _b === void 0 ? void 0 : _b.phone) || '',
                                message: "Your order #".concat(order.id, " has been confirmed. Total: $").concat(order.total),
                            })];
                    case 2:
                        // Send SMS notification
                        _c.sent();
                        shared_1.logger.info("Order confirmation sent for order: ".concat(order.id));
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _c.sent();
                        shared_1.logger.error('Failed to send order confirmation:', error_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    NotificationService.prototype.sendOrderStatusUpdate = function (order) {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 3, , 4]);
                        // Send email notification
                        return [4 /*yield*/, this.sendEmail({
                                to: ((_a = order.user) === null || _a === void 0 ? void 0 : _a.email) || '',
                                subject: 'Order Status Update',
                                template: 'order-status-update',
                                data: {
                                    orderId: order.id,
                                    status: order.status,
                                    user: order.user,
                                },
                            })];
                    case 1:
                        // Send email notification
                        _c.sent();
                        // Send SMS notification
                        return [4 /*yield*/, this.sendSMS({
                                to: ((_b = order.user) === null || _b === void 0 ? void 0 : _b.phone) || '',
                                message: "Your order #".concat(order.id, " status has been updated to: ").concat(order.status),
                            })];
                    case 2:
                        // Send SMS notification
                        _c.sent();
                        shared_1.logger.info("Order status update sent for order: ".concat(order.id));
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _c.sent();
                        shared_1.logger.error('Failed to send order status update:', error_2);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    NotificationService.prototype.sendOrderCancellation = function (order) {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 3, , 4]);
                        // Send email notification
                        return [4 /*yield*/, this.sendEmail({
                                to: ((_a = order.user) === null || _a === void 0 ? void 0 : _a.email) || '',
                                subject: 'Order Cancellation',
                                template: 'order-cancellation',
                                data: {
                                    orderId: order.id,
                                    user: order.user,
                                },
                            })];
                    case 1:
                        // Send email notification
                        _c.sent();
                        // Send SMS notification
                        return [4 /*yield*/, this.sendSMS({
                                to: ((_b = order.user) === null || _b === void 0 ? void 0 : _b.phone) || '',
                                message: "Your order #".concat(order.id, " has been cancelled."),
                            })];
                    case 2:
                        // Send SMS notification
                        _c.sent();
                        shared_1.logger.info("Order cancellation sent for order: ".concat(order.id));
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _c.sent();
                        shared_1.logger.error('Failed to send order cancellation:', error_3);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    NotificationService.prototype.sendPaymentConfirmation = function (order) {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        // Send email notification
                        return [4 /*yield*/, this.sendEmail({
                                to: ((_a = order.user) === null || _a === void 0 ? void 0 : _a.email) || '',
                                subject: 'Payment Confirmation',
                                template: 'payment-confirmation',
                                data: {
                                    orderId: order.id,
                                    total: order.total,
                                    user: order.user,
                                },
                            })];
                    case 1:
                        // Send email notification
                        _b.sent();
                        shared_1.logger.info("Payment confirmation sent for order: ".concat(order.id));
                        return [3 /*break*/, 3];
                    case 2:
                        error_4 = _b.sent();
                        shared_1.logger.error('Failed to send payment confirmation:', error_4);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    NotificationService.prototype.sendRefundNotification = function (order, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var error_5;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 3, , 4]);
                        // Send email notification
                        return [4 /*yield*/, this.sendEmail({
                                to: ((_a = order.user) === null || _a === void 0 ? void 0 : _a.email) || '',
                                subject: 'Refund Processed',
                                template: 'refund-notification',
                                data: {
                                    orderId: order.id,
                                    amount: amount,
                                    user: order.user,
                                },
                            })];
                    case 1:
                        // Send email notification
                        _c.sent();
                        // Send SMS notification
                        return [4 /*yield*/, this.sendSMS({
                                to: ((_b = order.user) === null || _b === void 0 ? void 0 : _b.phone) || '',
                                message: "Refund of $".concat(amount, " has been processed for order #").concat(order.id),
                            })];
                    case 2:
                        // Send SMS notification
                        _c.sent();
                        shared_1.logger.info("Refund notification sent for order: ".concat(order.id));
                        return [3 /*break*/, 4];
                    case 3:
                        error_5 = _c.sent();
                        shared_1.logger.error('Failed to send refund notification:', error_5);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    NotificationService.prototype.sendEmail = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Simulate email sending
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                    case 1:
                        // Simulate email sending
                        _a.sent();
                        shared_1.logger.info("Email sent to ".concat(data.to, ": ").concat(data.subject));
                        return [2 /*return*/];
                }
            });
        });
    };
    NotificationService.prototype.sendSMS = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Simulate SMS sending
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 300); })];
                    case 1:
                        // Simulate SMS sending
                        _a.sent();
                        shared_1.logger.info("SMS sent to ".concat(data.to, ": ").concat(data.message));
                        return [2 /*return*/];
                }
            });
        });
    };
    return NotificationService;
}());
exports.NotificationService = NotificationService;
