// Order status values from the Prisma schema
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PAID = 'PAID',
}

// Payment status values from the Prisma schema
export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

// Payment method values from the Prisma schema
export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
}

// User type for order relationships
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

// Basic order type - can expand as needed
export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
  user?: User;
}

// Basic order item type - can expand as needed
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Payment interface
export interface Payment {
  id: string;
  orderId: string;
  status: PaymentStatus;
  method: PaymentMethod;
  amount: number;
  currency: string;
  gatewayId?: string;
  gatewayResponse?: any;
  createdAt: Date;
  updatedAt: Date;
}
