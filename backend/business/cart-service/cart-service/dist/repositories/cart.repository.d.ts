import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
export interface PrismaCart {
    id: string;
    userId: string;
    sessionId?: string;
    subtotal: Decimal;
    taxAmount: Decimal;
    discountAmount: Decimal;
    shippingAmount: Decimal;
    totalAmount: Decimal;
    currency: string;
    status: string;
    appliedCoupons: string[];
    notes?: string;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    items?: PrismaCartItem[];
}
export interface PrismaCartItem {
    id: string;
    cartId: string;
    productId: string;
    variantId?: string;
    name: string;
    sku: string;
    quantity: number;
    price: Decimal;
    comparePrice?: Decimal;
    image?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface CartRepository {
    findByUserId(userId: string): Promise<PrismaCart | null>;
    create(userId: string): Promise<PrismaCart>;
    addItem(cartId: string, item: Omit<PrismaCartItem, 'id' | 'cartId'>): Promise<PrismaCartItem>;
    updateItemQuantity(cartItemId: string, quantity: number): Promise<PrismaCartItem>;
    removeItem(cartItemId: string): Promise<void>;
    clearCart(cartId: string): Promise<void>;
    getCartWithItems(userId: string): Promise<(PrismaCart & {
        items: PrismaCartItem[];
    }) | null>;
}
export declare class PrismaCartRepository implements CartRepository {
    private prisma;
    constructor(prisma: PrismaClient);
    findByUserId(userId: string): Promise<PrismaCart | null>;
    create(userId: string): Promise<PrismaCart>;
    addItem(cartId: string, item: Omit<PrismaCartItem, 'id' | 'cartId'>): Promise<PrismaCartItem>;
    updateItemQuantity(cartItemId: string, quantity: number): Promise<PrismaCartItem>;
    removeItem(cartItemId: string): Promise<void>;
    clearCart(cartId: string): Promise<void>;
    getCartWithItems(userId: string): Promise<(PrismaCart & {
        items: PrismaCartItem[];
    }) | null>;
}
export declare const createCartRepository: (prisma: PrismaClient) => CartRepository;
export default createCartRepository;
//# sourceMappingURL=cart.repository.d.ts.map