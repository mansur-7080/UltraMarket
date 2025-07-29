import { Router } from 'express';
import { ClickController } from '../controllers/click.controller';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import {
  clickPrepareSchema,
  clickCompleteSchema,
  paymentIdParamSchema,
} from '../schemas/payment.schemas';

const router = Router();
const clickController = new ClickController();

// Click prepare endpoint
router.post('/prepare', validateBody(clickPrepareSchema), clickController.handlePrepare);

// Click complete endpoint
router.post('/complete', validateBody(clickCompleteSchema), clickController.handleComplete);

// Check payment status
router.get(
  '/status/:paymentId',
  validateParams(paymentIdParamSchema),
  clickController.checkPaymentStatus
);

// Cancel payment
router.post(
  '/cancel/:paymentId',
  validateParams(paymentIdParamSchema),
  clickController.cancelPayment
);

export default router;
