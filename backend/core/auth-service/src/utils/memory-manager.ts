/**
 * Memory Management Utility
 * Professional memory leak prevention and optimization
 */

import { logger } from './logger';

interface MemoryThresholds {
  warning: number; // 70%
  critical: number; // 85%
  emergency: number; // 95%
}

interface MemoryStats {
  used: number;
  total: number;
  free: number;
  percentage: number;
  status: 'healthy' | 'warning' | 'critical' | 'emergency';
}

export class MemoryManager {
  private static instance: MemoryManager;
  private thresholds: MemoryThresholds;
  private cleanupTasks: Map<string, () => void> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  constructor() {
    this.thresholds = {
      warning: 70,
      critical: 85,
      emergency: 95,
    };
  }

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * Get current memory usage
   */
  getMemoryStats(): MemoryStats {
    const memUsage = process.memoryUsage();
    const total = memUsage.heapTotal;
    const used = memUsage.heapUsed;
    const free = total - used;
    const percentage = (used / total) * 100;

    let status: 'healthy' | 'warning' | 'critical' | 'emergency' = 'healthy';
    
    if (percentage >= this.thresholds.emergency) {
      status = 'emergency';
    } else if (percentage >= this.thresholds.critical) {
      status = 'critical';
    } else if (percentage >= this.thresholds.warning) {
      status = 'warning';
    }

    return {
      used: Math.round(used / 1024 / 1024), // MB
      total: Math.round(total / 1024 / 1024), // MB
      free: Math.round(free / 1024 / 1024), // MB
      percentage: Math.round(percentage * 100) / 100,
      status,
    };
  }

  /**
   * Start memory monitoring
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      logger.warn('Memory monitoring is already active');
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, intervalMs);

    logger.info('Memory monitoring started', { intervalMs });
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    logger.info('Memory monitoring stopped');
  }

  /**
   * Check memory usage and take action if needed
   */
  private checkMemoryUsage(): void {
    const stats = this.getMemoryStats();
    
    logger.debug('Memory usage check', {
      used: `${stats.used}MB`,
      total: `${stats.total}MB`,
      percentage: `${stats.percentage}%`,
      status: stats.status,
    });

    switch (stats.status) {
      case 'warning':
        logger.warn('Memory usage is high', { stats });
        this.performCleanup('warning');
        break;
      
      case 'critical':
        logger.error('Memory usage is critical', { stats });
        this.performCleanup('critical');
        this.forceGarbageCollection();
        break;
      
      case 'emergency':
        logger.error('Memory usage is at emergency level', { stats });
        this.performCleanup('emergency');
        this.forceGarbageCollection();
        this.restartIfNeeded();
        break;
      
      default:
        // Healthy - no action needed
        break;
    }
  }

  /**
   * Register cleanup task
   */
  registerCleanupTask(id: string, task: () => void): void {
    this.cleanupTasks.set(id, task);
    logger.debug('Cleanup task registered', { id });
  }

  /**
   * Unregister cleanup task
   */
  unregisterCleanupTask(id: string): void {
    this.cleanupTasks.delete(id);
    logger.debug('Cleanup task unregistered', { id });
  }

  /**
   * Perform memory cleanup
   */
  private performCleanup(level: 'warning' | 'critical' | 'emergency'): void {
    logger.info(`Performing memory cleanup (${level})`);
    
    let cleanedCount = 0;
    for (const [id, task] of this.cleanupTasks) {
      try {
        task();
        cleanedCount++;
        logger.debug('Cleanup task executed', { id });
      } catch (error) {
        logger.error('Cleanup task failed', { id, error });
      }
    }

    logger.info('Memory cleanup completed', { 
      level, 
      tasksExecuted: cleanedCount,
      totalTasks: this.cleanupTasks.size 
    });
  }

  /**
   * Force garbage collection (if available)
   */
  private forceGarbageCollection(): void {
    if (global.gc) {
      try {
        global.gc();
        logger.info('Garbage collection forced');
      } catch (error) {
        logger.error('Failed to force garbage collection', { error });
      }
    } else {
      logger.warn('Garbage collection not available (use --expose-gc flag)');
    }
  }

  /**
   * Restart process if memory usage is critical
   */
  private restartIfNeeded(): void {
    const stats = this.getMemoryStats();
    
    if (stats.status === 'emergency' && stats.percentage > 98) {
      logger.error('Memory usage critical - restarting process', { stats });
      
      // Graceful shutdown
      setTimeout(() => {
        process.exit(1);
      }, 5000);
    }
  }

  /**
   * Get memory usage summary
   */
  getMemorySummary(): any {
    const stats = this.getMemoryStats();
    return {
      ...stats,
      monitoring: this.isMonitoring,
      cleanupTasks: this.cleanupTasks.size,
      uptime: process.uptime(),
      pid: process.pid,
    };
  }

  /**
   * Set custom thresholds
   */
  setThresholds(thresholds: Partial<MemoryThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
    logger.info('Memory thresholds updated', { thresholds: this.thresholds });
  }
}

// Export singleton instance
export const memoryManager = MemoryManager.getInstance(); 