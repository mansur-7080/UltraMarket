import { Controller, Post, Get, Body, Query, Param, HttpStatus, HttpCode } from '@nestjs/common';
import { NotificationService, NotificationData } from '../services/notification.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bitta notification yuborish' })
  @ApiResponse({ status: 200, description: 'Notification muvaffaqiyatli yuborildi' })
  async sendNotification(@Body() notificationData: NotificationData) {
    await this.notificationService.sendNotification(notificationData);
    return { message: 'Notification yuborildi' };
  }

  @Post('send-bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Ko'p notificationlarni yuborish" })
  @ApiResponse({ status: 200, description: 'Bulk notifications yuborildi' })
  async sendBulkNotifications(@Body() notifications: NotificationData[]) {
    await this.notificationService.sendBulkNotifications(notifications);
    return { message: 'Bulk notifications yuborildi' };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Notification statistikasi' })
  @ApiResponse({ status: 200, description: 'Notification statistikasi' })
  async getNotificationStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return await this.notificationService.getNotificationStats(start, end);
  }

  @Get('failed')
  @ApiOperation({ summary: 'Muvaffaqiyatsiz notificationlar' })
  @ApiResponse({ status: 200, description: "Muvaffaqiyatsiz notificationlar ro'yxati" })
  async getFailedNotifications(@Query('limit') limit: number = 100) {
    return await this.notificationService.getFailedNotifications(limit);
  }

  @Post('retry-failed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Muvaffaqiyatsiz notificationlarni qayta yuborish' })
  @ApiResponse({ status: 200, description: 'Muvaffaqiyatsiz notificationlar qayta yuborildi' })
  async retryFailedNotifications() {
    await this.notificationService.retryFailedNotifications();
    return { message: 'Muvaffaqiyatsiz notificationlar qayta yuborildi' };
  }

  @Post('email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Email yuborish' })
  @ApiResponse({ status: 200, description: 'Email yuborildi' })
  async sendEmail(
    @Body() emailData: { recipient: string; template: string; data: Record<string, any> }
  ) {
    await this.notificationService.sendNotification({
      type: 'email',
      recipient: emailData.recipient,
      template: emailData.template,
      data: emailData.data,
    });
    return { message: 'Email yuborildi' };
  }

  @Post('sms')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'SMS yuborish' })
  @ApiResponse({ status: 200, description: 'SMS yuborildi' })
  async sendSMS(
    @Body() smsData: { recipient: string; template: string; data: Record<string, any> }
  ) {
    await this.notificationService.sendNotification({
      type: 'sms',
      recipient: smsData.recipient,
      template: smsData.template,
      data: smsData.data,
    });
    return { message: 'SMS yuborildi' };
  }

  @Post('push')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Push notification yuborish' })
  @ApiResponse({ status: 200, description: 'Push notification yuborildi' })
  async sendPushNotification(
    @Body() pushData: { recipient: string; template: string; data: Record<string, any> }
  ) {
    await this.notificationService.sendNotification({
      type: 'push',
      recipient: pushData.recipient,
      template: pushData.template,
      data: pushData.data,
    });
    return { message: 'Push notification yuborildi' };
  }
}
