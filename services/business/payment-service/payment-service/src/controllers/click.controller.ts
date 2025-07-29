import { Request, Response } from 'express';
import { ClickService } from '../services/click.service';
import { logger } from '../utils/logger';

export class ClickController {
  private clickService: ClickService;

  constructor() {
    this.clickService = new ClickService();
  }

  // Handle Click prepare request
  handlePrepare = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Received Click prepare request', { body: req.body });

      const result = await this.clickService.handlePrepare(req.body);

      res.json(result);
    } catch (error) {
      logger.error('Error handling Click prepare request:', error);
      res.json({
        error: -9,
        error_note: 'Internal server error',
      });
    }
  };

  // Handle Click complete request
  handleComplete = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Received Click complete request', { body: req.body });

      const result = await this.clickService.handleComplete(req.body);

      res.json(result);
    } catch (error) {
      logger.error('Error handling Click complete request:', error);
      res.json({
        error: -9,
        error_note: 'Internal server error',
      });
    }
  };

  // Check payment status
  checkPaymentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { paymentId } = req.params;

      const result = await this.clickService.checkPaymentStatus(paymentId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error checking Click payment status:', error);
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

      const result = await this.clickService.cancelPayment(paymentId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error cancelling Click payment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel payment',
      });
    }
  };
}
