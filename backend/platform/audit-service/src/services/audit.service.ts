import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { ConfigService } from '@nestjs/config';

export interface AuditData {
  userId?: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
    private configService: ConfigService
  ) {}

  async logActivity(auditData: AuditData): Promise<void> {
    try {
      const auditLog = this.auditRepository.create({
        userId: auditData.userId,
        userEmail: auditData.userEmail,
        action: auditData.action,
        resource: auditData.resource,
        resourceId: auditData.resourceId,
        oldValues: auditData.oldValues,
        newValues: auditData.newValues,
        ipAddress: auditData.ipAddress,
        userAgent: auditData.userAgent,
        metadata: auditData.metadata,
        severity: auditData.severity || 'medium',
        timestamp: new Date(),
      });

      await this.auditRepository.save(auditLog);

      // Critical harakatlar uchun real-time alert
      if (auditData.severity === 'critical') {
        await this.sendCriticalAlert(auditLog);
      }

      this.logger.log(`Audit log yaratildi: ${auditData.action} - ${auditData.resource}`);
    } catch (error) {
      this.logger.error('Audit log yaratishda xatolik:', error);
      // Audit log xatoligi tizimni to'xtatmasligi kerak
    }
  }

  // Foydalanuvchi harakatlari
  async logUserActivity(
    userId: string,
    action: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logActivity({
      userId,
      action,
      resource: 'user',
      resourceId: userId,
      metadata,
      severity: 'low',
    });
  }

  // Tizim harakatlari
  async logSystemActivity(
    action: string,
    resource: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logActivity({
      action,
      resource,
      metadata,
      severity: 'medium',
    });
  }

  // Xavfsizlik hodisalari
  async logSecurityEvent(
    action: string,
    userId?: string,
    ipAddress?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logActivity({
      userId,
      action,
      resource: 'security',
      ipAddress,
      metadata,
      severity: 'high',
    });
  }

  // Ma'lumotlar bazasi o'zgarishlari
  async logDataChange(
    userId: string,
    resource: string,
    resourceId: string,
    oldValues: Record<string, any>,
    newValues: Record<string, any>
  ): Promise<void> {
    await this.logActivity({
      userId,
      action: 'update',
      resource,
      resourceId,
      oldValues,
      newValues,
      severity: 'medium',
    });
  }

  // To'lov harakatlari
  async logPaymentActivity(
    userId: string,
    action: string,
    paymentId: string,
    amount: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logActivity({
      userId,
      action,
      resource: 'payment',
      resourceId: paymentId,
      metadata: {
        ...metadata,
        amount,
        currency: 'UZS',
      },
      severity: 'high',
    });
  }

  // Admin harakatlari
  async logAdminActivity(
    adminId: string,
    action: string,
    resource: string,
    resourceId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logActivity({
      userId: adminId,
      action,
      resource,
      resourceId,
      metadata,
      severity: 'high',
    });
  }

  // API so'rovlari
  async logApiRequest(
    userId: string,
    method: string,
    endpoint: string,
    statusCode: number,
    responseTime: number,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await this.logActivity({
      userId,
      action: `${method} ${endpoint}`,
      resource: 'api',
      ipAddress,
      userAgent,
      metadata: {
        statusCode,
        responseTime,
        method,
        endpoint,
      },
      severity: statusCode >= 400 ? 'medium' : 'low',
    });
  }

  // Xatoliklar
  async logError(
    error: Error,
    context: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logActivity({
      userId,
      action: 'error',
      resource: 'system',
      metadata: {
        ...metadata,
        error: error.message,
        stack: error.stack,
        context,
      },
      severity: 'high',
    });
  }

  // Audit loglarni olish
  async getAuditLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const query = this.auditRepository.createQueryBuilder('audit');

    if (filters.userId) {
      query.andWhere('audit.userId = :userId', { userId: filters.userId });
    }

    if (filters.action) {
      query.andWhere('audit.action ILIKE :action', { action: `%${filters.action}%` });
    }

    if (filters.resource) {
      query.andWhere('audit.resource = :resource', { resource: filters.resource });
    }

    if (filters.severity) {
      query.andWhere('audit.severity = :severity', { severity: filters.severity });
    }

    if (filters.startDate) {
      query.andWhere('audit.timestamp >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query.andWhere('audit.timestamp <= :endDate', { endDate: filters.endDate });
    }

    query.orderBy('audit.timestamp', 'DESC');

    if (filters.limit) {
      query.take(filters.limit);
    }

    if (filters.offset) {
      query.skip(filters.offset);
    }

    const [logs, total] = await query.getManyAndCount();

    return {
      logs,
      total,
      limit: filters.limit || total,
      offset: filters.offset || 0,
    };
  }

  // Statistika
  async getAuditStats(startDate: Date, endDate: Date) {
    const stats = await this.auditRepository
      .createQueryBuilder('audit')
      .select(['audit.action', 'audit.resource', 'audit.severity', 'COUNT(*) as count'])
      .where('audit.timestamp BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('audit.action, audit.resource, audit.severity')
      .getRawMany();

    return stats;
  }

  // Foydalanuvchi harakatlari statistikasi
  async getUserActivityStats(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.auditRepository
      .createQueryBuilder('audit')
      .select(['DATE(audit.timestamp) as date', 'COUNT(*) as count'])
      .where('audit.userId = :userId', { userId })
      .andWhere('audit.timestamp >= :startDate', { startDate })
      .groupBy('DATE(audit.timestamp)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return stats;
  }

  // Xavfsizlik hodisalari
  async getSecurityEvents(hours: number = 24) {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);

    return await this.auditRepository.find({
      where: {
        resource: 'security',
        timestamp: startDate,
      },
      order: { timestamp: 'DESC' },
    });
  }

  // Critical alertlar
  private async sendCriticalAlert(auditLog: AuditLog): Promise<void> {
    try {
      // Telegram bot orqali alert yuborish
      const telegramBotToken = this.configService.get('TELEGRAM_BOT_TOKEN');
      const telegramChatId = this.configService.get('TELEGRAM_CHAT_ID');

      if (telegramBotToken && telegramChatId) {
        const message =
          `🚨 *CRITICAL ALERT*\n\n` +
          `Action: ${auditLog.action}\n` +
          `Resource: ${auditLog.resource}\n` +
          `User: ${auditLog.userId || 'System'}\n` +
          `Time: ${auditLog.timestamp.toISOString()}\n` +
          `IP: ${auditLog.ipAddress || 'N/A'}`;

        await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text: message,
            parse_mode: 'Markdown',
          }),
        });
      }
    } catch (error) {
      this.logger.error('Critical alert yuborishda xatolik:', error);
    }
  }

  // Ma'lumotlarni tozalash (eski loglarni o'chirish)
  async cleanupOldLogs(days: number = 90): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.auditRepository
      .createQueryBuilder()
      .delete()
      .where('timestamp < :cutoffDate', { cutoffDate })
      .execute();

    this.logger.log(`${result.affected} ta eski audit log o'chirildi`);
  }

  // Export functionality
  async exportAuditLogs(filters: any, format: 'csv' | 'json' = 'csv'): Promise<string> {
    const { logs } = await this.getAuditLogs(filters);

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }

    // CSV format
    const headers = [
      'Timestamp',
      'User ID',
      'Action',
      'Resource',
      'Resource ID',
      'IP Address',
      'Severity',
    ];

    const csvRows = [
      headers.join(','),
      ...logs.map((log) =>
        [
          log.timestamp.toISOString(),
          log.userId || '',
          log.action,
          log.resource,
          log.resourceId || '',
          log.ipAddress || '',
          log.severity,
        ].join(',')
      ),
    ];

    return csvRows.join('\n');
  }
}
