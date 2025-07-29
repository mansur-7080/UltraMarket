import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import {
  createOrder,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  getOrdersByUser,
  getOrderHistory,
  processOrderPayment,
  refundOrder,
  exportOrders,
} from '../controllers/orderController';
import { validateOrder, validateOrderUpdate } from '../validators/orderValidator';

const router = Router();

// Public routes (with authentication)
router.get('/orders/:id', authenticateToken, getOrderById);
router.get('/orders/user/:userId', authenticateToken, getOrdersByUser);
router.get('/orders/history/:userId', authenticateToken, getOrderHistory);

// Protected routes (require specific roles)
router.post('/orders', authenticateToken, validateOrder, createOrder);
router.put(
  '/orders/:id/status',
  authenticateToken,
  authorizeRoles('admin', 'manager'),
  validateOrderUpdate,
  updateOrderStatus
);
router.delete('/orders/:id', authenticateToken, authorizeRoles('admin', 'manager'), cancelOrder);
router.post('/orders/:id/payment', authenticateToken, processOrderPayment);
router.post(
  '/orders/:id/refund',
  authenticateToken,
  authorizeRoles('admin', 'manager'),
  refundOrder
);

// Admin only routes
router.get('/orders', authenticateToken, authorizeRoles('admin', 'manager'), getAllOrders);
router.get('/orders/export', authenticateToken, authorizeRoles('admin'), exportOrders);

export default router;
