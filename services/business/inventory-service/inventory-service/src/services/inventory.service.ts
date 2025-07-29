import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';
import { EventEmitter } from 'events';

export interface InventoryItem {
  id: string;
  productId: string;
  sku: string;
  warehouseId: string;
  availableQuantity: number;
  reservedQuantity: number;
  totalQuantity: number;
  minimumStock: number;
  maximumStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  averageCost: number;
  lastCost: number;
  location: {
    zone: string;
    aisle: string;
    shelf: string;
    bin: string;
  };
  dimensions: {
    length: number;
    width: number;
    height: number;
    weight: number;
  };
  attributes: {
    category: string;
    brand: string;
    supplier: string;
    expiryDate?: Date;
    batchNumber?: string;
    serialNumbers?: string[];
  };
  status: 'active' | 'inactive' | 'discontinued' | 'backordered';
  movements: InventoryMovement[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryMovement {
  id: string;
  inventoryId: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer' | 'reservation' | 'return';
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  reference: {
    type: 'purchase_order' | 'sales_order' | 'transfer' | 'adjustment' | 'return';
    id: string;
    notes?: string;
  };
  performedBy: string;
  reason?: string;
  createdAt: Date;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  manager: string;
  capacity: {
    totalSpace: number;
    usedSpace: number;
    availableSpace: number;
  };
  status: 'active' | 'inactive' | 'maintenance';
  settings: {
    timezone: string;
    workingHours: {
      start: string;
      end: string;
      days: string[];
    };
    autoReorder: boolean;
    allowNegativeStock: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface StockReservation {
  id: string;
  productId: string;
  quantity: number;
  orderId: string;
  customerId: string;
  warehouseId: string;
  status: 'active' | 'fulfilled' | 'cancelled' | 'expired';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LowStockAlert {
  id: string;
  productId: string;
  sku: string;
  warehouseId: string;
  currentStock: number;
  minimumStock: number;
  reorderPoint: number;
  status: 'pending' | 'acknowledged' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

export interface InventoryReport {
  summary: {
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
    overstockItems: number;
  };
  breakdown: {
    byCategory: Array<{ category: string; value: number; quantity: number }>;
    byWarehouse: Array<{ warehouse: string; value: number; quantity: number }>;
    bySupplier: Array<{ supplier: string; value: number; quantity: number }>;
  };
  movements: {
    in: number;
    out: number;
    adjustments: number;
    transfers: number;
  };
  alerts: LowStockAlert[];
  trends: Array<{
    date: string;
    totalValue: number;
    movements: number;
  }>;
}

export class InventoryService extends EventEmitter {
  private prisma: PrismaClient;

  constructor() {
    super();
    this.prisma = new PrismaClient();
  }

  /**
   * Get all inventory items with filters and pagination
   */
  async getAllInventory(
    filters: any = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: any[]; total: number }> {
    try {
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        this.prisma.inventory.findMany({
          where: filters,
          skip,
          take: limit,
          include: {
            product: true,
            warehouse: true,
            movements: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.inventory.count({ where: filters }),
      ]);

      return { items, total };
    } catch (error) {
      logger.error('Get all inventory failed', { filters, page, limit, error });
      throw error;
    }
  }

  /**
   * Get inventory item by ID
   */
  async getInventoryById(inventoryId: string): Promise<any> {
    try {
      const inventory = await this.prisma.inventory.findUnique({
        where: { id: inventoryId },
        include: {
          product: true,
          warehouse: true,
          movements: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      });

      return inventory;
    } catch (error) {
      logger.error('Get inventory by ID failed', { inventoryId, error });
      throw error;
    }
  }

  /**
   * Check stock availability for a product
   */
  async checkStock(
    productId: string,
    warehouseId?: string
  ): Promise<{
    available: number;
    reserved: number;
    total: number;
    locations: Array<{ warehouseId: string; available: number; reserved: number }>;
  }> {
    try {
      const whereClause: any = { productId };
      if (warehouseId) {
        whereClause.warehouseId = warehouseId;
      }

      const inventory = await this.prisma.inventory.findMany({
        where: whereClause,
        include: {
          warehouse: true,
        },
      });

      if (inventory.length === 0) {
        throw new ApiError(404, 'Product not found in inventory');
      }

      const total = inventory.reduce((sum, item) => sum + item.totalQuantity, 0);
      const available = inventory.reduce((sum, item) => sum + item.availableQuantity, 0);
      const reserved = inventory.reduce((sum, item) => sum + item.reservedQuantity, 0);

      const locations = inventory.map((item) => ({
        warehouseId: item.warehouseId,
        available: item.availableQuantity,
        reserved: item.reservedQuantity,
      }));

      return { available, reserved, total, locations };
    } catch (error) {
      logger.error('Stock check failed', { productId, warehouseId, error });
      throw error;
    }
  }

  /**
   * Check availability for multiple items
   */
  async checkMultipleAvailability(
    items: Array<{
      productId: string;
      quantity: number;
      warehouseId?: string;
    }>
  ): Promise<
    Array<{
      productId: string;
      quantity: number;
      available: boolean;
      availableQuantity: number;
      warehouseId?: string;
    }>
  > {
    try {
      const results = await Promise.all(
        items.map(async (item) => {
          const stock = await this.checkStock(item.productId, item.warehouseId);

          return {
            productId: item.productId,
            quantity: item.quantity,
            available: stock.available >= item.quantity,
            availableQuantity: stock.available,
            warehouseId: item.warehouseId,
          };
        })
      );

      return results;
    } catch (error) {
      logger.error('Multiple availability check failed', { items, error });
      throw error;
    }
  }

  /**
   * Update inventory item settings
   */
  async updateInventorySettings(
    inventoryId: string,
    updates: Partial<{
      minimumStock: number;
      maximumStock: number;
      reorderPoint: number;
      reorderQuantity: number;
      status: string;
    }>
  ): Promise<any> {
    try {
      const inventory = await this.prisma.inventory.update({
        where: { id: inventoryId },
        data: updates,
        include: {
          product: true,
          warehouse: true,
        },
      });

      logger.info('Inventory settings updated', { inventoryId, updates });
      return inventory;
    } catch (error) {
      logger.error('Update inventory settings failed', { inventoryId, updates, error });
      throw error;
    }
  }

  /**
   * Get inventory movements
   */
  async getMovements(
    inventoryId: string,
    page: number = 1,
    limit: number = 20,
    type?: string
  ): Promise<any[]> {
    try {
      const skip = (page - 1) * limit;
      const whereClause: any = { inventoryId };

      if (type) {
        whereClause.type = type;
      }

      const movements = await this.prisma.inventoryMovement.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return movements;
    } catch (error) {
      logger.error('Get movements failed', { inventoryId, page, limit, type, error });
      throw error;
    }
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(filters: any = {}): Promise<LowStockAlert[]> {
    try {
      const alerts = await this.prisma.lowStockAlert.findMany({
        where: filters,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      });

      return alerts as LowStockAlert[];
    } catch (error) {
      logger.error('Get low stock alerts failed', { filters, error });
      throw error;
    }
  }

  /**
   * Acknowledge low stock alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    try {
      await this.prisma.lowStockAlert.update({
        where: { id: alertId },
        data: {
          status: 'acknowledged',
          acknowledgedAt: new Date(),
        },
      });

      logger.info('Alert acknowledged', { alertId, acknowledgedBy });
    } catch (error) {
      logger.error('Acknowledge alert failed', { alertId, acknowledgedBy, error });
      throw error;
    }
  }

  /**
   * Resolve low stock alert
   */
  async resolveAlert(alertId: string, resolvedBy: string): Promise<void> {
    try {
      await this.prisma.lowStockAlert.update({
        where: { id: alertId },
        data: {
          status: 'resolved',
          resolvedAt: new Date(),
        },
      });

      logger.info('Alert resolved', { alertId, resolvedBy });
    } catch (error) {
      logger.error('Resolve alert failed', { alertId, resolvedBy, error });
      throw error;
    }
  }

  /**
   * Reserve stock for an order
   */
  async reserveStock(
    productId: string,
    quantity: number,
    orderId: string,
    customerId: string,
    warehouseId?: string
  ): Promise<StockReservation> {
    try {
      // Find available inventory
      const inventory = await this.findBestInventoryForReservation(
        productId,
        quantity,
        warehouseId
      );

      if (!inventory || inventory.availableQuantity < quantity) {
        throw new ApiError(400, 'Insufficient stock available');
      }

      // Create reservation
      const reservation = await this.prisma.stockReservation.create({
        data: {
          productId,
          quantity,
          orderId,
          customerId,
          warehouseId: inventory.warehouseId,
          status: 'active',
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        },
      });

      // Update inventory
      await this.prisma.inventory.update({
        where: { id: inventory.id },
        data: {
          availableQuantity: inventory.availableQuantity - quantity,
          reservedQuantity: inventory.reservedQuantity + quantity,
        },
      });

      // Record movement
      await this.recordMovement({
        inventoryId: inventory.id,
        type: 'reservation',
        quantity: -quantity,
        reference: {
          type: 'sales_order',
          id: orderId,
        },
        performedBy: customerId,
      });

      this.emit('stockReserved', {
        productId,
        quantity,
        orderId,
        warehouseId: inventory.warehouseId,
      });

      logger.info('Stock reserved successfully', { productId, quantity, orderId });
      return reservation;
    } catch (error) {
      logger.error('Stock reservation failed', { productId, quantity, orderId, error });
      throw error;
    }
  }

  /**
   * Release stock reservation
   */
  async releaseReservation(reservationId: string): Promise<void> {
    try {
      const reservation = await this.prisma.stockReservation.findUnique({
        where: { id: reservationId },
        include: { inventory: true },
      });

      if (!reservation) {
        throw new ApiError(404, 'Reservation not found');
      }

      if (reservation.status !== 'active') {
        throw new ApiError(400, 'Reservation is not active');
      }

      // Update inventory
      await this.prisma.inventory.update({
        where: { id: reservation.inventory.id },
        data: {
          availableQuantity: reservation.inventory.availableQuantity + reservation.quantity,
          reservedQuantity: reservation.inventory.reservedQuantity - reservation.quantity,
        },
      });

      // Update reservation status
      await this.prisma.stockReservation.update({
        where: { id: reservationId },
        data: { status: 'cancelled' },
      });

      // Record movement
      await this.recordMovement({
        inventoryId: reservation.inventory.id,
        type: 'adjustment',
        quantity: reservation.quantity,
        reference: {
          type: 'adjustment',
          id: reservationId,
          notes: 'Released reservation',
        },
        performedBy: 'system',
      });

      this.emit('reservationReleased', {
        productId: reservation.productId,
        quantity: reservation.quantity,
        orderId: reservation.orderId,
      });

      logger.info('Stock reservation released', { reservationId });
    } catch (error) {
      logger.error('Reservation release failed', { reservationId, error });
      throw error;
    }
  }

  /**
   * Fulfill stock reservation (when order is shipped)
   */
  async fulfillReservation(reservationId: string): Promise<void> {
    try {
      const reservation = await this.prisma.stockReservation.findUnique({
        where: { id: reservationId },
        include: { inventory: true },
      });

      if (!reservation) {
        throw new ApiError(404, 'Reservation not found');
      }

      if (reservation.status !== 'active') {
        throw new ApiError(400, 'Reservation is not active');
      }

      // Update inventory - remove from reserved and total
      await this.prisma.inventory.update({
        where: { id: reservation.inventory.id },
        data: {
          reservedQuantity: reservation.inventory.reservedQuantity - reservation.quantity,
          totalQuantity: reservation.inventory.totalQuantity - reservation.quantity,
        },
      });

      // Update reservation status
      await this.prisma.stockReservation.update({
        where: { id: reservationId },
        data: { status: 'fulfilled' },
      });

      // Record movement
      await this.recordMovement({
        inventoryId: reservation.inventory.id,
        type: 'out',
        quantity: -reservation.quantity,
        reference: {
          type: 'sales_order',
          id: reservation.orderId,
        },
        performedBy: 'system',
      });

      // Check for low stock alerts
      await this.checkLowStockAlert(reservation.inventory.id);

      this.emit('stockFulfilled', {
        productId: reservation.productId,
        quantity: reservation.quantity,
        orderId: reservation.orderId,
      });

      logger.info('Stock reservation fulfilled', { reservationId });
    } catch (error) {
      logger.error('Reservation fulfillment failed', { reservationId, error });
      throw error;
    }
  }

  /**
   * Add stock (receiving inventory)
   */
  async addStock(
    productId: string,
    quantity: number,
    warehouseId: string,
    unitCost: number,
    reference: {
      type: 'purchase_order' | 'transfer' | 'adjustment' | 'return';
      id: string;
      notes?: string;
    },
    performedBy: string
  ): Promise<void> {
    try {
      // Find or create inventory record
      let inventory = await this.prisma.inventory.findFirst({
        where: { productId, warehouseId },
      });

      if (!inventory) {
        // Create new inventory record
        inventory = await this.prisma.inventory.create({
          data: {
            productId,
            warehouseId,
            availableQuantity: quantity,
            reservedQuantity: 0,
            totalQuantity: quantity,
            unitCost,
            averageCost: unitCost,
            lastCost: unitCost,
            minimumStock: 10, // Default value
            maximumStock: 1000, // Default value
            reorderPoint: 20, // Default value
            reorderQuantity: 100, // Default value
            status: 'active',
          },
        });
      } else {
        // Update existing inventory
        const newTotalQuantity = inventory.totalQuantity + quantity;
        const newAverageCost =
          (inventory.averageCost * inventory.totalQuantity + unitCost * quantity) /
          newTotalQuantity;

        await this.prisma.inventory.update({
          where: { id: inventory.id },
          data: {
            availableQuantity: inventory.availableQuantity + quantity,
            totalQuantity: newTotalQuantity,
            averageCost: newAverageCost,
            lastCost: unitCost,
          },
        });
      }

      // Record movement
      await this.recordMovement({
        inventoryId: inventory.id,
        type: 'in',
        quantity,
        unitCost,
        totalCost: unitCost * quantity,
        reference,
        performedBy,
      });

      this.emit('stockAdded', {
        productId,
        quantity,
        warehouseId,
        unitCost,
      });

      logger.info('Stock added successfully', { productId, quantity, warehouseId });
    } catch (error) {
      logger.error('Add stock failed', { productId, quantity, warehouseId, error });
      throw error;
    }
  }

  /**
   * Adjust stock (for corrections, damages, etc.)
   */
  async adjustStock(
    inventoryId: string,
    adjustment: number,
    reason: string,
    performedBy: string
  ): Promise<void> {
    try {
      const inventory = await this.prisma.inventory.findUnique({
        where: { id: inventoryId },
      });

      if (!inventory) {
        throw new ApiError(404, 'Inventory item not found');
      }

      const newAvailable = inventory.availableQuantity + adjustment;
      const newTotal = inventory.totalQuantity + adjustment;

      if (newAvailable < 0 || newTotal < 0) {
        throw new ApiError(400, 'Adjustment would result in negative stock');
      }

      // Update inventory
      await this.prisma.inventory.update({
        where: { id: inventoryId },
        data: {
          availableQuantity: newAvailable,
          totalQuantity: newTotal,
        },
      });

      // Record movement
      await this.recordMovement({
        inventoryId,
        type: 'adjustment',
        quantity: adjustment,
        reference: {
          type: 'adjustment',
          id: `ADJ-${Date.now()}`,
          notes: reason,
        },
        performedBy,
        reason,
      });

      // Check for low stock alerts
      await this.checkLowStockAlert(inventoryId);

      this.emit('stockAdjusted', {
        inventoryId,
        adjustment,
        reason,
        performedBy,
      });

      logger.info('Stock adjusted', { inventoryId, adjustment, reason });
    } catch (error) {
      logger.error('Stock adjustment failed', { inventoryId, adjustment, error });
      throw error;
    }
  }

  /**
   * Transfer stock between warehouses
   */
  async transferStock(
    productId: string,
    quantity: number,
    fromWarehouseId: string,
    toWarehouseId: string,
    performedBy: string,
    notes?: string
  ): Promise<void> {
    try {
      // Check source inventory
      const sourceInventory = await this.prisma.inventory.findFirst({
        where: { productId, warehouseId: fromWarehouseId },
      });

      if (!sourceInventory) {
        throw new ApiError(404, 'Source inventory not found');
      }

      if (sourceInventory.availableQuantity < quantity) {
        throw new ApiError(400, 'Insufficient stock for transfer');
      }

      // Find or create destination inventory
      let destInventory = await this.prisma.inventory.findFirst({
        where: { productId, warehouseId: toWarehouseId },
      });

      const transferId = `TRF-${Date.now()}`;

      // Update source inventory
      await this.prisma.inventory.update({
        where: { id: sourceInventory.id },
        data: {
          availableQuantity: sourceInventory.availableQuantity - quantity,
          totalQuantity: sourceInventory.totalQuantity - quantity,
        },
      });

      // Record outbound movement
      await this.recordMovement({
        inventoryId: sourceInventory.id,
        type: 'transfer',
        quantity: -quantity,
        reference: {
          type: 'transfer',
          id: transferId,
          notes,
        },
        performedBy,
      });

      if (!destInventory) {
        // Create new inventory record at destination
        destInventory = await this.prisma.inventory.create({
          data: {
            productId,
            warehouseId: toWarehouseId,
            availableQuantity: quantity,
            reservedQuantity: 0,
            totalQuantity: quantity,
            unitCost: sourceInventory.averageCost,
            averageCost: sourceInventory.averageCost,
            lastCost: sourceInventory.lastCost,
            minimumStock: sourceInventory.minimumStock,
            maximumStock: sourceInventory.maximumStock,
            reorderPoint: sourceInventory.reorderPoint,
            reorderQuantity: sourceInventory.reorderQuantity,
            status: 'active',
          },
        });
      } else {
        // Update existing destination inventory
        await this.prisma.inventory.update({
          where: { id: destInventory.id },
          data: {
            availableQuantity: destInventory.availableQuantity + quantity,
            totalQuantity: destInventory.totalQuantity + quantity,
          },
        });
      }

      // Record inbound movement
      await this.recordMovement({
        inventoryId: destInventory.id,
        type: 'transfer',
        quantity,
        reference: {
          type: 'transfer',
          id: transferId,
          notes,
        },
        performedBy,
      });

      this.emit('stockTransferred', {
        productId,
        quantity,
        fromWarehouseId,
        toWarehouseId,
        transferId,
      });

      logger.info('Stock transferred successfully', {
        productId,
        quantity,
        fromWarehouseId,
        toWarehouseId,
      });
    } catch (error) {
      logger.error('Stock transfer failed', {
        productId,
        quantity,
        fromWarehouseId,
        toWarehouseId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get inventory report
   */
  async getInventoryReport(
    warehouseId?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<InventoryReport> {
    try {
      const whereClause: any = {};
      if (warehouseId) {
        whereClause.warehouseId = warehouseId;
      }

      const inventory = await this.prisma.inventory.findMany({
        where: whereClause,
        include: {
          product: true,
          warehouse: true,
          movements: {
            where: dateRange
              ? {
                  createdAt: {
                    gte: dateRange.start,
                    lte: dateRange.end,
                  },
                }
              : undefined,
            orderBy: { createdAt: 'desc' },
            take: 1000,
          },
        },
      });

      // Calculate summary
      const totalItems = inventory.length;
      const totalValue = inventory.reduce(
        (sum, item) => sum + item.totalQuantity * item.averageCost,
        0
      );
      const lowStockItems = inventory.filter(
        (item) => item.availableQuantity <= item.reorderPoint
      ).length;
      const outOfStockItems = inventory.filter((item) => item.availableQuantity === 0).length;
      const overstockItems = inventory.filter(
        (item) => item.availableQuantity > item.maximumStock
      ).length;

      // Get low stock alerts
      const alerts = await this.prisma.lowStockAlert.findMany({
        where: {
          status: { in: ['pending', 'acknowledged'] },
          ...(warehouseId && { warehouseId }),
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        summary: {
          totalItems,
          totalValue,
          lowStockItems,
          outOfStockItems,
          overstockItems,
        },
        breakdown: {
          byCategory: [], // Would calculate from product data
          byWarehouse: [], // Would calculate from warehouse data
          bySupplier: [], // Would calculate from supplier data
        },
        movements: {
          in: inventory.reduce(
            (sum, item) => sum + item.movements.filter((m) => m.type === 'in').length,
            0
          ),
          out: inventory.reduce(
            (sum, item) => sum + item.movements.filter((m) => m.type === 'out').length,
            0
          ),
          adjustments: inventory.reduce(
            (sum, item) => sum + item.movements.filter((m) => m.type === 'adjustment').length,
            0
          ),
          transfers: inventory.reduce(
            (sum, item) => sum + item.movements.filter((m) => m.type === 'transfer').length,
            0
          ),
        },
        alerts: alerts as LowStockAlert[],
        trends: [], // Would calculate historical trends
      };
    } catch (error) {
      logger.error('Inventory report generation failed', { warehouseId, dateRange, error });
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async findBestInventoryForReservation(
    productId: string,
    quantity: number,
    warehouseId?: string
  ): Promise<any> {
    const whereClause: any = {
      productId,
      availableQuantity: { gte: quantity },
    };

    if (warehouseId) {
      whereClause.warehouseId = warehouseId;
    }

    return await this.prisma.inventory.findFirst({
      where: whereClause,
      orderBy: [{ availableQuantity: 'desc' }, { createdAt: 'asc' }],
    });
  }

  private async recordMovement(movement: {
    inventoryId: string;
    type: 'in' | 'out' | 'adjustment' | 'transfer' | 'reservation' | 'return';
    quantity: number;
    unitCost?: number;
    totalCost?: number;
    reference: {
      type: 'purchase_order' | 'sales_order' | 'transfer' | 'adjustment' | 'return';
      id: string;
      notes?: string;
    };
    performedBy: string;
    reason?: string;
  }): Promise<void> {
    await this.prisma.inventoryMovement.create({
      data: {
        inventoryId: movement.inventoryId,
        type: movement.type,
        quantity: movement.quantity,
        unitCost: movement.unitCost,
        totalCost: movement.totalCost,
        reference: movement.reference,
        performedBy: movement.performedBy,
        reason: movement.reason,
      },
    });
  }

  private async checkLowStockAlert(inventoryId: string): Promise<void> {
    const inventory = await this.prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: { product: true },
    });

    if (!inventory) return;

    if (inventory.availableQuantity <= inventory.reorderPoint) {
      // Check if alert already exists
      const existingAlert = await this.prisma.lowStockAlert.findFirst({
        where: {
          productId: inventory.productId,
          warehouseId: inventory.warehouseId,
          status: { in: ['pending', 'acknowledged'] },
        },
      });

      if (!existingAlert) {
        await this.prisma.lowStockAlert.create({
          data: {
            productId: inventory.productId,
            sku: inventory.product.sku,
            warehouseId: inventory.warehouseId,
            currentStock: inventory.availableQuantity,
            minimumStock: inventory.minimumStock,
            reorderPoint: inventory.reorderPoint,
            status: 'pending',
            priority:
              inventory.availableQuantity === 0
                ? 'critical'
                : inventory.availableQuantity <= inventory.minimumStock
                  ? 'high'
                  : 'medium',
          },
        });

        this.emit('lowStockAlert', {
          productId: inventory.productId,
          warehouseId: inventory.warehouseId,
          currentStock: inventory.availableQuantity,
          reorderPoint: inventory.reorderPoint,
        });
      }
    }
  }

  /**
   * Clean up expired reservations
   */
  async cleanupExpiredReservations(): Promise<void> {
    try {
      const expiredReservations = await this.prisma.stockReservation.findMany({
        where: {
          status: 'active',
          expiresAt: { lt: new Date() },
        },
      });

      for (const reservation of expiredReservations) {
        await this.releaseReservation(reservation.id);
      }

      logger.info('Expired reservations cleaned up', { count: expiredReservations.length });
    } catch (error) {
      logger.error('Cleanup expired reservations failed', error);
    }
  }
}

export const inventoryService = new InventoryService();
