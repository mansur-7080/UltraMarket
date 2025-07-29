import { Request, Response } from 'express';
export declare class NotificationController {
    private notificationService;
    constructor();
    /**
     * Send single notification
     */
    sendNotification(req: Request, res: Response): Promise<void>;
    /**
     * Send bulk notifications
     */
    sendBulkNotifications(req: Request, res: Response): Promise<void>;
    /**
     * Schedule notification
     */
    scheduleNotification(req: Request, res: Response): Promise<void>;
    /**
     * Get user notifications
     */
    getUserNotifications(req: Request, res: Response): Promise<void>;
    /**
     * Mark notification as read
     */
    markAsRead(req: Request, res: Response): Promise<void>;
    /**
     * Mark all notifications as read
     */
    markAllAsRead(req: Request, res: Response): Promise<void>;
    /**
     * Delete notification
     */
    deleteNotification(req: Request, res: Response): Promise<void>;
    /**
     * Get notification preferences
     */
    getPreferences(req: Request, res: Response): Promise<void>;
    /**
     * Update notification preferences
     */
    updatePreferences(req: Request, res: Response): Promise<void>;
    /**
     * Get notification templates
     */
    getTemplates(req: Request, res: Response): Promise<void>;
    /**
     * Create notification template
     */
    createTemplate(req: Request, res: Response): Promise<void>;
    /**
     * Update notification template
     */
    updateTemplate(req: Request, res: Response): Promise<void>;
    /**
     * Delete notification template
     */
    deleteTemplate(req: Request, res: Response): Promise<void>;
    /**
     * Get notification analytics
     */
    getAnalytics(req: Request, res: Response): Promise<void>;
    /**
     * Get service health
     */
    getHealth(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=notification.controller.d.ts.map