import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerformanceMetric } from '../entities/performance-metric.entity';
import * as os from 'os';
import * as process from 'process';

export interface MetricData {
  name: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
  timestamp?: Date;
}

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);
  private metricsBuffer: MetricData[] = [];
  private readonly bufferSize = 1000;

  constructor(
    private configService: ConfigService,
    @InjectRepository(PerformanceMetric)
    private metricsRepository: Repository<PerformanceMetric>
  ) {
    this.startSystemMonitoring();
    this.startMetricsFlush();
  }

  // Metrikani buffer'ga qo'shish
  async recordMetric(metricData: MetricData): Promise<void> {
    const metric = {
      ...metricData,
      timestamp: metricData.timestamp || new Date(),
    };

    this.metricsBuffer.push(metric);

    // Buffer to'lsa, ma'lumotlar bazasiga yozish
    if (this.metricsBuffer.length >= this.bufferSize) {
      await this.flushMetrics();
    }
  }

  // HTTP so'rov vaqtini o'lchash
  async recordHttpRequest(
    method: string,
    endpoint: string,
    statusCode: number,
    responseTime: number,
    userId?: string
  ): Promise<void> {
    await this.recordMetric({
      name: 'http_request_duration',
      value: responseTime,
      unit: 'ms',
      tags: {
        method,
        endpoint,
        status_code: statusCode.toString(),
        user_id: userId || 'anonymous',
      },
    });

    await this.recordMetric({
      name: 'http_request_count',
      value: 1,
      unit: 'count',
      tags: {
        method,
        endpoint,
        status_code: statusCode.toString(),
      },
    });
  }

  // Ma'lumotlar bazasi so'rovlarini o'lchash
  async recordDatabaseQuery(
    query: string,
    duration: number,
    table?: string,
    operation?: string
  ): Promise<void> {
    await this.recordMetric({
      name: 'database_query_duration',
      value: duration,
      unit: 'ms',
      tags: {
        table: table || 'unknown',
        operation: operation || 'unknown',
      },
    });

    await this.recordMetric({
      name: 'database_query_count',
      value: 1,
      unit: 'count',
      tags: {
        table: table || 'unknown',
        operation: operation || 'unknown',
      },
    });
  }

  // Xotira ishlatilishini o'lchash
  async recordMemoryUsage(): Promise<void> {
    const memoryUsage = process.memoryUsage();

    await this.recordMetric({
      name: 'memory_heap_used',
      value: memoryUsage.heapUsed,
      unit: 'bytes',
    });

    await this.recordMetric({
      name: 'memory_heap_total',
      value: memoryUsage.heapTotal,
      unit: 'bytes',
    });

    await this.recordMetric({
      name: 'memory_rss',
      value: memoryUsage.rss,
      unit: 'bytes',
    });
  }

  // CPU ishlatilishini o'lchash
  async recordCpuUsage(): Promise<void> {
    const cpuUsage = process.cpuUsage();
    const loadAvg = os.loadavg();

    await this.recordMetric({
      name: 'cpu_usage_user',
      value: cpuUsage.user,
      unit: 'microseconds',
    });

    await this.recordMetric({
      name: 'cpu_usage_system',
      value: cpuUsage.system,
      unit: 'microseconds',
    });

    await this.recordMetric({
      name: 'cpu_load_average_1m',
      value: loadAvg[0],
      unit: 'load',
    });

    await this.recordMetric({
      name: 'cpu_load_average_5m',
      value: loadAvg[1],
      unit: 'load',
    });

    await this.recordMetric({
      name: 'cpu_load_average_15m',
      value: loadAvg[2],
      unit: 'load',
    });
  }

  // Disk ishlatilishini o'lchash
  async recordDiskUsage(): Promise<void> {
    try {
      const stats = await import('fs').then((fs) => fs.promises.stat('/'));

      await this.recordMetric({
        name: 'disk_usage',
        value: stats.size,
        unit: 'bytes',
      });
    } catch (error) {
      this.logger.warn("Disk usage o'lchashda xatolik:", error);
    }
  }

  // Biznes metrikalarini o'lchash
  async recordBusinessMetric(
    name: string,
    value: number,
    unit: string,
    tags?: Record<string, string>
  ): Promise<void> {
    await this.recordMetric({
      name: `business_${name}`,
      value,
      unit,
      tags,
    });
  }

  // E-commerce metrikalar
  async recordOrderMetric(orderId: string, amount: number, status: string): Promise<void> {
    await this.recordMetric({
      name: 'order_created',
      value: 1,
      unit: 'count',
      tags: {
        order_id: orderId,
        status,
      },
    });

    await this.recordMetric({
      name: 'order_amount',
      value: amount,
      unit: 'uzs',
      tags: {
        order_id: orderId,
        status,
      },
    });
  }

  // To'lov metrikalar
  async recordPaymentMetric(
    paymentId: string,
    amount: number,
    provider: string,
    status: string,
    duration: number
  ): Promise<void> {
    await this.recordMetric({
      name: 'payment_processed',
      value: 1,
      unit: 'count',
      tags: {
        payment_id: paymentId,
        provider,
        status,
      },
    });

    await this.recordMetric({
      name: 'payment_amount',
      value: amount,
      unit: 'uzs',
      tags: {
        payment_id: paymentId,
        provider,
        status,
      },
    });

    await this.recordMetric({
      name: 'payment_duration',
      value: duration,
      unit: 'ms',
      tags: {
        payment_id: paymentId,
        provider,
        status,
      },
    });
  }

  // Qidiruv metrikalar
  async recordSearchMetric(query: string, results: number, duration: number): Promise<void> {
    await this.recordMetric({
      name: 'search_query',
      value: 1,
      unit: 'count',
      tags: {
        query_length: query.length.toString(),
        has_results: (results > 0).toString(),
      },
    });

    await this.recordMetric({
      name: 'search_results_count',
      value: results,
      unit: 'count',
    });

    await this.recordMetric({
      name: 'search_duration',
      value: duration,
      unit: 'ms',
    });
  }

  // Metrikalarni ma'lumotlar bazasiga yozish
  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    try {
      const metrics = this.metricsBuffer.splice(0, this.bufferSize);

      const entities = metrics.map((metric) =>
        this.metricsRepository.create({
          name: metric.name,
          value: metric.value,
          unit: metric.unit,
          tags: metric.tags,
          timestamp: metric.timestamp,
        })
      );

      await this.metricsRepository.save(entities);

      this.logger.debug(`${entities.length} ta metrika ma'lumotlar bazasiga yozildi`);
    } catch (error) {
      this.logger.error('Metrikalarni yozishda xatolik:', error);
    }
  }

  // Tizim monitoringini boshlash
  private startSystemMonitoring(): void {
    // Har 30 soniyada tizim metrikalarini yig'ish
    setInterval(async () => {
      try {
        await this.recordMemoryUsage();
        await this.recordCpuUsage();
        await this.recordDiskUsage();
      } catch (error) {
        this.logger.error('Tizim monitoringda xatolik:', error);
      }
    }, 30000);
  }

  // Metrikalarni muntazam yozish
  private startMetricsFlush(): void {
    // Har 10 soniyada buffer'ni tozalash
    setInterval(async () => {
      await this.flushMetrics();
    }, 10000);
  }

  // Metrikalar statistikasi
  async getMetricStats(
    metricName: string,
    startDate: Date,
    endDate: Date,
    groupBy: 'hour' | 'day' | 'week' = 'hour'
  ) {
    const dateFormat = {
      hour: 'YYYY-MM-DD HH24:00:00',
      day: 'YYYY-MM-DD',
      week: 'YYYY-"W"WW',
    };

    const query = this.metricsRepository
      .createQueryBuilder('metric')
      .select([
        `TO_CHAR(metric.timestamp, '${dateFormat[groupBy]}') as period`,
        'AVG(metric.value) as avg_value',
        'MIN(metric.value) as min_value',
        'MAX(metric.value) as max_value',
        'COUNT(*) as count',
      ])
      .where('metric.name = :metricName', { metricName })
      .andWhere('metric.timestamp BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('period')
      .orderBy('period', 'ASC');

    return await query.getRawMany();
  }

  // Top metrikalar
  async getTopMetrics(limit: number = 10) {
    return await this.metricsRepository
      .createQueryBuilder('metric')
      .select(['metric.name', 'AVG(metric.value) as avg_value', 'COUNT(*) as count'])
      .where('metric.timestamp > :since', {
        since: new Date(Date.now() - 24 * 60 * 60 * 1000), // So'nggi 24 soat
      })
      .groupBy('metric.name')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  // Sekin so'rovlar
  async getSlowRequests(threshold: number = 1000, limit: number = 100) {
    return await this.metricsRepository
      .createQueryBuilder('metric')
      .where('metric.name = :name', { name: 'http_request_duration' })
      .andWhere('metric.value > :threshold', { threshold })
      .andWhere('metric.timestamp > :since', {
        since: new Date(Date.now() - 24 * 60 * 60 * 1000),
      })
      .orderBy('metric.value', 'DESC')
      .limit(limit)
      .getMany();
  }

  // Xatolik darajasi
  async getErrorRate(startDate: Date, endDate: Date) {
    const totalRequests = await this.metricsRepository
      .createQueryBuilder('metric')
      .where('metric.name = :name', { name: 'http_request_count' })
      .andWhere('metric.timestamp BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getCount();

    const errorRequests = await this.metricsRepository
      .createQueryBuilder('metric')
      .where('metric.name = :name', { name: 'http_request_count' })
      .andWhere('metric.timestamp BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere("metric.tags->>'status_code' LIKE '4%' OR metric.tags->>'status_code' LIKE '5%'")
      .getCount();

    return {
      totalRequests,
      errorRequests,
      errorRate: totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0,
    };
  }

  // Tizim salomatligi
  async getSystemHealth() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const memoryUsage = await this.metricsRepository
      .createQueryBuilder('metric')
      .select('AVG(metric.value) as avg_value')
      .where('metric.name = :name', { name: 'memory_heap_used' })
      .andWhere('metric.timestamp > :since', { since: oneHourAgo })
      .getRawOne();

    const cpuUsage = await this.metricsRepository
      .createQueryBuilder('metric')
      .select('AVG(metric.value) as avg_value')
      .where('metric.name = :name', { name: 'cpu_load_average_1m' })
      .andWhere('metric.timestamp > :since', { since: oneHourAgo })
      .getRawOne();

    const errorRate = await this.getErrorRate(oneHourAgo, now);

    return {
      memory: {
        usage: memoryUsage?.avg_value || 0,
        status: (memoryUsage?.avg_value || 0) > 1000000000 ? 'warning' : 'ok', // 1GB
      },
      cpu: {
        load: cpuUsage?.avg_value || 0,
        status: (cpuUsage?.avg_value || 0) > 0.8 ? 'warning' : 'ok',
      },
      errorRate: {
        rate: errorRate.errorRate,
        status: errorRate.errorRate > 5 ? 'critical' : errorRate.errorRate > 1 ? 'warning' : 'ok',
      },
    };
  }

  // Metrikalarni tozalash
  async cleanupOldMetrics(days: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.metricsRepository
      .createQueryBuilder()
      .delete()
      .where('timestamp < :cutoffDate', { cutoffDate })
      .execute();

    this.logger.log(`${result.affected} ta eski metrika o'chirildi`);
  }

  // Prometheus formatida metrikalar
  async getPrometheusMetrics(): Promise<string> {
    const metrics = await this.metricsRepository
      .createQueryBuilder('metric')
      .where('metric.timestamp > :since', {
        since: new Date(Date.now() - 5 * 60 * 1000), // So'nggi 5 daqiqa
      })
      .getMany();

    let prometheusOutput = '';

    // Metrikalarni guruhlab Prometheus formatiga o'tkazish
    const groupedMetrics = metrics.reduce(
      (acc, metric) => {
        if (!acc[metric.name]) {
          acc[metric.name] = [];
        }
        acc[metric.name].push(metric);
        return acc;
      },
      {} as Record<string, PerformanceMetric[]>
    );

    for (const [name, metricList] of Object.entries(groupedMetrics)) {
      prometheusOutput += `# HELP ${name} ${name} metric\n`;
      prometheusOutput += `# TYPE ${name} gauge\n`;

      for (const metric of metricList) {
        const labels = metric.tags
          ? Object.entries(metric.tags)
              .map(([key, value]) => `${key}="${value}"`)
              .join(',')
          : '';

        prometheusOutput += `${name}{${labels}} ${metric.value}\n`;
      }
    }

    return prometheusOutput;
  }
}
