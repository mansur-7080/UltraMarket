import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
  discount: number;
  tax: number;
  total: number;
  metadata?: any;
}

export interface IShippingInfo {
  method: string;
  carrier: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  cost: number;
  address: {
    firstName: string;
    lastName: string;
    company?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
}

export interface IPaymentInfo {
  method: string;
  status: string;
  transactionId?: string;
  amount: number;
  currency: string;
  paidAt?: Date;
  refundedAmount?: number;
  metadata?: any;
}

export interface IOrder extends Document {
  orderNumber: string;
  userId: string;
  status:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'refunded';
  items: IOrderItem[];
  subtotal: number;
  taxTotal: number;
  shippingTotal: number;
  discountTotal: number;
  grandTotal: number;
  currency: string;
  shipping: IShippingInfo;
  billing: {
    firstName: string;
    lastName: string;
    company?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
    email: string;
  };
  payment: IPaymentInfo;
  notes?: string;
  tags?: string[];
  metadata?: any;
  timeline: {
    event: string;
    timestamp: Date;
    description?: string;
    performedBy?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  sku: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  metadata: { type: Schema.Types.Mixed },
});

const ShippingInfoSchema = new Schema({
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

const PaymentInfoSchema = new Schema({
  method: { type: String, required: true },
  status: { type: String, required: true },
  transactionId: { type: String },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true },
  paidAt: { type: Date },
  refundedAmount: { type: Number, default: 0, min: 0 },
  metadata: { type: Schema.Types.Mixed },
});

const TimelineSchema = new Schema({
  event: { type: String, required: true },
  timestamp: { type: Date, required: true, default: Date.now },
  description: { type: String },
  performedBy: { type: String },
});

const OrderSchema = new Schema<IOrder>(
  {
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
        validator: function (items: IOrderItem[]) {
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
      type: Schema.Types.Mixed,
    },
    timeline: {
      type: [TimelineSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

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
OrderSchema.pre('save', async function (next: any) {
  // Generate order number if not exists
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNumber = `ORD-${year}${month}${day}-${random}`;
  }

  // Calculate totals
  this.subtotal = this.items.reduce((sum: number, item: IOrderItem) => sum + item.total, 0);
  this.grandTotal = this.subtotal + this.taxTotal + this.shippingTotal - this.discountTotal;

  // Add timeline entry for status changes
  if (this.isModified('status')) {
    this.timeline.push({
      event: `Status changed to ${this.status}`,
      timestamp: new Date(),
      description: `Order status updated to ${this.status}`,
    });
  }

  next();
});

// Static methods
OrderSchema.statics.findByUserId = function (userId: string) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

OrderSchema.statics.findByStatus = function (status: string) {
  return this.find({ status }).sort({ createdAt: -1 });
};

OrderSchema.statics.findByDateRange = function (startDate: Date, endDate: Date) {
  return this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ createdAt: -1 });
};

// Instance methods
OrderSchema.methods.addTimelineEvent = function (
  event: string,
  description?: string,
  performedBy?: string
) {
  this.timeline.push({
    event,
    timestamp: new Date(),
    description,
    performedBy,
  });
  return this.save();
};

OrderSchema.methods.updateStatus = async function (newStatus: string, performedBy?: string) {
  const oldStatus = this.status;
  this.status = newStatus;

  await this.addTimelineEvent(
    'Status Update',
    `Status changed from ${oldStatus} to ${newStatus}`,
    performedBy
  );

  return this;
};

OrderSchema.methods.cancelOrder = async function (reason: string, performedBy?: string) {
  if (['delivered', 'cancelled', 'refunded'].includes(this.status)) {
    throw new Error('Cannot cancel order in current status');
  }

  this.status = 'cancelled';
  await this.addTimelineEvent('Order Cancelled', reason, performedBy);

  return this;
};

OrderSchema.methods.processRefund = async function (
  amount: number,
  reason: string,
  performedBy?: string
) {
  if (!this.isPaid) {
    throw new Error('Cannot refund unpaid order');
  }

  this.payment.refundedAmount = (this.payment.refundedAmount || 0) + amount;

  if (this.payment.refundedAmount >= this.payment.amount) {
    this.status = 'refunded';
  }

  await this.addTimelineEvent(
    'Refund Processed',
    `Refunded ${amount} ${this.currency}. Reason: ${reason}`,
    performedBy
  );

  return this;
};

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
