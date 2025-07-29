import { PrismaClient } from '@prisma/client';
import { OrderStatus, PaymentStatus, PaymentMethod } from '../types/order.types';

// Create an augmented type for the Prisma client that includes all our models
export interface ExtendedPrismaClient extends PrismaClient {
  order: any;
  orderItem: any;
  product: any;
  payment: any;
  orderHistory: any;
  cartItem: any;
}

// Cast the existing Prisma client to our extended type
export const prisma = new PrismaClient() as unknown as ExtendedPrismaClient;

// Define Prisma namespace types
export type JsonObject = Record<string, any>;

export interface OrderWhereUniqueInput {
  id?: string;
  userId?: string;
}

export interface OrderWhereInput {
  id?: string;
  userId?: string;
  status?: OrderStatus | { in: OrderStatus[] };
  paymentStatus?: PaymentStatus;
  createdAt?: any;
  [key: string]: any;
}

export interface OrderInclude {
  orderItems?: boolean;
  payments?: boolean;
  orderHistory?: boolean;
  [key: string]: any;
}

export interface CartItemWhereInput {
  id?: string;
  userId?: string;
  sessionId?: string;
  productId?: string;
  [key: string]: any;
}

// Augment the Prisma namespace
export const Prisma = {
  JsonObject: {} as JsonObject,
  OrderWhereUniqueInput: {} as OrderWhereUniqueInput,
  OrderWhereInput: {} as OrderWhereInput,
  OrderInclude: {} as OrderInclude,
  CartItemWhereInput: {} as CartItemWhereInput,
};
