/**
 * Order data interfaces
 */

import { OrderItem, ShippingAddress, OrderStatus } from '../services/order.service';

export interface OrderCreateData {
  userId: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  shippingAddress?: ShippingAddress;
  paymentId?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface OrderUpdateData {
  status?: OrderStatus;
  paymentId?: string;
  shippingAddress?: ShippingAddress;
  metadata?: Record<string, unknown>;
}
