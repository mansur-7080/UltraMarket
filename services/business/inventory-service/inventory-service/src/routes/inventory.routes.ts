import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  checkStockSchema,
  reserveStockSchema,
  addStockSchema,
  adjustStockSchema,
  transferStockSchema,
} from '../schemas/inventory.schemas';

const router = Router();
const inventoryController = new InventoryController();

/**
 * @swagger
 * /api/v1/inventory:
 *   get:
 *     summary: Get all inventory items
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *         description: Filter by warehouse ID
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         description: Filter by product ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Inventory items retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', authMiddleware, inventoryController.getAllInventory);

/**
 * @swagger
 * /api/v1/inventory/{productId}/stock:
 *   get:
 *     summary: Check stock for a product
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *         description: Warehouse ID (optional)
 *     responses:
 *       200:
 *         description: Stock information retrieved successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.get('/:productId/stock', authMiddleware, inventoryController.checkStock);

/**
 * @swagger
 * /api/v1/inventory/{productId}/reserve:
 *   post:
 *     summary: Reserve stock for an order
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *               - orderId
 *               - customerId
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               orderId:
 *                 type: string
 *               customerId:
 *                 type: string
 *               warehouseId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Stock reserved successfully
 *       400:
 *         description: Insufficient stock or invalid request
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/:productId/reserve',
  authMiddleware,
  validateRequest(reserveStockSchema),
  inventoryController.reserveStock
);

/**
 * @swagger
 * /api/v1/inventory/reservations/{reservationId}/release:
 *   post:
 *     summary: Release a stock reservation
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation ID
 *     responses:
 *       200:
 *         description: Reservation released successfully
 *       404:
 *         description: Reservation not found
 *       400:
 *         description: Reservation cannot be released
 *       500:
 *         description: Internal server error
 */
router.post(
  '/reservations/:reservationId/release',
  authMiddleware,
  inventoryController.releaseReservation
);

/**
 * @swagger
 * /api/v1/inventory/reservations/{reservationId}/fulfill:
 *   post:
 *     summary: Fulfill a stock reservation
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation ID
 *     responses:
 *       200:
 *         description: Reservation fulfilled successfully
 *       404:
 *         description: Reservation not found
 *       400:
 *         description: Reservation cannot be fulfilled
 *       500:
 *         description: Internal server error
 */
router.post(
  '/reservations/:reservationId/fulfill',
  authMiddleware,
  inventoryController.fulfillReservation
);

/**
 * @swagger
 * /api/v1/inventory/{productId}/add:
 *   post:
 *     summary: Add stock (receiving inventory)
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *               - warehouseId
 *               - unitCost
 *               - reference
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               warehouseId:
 *                 type: string
 *               unitCost:
 *                 type: number
 *                 minimum: 0
 *               reference:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [purchase_order, transfer, adjustment, return]
 *                   id:
 *                     type: string
 *                   notes:
 *                     type: string
 *     responses:
 *       201:
 *         description: Stock added successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Product or warehouse not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/:productId/add',
  authMiddleware,
  validateRequest(addStockSchema),
  inventoryController.addStock
);

/**
 * @swagger
 * /api/v1/inventory/{inventoryId}/adjust:
 *   post:
 *     summary: Adjust stock (corrections, damages, etc.)
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inventoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Inventory ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adjustment
 *               - reason
 *             properties:
 *               adjustment:
 *                 type: integer
 *                 description: Positive for increase, negative for decrease
 *               reason:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Stock adjusted successfully
 *       400:
 *         description: Invalid adjustment or would result in negative stock
 *       404:
 *         description: Inventory item not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/:inventoryId/adjust',
  authMiddleware,
  validateRequest(adjustStockSchema),
  inventoryController.adjustStock
);

/**
 * @swagger
 * /api/v1/inventory/transfer:
 *   post:
 *     summary: Transfer stock between warehouses
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *               - fromWarehouseId
 *               - toWarehouseId
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               fromWarehouseId:
 *                 type: string
 *               toWarehouseId:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stock transferred successfully
 *       400:
 *         description: Insufficient stock or invalid request
 *       404:
 *         description: Product or warehouse not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/transfer',
  authMiddleware,
  validateRequest(transferStockSchema),
  inventoryController.transferStock
);

/**
 * @swagger
 * /api/v1/inventory/check-availability:
 *   post:
 *     summary: Check availability for multiple items
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                     warehouseId:
 *                       type: string
 *     responses:
 *       200:
 *         description: Availability checked successfully
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Internal server error
 */
router.post(
  '/check-availability',
  authMiddleware,
  validateRequest(checkStockSchema),
  inventoryController.checkAvailability
);

/**
 * @swagger
 * /api/v1/inventory/{inventoryId}:
 *   get:
 *     summary: Get inventory item details
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inventoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Inventory ID
 *     responses:
 *       200:
 *         description: Inventory item details retrieved successfully
 *       404:
 *         description: Inventory item not found
 *       500:
 *         description: Internal server error
 */
router.get('/:inventoryId', authMiddleware, inventoryController.getInventoryItem);

/**
 * @swagger
 * /api/v1/inventory/{inventoryId}:
 *   put:
 *     summary: Update inventory item settings
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inventoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Inventory ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               minimumStock:
 *                 type: integer
 *                 minimum: 0
 *               maximumStock:
 *                 type: integer
 *                 minimum: 1
 *               reorderPoint:
 *                 type: integer
 *                 minimum: 0
 *               reorderQuantity:
 *                 type: integer
 *                 minimum: 1
 *               status:
 *                 type: string
 *                 enum: [active, inactive, discontinued, backordered]
 *     responses:
 *       200:
 *         description: Inventory item updated successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Inventory item not found
 *       500:
 *         description: Internal server error
 */
router.put('/:inventoryId', authMiddleware, inventoryController.updateInventoryItem);

export default router;
