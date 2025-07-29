import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

const prisma = new PrismaClient();

export class WebhookController {
  // Get webhooks by payment ID
  getWebhooksByPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { paymentId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const [webhooks, total] = await Promise.all([
        prisma.webhook.findMany({
          where: { paymentId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit as string),
        }),
        prisma.webhook.count({ where: { paymentId } }),
      ]);

      res.json({
        success: true,
        data: {
          webhooks,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            totalPages: Math.ceil(total / parseInt(limit as string)),
          },
        },
      });
    } catch (error) {
      logger.error('Error getting webhooks by payment:', error);
      throw new AppError('Failed to get webhooks', 500);
    }
  };

  // Get webhook by ID
  getWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const webhook = await prisma.webhook.findUnique({
        where: { id },
        include: {
          payment: true,
        },
      });

      if (!webhook) {
        throw new AppError('Webhook not found', 404);
      }

      res.json({
        success: true,
        data: webhook,
      });
    } catch (error) {
      logger.error('Error getting webhook:', error);
      throw error;
    }
  };

  // Get all webhooks (Admin only)
  getAllWebhooks = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = 1, limit = 10, provider, event, startDate, endDate } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const where: any = {};
      if (provider) where.provider = provider;
      if (event) where.event = event;
      if (startDate) where.createdAt = { gte: new Date(startDate as string) };
      if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate as string) };

      const [webhooks, total] = await Promise.all([
        prisma.webhook.findMany({
          where,
          include: {
            payment: {
              select: {
                id: true,
                orderId: true,
                amount: true,
                currency: true,
                status: true,
                method: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit as string),
        }),
        prisma.webhook.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          webhooks,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            totalPages: Math.ceil(total / parseInt(limit as string)),
          },
        },
      });
    } catch (error) {
      logger.error('Error getting all webhooks:', error);
      throw new AppError('Failed to get webhooks', 500);
    }
  };

  // Get webhook statistics (Admin only)
  getWebhookStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;

      const where: any = {};
      if (startDate) where.createdAt = { gte: new Date(startDate as string) };
      if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate as string) };

      const [totalWebhooks, webhooksByProvider, webhooksByEvent, recentWebhooks] =
        await Promise.all([
          prisma.webhook.count({ where }),
          prisma.webhook.groupBy({
            by: ['provider'],
            where,
            _count: { id: true },
          }),
          prisma.webhook.groupBy({
            by: ['event'],
            where,
            _count: { id: true },
          }),
          prisma.webhook.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              payment: {
                select: {
                  id: true,
                  orderId: true,
                  amount: true,
                  status: true,
                  method: true,
                },
              },
            },
          }),
        ]);

      res.json({
        success: true,
        data: {
          totalWebhooks,
          webhooksByProvider,
          webhooksByEvent,
          recentWebhooks,
          period: {
            startDate,
            endDate,
          },
        },
      });
    } catch (error) {
      logger.error('Error getting webhook statistics:', error);
      throw new AppError('Failed to get webhook statistics', 500);
    }
  };

  // Retry webhook processing (Admin only)
  retryWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const webhook = await prisma.webhook.findUnique({
        where: { id },
        include: { payment: true },
      });

      if (!webhook) {
        throw new AppError('Webhook not found', 404);
      }

      // Create a new webhook entry for retry
      const retryWebhook = await prisma.webhook.create({
        data: {
          paymentId: webhook.paymentId,
          provider: webhook.provider,
          event: `${webhook.event}_RETRY`,
          data: {
            ...webhook.data,
            retryOf: webhook.id,
            retryAt: new Date().toISOString(),
          },
          processedAt: new Date(),
        },
      });

      logger.info('Webhook retry created', {
        originalWebhookId: id,
        retryWebhookId: retryWebhook.id,
      });

      res.json({
        success: true,
        data: {
          message: 'Webhook retry initiated',
          retryWebhookId: retryWebhook.id,
        },
      });
    } catch (error) {
      logger.error('Error retrying webhook:', error);
      throw error;
    }
  };
}
