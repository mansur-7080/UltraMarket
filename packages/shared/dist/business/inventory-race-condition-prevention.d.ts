/**
 * PROFESSIONAL INVENTORY RACE CONDITION PREVENTION
 * UltraMarket - Production Ready Solution
 *
 * SOLVES: Multiple users buying same product simultaneously → Inventory corruption
 *
 * Before: No locking → 2 users can buy last item → Negative inventory
 * After: Atomic transactions + Row locking → Only 1 user succeeds
 */
export interface InventoryItem {
    productId: string;
    variantId?: string;
    warehouseId: string;
    currentStock: number;
    reservedStock: number;
    availableStock: number;
}
export interface PurchaseAttempt {
    userId: string;
    productId: string;
    variantId?: string;
    quantity: number;
    warehouseId?: string;
    sessionId: string;
    timestamp: Date;
}
export interface PurchaseResult {
    success: boolean;
    purchaseId?: string;
    message: string;
    remainingStock?: number;
    errorCode?: string;
}
/**
 * Inventory Race Condition Prevention Manager
 * Uses database-level row locking and atomic transactions
 */
export declare class InventoryRaceConditionPrevention {
    private static instance;
    private activePurchases;
    private lockTimeout;
    private reservationTimeout;
    private constructor();
    static getInstance(): InventoryRaceConditionPrevention;
    /**
     * CRITICAL: Atomic purchase with race condition prevention
     * This method MUST be used for all inventory purchases
     */
    attemptPurchase(attempt: PurchaseAttempt, dbTransaction: any): Promise<PurchaseResult>;
    /**
     * POSTGRESQL Implementation - Row Locking
     */
    private acquireInventoryLock;
    /**
     * MONGODB Implementation - Optimistic Locking
     */
    private acquireInventoryLockMongo;
    /**
     * Check if sufficient stock is available
     */
    private checkAvailability;
    /**
     * Create inventory reservation atomically
     */
    private createInventoryReservation;
    /**
     * Update inventory quantity atomically
     */
    private updateInventoryQuantity;
    /**
     * MongoDB atomic update with optimistic locking
     */
    private updateInventoryQuantityMongo;
    /**
     * Generate consistent lock key
     */
    private generateLockKey;
    /**
     * Check if user has active purchase
     */
    private isUserActivePurchasing;
    /**
     * Register active purchase
     */
    private registerActivePurchase;
    /**
     * Unregister active purchase
     */
    private unregisterActivePurchase;
    /**
     * Clean up expired reservations (should be called periodically)
     */
    cleanupExpiredReservations(dbTransaction: any): Promise<number>;
    /**
     * Get active purchase statistics
     */
    getActivePurchaseStats(): any;
}
export declare const inventoryRaceConditionPrevention: InventoryRaceConditionPrevention;
/**
 * Utility function for safe inventory purchase
 */
export declare const safePurchase: (attempt: PurchaseAttempt, dbTransaction: any) => Promise<PurchaseResult>;
export default inventoryRaceConditionPrevention;
//# sourceMappingURL=inventory-race-condition-prevention.d.ts.map