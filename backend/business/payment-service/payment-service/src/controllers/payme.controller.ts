import { Request, Response } from 'express';
import { PaymeService } from '../services/payme.service';
import { logger } from '../utils/logger';

export class PaymeController {
  private paymeService: PaymeService;

  constructor() {
    this.paymeService = new PaymeService();
  }

  // Handle Payme webhook
  handleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Received Payme webhook request', { body: req.body });

      const result = await this.paymeService.handleWebhook(req.body);

      res.json(result);
    } catch (error) {
      logger.error('Error handling Payme webhook:', error);
      res.json({
        error: {
          code: -32400,
          message: 'Internal server error',
        },
        id: req.body.id || 0,
      });
    }
  };

  // Check payment status
  checkPaymentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { paymentId } = req.params;

      const result = await this.paymeService.checkPaymentStatus(paymentId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error checking Payme payment status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check payment status',
      });
    }
  };

  // Cancel payment
  cancelPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { paymentId } = req.params;

      const result = await this.paymeService.cancelPayment(paymentId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error cancelling Payme payment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel payment',
      });
    }
  };
}
