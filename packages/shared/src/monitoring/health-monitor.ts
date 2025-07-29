/**
 * Professional Health Monitoring System
 * Comprehensive health checks and monitoring for UltraMarket microservices
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';

// =================== TYPES ===================

export interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  timestamp: Date;
  details?: Record<string, any>;
  error?: string;
}

export interface ServiceHealth {
  serviceName: string;
  version: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  uptime: number;
  responseTime: number;
  lastCheck: Date;
  checks: HealthCheckResult[];
  metadata: Record<string, any>;
}

export interface HealthCheckConfig {
  name: string;
  check: () => Promise<boolean | HealthCheckResult>;
  interval?: number; // milliseconds
  timeout?: number; // milliseconds
  retries?: number;
  critical?: boolean;
}

export interface MonitoringConfig {
  serviceName: string;
  version: string;
  interval: number;
  timeout: number;
  retries: number;
  alertThresholds: {
    responseTime: number;
    errorRate: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

// =================== SIMPLE LOGGER ===================

const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  error: (message: string, meta?: any) => {
    console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : '');
  },
};

// =================== HEALTH MONITOR CLASS ===================

export class HealthMonitor extends EventEmitter {
  private config: MonitoringConfig;
  private checks: Map<string, HealthCheckConfig> = new Map();
  private results: Map<string, HealthCheckResult> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private startTime: Date = new Date();
  private metrics: {
    totalChecks: number;
    failedChecks: number;
    averageResponseTime: number;
    lastHealthy: Date | null;
  } = {
    totalChecks: 0,
    failedChecks: 0,
    averageResponseTime: 0,
    lastHealthy: null,
  };

  constructor(config: MonitoringConfig) {
    super();
    this.config = config;
    this.setupDefaultChecks();
  }

  /**
   * Setup default health checks
   */
  private setupDefaultChecks(): void {
    // Memory usage check
    this.addCheck({
      name: 'memory',
      check: this.checkMemoryUsage.bind(this),
      interval: 30000, // 30 seconds
      timeout: 5000,
      critical: true,
    });

    // CPU usage check
    this.addCheck({
      name: 'cpu',
      check: this.checkCpuUsage.bind(this),
      interval: 30000,
      timeout: 5000,
      critical: true,
    });

    // Disk space check
    this.addCheck({
      name: 'disk',
      check: this.checkDiskSpace.bind(this),
      interval: 60000, // 1 minute
      timeout: 10000,
      critical: false,
    });

    // Event loop lag check
    this.addCheck({
      name: 'eventloop',
      check: this.checkEventLoop.bind(this),
      interval: 15000, // 15 seconds
      timeout: 5000,
      critical: true,
    });
  }

  /**
   * Add a health check
   */
  addCheck(config: HealthCheckConfig): void {
    this.checks.set(config.name, config);

    // Start periodic check if interval is specified
    if (config.interval) {
      this.startPeriodicCheck(config);
    }

    logger.info(`Health check added: ${config.name}`, {
      service: this.config.serviceName,
      check: config.name,
      interval: config.interval,
      critical: config.critical,
    });
  }

  /**
   * Remove a health check
   */
  removeCheck(name: string): void {
    this.checks.delete(name);
    this.results.delete(name);

    const interval = this.intervals.get(name);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(name);
    }

    logger.info(`Health check removed: ${name}`, {
      service: this.config.serviceName,
      check: name,
    });
  }

  /**
   * Start periodic health check
   */
  private startPeriodicCheck(config: HealthCheckConfig): void {
    const interval = setInterval(async () => {
      await this.runCheck(config.name);
    }, config.interval || this.config.interval);

    this.intervals.set(config.name, interval);
  }

  /**
   * Run a specific health check
   */
  async runCheck(name: string): Promise<HealthCheckResult> {
    const config = this.checks.get(name);
    if (!config) {
      throw new Error(`Health check not found: ${name}`);
    }

    const startTime = performance.now();
    let result: HealthCheckResult;

    try {
      const checkResult = await this.executeWithTimeout(
        config.check(),
        config.timeout || this.config.timeout
      );

      const responseTime = performance.now() - startTime;

      if (typeof checkResult === 'boolean') {
        result = {
          name,
          status: checkResult ? 'healthy' : 'unhealthy',
          responseTime,
          timestamp: new Date(),
        };
      } else {
        result = {
          ...checkResult,
          name,
          responseTime,
          timestamp: new Date(),
        };
      }

      this.metrics.totalChecks++;
      this.updateAverageResponseTime(responseTime);

      if (result.status === 'healthy') {
        this.metrics.lastHealthy = new Date();
      } else {
        this.metrics.failedChecks++;

        if (config.critical) {
          this.emit('critical-failure', result);
        }
      }
    } catch (error) {
      const responseTime = performance.now() - startTime;

      result = {
        name,
        status: 'unhealthy',
        responseTime,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error),
      };

      this.metrics.totalChecks++;
      this.metrics.failedChecks++;
      this.updateAverageResponseTime(responseTime);

      if (config.critical) {
        this.emit('critical-failure', result);
      }
    }

    this.results.set(name, result);
    this.emit('check-complete', result);

    // Log result
    logger.info(`Health check completed: ${name}`, {
      service: this.config.serviceName,
      check: name,
      status: result.status,
      responseTime: result.responseTime,
      error: result.error,
    });

    return result;
  }

  /**
   * Run all health checks
   */
  async runAllChecks(): Promise<HealthCheckResult[]> {
    const checkNames = Array.from(this.checks.keys());
    const results = await Promise.allSettled(checkNames.map((name) => this.runCheck(name)));

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          name: checkNames[index],
          status: 'unhealthy' as const,
          responseTime: 0,
          timestamp: new Date(),
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        };
      }
    });
  }

  /**
   * Get current service health status
   */
  getServiceHealth(): ServiceHealth {
    const checks = Array.from(this.results.values());
    const overallStatus = this.calculateOverallStatus(checks);
    const uptime = Date.now() - this.startTime.getTime();

    return {
      serviceName: this.config.serviceName,
      version: this.config.version,
      status: overallStatus,
      uptime,
      responseTime: this.metrics.averageResponseTime,
      lastCheck: new Date(),
      checks,
      metadata: {
        totalChecks: this.metrics.totalChecks,
        failedChecks: this.metrics.failedChecks,
        successRate: this.calculateSuccessRate(),
        lastHealthy: this.metrics.lastHealthy,
        startTime: this.startTime,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
    };
  }

  /**
   * Calculate overall service status
   */
  private calculateOverallStatus(
    checks: HealthCheckResult[]
  ): 'healthy' | 'unhealthy' | 'degraded' {
    if (checks.length === 0) {
      return 'unhealthy';
    }

    const criticalChecks = checks.filter((check) => {
      const config = this.checks.get(check.name);
      return config?.critical;
    });

    const unhealthyChecks = checks.filter((check) => check.status === 'unhealthy');
    const degradedChecks = checks.filter((check) => check.status === 'degraded');

    // If any critical check is unhealthy, service is unhealthy
    if (criticalChecks.some((check) => check.status === 'unhealthy')) {
      return 'unhealthy';
    }

    // If more than 50% of checks are unhealthy, service is unhealthy
    if (unhealthyChecks.length > checks.length / 2) {
      return 'unhealthy';
    }

    // If any checks are degraded or some are unhealthy, service is degraded
    if (degradedChecks.length > 0 || unhealthyChecks.length > 0) {
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * Calculate success rate
   */
  private calculateSuccessRate(): number {
    if (this.metrics.totalChecks === 0) {
      return 0;
    }
    return (
      ((this.metrics.totalChecks - this.metrics.failedChecks) / this.metrics.totalChecks) * 100
    );
  }

  /**
   * Update average response time
   */
  private updateAverageResponseTime(responseTime: number): void {
    if (this.metrics.totalChecks === 1) {
      this.metrics.averageResponseTime = responseTime;
    } else {
      this.metrics.averageResponseTime =
        (this.metrics.averageResponseTime * (this.metrics.totalChecks - 1) + responseTime) /
        this.metrics.totalChecks;
    }
  }

  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Health check timeout')), timeout);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  // =================== DEFAULT HEALTH CHECKS ===================

  /**
   * Check memory usage
   */
  private async checkMemoryUsage(): Promise<HealthCheckResult> {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
    const memoryUsagePercent = (heapUsedMB / heapTotalMB) * 100;

    let status: 'healthy' | 'unhealthy' | 'degraded';

    if (memoryUsagePercent > this.config.alertThresholds.memoryUsage) {
      status = 'unhealthy';
    } else if (memoryUsagePercent > this.config.alertThresholds.memoryUsage * 0.8) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      name: 'memory',
      status,
      responseTime: 0,
      timestamp: new Date(),
      details: {
        heapUsed: `${heapUsedMB.toFixed(2)} MB`,
        heapTotal: `${heapTotalMB.toFixed(2)} MB`,
        usagePercent: `${memoryUsagePercent.toFixed(2)}%`,
        rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`,
      },
    };
  }

  /**
   * Check CPU usage
   */
  private async checkCpuUsage(): Promise<HealthCheckResult> {
    const startUsage = process.cpuUsage();

    // Wait 100ms to measure CPU usage
    await new Promise((resolve) => setTimeout(resolve, 100));

    const endUsage = process.cpuUsage(startUsage);
    const totalUsage = (endUsage.user + endUsage.system) / 1000; // Convert to milliseconds
    const cpuPercent = (totalUsage / 100) * 100; // Approximate CPU percentage

    let status: 'healthy' | 'unhealthy' | 'degraded';

    if (cpuPercent > this.config.alertThresholds.cpuUsage) {
      status = 'unhealthy';
    } else if (cpuPercent > this.config.alertThresholds.cpuUsage * 0.8) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      name: 'cpu',
      status,
      responseTime: 0,
      timestamp: new Date(),
      details: {
        user: `${(endUsage.user / 1000).toFixed(2)} ms`,
        system: `${(endUsage.system / 1000).toFixed(2)} ms`,
        total: `${totalUsage.toFixed(2)} ms`,
        percent: `${cpuPercent.toFixed(2)}%`,
      },
    };
  }

  /**
   * Check disk space
   */
  private async checkDiskSpace(): Promise<HealthCheckResult> {
    try {
      const { execSync } = require('child_process');
      const output = execSync('df -h /', { encoding: 'utf-8' });
      const lines = output.trim().split('\n');
      const data = lines[1].split(/\s+/);

      const usagePercent = parseInt(data[4].replace('%', ''));

      let status: 'healthy' | 'unhealthy' | 'degraded';

      if (usagePercent > 90) {
        status = 'unhealthy';
      } else if (usagePercent > 80) {
        status = 'degraded';
      } else {
        status = 'healthy';
      }

      return {
        name: 'disk',
        status,
        responseTime: 0,
        timestamp: new Date(),
        details: {
          filesystem: data[0],
          size: data[1],
          used: data[2],
          available: data[3],
          usagePercent: `${usagePercent}%`,
          mountPoint: data[5],
        },
      };
    } catch (error) {
      return {
        name: 'disk',
        status: 'unhealthy',
        responseTime: 0,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Check event loop lag
   */
  private async checkEventLoop(): Promise<HealthCheckResult> {
    const start = performance.now();

    await new Promise((resolve) => setImmediate(resolve));

    const lag = performance.now() - start;

    let status: 'healthy' | 'unhealthy' | 'degraded';

    if (lag > 100) {
      // 100ms lag is concerning
      status = 'unhealthy';
    } else if (lag > 50) {
      // 50ms lag is degraded
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      name: 'eventloop',
      status,
      responseTime: 0,
      timestamp: new Date(),
      details: {
        lag: `${lag.toFixed(2)} ms`,
        threshold: '50 ms (degraded), 100 ms (unhealthy)',
      },
    };
  }

  /**
   * Start monitoring
   */
  start(): void {
    logger.info(`Health monitoring started for ${this.config.serviceName}`, {
      service: this.config.serviceName,
      version: this.config.version,
      checks: Array.from(this.checks.keys()),
    });

    this.emit('monitoring-started');
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    // Clear all intervals
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals.clear();

    logger.info(`Health monitoring stopped for ${this.config.serviceName}`, {
      service: this.config.serviceName,
      totalChecks: this.metrics.totalChecks,
      failedChecks: this.metrics.failedChecks,
      successRate: this.calculateSuccessRate(),
    });

    this.emit('monitoring-stopped');
  }
}

// =================== UTILITY FUNCTIONS ===================

/**
 * Create a database health check
 */
export function createDatabaseHealthCheck(
  name: string,
  connectionCheck: () => Promise<boolean>,
  options: Partial<HealthCheckConfig> = {}
): HealthCheckConfig {
  return {
    name,
    check: async () => {
      try {
        const isConnected = await connectionCheck();
        return {
          name,
          status: isConnected ? 'healthy' : 'unhealthy',
          responseTime: 0,
          timestamp: new Date(),
          details: {
            connection: isConnected ? 'connected' : 'disconnected',
          },
        };
      } catch (error) {
        return {
          name,
          status: 'unhealthy',
          responseTime: 0,
          timestamp: new Date(),
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    interval: 30000,
    timeout: 5000,
    critical: true,
    ...options,
  };
}

/**
 * Create an HTTP service health check
 */
export function createHttpHealthCheck(
  name: string,
  url: string,
  options: Partial<HealthCheckConfig> = {}
): HealthCheckConfig {
  return {
    name,
    check: async () => {
      try {
        const startTime = performance.now();
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'User-Agent': 'UltraMarket-HealthCheck/1.0' },
        });
        const responseTime = performance.now() - startTime;

        const status = response.ok ? 'healthy' : 'unhealthy';

        return {
          name,
          status,
          responseTime,
          timestamp: new Date(),
          details: {
            url,
            statusCode: response.status,
            statusText: response.statusText,
            responseTime: `${responseTime.toFixed(2)} ms`,
          },
        };
      } catch (error) {
        return {
          name,
          status: 'unhealthy',
          responseTime: 0,
          timestamp: new Date(),
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    interval: 30000,
    timeout: 10000,
    critical: false,
    ...options,
  };
}

/**
 * Create a Redis health check
 */
export function createRedisHealthCheck(
  name: string,
  redisClient: any,
  options: Partial<HealthCheckConfig> = {}
): HealthCheckConfig {
  return {
    name,
    check: async () => {
      try {
        const startTime = performance.now();
        await redisClient.ping();
        const responseTime = performance.now() - startTime;

        return {
          name,
          status: 'healthy',
          responseTime,
          timestamp: new Date(),
          details: {
            connection: 'connected',
            responseTime: `${responseTime.toFixed(2)} ms`,
          },
        };
      } catch (error) {
        return {
          name,
          status: 'unhealthy',
          responseTime: 0,
          timestamp: new Date(),
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    interval: 30000,
    timeout: 5000,
    critical: true,
    ...options,
  };
}

// =================== EXPORT ===================

export default {
  HealthMonitor,
  createDatabaseHealthCheck,
  createHttpHealthCheck,
  createRedisHealthCheck,
};
