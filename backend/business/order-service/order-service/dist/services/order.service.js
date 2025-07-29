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
exports.OrderService = void 0;
var prisma_shim_1 = require("../config/prisma-shim");
var logger_1 = require("../utils/logger");
var OrderService = /** @class */ (function () {
    function OrderService() {
    }
    OrderService.prototype.createOrder = function (orderData) {
        return __awaiter(this, void 0, void 0, function () {
            var subtotal_1, taxRate, taxAmount_1, shippingAmount_1, discountAmount_1, totalAmount_1, result, order, error_1, error_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        // Validate required fields
                        if (!orderData.userId || !orderData.items || orderData.items.length === 0) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: {
                                        code: 'VALIDATION_ERROR',
                                        message: 'Invalid order data',
                                        details: { fields: ['userId', 'items'] },
                                    },
                                }];
                        }
                        subtotal_1 = orderData.items.reduce(function (sum, item) { return sum + item.price * item.quantity; }, 0);
                        taxRate = 0.08;
                        taxAmount_1 = parseFloat((subtotal_1 * taxRate).toFixed(2));
                        shippingAmount_1 = 9.99;
                        discountAmount_1 = 0;
                        totalAmount_1 = subtotal_1 + taxAmount_1 + shippingAmount_1 - discountAmount_1;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, prisma_shim_1.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                var order;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, tx.order.create({
                                                data: {
                                                    userId: orderData.userId,
                                                    orderNumber: "ORD-".concat(Date.now().toString().slice(-6)),
                                                    status: 'PENDING',
                                                    subtotal: subtotal_1,
                                                    taxAmount: taxAmount_1,
                                                    shippingAmount: shippingAmount_1,
                                                    discountAmount: discountAmount_1,
                                                    totalAmount: totalAmount_1,
                                                    // Add shipping and payment info
                                                    // ...more fields as needed
                                                },
                                            })];
                                        case 1:
                                            order = _a.sent();
                                            // Create order items
                                            return [4 /*yield*/, tx.orderItem.createMany({
                                                    data: orderData.items.map(function (item) { return ({
                                                        orderId: order.id,
                                                        productId: item.productId,
                                                        name: item.name,
                                                        sku: item.sku || '',
                                                        price: item.price,
                                                        quantity: item.quantity,
                                                        subtotal: item.price * item.quantity,
                                                    }); }),
                                                })];
                                        case 2:
                                            // Create order items
                                            _a.sent();
                                            return [2 /*return*/, order];
                                    }
                                });
                            }); })];
                    case 2:
                        result = _a.sent();
                        logger_1.logger.info('Order created successfully', {
                            orderId: result.id,
                            userId: orderData.userId,
                        });
                        order = __assign(__assign({}, result), { id: result.id, userId: result.userId, items: [], totalAmount: Number(result.subtotal) +
                                Number(result.taxAmount) +
                                Number(result.shippingAmount) -
                                Number(result.discountAmount), status: result.status, createdAt: result.createdAt.toISOString(), updatedAt: result.updatedAt.toISOString() });
                        return [2 /*return*/, {
                                success: true,
                                data: order,
                                message: 'Order created successfully',
                            }];
                    case 3:
                        error_1 = _a.sent();
                        throw error_1; // Rethrow for the outer catch
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_2 = _a.sent();
                        logger_1.logger.error('Failed to create order', { error: error_2 });
                        return [2 /*return*/, {
                                success: false,
                                error: {
                                    code: 'DATABASE_ERROR',
                                    message: 'Failed to create order',
                                    details: { error: error_2 },
                                },
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    OrderService.prototype.getOrderById = function (orderId) {
        return __awaiter(this, void 0, void 0, function () {
            var order, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, prisma_shim_1.prisma.order.findUnique({
                                where: { id: orderId },
                                include: {
                                    items: true,
                                    shipping: true,
                                    billing: true,
                                    payments: true,
                                },
                            })];
                    case 1:
                        order = _a.sent();
                        if (!order) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: {
                                        code: 'NOT_FOUND',
                                        message: 'Order not found',
                                        details: {
                                            resource: 'Order',
                                            identifier: orderId,
                                        },
                                    },
                                }];
                        }
                        return [2 /*return*/, {
                                success: true,
                                data: order,
                                message: 'Order retrieved successfully',
                            }];
                    case 2:
                        error_3 = _a.sent();
                        logger_1.logger.error('Failed to get order', { error: error_3, orderId: orderId });
                        return [2 /*return*/, {
                                success: false,
                                error: {
                                    code: 'DATABASE_ERROR',
                                    message: 'Failed to get order',
                                    details: { error: error_3 },
                                },
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    OrderService.prototype.updateOrderStatus = function (orderId, newStatus, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var order, invalidTransitions, updatedOrder, error_4;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, prisma_shim_1.prisma.order.findUnique({
                                where: { id: orderId },
                            })];
                    case 1:
                        order = _b.sent();
                        if (!order) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: {
                                        code: 'NOT_FOUND',
                                        message: 'Order not found',
                                        details: {
                                            resource: 'Order',
                                            identifier: orderId,
                                        },
                                    },
                                }];
                        }
                        // Check if user is authorized to update this order (if userId provided)
                        if (userId && order.userId !== userId) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: {
                                        code: 'UNAUTHORIZED',
                                        message: 'User not authorized to update this order',
                                    },
                                }];
                        }
                        invalidTransitions = {
                            DELIVERED: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'],
                            COMPLETED: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'],
                            CANCELLED: ['DELIVERED', 'COMPLETED'],
                            REFUNDED: ['PENDING'],
                        };
                        if (invalidTransitions[order.status] &&
                            ((_a = invalidTransitions[order.status]) === null || _a === void 0 ? void 0 : _a.includes(newStatus))) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: {
                                        code: 'BUSINESS_ERROR',
                                        message: 'Invalid order status transition',
                                        details: {
                                            businessRule: 'INVALID_STATUS_TRANSITION',
                                            currentStatus: order.status,
                                            requestedStatus: newStatus,
                                        },
                                    },
                                }];
                        }
                        return [4 /*yield*/, prisma_shim_1.prisma.order.update({
                                where: { id: orderId },
                                data: {
                                    status: newStatus,
                                    updatedAt: new Date(),
                                },
                            })];
                    case 2:
                        updatedOrder = _b.sent();
                        return [2 /*return*/, {
                                success: true,
                                data: updatedOrder,
                                message: 'Order status updated successfully',
                            }];
                    case 3:
                        error_4 = _b.sent();
                        logger_1.logger.error('Failed to update order status', { error: error_4, orderId: orderId });
                        return [2 /*return*/, {
                                success: false,
                                error: {
                                    code: 'DATABASE_ERROR',
                                    message: 'Failed to update order status',
                                    details: { error: error_4 },
                                },
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    OrderService.prototype.getUserOrders = function (userId_1) {
        return __awaiter(this, arguments, void 0, function (userId, page, limit, status) {
            var where, _a, orders, total, error_5;
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        where = { userId: userId };
                        if (status) {
                            where.status = status;
                        }
                        return [4 /*yield*/, Promise.all([
                                prisma_shim_1.prisma.order.findMany({
                                    where: where,
                                    include: { items: true },
                                    skip: (page - 1) * limit,
                                    take: limit,
                                    orderBy: { createdAt: 'desc' },
                                }),
                                prisma_shim_1.prisma.order.count({ where: where }),
                            ])];
                    case 1:
                        _a = _b.sent(), orders = _a[0], total = _a[1];
                        return [2 /*return*/, {
                                success: true,
                                data: {
                                    orders: orders,
                                    pagination: {
                                        page: page,
                                        limit: limit,
                                        total: total,
                                        totalPages: Math.ceil(total / limit),
                                    },
                                },
                                message: 'User orders retrieved successfully',
                            }];
                    case 2:
                        error_5 = _b.sent();
                        logger_1.logger.error('Failed to get user orders', { error: error_5, userId: userId });
                        return [2 /*return*/, {
                                success: false,
                                error: {
                                    code: 'DATABASE_ERROR',
                                    message: 'Failed to get user orders',
                                    details: { error: error_5 },
                                },
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    OrderService.prototype.cancelOrder = function (orderId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updateOrderStatus(orderId, 'CANCELLED', userId)];
            });
        });
    };
    return OrderService;
}());
exports.OrderService = OrderService;
