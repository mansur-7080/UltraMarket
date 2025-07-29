/**
 * PROFESSIONAL INVENTORY RACE CONDITION PREVENTION
 * UltraMarket - Production Ready Solution
 * 
 * SOLVES: Multiple users buying same product simultaneously → Inventory corruption
 * 
 * Before: No locking → 2 users can buy last item → Negative inventory
 * After: Atomic transactions + Row locking → Only 1 user succeeds
 */

import { logger } from '../logging/logger';

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
export class InventoryRaceConditionPrevention {
  private static instance: InventoryRaceConditionPrevention;
  private activePurchases = new Map<string, Set<string>>(); // productId -> Set<userId>
  private lockTimeout = 30000; // 30 seconds
  private reservationTimeout = 15 * 60 * 1000; // 15 minutes

  private constructor() {}

  public static getInstance(): InventoryRaceConditionPrevention {
    if (!InventoryRaceConditionPrevention.instance) {
      InventoryRaceConditionPrevention.instance = new InventoryRaceConditionPrevention();
    }
    return InventoryRaceConditionPrevention.instance;
  }

  /**
   * CRITICAL: Atomic purchase with race condition prevention
   * This method MUST be used for all inventory purchases
   */
  public async attemptPurchase(
    attempt: PurchaseAttempt,
    dbTransaction: any // Generic database transaction
  ): Promise<PurchaseResult> {
    const lockKey = this.generateLockKey(attempt.productId, attempt.variantId);
    const userId = attempt.userId;

    // Check if user already has active purchase for this product
    if (this.isUserActivePurchasing(lockKey, userId)) {
      return {
        success: false,
        message: 'You already have an active purchase for this product',
        errorCode: 'DUPLICATE_PURCHASE_ATTEMPT'
      };
    }

    // Register active purchase
    this.registerActivePurchase(lockKey, userId);

    try {
      // Step 1: Acquire row lock with timeout
      const inventory = await this.acquireInventoryLock(
        attempt,
        dbTransaction
      );

      if (!inventory) {
        return {
          success: false,
          message: 'Product not found or unavailable',
          errorCode: 'PRODUCT_NOT_FOUND'
        };
      }

      // Step 2: Check availability after lock
      const availabilityCheck = this.checkAvailability(inventory, attempt.quantity);
      if (!availabilityCheck.available) {
        return {
          success: false,
          message: availabilityCheck.message,
          remainingStock: inventory.availableStock,
          errorCode: 'INSUFFICIENT_STOCK'
        };
      }

      // Step 3: Create reservation atomically
      const reservation = await this.createInventoryReservation(
        attempt,
        inventory,
        dbTransaction
      );

      // Step 4: Update inventory atomically
      const updatedInventory = await this.updateInventoryQuantity(
        attempt,
        inventory,
        dbTransaction
      );

      logger.info('Purchase successful with race condition prevention', {
        userId: attempt.userId,
        productId: attempt.productId,
        quantity: attempt.quantity,
        remainingStock: updatedInventory.availableStock,
        reservationId: reservation.id
      });

      return {
        success: true,
        purchaseId: reservation.id,
        message: 'Product reserved successfully',
        remainingStock: updatedInventory.availableStock
      };

    } catch (error) {
      logger.error('Purchase attempt failed', {
        userId: attempt.userId,
        productId: attempt.productId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Purchase failed due to system error',
        errorCode: 'SYSTEM_ERROR'
      };
    } finally {
      // CRITICAL: Always unregister active purchase
      this.unregisterActivePurchase(lockKey, userId);
    }
  }

  /**
   * POSTGRESQL Implementation - Row Locking
   */
  private async acquireInventoryLock(
    attempt: PurchaseAttempt,
    dbTransaction: any
  ): Promise<InventoryItem | null> {
    const query = `
      SELECT 
        product_id,
        variant_id,
        warehouse_id,
        stock_quantity as current_stock,
        reserved_quantity as reserved_stock,
        (stock_quantity - reserved_quantity) as available_stock
      FROM inventory 
      WHERE product_id = $1 
        AND (variant_id = $2 OR ($2 IS NULL AND variant_id IS NULL))
        AND (warehouse_id = $3 OR $3 IS NULL)
        AND status = 'active'
      FOR UPDATE NOWAIT; -- CRITICAL: Row-level lock with no wait
    `;

    try {
      const result = await dbTransaction.query(query, [
        attempt.productId,
        attempt.variantId || null,
        attempt.warehouseId || null
      ]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        productId: row.product_id,
        variantId: row.variant_id,
        warehouseId: row.warehouse_id,
        currentStock: parseInt(row.current_stock),
        reservedStock: parseInt(row.reserved_stock),
        availableStock: parseInt(row.available_stock)
      };
    } catch (error: any) {
      if (error.code === '55P03') { // Lock not available
        throw new Error('Product is currently being purchased by another user. Please try again.');
      }
      throw error;
    }
  }

  /**
   * MONGODB Implementation - Optimistic Locking
   */
  private async acquireInventoryLockMongo(
    attempt: PurchaseAttempt,
    mongoSession: any
  ): Promise<InventoryItem | null> {
    const filter = {
      productId: attempt.productId,
      ...(attempt.variantId && { variantId: attempt.variantId }),
      ...(attempt.warehouseId && { warehouseId: attempt.warehouseId }),
      status: 'active'
    };

    // MongoDB optimistic locking using version field
    const inventory = await mongoSession
      .collection('inventory')
      .findOne(filter, { session: mongoSession });

    if (!inventory) {
      return null;
    }

    return {
      productId: inventory.productId,
      variantId: inventory.variantId,
      warehouseId: inventory.warehouseId,
      currentStock: inventory.stockQuantity,
      reservedStock: inventory.reservedQuantity || 0,
      availableStock: inventory.stockQuantity - (inventory.reservedQuantity || 0)
    };
  }

  /**
   * Check if sufficient stock is available
   */
  private checkAvailability(
    inventory: InventoryItem, 
    requestedQuantity: number
  ): { available: boolean; message: string } {
    if (inventory.availableStock <= 0) {
      return {
        available: false,
        message: 'Product is out of stock'
      };
    }

    if (inventory.availableStock < requestedQuantity) {
      return {
        available: false,
        message: `Only ${inventory.availableStock} units available, but you requested ${requestedQuantity}`
      };
    }

    return {
      available: true,
      message: 'Stock available'
    };
  }

  /**
   * Create inventory reservation atomically
   */
  private async createInventoryReservation(
    attempt: PurchaseAttempt,
    inventory: InventoryItem,
    dbTransaction: any
  ): Promise<{ id: string; expiresAt: Date }> {
    const reservationId = `RES_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + this.reservationTimeout);

    const insertQuery = `
      INSERT INTO inventory_reservations (
        id, product_id, variant_id, warehouse_id, user_id, 
        quantity, status, expires_at, created_at, session_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, expires_at;
    `;

    const result = await dbTransaction.query(insertQuery, [
      reservationId,
      attempt.productId,
      attempt.variantId || null,
      inventory.warehouseId,
      attempt.userId,
      attempt.quantity,
      'active',
      expiresAt,
      new Date(),
      attempt.sessionId
    ]);

    return {
      id: result.rows[0].id,
      expiresAt: result.rows[0].expires_at
    };
  }

  /**
   * Update inventory quantity atomically
   */
  private async updateInventoryQuantity(
    attempt: PurchaseAttempt,
    inventory: InventoryItem,
    dbTransaction: any
  ): Promise<InventoryItem> {
    const updateQuery = `
      UPDATE inventory 
      SET 
        reserved_quantity = reserved_quantity + $1,
        updated_at = NOW(),
        version = version + 1
      WHERE product_id = $2 
        AND (variant_id = $3 OR ($3 IS NULL AND variant_id IS NULL))
        AND warehouse_id = $4
      RETURNING 
        stock_quantity as current_stock,
        reserved_quantity as reserved_stock,
        (stock_quantity - reserved_quantity) as available_stock;
    `;

    const result = await dbTransaction.query(updateQuery, [
      attempt.quantity,
      attempt.productId,
      attempt.variantId || null,
      inventory.warehouseId
    ]);

    if (result.rows.length === 0) {
      throw new Error('Failed to update inventory - record may have been modified');
    }

    const row = result.rows[0];
    return {
      ...inventory,
      currentStock: parseInt(row.current_stock),
      reservedStock: parseInt(row.reserved_stock),
      availableStock: parseInt(row.available_stock)
    };
  }

  /**
   * MongoDB atomic update with optimistic locking
   */
  private async updateInventoryQuantityMongo(
    attempt: PurchaseAttempt,
    inventory: InventoryItem,
    mongoSession: any,
    originalVersion: number
  ): Promise<InventoryItem> {
    const filter = {
      productId: attempt.productId,
      ...(attempt.variantId && { variantId: attempt.variantId }),
      warehouseId: inventory.warehouseId,
      version: originalVersion // Optimistic lock
    };

    const update = {
      $inc: {
        reservedQuantity: attempt.quantity,
        version: 1
      },
      $set: {
        updatedAt: new Date()
      }
    };

    const result = await mongoSession
      .collection('inventory')
      .findOneAndUpdate(filter, update, {
        session: mongoSession,
        returnDocument: 'after'
      });

    if (!result.value) {
      throw new Error('Failed to update inventory - record may have been modified by another user');
    }

    return {
      productId: result.value.productId,
      variantId: result.value.variantId,
      warehouseId: result.value.warehouseId,
      currentStock: result.value.stockQuantity,
      reservedStock: result.value.reservedQuantity,
      availableStock: result.value.stockQuantity - result.value.reservedQuantity
    };
  }

  /**
   * Generate consistent lock key
   */
  private generateLockKey(productId: string, variantId?: string): string {
    return variantId ? `${productId}:${variantId}` : productId;
  }

  /**
   * Check if user has active purchase
   */
  private isUserActivePurchasing(lockKey: string, userId: string): boolean {
    const activeUsers = this.activePurchases.get(lockKey);
    return activeUsers ? activeUsers.has(userId) : false;
  }

  /**
   * Register active purchase
   */
  private registerActivePurchase(lockKey: string, userId: string): void {
    if (!this.activePurchases.has(lockKey)) {
      this.activePurchases.set(lockKey, new Set());
    }
    this.activePurchases.get(lockKey)!.add(userId);
  }

  /**
   * Unregister active purchase
   */
  private unregisterActivePurchase(lockKey: string, userId: string): void {
    const activeUsers = this.activePurchases.get(lockKey);
    if (activeUsers) {
      activeUsers.delete(userId);
      if (activeUsers.size === 0) {
        this.activePurchases.delete(lockKey);
      }
    }
  }

  /**
   * Clean up expired reservations (should be called periodically)
   */
  public async cleanupExpiredReservations(dbTransaction: any): Promise<number> {
    const cleanupQuery = `
      WITH expired_reservations AS (
        DELETE FROM inventory_reservations 
        WHERE status = 'active' AND expires_at < NOW()
        RETURNING product_id, variant_id, warehouse_id, quantity
      ),
      inventory_updates AS (
        UPDATE inventory 
        SET 
          reserved_quantity = inventory.reserved_quantity - expired.quantity,
          updated_at = NOW()
        FROM expired_reservations expired
        WHERE inventory.product_id = expired.product_id
          AND (inventory.variant_id = expired.variant_id OR (expired.variant_id IS NULL AND inventory.variant_id IS NULL))
          AND inventory.warehouse_id = expired.warehouse_id
      )
      SELECT COUNT(*) as cleaned_count FROM expired_reservations;
    `;

    const result = await dbTransaction.query(cleanupQuery);
    const cleanedCount = parseInt(result.rows[0].cleaned_count);

    if (cleanedCount > 0) {
      logger.info('Cleaned up expired inventory reservations', { count: cleanedCount });
    }

    return cleanedCount;
  }

  /**
   * Get active purchase statistics
   */
  public getActivePurchaseStats(): any {
    const stats = {
      totalActiveProducts: this.activePurchases.size,
      totalActiveUsers: 0,
      productBreakdown: {} as any
    };

    for (const [productId, userSet] of this.activePurchases.entries()) {
      stats.totalActiveUsers += userSet.size;
      stats.productBreakdown[productId] = userSet.size;
    }

    return stats;
  }
}

// Export singleton instance
export const inventoryRaceConditionPrevention = InventoryRaceConditionPrevention.getInstance();

/**
 * Utility function for safe inventory purchase
 */
export const safePurchase = async (
  attempt: PurchaseAttempt,
  dbTransaction: any
): Promise<PurchaseResult> => {
  return await inventoryRaceConditionPrevention.attemptPurchase(attempt, dbTransaction);
};

export default inventoryRaceConditionPrevention; 