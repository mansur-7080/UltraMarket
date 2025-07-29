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
exports.PaymentService = void 0;
var prisma_shim_1 = require("../config/prisma-shim");
var shared_1 = require("@ultramarket/shared");
var order_types_1 = require("../types/order.types");
var PaymentService = /** @class */ (function () {
    function PaymentService() {
    }
    PaymentService.prototype.processPayment = function (orderId, method, details) {
        return __awaiter(this, void 0, void 0, function () {
            var order, payment, updatedPayment, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, prisma_shim_1.prisma.order.findUnique({
                                where: { id: orderId },
                                include: { payments: true },
                            })];
                    case 1:
                        order = _a.sent();
                        if (!order) {
                            throw new Error('Order not found');
                        }
                        if (order.paymentStatus === 'COMPLETED') {
                            throw new Error('Payment already completed');
                        }
                        return [4 /*yield*/, prisma_shim_1.prisma.payment.create({
                                data: {
                                    orderId: orderId,
                                    amount: order.total,
                                    currency: 'USD',
                                    method: method,
                                    status: order_types_1.PaymentStatus.PROCESSING,
                                    gateway: details.gateway || 'stripe',
                                    metadata: details,
                                },
                            })];
                    case 2:
                        payment = _a.sent();
                        // Simulate payment processing
                        return [4 /*yield*/, this.simulatePaymentProcessing(payment.id)];
                    case 3:
                        // Simulate payment processing
                        _a.sent();
                        return [4 /*yield*/, prisma_shim_1.prisma.payment.update({
                                where: { id: payment.id },
                                data: {
                                    status: order_types_1.PaymentStatus.COMPLETED,
                                    transactionId: "txn_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9)),
                                },
                            })];
                    case 4:
                        updatedPayment = _a.sent();
                        // Update order payment status
                        return [4 /*yield*/, prisma_shim_1.prisma.order.update({
                                where: { id: orderId },
                                data: {
                                    paymentStatus: order_types_1.PaymentStatus.COMPLETED,
                                },
                            })];
                    case 5:
                        // Update order payment status
                        _a.sent();
                        shared_1.logger.info("Payment processed successfully: ".concat(payment.id, " for order: ").concat(orderId));
                        return [2 /*return*/, updatedPayment];
                    case 6:
                        error_1 = _a.sent();
                        shared_1.logger.error('Payment processing failed:', error_1);
                        throw error_1;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    PaymentService.prototype.processRefund = function (orderId, amount, reason, processedBy) {
        return __awaiter(this, void 0, void 0, function () {
            var order, refund, updatedRefund, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, prisma_shim_1.prisma.order.findUnique({
                                where: { id: orderId },
                                include: { payments: true },
                            })];
                    case 1:
                        order = _a.sent();
                        if (!order) {
                            throw new Error('Order not found');
                        }
                        if (order.paymentStatus !== 'COMPLETED') {
                            throw new Error('Order payment not completed');
                        }
                        return [4 /*yield*/, prisma_shim_1.prisma.payment.create({
                                data: {
                                    orderId: orderId,
                                    amount: -amount, // Negative amount for refund
                                    currency: 'USD',
                                    method: order_types_1.PaymentMethod.CREDIT_CARD,
                                    status: order_types_1.PaymentStatus.PROCESSING,
                                    gateway: 'stripe',
                                    metadata: {
                                        type: 'refund',
                                        reason: reason,
                                        processedBy: processedBy,
                                    },
                                },
                            })];
                    case 2:
                        refund = _a.sent();
                        // Simulate refund processing
                        return [4 /*yield*/, this.simulateRefundProcessing(refund.id)];
                    case 3:
                        // Simulate refund processing
                        _a.sent();
                        return [4 /*yield*/, prisma_shim_1.prisma.payment.update({
                                where: { id: refund.id },
                                data: {
                                    status: order_types_1.PaymentStatus.COMPLETED,
                                    transactionId: "refund_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9)),
                                },
                            })];
                    case 4:
                        updatedRefund = _a.sent();
                        // Update order payment status
                        return [4 /*yield*/, prisma_shim_1.prisma.order.update({
                                where: { id: orderId },
                                data: {
                                    paymentStatus: order_types_1.PaymentStatus.REFUNDED,
                                },
                            })];
                    case 5:
                        // Update order payment status
                        _a.sent();
                        shared_1.logger.info("Refund processed successfully: ".concat(refund.id, " for order: ").concat(orderId));
                        return [2 /*return*/, updatedRefund];
                    case 6:
                        error_2 = _a.sent();
                        shared_1.logger.error('Refund processing failed:', error_2);
                        throw error_2;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    PaymentService.prototype.getPaymentHistory = function (orderId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_shim_1.prisma.payment.findMany({
                            where: { orderId: orderId },
                            orderBy: { createdAt: 'desc' },
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    PaymentService.prototype.getPaymentById = function (paymentId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_shim_1.prisma.payment.findUnique({
                            where: { id: paymentId },
                            include: {
                                order: {
                                    include: {
                                        user: {
                                            select: {
                                                id: true,
                                                email: true,
                                                firstName: true,
                                                lastName: true,
                                            },
                                        },
                                    },
                                },
                            },
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    PaymentService.prototype.simulatePaymentProcessing = function (paymentId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Simulate payment gateway processing
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                    case 1:
                        // Simulate payment gateway processing
                        _a.sent();
                        // Simulate 95% success rate
                        if (Math.random() < 0.05) {
                            throw new Error('Payment gateway error');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    PaymentService.prototype.simulateRefundProcessing = function (refundId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Simulate refund processing
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
                    case 1:
                        // Simulate refund processing
                        _a.sent();
                        // Simulate 98% success rate for refunds
                        if (Math.random() < 0.02) {
                            throw new Error('Refund processing error');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return PaymentService;
}());
exports.PaymentService = PaymentService;
