import { Request, Response, NextFunction } from 'express';
import { inventoryService } from '../services/inventory.service';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';
import { catchAsync } from '../utils/catchAsync';

export class InventoryController {
  /**
   * Get all inventory items
   */
  getAllInventory = catchAsync(async (req: Request, res: Response) => {
    const { warehouseId, productId, page = 1, limit = 20 } = req.query;

    const filters: any = {};
    if (warehouseId) filters.warehouseId = warehouseId as string;
    if (productId) filters.productId = productId as string;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const result = await inventoryService.getAllInventory(filters, pageNum, limitNum);

    res.status(200).json({
      success: true,
      message: 'Inventory items retrieved successfully',
      data: result.items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: result.total,
        pages: Math.ceil(result.total / limitNum),
      },
    });
  });

  /**
   * Get inventory item details
   */
  getInventoryItem = catchAsync(async (req: Request, res: Response) => {
    const { inventoryId } = req.params;

    const inventory = await inventoryService.getInventoryById(inventoryId);

    if (!inventory) {
      throw new ApiError(404, 'Inventory item not found');
    }

    res.status(200).json({
      success: true,
      message: 'Inventory item retrieved successfully',
      data: inventory,
    });
  });

  /**
   * Check stock for a product
   */
  checkStock = catchAsync(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const { warehouseId } = req.query;

    const stock = await inventoryService.checkStock(productId, warehouseId as string);

    res.status(200).json({
      success: true,
      message: 'Stock information retrieved successfully',
      data: stock,
    });
  });

  /**
   * Reserve stock for an order
   */
  reserveStock = catchAsync(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const { quantity, orderId, customerId, warehouseId } = req.body;

    const reservation = await inventoryService.reserveStock(
      productId,
      quantity,
      orderId,
      customerId,
      warehouseId
    );

    res.status(201).json({
      success: true,
      message: 'Stock reserved successfully',
      data: reservation,
    });
  });

  /**
   * Release a stock reservation
   */
  releaseReservation = catchAsync(async (req: Request, res: Response) => {
    const { reservationId } = req.params;

    await inventoryService.releaseReservation(reservationId);

    res.status(200).json({
      success: true,
      message: 'Reservation released successfully',
    });
  });

  /**
   * Fulfill a stock reservation
   */
  fulfillReservation = catchAsync(async (req: Request, res: Response) => {
    const { reservationId } = req.params;

    await inventoryService.fulfillReservation(reservationId);

    res.status(200).json({
      success: true,
      message: 'Reservation fulfilled successfully',
    });
  });

  /**
   * Add stock (receiving inventory)
   */
  addStock = catchAsync(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const { quantity, warehouseId, unitCost, reference } = req.body;
    const performedBy = req.user?.id || 'system';

    await inventoryService.addStock(
      productId,
      quantity,
      warehouseId,
      unitCost,
      reference,
      performedBy
    );

    res.status(201).json({
      success: true,
      message: 'Stock added successfully',
    });
  });

  /**
   * Adjust stock (corrections, damages, etc.)
   */
  adjustStock = catchAsync(async (req: Request, res: Response) => {
    const { inventoryId } = req.params;
    const { adjustment, reason } = req.body;
    const performedBy = req.user?.id || 'system';

    await inventoryService.adjustStock(inventoryId, adjustment, reason, performedBy);

    res.status(200).json({
      success: true,
      message: 'Stock adjusted successfully',
    });
  });

  /**
   * Transfer stock between warehouses
   */
  transferStock = catchAsync(async (req: Request, res: Response) => {
    const { productId, quantity, fromWarehouseId, toWarehouseId, notes } = req.body;
    const performedBy = req.user?.id || 'system';

    await inventoryService.transferStock(
      productId,
      quantity,
      fromWarehouseId,
      toWarehouseId,
      performedBy,
      notes
    );

    res.status(200).json({
      success: true,
      message: 'Stock transferred successfully',
    });
  });

  /**
   * Check availability for multiple items
   */
  checkAvailability = catchAsync(async (req: Request, res: Response) => {
    const { items } = req.body;

    const availability = await inventoryService.checkMultipleAvailability(items);

    res.status(200).json({
      success: true,
      message: 'Availability checked successfully',
      data: availability,
    });
  });

  /**
   * Update inventory item settings
   */
  updateInventoryItem = catchAsync(async (req: Request, res: Response) => {
    const { inventoryId } = req.params;
    const updates = req.body;

    const inventory = await inventoryService.updateInventorySettings(inventoryId, updates);

    res.status(200).json({
      success: true,
      message: 'Inventory item updated successfully',
      data: inventory,
    });
  });

  /**
   * Get inventory movements
   */
  getMovements = catchAsync(async (req: Request, res: Response) => {
    const { inventoryId } = req.params;
    const { page = 1, limit = 20, type } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const movements = await inventoryService.getMovements(
      inventoryId,
      pageNum,
      limitNum,
      type as string
    );

    res.status(200).json({
      success: true,
      message: 'Inventory movements retrieved successfully',
      data: movements,
    });
  });

  /**
   * Get low stock alerts
   */
  getLowStockAlerts = catchAsync(async (req: Request, res: Response) => {
    const { warehouseId, status, priority } = req.query;

    const filters: any = {};
    if (warehouseId) filters.warehouseId = warehouseId as string;
    if (status) filters.status = status as string;
    if (priority) filters.priority = priority as string;

    const alerts = await inventoryService.getLowStockAlerts(filters);

    res.status(200).json({
      success: true,
      message: 'Low stock alerts retrieved successfully',
      data: alerts,
    });
  });

  /**
   * Acknowledge low stock alert
   */
  acknowledgeAlert = catchAsync(async (req: Request, res: Response) => {
    const { alertId } = req.params;
    const acknowledgedBy = req.user?.id || 'system';

    await inventoryService.acknowledgeAlert(alertId, acknowledgedBy);

    res.status(200).json({
      success: true,
      message: 'Alert acknowledged successfully',
    });
  });

  /**
   * Resolve low stock alert
   */
  resolveAlert = catchAsync(async (req: Request, res: Response) => {
    const { alertId } = req.params;
    const resolvedBy = req.user?.id || 'system';

    await inventoryService.resolveAlert(alertId, resolvedBy);

    res.status(200).json({
      success: true,
      message: 'Alert resolved successfully',
    });
  });
}
