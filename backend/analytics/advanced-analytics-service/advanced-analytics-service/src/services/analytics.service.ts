import { ClickHouseClient } from '@clickhouse/client';
import { logger } from '@ultramarket/common';
import { createError } from '@ultramarket/common';

export interface AnalyticsEvent {
  eventType: string;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  properties: Record<string, any>;
  context: {
    userAgent: string;
    ip: string;
    page: {
      url: string;
      title: string;
      referrer?: string;
    };
    device: {
      type: 'mobile' | 'tablet' | 'desktop';
      os: string;
      browser: string;
    };
    location?: {
      country: string;
      city: string;
      region: string;
    };
  };
}

export interface MetricQuery {
  metric: string;
  filters?: Record<string, any>;
  groupBy?: string[];
  timeRange: {
    start: Date;
    end: Date;
  };
  interval?: 'hour' | 'day' | 'week' | 'month';
}

export interface DashboardData {
  overview: {
    totalUsers: number;
    totalSessions: number;
    totalPageViews: number;
    totalRevenue: number;
    conversionRate: number;
    averageOrderValue: number;
    bounceRate: number;
    averageSessionDuration: number;
  };
  trends: {
    userGrowth: Array<{ date: string; value: number }>;
    revenueGrowth: Array<{ date: string; value: number }>;
    sessionTrends: Array<{ date: string; value: number }>;
  };
  segments: {
    topPages: Array<{ page: string; views: number; bounceRate: number }>;
    topProducts: Array<{ productId: string; views: number; purchases: number }>;
    userSources: Array<{ source: string; users: number; conversionRate: number }>;
    deviceTypes: Array<{ device: string; sessions: number; percentage: number }>;
  };
  realTime: {
    activeUsers: number;
    currentSessions: number;
    topPages: Array<{ page: string; activeUsers: number }>;
    recentEvents: Array<{ event: string; timestamp: Date; userId?: string }>;
  };
}

export interface FunnelAnalysis {
  name: string;
  steps: Array<{
    name: string;
    users: number;
    conversionRate: number;
    dropoffRate: number;
  }>;
  totalUsers: number;
  overallConversionRate: number;
}

export interface CohortAnalysis {
  cohorts: Array<{
    period: string;
    size: number;
    retention: number[];
  }>;
  averageRetention: number[];
}

export interface UserSegment {
  id: string;
  name: string;
  description: string;
  criteria: Record<string, any>;
  userCount: number;
  conversionRate: number;
  avgLifetimeValue: number;
}

export class AnalyticsService {
  private clickhouse: ClickHouseClient;

  constructor() {
    this.clickhouse = new ClickHouseClient({
      host: process.env.CLICKHOUSE_HOST || 'localhost',
      port: parseInt(process.env.CLICKHOUSE_PORT || '8123'),
      username: process.env.CLICKHOUSE_USERNAME || 'default',
      password: process.env.CLICKHOUSE_PASSWORD || '',
      database: process.env.CLICKHOUSE_DATABASE || 'analytics'
    });
  }

  /**
   * Track analytics event
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      await this.clickhouse.insert({
        table: 'events',
        values: [{
          event_type: event.eventType,
          user_id: event.userId || '',
          session_id: event.sessionId,
          timestamp: event.timestamp,
          properties: JSON.stringify(event.properties),
          user_agent: event.context.userAgent,
          ip_address: event.context.ip,
          page_url: event.context.page.url,
          page_title: event.context.page.title,
          page_referrer: event.context.page.referrer || '',
          device_type: event.context.device.type,
          device_os: event.context.device.os,
          device_browser: event.context.device.browser,
          location_country: event.context.location?.country || '',
          location_city: event.context.location?.city || '',
          location_region: event.context.location?.region || ''
        }],
        format: 'JSONEachRow'
      });

      logger.debug('Analytics event tracked', { 
        eventType: event.eventType, 
        userId: event.userId,
        sessionId: event.sessionId
      });
    } catch (error) {
      logger.error('Failed to track analytics event', error);
      throw createError(500, 'Analytics tracking failed');
    }
  }

  /**
   * Track multiple events in batch
   */
  async trackEventsBatch(events: AnalyticsEvent[]): Promise<void> {
    try {
      if (events.length === 0) return;

      const values = events.map(event => ({
        event_type: event.eventType,
        user_id: event.userId || '',
        session_id: event.sessionId,
        timestamp: event.timestamp,
        properties: JSON.stringify(event.properties),
        user_agent: event.context.userAgent,
        ip_address: event.context.ip,
        page_url: event.context.page.url,
        page_title: event.context.page.title,
        page_referrer: event.context.page.referrer || '',
        device_type: event.context.device.type,
        device_os: event.context.device.os,
        device_browser: event.context.device.browser,
        location_country: event.context.location?.country || '',
        location_city: event.context.location?.city || '',
        location_region: event.context.location?.region || ''
      }));

      await this.clickhouse.insert({
        table: 'events',
        values,
        format: 'JSONEachRow'
      });

      logger.info('Analytics events batch tracked', { count: events.length });
    } catch (error) {
      logger.error('Failed to track analytics events batch', error);
      throw createError(500, 'Batch analytics tracking failed');
    }
  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboard(timeRange: { start: Date; end: Date }): Promise<DashboardData> {
    try {
      const [overview, trends, segments, realTime] = await Promise.all([
        this.getOverviewMetrics(timeRange),
        this.getTrendMetrics(timeRange),
        this.getSegmentMetrics(timeRange),
        this.getRealTimeMetrics()
      ]);

      return {
        overview,
        trends,
        segments,
        realTime
      };
    } catch (error) {
      logger.error('Failed to get dashboard data', error);
      throw createError(500, 'Dashboard data retrieval failed');
    }
  }

  /**
   * Perform funnel analysis
   */
  async getFunnelAnalysis(
    steps: string[],
    timeRange: { start: Date; end: Date },
    filters?: Record<string, any>
  ): Promise<FunnelAnalysis> {
    try {
      const filterClause = this.buildFilterClause(filters);
      
      const query = `
        WITH funnel_events AS (
          SELECT 
            user_id,
            event_type,
            timestamp,
            ROW_NUMBER() OVER (PARTITION BY user_id, event_type ORDER BY timestamp) as rn
          FROM events 
          WHERE event_type IN (${steps.map(step => `'${step}'`).join(',')})
            AND timestamp BETWEEN '${timeRange.start.toISOString()}' AND '${timeRange.end.toISOString()}'
            ${filterClause ? `AND ${filterClause}` : ''}
            AND rn = 1
        ),
        step_users AS (
          SELECT 
            event_type,
            COUNT(DISTINCT user_id) as users
          FROM funnel_events
          GROUP BY event_type
        )
        SELECT 
          event_type,
          users,
          users / LAG(users, 1, users) OVER (ORDER BY FIELD(event_type, ${steps.map(step => `'${step}'`).join(',')})) as conversion_rate
        FROM step_users
        ORDER BY FIELD(event_type, ${steps.map(step => `'${step}'`).join(',')})
      `;

      const result = await this.clickhouse.query({
        query,
        format: 'JSONEachRow'
      });

      const data = await result.json() as Array<{
        event_type: string;
        users: number;
        conversion_rate: number;
      }>;

      const totalUsers = data[0]?.users || 0;
      const overallConversionRate = data.length > 0 ? 
        (data[data.length - 1].users / totalUsers) : 0;

      const funnelSteps = data.map((row, index) => ({
        name: row.event_type,
        users: row.users,
        conversionRate: row.conversion_rate,
        dropoffRate: index > 0 ? 1 - row.conversion_rate : 0
      }));

      return {
        name: 'Conversion Funnel',
        steps: funnelSteps,
        totalUsers,
        overallConversionRate
      };
    } catch (error) {
      logger.error('Failed to get funnel analysis', error);
      throw createError(500, 'Funnel analysis failed');
    }
  }

  /**
   * Perform cohort analysis
   */
  async getCohortAnalysis(
    timeRange: { start: Date; end: Date },
    retentionEvent: string = 'page_view'
  ): Promise<CohortAnalysis> {
    try {
      const query = `
        WITH user_cohorts AS (
          SELECT 
            user_id,
            toStartOfMonth(MIN(timestamp)) as cohort_month,
            MIN(timestamp) as first_seen
          FROM events
          WHERE timestamp BETWEEN '${timeRange.start.toISOString()}' AND '${timeRange.end.toISOString()}'
            AND user_id != ''
          GROUP BY user_id
        ),
        cohort_data AS (
          SELECT 
            c.cohort_month,
            COUNT(DISTINCT c.user_id) as cohort_size,
            arrayMap(x -> x + 1, range(12)) as periods,
            arrayMap(period -> (
              SELECT COUNT(DISTINCT e.user_id)
              FROM events e
              WHERE e.user_id = c.user_id
                AND e.event_type = '${retentionEvent}'
                AND e.timestamp BETWEEN 
                  addMonths(c.cohort_month, period) AND 
                  addMonths(c.cohort_month, period + 1)
            ), range(12)) as retention_counts
          FROM user_cohorts c
          GROUP BY c.cohort_month
        )
        SELECT 
          cohort_month,
          cohort_size,
          arrayMap((x, y) -> x / y, retention_counts, arrayResize([cohort_size], 12, cohort_size)) as retention_rates
        FROM cohort_data
        ORDER BY cohort_month
      `;

      const result = await this.clickhouse.query({
        query,
        format: 'JSONEachRow'
      });

      const data = await result.json() as Array<{
        cohort_month: string;
        cohort_size: number;
        retention_rates: number[];
      }>;

      const cohorts = data.map(row => ({
        period: row.cohort_month,
        size: row.cohort_size,
        retention: row.retention_rates
      }));

      // Calculate average retention across all cohorts
      const averageRetention = Array.from({ length: 12 }, (_, i) => {
        const values = cohorts.map(c => c.retention[i]).filter(v => v > 0);
        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      });

      return {
        cohorts,
        averageRetention
      };
    } catch (error) {
      logger.error('Failed to get cohort analysis', error);
      throw createError(500, 'Cohort analysis failed');
    }
  }

  /**
   * Get user segments
   */
  async getUserSegments(): Promise<UserSegment[]> {
    try {
      // This would typically come from a segments configuration
      const segments = [
        {
          id: 'high-value',
          name: 'High Value Customers',
          description: 'Users with high lifetime value',
          criteria: { totalSpent: { $gte: 1000 } }
        },
        {
          id: 'frequent-buyers',
          name: 'Frequent Buyers',
          description: 'Users who purchase regularly',
          criteria: { orderCount: { $gte: 5 } }
        },
        {
          id: 'mobile-users',
          name: 'Mobile Users',
          description: 'Users primarily on mobile devices',
          criteria: { deviceType: 'mobile' }
        }
      ];

      const segmentData = await Promise.all(
        segments.map(async segment => {
          const filterClause = this.buildSegmentFilter(segment.criteria);
          
          const query = `
            SELECT 
              COUNT(DISTINCT user_id) as user_count,
              AVG(total_spent) as avg_lifetime_value,
              AVG(conversion_rate) as conversion_rate
            FROM (
              SELECT 
                user_id,
                SUM(JSONExtractFloat(properties, 'orderValue')) as total_spent,
                COUNT(CASE WHEN event_type = 'purchase' THEN 1 END) / 
                COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) as conversion_rate
              FROM events
              WHERE user_id != ''
                ${filterClause ? `AND ${filterClause}` : ''}
              GROUP BY user_id
            ) user_metrics
          `;

          const result = await this.clickhouse.query({
            query,
            format: 'JSONEachRow'
          });

          const data = await result.json() as Array<{
            user_count: number;
            avg_lifetime_value: number;
            conversion_rate: number;
          }>;

          const metrics = data[0] || { 
            user_count: 0, 
            avg_lifetime_value: 0, 
            conversion_rate: 0 
          };

          return {
            ...segment,
            userCount: metrics.user_count,
            conversionRate: metrics.conversion_rate,
            avgLifetimeValue: metrics.avg_lifetime_value
          };
        })
      );

      return segmentData;
    } catch (error) {
      logger.error('Failed to get user segments', error);
      throw createError(500, 'User segments retrieval failed');
    }
  }

  /**
   * Get custom metric data
   */
  async getMetric(query: MetricQuery): Promise<any> {
    try {
      const { metric, filters, groupBy, timeRange, interval } = query;
      
      const filterClause = this.buildFilterClause(filters);
      const groupByClause = groupBy ? groupBy.join(', ') : '';
      const intervalClause = this.getIntervalClause(interval);

      const sqlQuery = `
        SELECT 
          ${intervalClause ? `${intervalClause} as period,` : ''}
          ${groupByClause ? `${groupByClause},` : ''}
          ${this.getMetricAggregation(metric)} as value
        FROM events
        WHERE timestamp BETWEEN '${timeRange.start.toISOString()}' AND '${timeRange.end.toISOString()}'
          ${filterClause ? `AND ${filterClause}` : ''}
        ${groupByClause || intervalClause ? `GROUP BY ${[intervalClause, groupByClause].filter(Boolean).join(', ')}` : ''}
        ORDER BY ${intervalClause || groupByClause || '1'}
      `;

      const result = await this.clickhouse.query({
        query: sqlQuery,
        format: 'JSONEachRow'
      });

      return await result.json();
    } catch (error) {
      logger.error('Failed to get metric data', error);
      throw createError(500, 'Metric query failed');
    }
  }

  /**
   * Get real-time analytics
   */
  async getRealTimeMetrics(): Promise<any> {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const query = `
        SELECT 
          COUNT(DISTINCT user_id) as active_users,
          COUNT(DISTINCT session_id) as current_sessions,
          groupArray((page_url, COUNT(*))) as top_pages,
          groupArray((event_type, timestamp, user_id)) as recent_events
        FROM events
        WHERE timestamp >= '${fiveMinutesAgo.toISOString()}'
      `;

      const result = await this.clickhouse.query({
        query,
        format: 'JSONEachRow'
      });

      const data = await result.json() as Array<{
        active_users: number;
        current_sessions: number;
        top_pages: Array<[string, number]>;
        recent_events: Array<[string, string, string]>;
      }>;

      const metrics = data[0] || {
        active_users: 0,
        current_sessions: 0,
        top_pages: [],
        recent_events: []
      };

      return {
        activeUsers: metrics.active_users,
        currentSessions: metrics.current_sessions,
        topPages: metrics.top_pages.map(([page, count]) => ({
          page,
          activeUsers: count
        })),
        recentEvents: metrics.recent_events.map(([event, timestamp, userId]) => ({
          event,
          timestamp: new Date(timestamp),
          userId: userId || undefined
        }))
      };
    } catch (error) {
      logger.error('Failed to get real-time metrics', error);
      throw createError(500, 'Real-time metrics failed');
    }
  }

  /**
   * Generate analytics report
   */
  async generateReport(
    type: 'daily' | 'weekly' | 'monthly',
    date: Date,
    metrics: string[]
  ): Promise<any> {
    try {
      const timeRange = this.getReportTimeRange(type, date);
      
      const reportData = await Promise.all(
        metrics.map(metric => this.getMetric({
          metric,
          timeRange,
          interval: type === 'daily' ? 'hour' : type === 'weekly' ? 'day' : 'week'
        }))
      );

      const report = {
        type,
        date: date.toISOString(),
        timeRange,
        metrics: Object.fromEntries(
          metrics.map((metric, index) => [metric, reportData[index]])
        ),
        generatedAt: new Date().toISOString()
      };

      logger.info('Analytics report generated', { type, date, metrics });
      return report;
    } catch (error) {
      logger.error('Failed to generate analytics report', error);
      throw createError(500, 'Report generation failed');
    }
  }

  /**
   * Helper methods
   */
  private async getOverviewMetrics(timeRange: { start: Date; end: Date }): Promise<any> {
    const query = `
      SELECT 
        COUNT(DISTINCT user_id) as total_users,
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(*) as total_page_views,
        SUM(JSONExtractFloat(properties, 'orderValue')) as total_revenue,
        COUNT(CASE WHEN event_type = 'purchase' THEN 1 END) / COUNT(DISTINCT user_id) as conversion_rate,
        AVG(JSONExtractFloat(properties, 'orderValue')) as average_order_value,
        COUNT(CASE WHEN JSONExtractInt(properties, 'pageViews') = 1 THEN 1 END) / COUNT(DISTINCT session_id) as bounce_rate,
        AVG(JSONExtractInt(properties, 'sessionDuration')) as average_session_duration
      FROM events
      WHERE timestamp BETWEEN '${timeRange.start.toISOString()}' AND '${timeRange.end.toISOString()}'
    `;

    const result = await this.clickhouse.query({ query, format: 'JSONEachRow' });
    const data = await result.json();
    return data[0] || {};
  }

  private async getTrendMetrics(timeRange: { start: Date; end: Date }): Promise<any> {
    const query = `
      SELECT 
        toDate(timestamp) as date,
        COUNT(DISTINCT user_id) as users,
        SUM(JSONExtractFloat(properties, 'orderValue')) as revenue,
        COUNT(DISTINCT session_id) as sessions
      FROM events
      WHERE timestamp BETWEEN '${timeRange.start.toISOString()}' AND '${timeRange.end.toISOString()}'
      GROUP BY date
      ORDER BY date
    `;

    const result = await this.clickhouse.query({ query, format: 'JSONEachRow' });
    const data = await result.json() as Array<{
      date: string;
      users: number;
      revenue: number;
      sessions: number;
    }>;

    return {
      userGrowth: data.map(row => ({ date: row.date, value: row.users })),
      revenueGrowth: data.map(row => ({ date: row.date, value: row.revenue })),
      sessionTrends: data.map(row => ({ date: row.date, value: row.sessions }))
    };
  }

  private async getSegmentMetrics(timeRange: { start: Date; end: Date }): Promise<any> {
    // Implementation for segment metrics
    return {
      topPages: [],
      topProducts: [],
      userSources: [],
      deviceTypes: []
    };
  }

  private buildFilterClause(filters?: Record<string, any>): string {
    if (!filters) return '';
    
    return Object.entries(filters)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key} IN (${value.map(v => `'${v}'`).join(',')})`;
        }
        return `${key} = '${value}'`;
      })
      .join(' AND ');
  }

  private buildSegmentFilter(criteria: Record<string, any>): string {
    // Convert segment criteria to SQL WHERE clause
    return '';
  }

  private getIntervalClause(interval?: string): string {
    switch (interval) {
      case 'hour': return 'toStartOfHour(timestamp)';
      case 'day': return 'toDate(timestamp)';
      case 'week': return 'toStartOfWeek(timestamp)';
      case 'month': return 'toStartOfMonth(timestamp)';
      default: return '';
    }
  }

  private getMetricAggregation(metric: string): string {
    switch (metric) {
      case 'users': return 'COUNT(DISTINCT user_id)';
      case 'sessions': return 'COUNT(DISTINCT session_id)';
      case 'page_views': return 'COUNT(*)';
      case 'revenue': return 'SUM(JSONExtractFloat(properties, \'orderValue\'))';
      case 'conversion_rate': return 'COUNT(CASE WHEN event_type = \'purchase\' THEN 1 END) / COUNT(DISTINCT user_id)';
      default: return 'COUNT(*)';
    }
  }

  private getReportTimeRange(type: string, date: Date): { start: Date; end: Date } {
    const start = new Date(date);
    const end = new Date(date);

    switch (type) {
      case 'daily':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        start.setDate(date.getDate() - date.getDay());
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(start.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { start, end };
  }

  /**
   * Initialize analytics database
   */
  async initializeDatabase(): Promise<void> {
    try {
      await this.clickhouse.command({
        query: `
          CREATE TABLE IF NOT EXISTS events (
            event_type String,
            user_id String,
            session_id String,
            timestamp DateTime64(3),
            properties String,
            user_agent String,
            ip_address String,
            page_url String,
            page_title String,
            page_referrer String,
            device_type Enum8('mobile' = 1, 'tablet' = 2, 'desktop' = 3),
            device_os String,
            device_browser String,
            location_country String,
            location_city String,
            location_region String
          ) ENGINE = MergeTree()
          ORDER BY (event_type, timestamp)
          PARTITION BY toYYYYMM(timestamp)
        `
      });

      logger.info('Analytics database initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize analytics database', error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();