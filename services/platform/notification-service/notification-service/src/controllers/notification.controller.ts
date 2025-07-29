import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { NotificationService } from '../services/notification.service';
import { logger } from '@ultramarket/shared';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Send single notification
   */
  async sendNotification(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      const notificationData = req.body;
      const result = await this.notificationService.sendNotification(notificationData);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Notification sent successfully',
      });

      logger.info('Notification sent', {
        userId: notificationData.userId,
        type: notificationData.type,
        channel: notificationData.channel,
      });
    } catch (error) {
      logger.error('Failed to send notification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        body: req.body,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to send notification',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      const { notifications } = req.body;

      if (!Array.isArray(notifications) || notifications.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Notifications array is required',
        });
        return;
      }

      const results = await this.notificationService.sendBulkNotifications(notifications);

      res.status(200).json({
        success: true,
        data: results,
        message: `Bulk notifications processed: ${results.successful} successful, ${results.failed} failed`,
      });

      logger.info('Bulk notifications sent', {
        total: notifications.length,
        successful: results.successful,
        failed: results.failed,
      });
    } catch (error) {
      logger.error('Failed to send bulk notifications', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to send bulk notifications',
      });
    }
  }

  /**
   * Schedule notification
   */
  async scheduleNotification(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      const notificationData = req.body;
      const result = await this.notificationService.scheduleNotification(notificationData);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Notification scheduled successfully',
      });

      logger.info('Notification scheduled', {
        userId: notificationData.userId,
        scheduledFor: notificationData.scheduledFor,
      });
    } catch (error) {
      logger.error('Failed to schedule notification', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to schedule notification',
      });
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20, status, type } = req.query;

      const result = await this.notificationService.getUserNotifications(userId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
        type: type as string,
      });

      res.status(200).json({
        success: true,
        data: result,
      });

      logger.debug('User notifications retrieved', {
        userId,
        page,
        limit,
        total: result.total,
      });
    } catch (error) {
      logger.error('Failed to get user notifications', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.params.userId,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get user notifications',
      });
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { notificationId } = req.params;
      const userId = (req as any).user?.id;

      await this.notificationService.markAsRead(notificationId, userId);

      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
      });

      logger.debug('Notification marked as read', {
        notificationId,
        userId,
      });
    } catch (error) {
      logger.error('Failed to mark notification as read', {
        error: error instanceof Error ? error.message : 'Unknown error',
        notificationId: req.params.notificationId,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to mark notification as read',
      });
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const result = await this.notificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        data: result,
        message: 'All notifications marked as read',
      });

      logger.debug('All notifications marked as read', {
        userId,
        count: result.count,
      });
    } catch (error) {
      logger.error('Failed to mark all notifications as read', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (req as any).user?.id,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to mark all notifications as read',
      });
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const { notificationId } = req.params;
      const userId = (req as any).user?.id;

      await this.notificationService.deleteNotification(notificationId, userId);

      res.status(200).json({
        success: true,
        message: 'Notification deleted successfully',
      });

      logger.debug('Notification deleted', {
        notificationId,
        userId,
      });
    } catch (error) {
      logger.error('Failed to delete notification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        notificationId: req.params.notificationId,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to delete notification',
      });
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const preferences = await this.notificationService.getPreferences(userId);

      res.status(200).json({
        success: true,
        data: preferences,
      });

      logger.debug('Notification preferences retrieved', { userId });
    } catch (error) {
      logger.error('Failed to get notification preferences', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (req as any).user?.id,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get notification preferences',
      });
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      const userId = (req as any).user?.id;
      const preferences = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const result = await this.notificationService.updatePreferences(userId, preferences);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Notification preferences updated successfully',
      });

      logger.info('Notification preferences updated', {
        userId,
        preferences: Object.keys(preferences),
      });
    } catch (error) {
      logger.error('Failed to update notification preferences', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: (req as any).user?.id,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to update notification preferences',
      });
    }
  }

  /**
   * Get notification templates
   */
  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const { type, channel, active } = req.query;

      const templates = await this.notificationService.getTemplates({
        type: type as string,
        channel: channel as string,
        active: active === 'true',
      });

      res.status(200).json({
        success: true,
        data: templates,
      });

      logger.debug('Notification templates retrieved', {
        count: templates.length,
        filters: { type, channel, active },
      });
    } catch (error) {
      logger.error('Failed to get notification templates', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get notification templates',
      });
    }
  }

  /**
   * Create notification template
   */
  async createTemplate(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      const templateData = req.body;
      const result = await this.notificationService.createTemplate(templateData);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Notification template created successfully',
      });

      logger.info('Notification template created', {
        templateId: result.id,
        name: result.name,
        type: result.type,
      });
    } catch (error) {
      logger.error('Failed to create notification template', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to create notification template',
      });
    }
  }

  /**
   * Update notification template
   */
  async updateTemplate(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      const { templateId } = req.params;
      const templateData = req.body;

      const result = await this.notificationService.updateTemplate(templateId, templateData);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Notification template updated successfully',
      });

      logger.info('Notification template updated', {
        templateId,
        updates: Object.keys(templateData),
      });
    } catch (error) {
      logger.error('Failed to update notification template', {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateId: req.params.templateId,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to update notification template',
      });
    }
  }

  /**
   * Delete notification template
   */
  async deleteTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.params;

      await this.notificationService.deleteTemplate(templateId);

      res.status(200).json({
        success: true,
        message: 'Notification template deleted successfully',
      });

      logger.info('Notification template deleted', { templateId });
    } catch (error) {
      logger.error('Failed to delete notification template', {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateId: req.params.templateId,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to delete notification template',
      });
    }
  }

  /**
   * Get notification analytics
   */
  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate, type, channel } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: 'startDate and endDate are required',
        });
        return;
      }

      const analytics = await this.notificationService.getAnalytics({
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
        type: type as string,
        channel: channel as string,
      });

      res.status(200).json({
        success: true,
        data: analytics,
      });

      logger.debug('Notification analytics retrieved', {
        startDate,
        endDate,
        type,
        channel,
      });
    } catch (error) {
      logger.error('Failed to get notification analytics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get notification analytics',
      });
    }
  }

  /**
   * Get service health
   */
  async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await this.notificationService.getHealthStatus();

      res.status(200).json({
        success: true,
        data: health,
      });
    } catch (error) {
      logger.error('Failed to get service health', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get service health',
      });
    }
  }
}
