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
exports.orderQueryValidation = exports.cartUpdateValidation = exports.cartItemValidation = exports.orderStatusValidation = exports.orderValidation = exports.OrderController = void 0;
var express_validator_1 = require("express-validator");
var prisma_shim_1 = require("../config/prisma-shim");
var logger_1 = require("../utils/logger");
var errors_1 = require("../utils/errors");
var OrderController = /** @class */ (function () {
    function OrderController() {
    }
    /**
     * Get all orders with pagination and filtering
     */
    OrderController.getOrders = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var errors, userId, _a, _b, page, _c, limit, status_1, startDate, endDate, orderNumber, pageNum, limitNum, skip, where, _d, orders, total, totalPages, error_1;
            var _e, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        _g.trys.push([0, 2, , 3]);
                        errors = (0, express_validator_1.validationResult)(req);
                        if (!errors.isEmpty()) {
                            throw new errors_1.AppError(400, 'Validation failed', 'VALIDATION_ERROR', errors.array());
                        }
                        userId = (_e = req.user) === null || _e === void 0 ? void 0 : _e.id;
                        _a = req.query, _b = _a.page, page = _b === void 0 ? 1 : _b, _c = _a.limit, limit = _c === void 0 ? 20 : _c, status_1 = _a.status, startDate = _a.startDate, endDate = _a.endDate, orderNumber = _a.orderNumber;
                        pageNum = parseInt(page);
                        limitNum = parseInt(limit);
                        skip = (pageNum - 1) * limitNum;
                        where = {};
                        // Filter by user if not admin
                        if (!['admin', 'super_admin'].includes((_f = req.user) === null || _f === void 0 ? void 0 : _f.role)) {
                            where.user_id = userId;
                        }
                        if (status_1) {
                            where.status = status_1;
                        }
                        if (orderNumber) {
                            where.order_number = { contains: orderNumber, mode: 'insensitive' };
                        }
                        if (startDate || endDate) {
                            where.created_at = {};
                            if (startDate)
                                where.created_at.gte = new Date(startDate);
                            if (endDate)
                                where.created_at.lte = new Date(endDate);
                        }
                        return [4 /*yield*/, Promise.all([
                                prisma_shim_1.prisma.order.findMany({
                                    where: where,
                                    include: {
                                        user: {
                                            select: {
                                                id: true,
                                                email: true,
                                                username: true,
                                                first_name: true,
                                                last_name: true,
                                            },
                                        },
                                        order_items: {
                                            include: {
                                                products: {
                                                    select: {
                                                        id: true,
                                                        name: true,
                                                        sku: true,
                                                        price: true,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                    orderBy: { created_at: 'desc' },
                                    skip: skip,
                                    take: limitNum,
                                }),
                                prisma_shim_1.prisma.order.count({ where: where }),
                            ])];
                    case 1:
                        _d = _g.sent(), orders = _d[0], total = _d[1];
                        totalPages = Math.ceil(total / limitNum);
                        logger_1.logger.info('Orders retrieved successfully', {
                            count: orders.length,
                            total: total,
                            page: pageNum,
                            limit: limitNum,
                        });
                        res.json({
                            success: true,
                            data: {
                                orders: orders,
                                pagination: {
                                    page: pageNum,
                                    limit: limitNum,
                                    total: total,
                                    totalPages: totalPages,
                                    hasNextPage: pageNum < totalPages,
                                    hasPrevPage: pageNum > 1,
                                },
                            },
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _g.sent();
                        next(error_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get order by ID
     */
    OrderController.getOrderById = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var id, userId, order, error_2;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        id = req.params.id;
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                        return [4 /*yield*/, prisma_shim_1.prisma.order.findUnique({
                                where: { id: id },
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            email: true,
                                            username: true,
                                            first_name: true,
                                            last_name: true,
                                        },
                                    },
                                    orderItems: {
                                        include: {
                                            product: {
                                                select: {
                                                    id: true,
                                                    name: true,
                                                    sku: true,
                                                    price: true,
                                                    description: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            })];
                    case 1:
                        order = _c.sent();
                        if (!order) {
                            throw new errors_1.AppError(404, 'Order not found');
                        }
                        // Check if user has permission to view this order
                        if (order.user_id !== userId && !['admin', 'super_admin'].includes((_b = req.user) === null || _b === void 0 ? void 0 : _b.role)) {
                            throw new errors_1.AppError(403, 'You can only view your own orders');
                        }
                        logger_1.logger.info('Order retrieved successfully', { orderId: id });
                        res.json({
                            success: true,
                            data: { order: order },
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _c.sent();
                        next(error_2);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Create new order
     */
    OrderController.createOrder = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var errors, userId, _a, items, shipping_address, billing_address, payment_method, _b, currency, notes, subtotal, total, orderItems, _i, items_1, item, product, itemTotal, tax, shipping, orderNumber, order_1, error_3;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 8, , 9]);
                        errors = (0, express_validator_1.validationResult)(req);
                        if (!errors.isEmpty()) {
                            throw new errors_1.AppError(400, 'Validation failed', 'VALIDATION_ERROR', errors.array());
                        }
                        userId = (_c = req.user) === null || _c === void 0 ? void 0 : _c.id;
                        _a = req.body, items = _a.items, shipping_address = _a.shipping_address, billing_address = _a.billing_address, payment_method = _a.payment_method, _b = _a.currency, currency = _b === void 0 ? 'USD' : _b, notes = _a.notes;
                        if (!items || !Array.isArray(items) || items.length === 0) {
                            throw new errors_1.AppError(400, 'Order must contain at least one item');
                        }
                        subtotal = 0;
                        total = 0;
                        orderItems = [];
                        _i = 0, items_1 = items;
                        _d.label = 1;
                    case 1:
                        if (!(_i < items_1.length)) return [3 /*break*/, 4];
                        item = items_1[_i];
                        return [4 /*yield*/, prisma_shim_1.prisma.product.findFirst({
                                where: {
                                    id: item.product_id,
                                    is_active: true,
                                    status: 'active',
                                },
                            })];
                    case 2:
                        product = _d.sent();
                        if (!product) {
                            throw new errors_1.AppError(404, "Product ".concat(item.product_id, " not found"));
                        }
                        if (product.stock_quantity < item.quantity && product.track_inventory) {
                            throw new errors_1.AppError(400, "Insufficient stock for product ".concat(product.name));
                        }
                        itemTotal = product.price * item.quantity;
                        subtotal += itemTotal;
                        orderItems.push({
                            product_id: item.product_id,
                            quantity: item.quantity,
                            unit_price: product.price,
                            total_price: itemTotal,
                        });
                        _d.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        tax = subtotal * 0.1;
                        shipping = 10;
                        total = subtotal + tax + shipping;
                        orderNumber = "ORD-".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9));
                        return [4 /*yield*/, prisma_shim_1.prisma.order.create({
                                data: {
                                    order_number: orderNumber,
                                    user_id: userId,
                                    status: 'pending',
                                    currency: currency,
                                    subtotal: subtotal,
                                    tax: tax,
                                    shipping_cost: shipping,
                                    total: total,
                                    payment_status: 'pending',
                                    shipping_address: JSON.stringify(shipping_address),
                                    billing_address: JSON.stringify(billing_address),
                                    payment_method: payment_method,
                                    notes: notes,
                                    created_at: new Date(),
                                    updated_at: new Date(),
                                },
                            })];
                    case 5:
                        order_1 = _d.sent();
                        // Create order items
                        return [4 /*yield*/, Promise.all(orderItems.map(function (item) {
                                return prisma_shim_1.prisma.orderItem.create({
                                    data: {
                                        order_id: order_1.id,
                                        product_id: item.product_id,
                                        quantity: item.quantity,
                                        unit_price: item.unit_price,
                                        total_price: item.total_price,
                                    },
                                });
                            }))];
                    case 6:
                        // Create order items
                        _d.sent();
                        // Update product stock
                        return [4 /*yield*/, Promise.all(orderItems.map(function (item) {
                                return prisma_shim_1.prisma.product.update({
                                    where: { id: item.product_id },
                                    data: {
                                        stock_quantity: {
                                            decrement: item.quantity,
                                        },
                                    },
                                });
                            }))];
                    case 7:
                        // Update product stock
                        _d.sent();
                        logger_1.logger.info('Order created successfully', {
                            orderId: order_1.id,
                            orderNumber: order_1.order_number,
                            userId: userId,
                        });
                        res.status(201).json({
                            success: true,
                            message: 'Order created successfully',
                            data: { order: order_1 },
                        });
                        return [3 /*break*/, 9];
                    case 8:
                        error_3 = _d.sent();
                        next(error_3);
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update order status
     */
    OrderController.updateOrderStatus = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var errors, id, _a, status_2, payment_status, order, updateData, updatedOrder, error_4;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 3, , 4]);
                        errors = (0, express_validator_1.validationResult)(req);
                        if (!errors.isEmpty()) {
                            throw new errors_1.AppError(400, 'Validation failed', 'VALIDATION_ERROR', errors.array());
                        }
                        id = req.params.id;
                        _a = req.body, status_2 = _a.status, payment_status = _a.payment_status;
                        return [4 /*yield*/, prisma_shim_1.prisma.order.findUnique({
                                where: { id: id },
                            })];
                    case 1:
                        order = _c.sent();
                        if (!order) {
                            throw new errors_1.AppError(404, 'Order not found');
                        }
                        // Only admins can update order status
                        if (!['admin', 'super_admin'].includes((_b = req.user) === null || _b === void 0 ? void 0 : _b.role)) {
                            throw new errors_1.AppError(403, 'Only administrators can update order status');
                        }
                        updateData = {};
                        if (status_2)
                            updateData.status = status_2;
                        if (payment_status)
                            updateData.payment_status = payment_status;
                        updateData.updatedAt = new Date();
                        return [4 /*yield*/, prisma_shim_1.prisma.order.update({
                                where: { id: id },
                                data: updateData,
                            })];
                    case 2:
                        updatedOrder = _c.sent();
                        logger_1.logger.info('Order status updated successfully', {
                            orderId: id,
                            status: status_2 || updatedOrder.status,
                            paymentStatus: payment_status || updatedOrder.payment_status,
                        });
                        res.json({
                            success: true,
                            message: 'Order status updated successfully',
                            data: { order: updatedOrder },
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        error_4 = _c.sent();
                        next(error_4);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get cart items
     */
    OrderController.getCart = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, sessionId, where, cartItems, total, error_5;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                        sessionId = (_b = req.session) === null || _b === void 0 ? void 0 : _b.id;
                        where = {};
                        if (userId) {
                            where.user_id = userId;
                        }
                        else if (sessionId) {
                            where.session_id = sessionId;
                        }
                        else {
                            return [2 /*return*/, res.json({
                                    success: true,
                                    data: { items: [], total: 0 },
                                })];
                        }
                        return [4 /*yield*/, prisma_shim_1.prisma.cartItem.findMany({
                                where: __assign(__assign({}, where), { expires_at: { gt: new Date() } }),
                                include: {
                                    product: {
                                        select: {
                                            id: true,
                                            name: true,
                                            price: true,
                                        },
                                    },
                                },
                                orderBy: { created_at: 'desc' },
                            })];
                    case 1:
                        cartItems = _c.sent();
                        total = cartItems.reduce(function (sum, item) { return sum + Number(item.price) * item.quantity; }, 0);
                        logger_1.logger.info('Cart retrieved successfully', {
                            userId: userId,
                            sessionId: sessionId,
                            itemCount: cartItems.length,
                            total: total,
                        });
                        return [2 /*return*/, res.json({
                                success: true,
                                data: {
                                    items: cartItems,
                                    total: total,
                                },
                            })];
                    case 2:
                        error_5 = _c.sent();
                        next(error_5);
                        return [2 /*return*/, undefined];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Add item to cart
     */
    OrderController.addToCart = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var errors, userId, sessionId, _a, product_id, _b, quantity, product, existingItem, newQuantity, error_6;
            var _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 7, , 8]);
                        errors = (0, express_validator_1.validationResult)(req);
                        if (!errors.isEmpty()) {
                            throw new errors_1.AppError(400, 'Validation failed', 'VALIDATION_ERROR', errors.array());
                        }
                        userId = (_c = req.user) === null || _c === void 0 ? void 0 : _c.id;
                        sessionId = (_d = req.session) === null || _d === void 0 ? void 0 : _d.id;
                        _a = req.body, product_id = _a.product_id, _b = _a.quantity, quantity = _b === void 0 ? 1 : _b;
                        if (!userId && !sessionId) {
                            throw new errors_1.AppError(400, 'User session required');
                        }
                        return [4 /*yield*/, prisma_shim_1.prisma.product.findFirst({
                                where: {
                                    id: product_id,
                                    is_active: true,
                                    status: 'active',
                                },
                            })];
                    case 1:
                        product = _e.sent();
                        if (!product) {
                            throw new errors_1.AppError(404, 'Product not found');
                        }
                        if (product.stock_quantity < quantity && product.track_inventory) {
                            throw new errors_1.AppError(400, 'Insufficient stock');
                        }
                        return [4 /*yield*/, prisma_shim_1.prisma.cartItem.findFirst({
                                where: __assign({ product_id: product_id }, (userId ? { user_id: userId } : { session_id: sessionId })),
                            })];
                    case 2:
                        existingItem = _e.sent();
                        if (!existingItem) return [3 /*break*/, 4];
                        newQuantity = existingItem.quantity + quantity;
                        return [4 /*yield*/, prisma_shim_1.prisma.cartItem.update({
                                where: { id: existingItem.id },
                                data: {
                                    quantity: newQuantity,
                                    updatedAt: new Date(),
                                },
                            })];
                    case 3:
                        _e.sent();
                        return [3 /*break*/, 6];
                    case 4: 
                    // Create new cart item
                    return [4 /*yield*/, prisma_shim_1.prisma.cartItem.create({
                            data: {
                                product_id: product_id,
                                quantity: quantity,
                                unit_price: product.price,
                                user_id: userId,
                                session_id: sessionId,
                                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                            },
                        })];
                    case 5:
                        // Create new cart item
                        _e.sent();
                        _e.label = 6;
                    case 6:
                        logger_1.logger.info('Item added to cart successfully', {
                            productId: product_id,
                            quantity: quantity,
                            userId: userId,
                            sessionId: sessionId,
                        });
                        res.json({
                            success: true,
                            message: 'Item added to cart successfully',
                        });
                        return [3 /*break*/, 8];
                    case 7:
                        error_6 = _e.sent();
                        next(error_6);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update cart item quantity
     */
    OrderController.updateCartItem = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var errors, id, quantity, cartItem, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        errors = (0, express_validator_1.validationResult)(req);
                        if (!errors.isEmpty()) {
                            throw new errors_1.AppError(400, 'Validation failed', 'VALIDATION_ERROR', errors.array());
                        }
                        id = req.params.id;
                        quantity = req.body.quantity;
                        return [4 /*yield*/, prisma_shim_1.prisma.cartItem.findUnique({
                                where: { id: id },
                                include: {
                                    products: {
                                        select: {
                                            stock_quantity: true,
                                            track_inventory: true,
                                        },
                                    },
                                },
                            })];
                    case 1:
                        cartItem = _a.sent();
                        if (!cartItem) {
                            throw new errors_1.AppError(404, 'Cart item not found');
                        }
                        if (cartItem.product &&
                            cartItem.product.stock_quantity &&
                            cartItem.product.stock_quantity < quantity) {
                            throw new errors_1.AppError(400, 'Insufficient stock');
                        }
                        return [4 /*yield*/, prisma_shim_1.prisma.cartItem.update({
                                where: { id: id },
                                data: {
                                    quantity: quantity,
                                    updated_at: new Date(),
                                },
                            })];
                    case 2:
                        _a.sent();
                        logger_1.logger.info('Cart item updated successfully', { itemId: id, quantity: quantity });
                        res.json({
                            success: true,
                            message: 'Cart item updated successfully',
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        error_7 = _a.sent();
                        next(error_7);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Remove item from cart
     */
    OrderController.removeFromCart = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var id, cartItem, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        id = req.params.id;
                        return [4 /*yield*/, prisma_shim_1.prisma.cartItem.findUnique({
                                where: { id: id },
                            })];
                    case 1:
                        cartItem = _a.sent();
                        if (!cartItem) {
                            throw new errors_1.AppError(404, 'Cart item not found');
                        }
                        return [4 /*yield*/, prisma_shim_1.prisma.cartItem.delete({
                                where: { id: id },
                            })];
                    case 2:
                        _a.sent();
                        logger_1.logger.info('Cart item removed successfully', { itemId: id });
                        res.json({
                            success: true,
                            message: 'Cart item removed successfully',
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        error_8 = _a.sent();
                        next(error_8);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Clear cart
     */
    OrderController.clearCart = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, sessionId, where, error_9;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                        sessionId = (_b = req.session) === null || _b === void 0 ? void 0 : _b.id;
                        where = {};
                        if (userId) {
                            where.user_id = userId;
                        }
                        else if (sessionId) {
                            where.session_id = sessionId;
                        }
                        else {
                            throw new errors_1.AppError(400, 'User session required');
                        }
                        return [4 /*yield*/, prisma_shim_1.prisma.cartItem.deleteMany({
                                where: where,
                            })];
                    case 1:
                        _c.sent();
                        logger_1.logger.info('Cart cleared successfully', { userId: userId, sessionId: sessionId });
                        res.json({
                            success: true,
                            message: 'Cart cleared successfully',
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_9 = _c.sent();
                        next(error_9);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return OrderController;
}());
exports.OrderController = OrderController;
// Validation middleware
exports.orderValidation = [
    (0, express_validator_1.body)('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
    (0, express_validator_1.body)('items.*.product_id').isUUID().withMessage('Valid product ID is required'),
    (0, express_validator_1.body)('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    (0, express_validator_1.body)('shipping_address').isObject().withMessage('Shipping address is required'),
    (0, express_validator_1.body)('billing_address').isObject().withMessage('Billing address is required'),
    (0, express_validator_1.body)('payment_method').notEmpty().withMessage('Payment method is required'),
    (0, express_validator_1.body)('currency')
        .optional()
        .isIn(['USD', 'EUR', 'GBP', 'UZS'])
        .withMessage('Valid currency is required'),
];
exports.orderStatusValidation = [
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
        .withMessage('Valid status is required'),
    (0, express_validator_1.body)('payment_status')
        .optional()
        .isIn(['pending', 'paid', 'failed', 'refunded'])
        .withMessage('Valid payment status is required'),
];
exports.cartItemValidation = [
    (0, express_validator_1.body)('product_id').isUUID().withMessage('Valid product ID is required'),
    (0, express_validator_1.body)('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];
exports.cartUpdateValidation = [
    (0, express_validator_1.body)('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];
exports.orderQueryValidation = [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
        .withMessage('Valid status is required'),
    (0, express_validator_1.query)('startDate').optional().isISO8601().withMessage('Valid start date is required'),
    (0, express_validator_1.query)('endDate').optional().isISO8601().withMessage('Valid end date is required'),
];
