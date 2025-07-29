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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
var prisma_shim_1 = require("../config/prisma-shim");
var shared_1 = require("@ultramarket/shared");
var order_types_1 = require("../types/order.types");
var OrderService = /** @class */ (function () {
    function OrderService() {
    }
    OrderService.prototype.createOrder = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, items, shippingAddress, billingAddress, paymentMethod, notes, total, order;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userId = data.userId, items = data.items, shippingAddress = data.shippingAddress, billingAddress = data.billingAddress, paymentMethod = data.paymentMethod, notes = data.notes;
                        total = items.reduce(function (sum, item) { return sum + item.price * item.quantity; }, 0);
                        return [4 /*yield*/, prisma_shim_1.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                var order;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, tx.order.create({
                                                data: {
                                                    userId: userId,
                                                    status: order_types_1.OrderStatus.PENDING,
                                                    total: total,
                                                    shippingAddress: shippingAddress,
                                                    billingAddress: billingAddress,
                                                    paymentMethod: paymentMethod,
                                                    notes: notes,
                                                    orderItems: {
                                                        create: items.map(function (item) { return ({
                                                            productId: item.productId,
                                                            quantity: item.quantity,
                                                            price: item.price,
                                                            subtotal: item.price * item.quantity,
                                                        }); }),
                                                    },
                                                },
                                                include: {
                                                    orderItems: true,
                                                    user: {
                                                        select: {
                                                            id: true,
                                                            email: true,
                                                            firstName: true,
                                                            lastName: true,
                                                        },
                                                    },
                                                },
                                            })];
                                        case 1:
                                            order = _a.sent();
                                            return [2 /*return*/, order];
                                    }
                                });
                            }); })];
                    case 1:
                        order = _a.sent();
                        shared_1.logger.info("Order created: ".concat(order.id, " for user: ").concat(userId));
                        return [2 /*return*/, order];
                }
            });
        });
    };
    OrderService.prototype.getOrderById = function (id, userId, role) {
        return __awaiter(this, void 0, void 0, function () {
            var where, order;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        where = { id: id };
                        // If not admin, ensure user can only access their own orders
                        if (role !== 'admin' && role !== 'manager') {
                            where.userId = userId;
                        }
                        return [4 /*yield*/, prisma_shim_1.prisma.order.findUnique({
                                where: where,
                                include: {
                                    orderItems: {
                                        include: {
                                            product: true,
                                        },
                                    },
                                    user: {
                                        select: {
                                            id: true,
                                            email: true,
                                            firstName: true,
                                            lastName: true,
                                        },
                                    },
                                },
                            })];
                    case 1:
                        order = _a.sent();
                        return [2 /*return*/, order];
                }
            });
        });
    };
    OrderService.prototype.getAllOrders = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            var page, limit, status, userId, role, skip, where, _a, orders, total;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        page = filters.page, limit = filters.limit, status = filters.status, userId = filters.userId, role = filters.role;
                        skip = (page - 1) * limit;
                        where = {};
                        // Apply filters
                        if (status)
                            where.status = status;
                        if (userId)
                            where.userId = userId;
                        // If not admin, limit to user's orders
                        if (role !== 'admin' && role !== 'manager') {
                            where.userId = userId;
                        }
                        return [4 /*yield*/, Promise.all([
                                prisma_shim_1.prisma.order.findMany({
                                    where: where,
                                    skip: skip,
                                    take: limit,
                                    orderBy: { createdAt: 'desc' },
                                    include: {
                                        orderItems: {
                                            include: {
                                                product: true,
                                            },
                                        },
                                        user: {
                                            select: {
                                                id: true,
                                                email: true,
                                                firstName: true,
                                                lastName: true,
                                            },
                                        },
                                    },
                                }),
                                prisma_shim_1.prisma.order.count({ where: where }),
                            ])];
                    case 1:
                        _a = _b.sent(), orders = _a[0], total = _a[1];
                        return [2 /*return*/, {
                                orders: orders,
                                total: total,
                                pages: Math.ceil(total / limit),
                            }];
                }
            });
        });
    };
    OrderService.prototype.updateOrderStatus = function (id, status, notes, updatedBy) {
        return __awaiter(this, void 0, void 0, function () {
            var order;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_shim_1.prisma.order.update({
                            where: { id: id },
                            data: {
                                status: status,
                                notes: notes,
                                updatedAt: new Date(),
                            },
                            include: {
                                orderItems: true,
                                user: {
                                    select: {
                                        id: true,
                                        email: true,
                                        firstName: true,
                                        lastName: true,
                                    },
                                },
                            },
                        })];
                    case 1:
                        order = _a.sent();
                        // Log status change
                        return [4 /*yield*/, prisma_shim_1.prisma.orderHistory.create({
                                data: {
                                    orderId: id,
                                    status: status,
                                    notes: notes,
                                    updatedBy: updatedBy,
                                },
                            })];
                    case 2:
                        // Log status change
                        _a.sent();
                        shared_1.logger.info("Order status updated: ".concat(id, " -> ").concat(status));
                        return [2 /*return*/, order];
                }
            });
        });
    };
    OrderService.prototype.cancelOrder = function (id, reason, cancelledBy) {
        return __awaiter(this, void 0, void 0, function () {
            var order;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_shim_1.prisma.order.update({
                            where: { id: id },
                            data: {
                                status: order_types_1.OrderStatus.CANCELLED,
                                notes: "Cancelled: ".concat(reason),
                                updatedAt: new Date(),
                            },
                            include: {
                                orderItems: true,
                                user: {
                                    select: {
                                        id: true,
                                        email: true,
                                        firstName: true,
                                        lastName: true,
                                    },
                                },
                            },
                        })];
                    case 1:
                        order = _a.sent();
                        // Log cancellation
                        return [4 /*yield*/, prisma_shim_1.prisma.orderHistory.create({
                                data: {
                                    orderId: id,
                                    status: order_types_1.OrderStatus.CANCELLED,
                                    notes: "Cancelled by ".concat(cancelledBy, ": ").concat(reason),
                                    updatedBy: cancelledBy,
                                },
                            })];
                    case 2:
                        // Log cancellation
                        _a.sent();
                        shared_1.logger.info("Order cancelled: ".concat(id, " - ").concat(reason));
                        return [2 /*return*/, order];
                }
            });
        });
    };
    OrderService.prototype.getOrdersByUser = function (userId, filters) {
        return __awaiter(this, void 0, void 0, function () {
            var page, limit, skip, _a, orders, total;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        page = filters.page, limit = filters.limit;
                        skip = (page - 1) * limit;
                        return [4 /*yield*/, Promise.all([
                                prisma_shim_1.prisma.order.findMany({
                                    where: { userId: userId },
                                    skip: skip,
                                    take: limit,
                                    orderBy: { createdAt: 'desc' },
                                    include: {
                                        orderItems: {
                                            include: {
                                                product: true,
                                            },
                                        },
                                    },
                                }),
                                prisma_shim_1.prisma.order.count({ where: { userId: userId } }),
                            ])];
                    case 1:
                        _a = _b.sent(), orders = _a[0], total = _a[1];
                        return [2 /*return*/, {
                                orders: orders,
                                total: total,
                                pages: Math.ceil(total / limit),
                            }];
                }
            });
        });
    };
    OrderService.prototype.getOrderHistory = function (userId, filters) {
        return __awaiter(this, void 0, void 0, function () {
            var page, limit, skip, _a, history, total;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        page = filters.page, limit = filters.limit;
                        skip = (page - 1) * limit;
                        return [4 /*yield*/, Promise.all([
                                prisma_shim_1.prisma.orderHistory.findMany({
                                    where: {
                                        order: {
                                            userId: userId,
                                        },
                                    },
                                    skip: skip,
                                    take: limit,
                                    orderBy: { createdAt: 'desc' },
                                    include: {
                                        order: {
                                            include: {
                                                orderItems: true,
                                            },
                                        },
                                    },
                                }),
                                prisma_shim_1.prisma.orderHistory.count({
                                    where: {
                                        order: {
                                            userId: userId,
                                        },
                                    },
                                }),
                            ])];
                    case 1:
                        _a = _b.sent(), history = _a[0], total = _a[1];
                        return [2 /*return*/, {
                                history: history,
                                total: total,
                                pages: Math.ceil(total / limit),
                            }];
                }
            });
        });
    };
    OrderService.prototype.exportOrders = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            var format, dateFrom, dateTo, where, orders, csvHeaders, csvRows, csvContent;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        format = filters.format, dateFrom = filters.dateFrom, dateTo = filters.dateTo;
                        where = {};
                        if (dateFrom || dateTo) {
                            where.createdAt = {};
                            if (dateFrom)
                                where.createdAt.gte = new Date(dateFrom);
                            if (dateTo)
                                where.createdAt.lte = new Date(dateTo);
                        }
                        return [4 /*yield*/, prisma_shim_1.prisma.order.findMany({
                                where: where,
                                include: {
                                    orderItems: true,
                                    user: {
                                        select: {
                                            id: true,
                                            email: true,
                                            firstName: true,
                                            lastName: true,
                                        },
                                    },
                                },
                                orderBy: { createdAt: 'desc' },
                            })];
                    case 1:
                        orders = _a.sent();
                        csvHeaders = ['Order ID', 'User', 'Status', 'Total', 'Created At', 'Items'];
                        csvRows = orders.map(function (order) { return [
                            order.id,
                            "".concat(order.user.firstName, " ").concat(order.user.lastName),
                            order.status,
                            order.total,
                            order.createdAt.toISOString(),
                            order.orderItems.length,
                        ]; });
                        csvContent = __spreadArray([csvHeaders], csvRows, true).map(function (row) { return row.map(function (cell) { return "\"".concat(cell, "\""); }).join(','); })
                            .join('\n');
                        return [2 /*return*/, csvContent];
                }
            });
        });
    };
    return OrderService;
}());
exports.OrderService = OrderService;
