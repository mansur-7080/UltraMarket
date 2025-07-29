export interface CartItem {
    productId: string;
    productName: string;
    sku: string;
    price: number;
    quantity: number;
    image: string;
    attributes?: Record<string, string>;
    addedAt: Date;
    updatedAt: Date;
}
export interface Cart {
    userId: string;
    items: CartItem[];
    totalItems: number;
    subtotal: number;
    estimatedShipping: number;
    estimatedTax: number;
    estimatedTotal: number;
    currency: string;
    createdAt: Date;
    updatedAt: Date;
    expiresAt?: Date;
}
export interface CartSummary {
    totalItems: number;
    subtotal: number;
    estimatedShipping: number;
    estimatedTax: number;
    estimatedTotal: number;
    currency: string;
}
export declare class CartService {
    private redis;
    private defaultTTL;
    constructor();
    getCart(userId: string): Promise<Cart | null>;
    saveCart(cart: Cart): Promise<void>;
    addItem(userId: string, item: Omit<CartItem, 'addedAt' | 'updatedAt'>): Promise<Cart>;
    updateItemQuantity(userId: string, productId: string, quantity: number, attributes?: Record<string, string>): Promise<Cart>;
    removeItem(userId: string, productId: string, attributes?: Record<string, string>): Promise<Cart>;
    clearCart(userId: string): Promise<void>;
    getCartSummary(userId: string): Promise<CartSummary | null>;
    mergeGuestCart(userId: string, guestCartItems: CartItem[]): Promise<Cart>;
    validateCart(userId: string): Promise<{
        isValid: boolean;
        issues: string[];
    }>;
    applyCoupon(userId: string, couponCode: string): Promise<Cart>;
    private getCartKey;
    private createEmptyCart;
    private recalculateCart;
    private emitCartEvent;
    healthCheck(): Promise<boolean>;
    cleanupExpiredCarts(): Promise<number>;
}
export declare const cartService: CartService;
//# sourceMappingURL=Cart.d.ts.map