export interface ICartItem {
    id?: string;
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    addedAt?: string;
    updatedAt?: string;
    subtotal?: number;
    image?: string;
    sku?: string;
}
export interface ICart {
    id?: string;
    userId: string;
    items: ICartItem[];
    summary?: {
        itemCount: number;
        subtotal: number;
        tax: number;
        shipping: number;
        discount: number;
        total: number;
    };
    updatedAt?: string;
    expiresAt?: string;
    coupon?: {
        code: string;
        discount: number;
    };
    appliedCoupons?: Array<{
        code: string;
        discount: number;
    }>;
    save?: () => Promise<ICart>;
}
export declare class CartService {
    private redisClient;
    private readonly CACHE_TTL;
    private getCacheKey;
    getCart(userId: string): Promise<ICart>;
    addItem(userId: string, item: ICartItem): Promise<ICart>;
    private updateCartSummary;
    updateItem(userId: string, productId: string, options: {
        quantity: number;
    }): Promise<ICart>;
    updateItemQuantity(userId: string, productId: string, quantity: number): Promise<ICart>;
    removeItem(userId: string, productId: string): Promise<ICart>;
    clearCart(userId: string): Promise<ICart>;
    invalidateCache(userId: string): Promise<void>;
    applyCoupon(userId: string, couponCode: string, couponData: {
        type?: 'percentage' | 'fixed';
        value?: number;
        minimumPurchase?: number;
        maxDiscount?: number;
    }): Promise<ICart>;
}
//# sourceMappingURL=cart.service.d.ts.map