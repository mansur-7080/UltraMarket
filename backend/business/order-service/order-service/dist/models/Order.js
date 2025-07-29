"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.Order = void 0;
var mongoose_1 = __importStar(require("mongoose"));
var OrderItemSchema = new mongoose_1.Schema({
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
});
var ShippingInfoSchema = new mongoose_1.Schema({
    method: { type: String, required: true },
    carrier: { type: String, required: true },
    trackingNumber: { type: String },
    estimatedDelivery: { type: Date },
    actualDelivery: { type: Date },
    cost: { type: Number, required: true, min: 0 },
    address: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        company: { type: String },
        addressLine1: { type: String, required: true },
        addressLine2: { type: String },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true },
        phone: { type: String, required: true },
    },
});
var PaymentInfoSchema = new mongoose_1.Schema({
    method: { type: String, required: true },
    status: { type: String, required: true },
    transactionId: { type: String },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true },
    paidAt: { type: Date },
    refundedAmount: { type: Number, default: 0, min: 0 },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
});
var TimelineSchema = new mongoose_1.Schema({
    event: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    description: { type: String },
    performedBy: { type: String },
});
var OrderSchema = new mongoose_1.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    userId: {
        type: String,
        required: true,
        index: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
        default: 'pending',
        index: true,
    },
    items: {
        type: [OrderItemSchema],
        required: true,
        validate: {
            validator: function (items) {
                return items.length > 0;
            },
            message: 'Order must contain at least one item',
        },
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0,
    },
    taxTotal: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    shippingTotal: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    discountTotal: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    grandTotal: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        required: true,
        default: 'UZS',
        enum: ['UZS', 'USD', 'RUB', 'EUR'],
    },
    shipping: {
        type: ShippingInfoSchema,
        required: true,
    },
    billing: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        company: { type: String },
        addressLine1: { type: String, required: true },
        addressLine2: { type: String },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String, required: true },
    },
    payment: {
        type: PaymentInfoSchema,
        required: true,
    },
    notes: {
        type: String,
        maxlength: 1000,
    },
    tags: [
        {
            type: String,
            trim: true,
        },
    ],
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
    },
    timeline: {
        type: [TimelineSchema],
        default: [],
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Indexes for performance
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ 'shipping.trackingNumber': 1 });
OrderSchema.index({ 'payment.transactionId': 1 });
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
// Virtual for order age
OrderSchema.virtual('orderAge').get(function () {
    return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
});
// Virtual for is paid
OrderSchema.virtual('isPaid').get(function () {
    return this.payment.status === 'completed' || this.payment.status === 'paid';
});
// Virtual for is shipped
OrderSchema.virtual('isShipped').get(function () {
    return ['shipped', 'delivered'].includes(this.status);
});
// Pre-save middleware
OrderSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function () {
        var date, year, month, day, random;
        return __generator(this, function (_a) {
            // Generate order number if not exists
            if (!this.orderNumber) {
                date = new Date();
                year = date.getFullYear();
                month = String(date.getMonth() + 1).padStart(2, '0');
                day = String(date.getDate()).padStart(2, '0');
                random = Math.random().toString(36).substring(2, 8).toUpperCase();
                this.orderNumber = "ORD-".concat(year).concat(month).concat(day, "-").concat(random);
            }
            // Calculate totals
            this.subtotal = this.items.reduce(function (sum, item) { return sum + item.total; }, 0);
            this.grandTotal = this.subtotal + this.taxTotal + this.shippingTotal - this.discountTotal;
            // Add timeline entry for status changes
            if (this.isModified('status')) {
                this.timeline.push({
                    event: "Status changed to ".concat(this.status),
                    timestamp: new Date(),
                    description: "Order status updated to ".concat(this.status),
                });
            }
            next();
            return [2 /*return*/];
        });
    });
});
// Static methods
OrderSchema.statics.findByUserId = function (userId) {
    return this.find({ userId: userId }).sort({ createdAt: -1 });
};
OrderSchema.statics.findByStatus = function (status) {
    return this.find({ status: status }).sort({ createdAt: -1 });
};
OrderSchema.statics.findByDateRange = function (startDate, endDate) {
    return this.find({
        createdAt: {
            $gte: startDate,
            $lte: endDate,
        },
    }).sort({ createdAt: -1 });
};
// Instance methods
OrderSchema.methods.addTimelineEvent = function (event, description, performedBy) {
    this.timeline.push({
        event: event,
        timestamp: new Date(),
        description: description,
        performedBy: performedBy,
    });
    return this.save();
};
OrderSchema.methods.updateStatus = function (newStatus, performedBy) {
    return __awaiter(this, void 0, void 0, function () {
        var oldStatus;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    oldStatus = this.status;
                    this.status = newStatus;
                    return [4 /*yield*/, this.addTimelineEvent('Status Update', "Status changed from ".concat(oldStatus, " to ").concat(newStatus), performedBy)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, this];
            }
        });
    });
};
OrderSchema.methods.cancelOrder = function (reason, performedBy) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (['delivered', 'cancelled', 'refunded'].includes(this.status)) {
                        throw new Error('Cannot cancel order in current status');
                    }
                    this.status = 'cancelled';
                    return [4 /*yield*/, this.addTimelineEvent('Order Cancelled', reason, performedBy)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, this];
            }
        });
    });
};
OrderSchema.methods.processRefund = function (amount, reason, performedBy) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!this.isPaid) {
                        throw new Error('Cannot refund unpaid order');
                    }
                    this.payment.refundedAmount = (this.payment.refundedAmount || 0) + amount;
                    if (this.payment.refundedAmount >= this.payment.amount) {
                        this.status = 'refunded';
                    }
                    return [4 /*yield*/, this.addTimelineEvent('Refund Processed', "Refunded ".concat(amount, " ").concat(this.currency, ". Reason: ").concat(reason), performedBy)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, this];
            }
        });
    });
};
exports.Order = mongoose_1.default.model('Order', OrderSchema);
