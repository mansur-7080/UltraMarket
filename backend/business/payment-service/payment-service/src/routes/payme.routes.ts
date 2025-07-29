import { Router } from 'express';
import { PaymeController } from '../controllers/payme.controller';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import { paymeWebhookSchema, paymentIdParamSchema } from '../schemas/payment.schemas';

const router = Router();
const paymeController = new PaymeController();

// Payme webhook endpoint
router.post('/webhook', validateBody(paymeWebhookSchema), paymeController.handleWebhook);

// Check payment status
router.get(
  '/status/:paymentId',
  validateParams(paymentIdParamSchema),
  paymeController.checkPaymentStatus
);

// Cancel payment
router.post(
  '/cancel/:paymentId',
  validateParams(paymentIdParamSchema),
  paymeController.cancelPayment
);

export default router;
