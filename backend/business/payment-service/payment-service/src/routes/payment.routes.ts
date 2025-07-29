import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { validateBody, validateQuery, validateParams } from '../middleware/validation.middleware';
import {
  createPaymentSchema,
  cancelPaymentSchema,
  refundPaymentSchema,
  getPaymentsQuerySchema,
  paymentStatisticsQuerySchema,
  paymentIdParamSchema,
  orderIdParamSchema,
} from '../schemas/payment.schemas';

const router = Router();
const paymentController = new PaymentController();

// Create payment
router.post(
  '/',
  authenticateToken,
  validateBody(createPaymentSchema),
  paymentController.createPayment
);

// Get payment by ID
router.get(
  '/:paymentId',
  authenticateToken,
  validateParams(paymentIdParamSchema),
  paymentController.getPayment
);

// Get payments by order ID
router.get(
  '/order/:orderId',
  authenticateToken,
  validateParams(orderIdParamSchema),
  paymentController.getPaymentsByOrder
);

// Get user payments
router.get(
  '/user/payments',
  authenticateToken,
  validateQuery(getPaymentsQuerySchema),
  paymentController.getUserPayments
);

// Cancel payment
router.post(
  '/:paymentId/cancel',
  authenticateToken,
  validateParams(paymentIdParamSchema),
  validateBody(cancelPaymentSchema),
  paymentController.cancelPayment
);

// Refund payment
router.post(
  '/:paymentId/refund',
  authenticateToken,
  requireAdmin,
  validateParams(paymentIdParamSchema),
  validateBody(refundPaymentSchema),
  paymentController.refundPayment
);

// Get payment methods
router.get('/methods/available', paymentController.getPaymentMethods);

// Verify payment status
router.post(
  '/:paymentId/verify',
  authenticateToken,
  validateParams(paymentIdParamSchema),
  paymentController.verifyPayment
);

// Get payment statistics (Admin only)
router.get(
  '/admin/statistics',
  authenticateToken,
  requireAdmin,
  validateQuery(paymentStatisticsQuerySchema),
  paymentController.getPaymentStatistics
);

export default router;
