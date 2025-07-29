import { logger } from '../logging/logger';
import { EventEmitter } from 'events';

// Memory usage interface
export interface MemoryUsage {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
  timestamp: Date;
}

// Memory threshold configuration
export interface MemoryThresholds {
  warning: number;
  critical: number;
  maxHeapSize: number;
}

// Resource cleanup interface
export interface CleanupResource {
  id: string;
  type: 'interval' | 'timeout' | 'listener' | 'stream' | 'connection' | 'other';
  resource: any;
  cleanup: () => void;
  created: Date;
}

// Memory manager class
export class MemoryManager extends EventEmitter {
  private resources: Map<string, CleanupResource> = new Map();
  private monitoringInterval?: NodeJS.Timeout;
  private thresholds: MemoryThresholds;
  private memoryHistory: MemoryUsage[] = [];
  private maxHistorySize: number = 100;
  private isMonitoring: boolean = false;

  constructor(thresholds?: Partial<MemoryThresholds>) {
    super();

    // Set default thresholds (in MB)
    this.thresholds = {
      warning: 512,
      critical: 1024,
      maxHeapSize: 1536,
      ...thresholds,
    };

    // Set max listeners to prevent memory leaks
    this.setMaxListeners(50);

    // Handle process exit
    process.on('exit', () => this.cleanup());
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception, cleaning up', { error: error.message });
      this.cleanup();
    });
  }

  /**
   * Start memory monitoring
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, intervalMs);

    // Register the monitoring interval for cleanup
    this.registerResource('memory-monitor', 'interval', this.monitoringInterval, () => {
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = undefined;
      }
    });

    logger.info('Memory monitoring started', {
      interval: intervalMs,
      thresholds: this.thresholds,
    });
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    this.unregisterResource('memory-monitor');

    logger.info('Memory monitoring stopped');
  }

  /**
   * Register a resource for cleanup
   */
  registerResource(
    id: string,
    type: CleanupResource['type'],
    resource: any,
    cleanup: () => void
  ): void {
    const cleanupResource: CleanupResource = {
      id,
      type,
      resource,
      cleanup,
      created: new Date(),
    };

    this.resources.set(id, cleanupResource);

    logger.debug('Resource registered for cleanup', {
      id,
      type,
      totalResources: this.resources.size,
    });
  }

  /**
   * Unregister a resource
   */
  unregisterResource(id: string): void {
    const resource = this.resources.get(id);
    if (resource) {
      try {
        resource.cleanup();
        this.resources.delete(id);

        logger.debug('Resource unregistered and cleaned up', {
          id,
          type: resource.type,
          totalResources: this.resources.size,
        });
      } catch (error) {
        logger.error('Error cleaning up resource', {
          id,
          type: resource.type,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Check current memory usage
   */
  checkMemoryUsage(): MemoryUsage {
    const memoryUsage = process.memoryUsage();
    const usage: MemoryUsage = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
      arrayBuffers: Math.round(memoryUsage.arrayBuffers / 1024 / 1024),
      timestamp: new Date(),
    };

    // Add to history
    this.memoryHistory.push(usage);
    if (this.memoryHistory.length > this.maxHistorySize) {
      this.memoryHistory.shift();
    }

    // Check thresholds
    this.checkThresholds(usage);

    return usage;
  }

  /**
   * Check memory thresholds
   */
  private checkThresholds(usage: MemoryUsage): void {
    const heapUsedMB = usage.heapUsed;

    if (heapUsedMB >= this.thresholds.critical) {
      logger.error('Critical memory usage detected', {
        heapUsed: heapUsedMB,
        threshold: this.thresholds.critical,
        totalResources: this.resources.size,
      });

      this.emit('critical-memory', usage);
      this.forceGarbageCollection();
    } else if (heapUsedMB >= this.thresholds.warning) {
      logger.warn('High memory usage detected', {
        heapUsed: heapUsedMB,
        threshold: this.thresholds.warning,
        totalResources: this.resources.size,
      });

      this.emit('high-memory', usage);
    }
  }

  /**
   * Force garbage collection if available
   */
  forceGarbageCollection(): void {
    if (global.gc) {
      try {
        global.gc();
        logger.info('Garbage collection forced');
      } catch (error) {
        logger.error('Failed to force garbage collection', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    } else {
      logger.warn('Garbage collection not available (run with --expose-gc)');
    }
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): {
    current: MemoryUsage;
    average: Partial<MemoryUsage>;
    peak: Partial<MemoryUsage>;
    resourceCount: number;
    resourceTypes: Record<string, number>;
  } {
    const current = this.checkMemoryUsage();

    if (this.memoryHistory.length === 0) {
      return {
        current,
        average: current,
        peak: current,
        resourceCount: this.resources.size,
        resourceTypes: this.getResourceTypeCounts(),
      };
    }

    // Calculate averages
    const average = {
      rss: Math.round(
        this.memoryHistory.reduce((sum, usage) => sum + usage.rss, 0) / this.memoryHistory.length
      ),
      heapTotal: Math.round(
        this.memoryHistory.reduce((sum, usage) => sum + usage.heapTotal, 0) /
          this.memoryHistory.length
      ),
      heapUsed: Math.round(
        this.memoryHistory.reduce((sum, usage) => sum + usage.heapUsed, 0) /
          this.memoryHistory.length
      ),
      external: Math.round(
        this.memoryHistory.reduce((sum, usage) => sum + usage.external, 0) /
          this.memoryHistory.length
      ),
      arrayBuffers: Math.round(
        this.memoryHistory.reduce((sum, usage) => sum + usage.arrayBuffers, 0) /
          this.memoryHistory.length
      ),
    };

    // Calculate peaks
    const peak = {
      rss: Math.max(...this.memoryHistory.map((usage) => usage.rss)),
      heapTotal: Math.max(...this.memoryHistory.map((usage) => usage.heapTotal)),
      heapUsed: Math.max(...this.memoryHistory.map((usage) => usage.heapUsed)),
      external: Math.max(...this.memoryHistory.map((usage) => usage.external)),
      arrayBuffers: Math.max(...this.memoryHistory.map((usage) => usage.arrayBuffers)),
    };

    return {
      current,
      average,
      peak,
      resourceCount: this.resources.size,
      resourceTypes: this.getResourceTypeCounts(),
    };
  }

  /**
   * Get resource type counts
   */
  private getResourceTypeCounts(): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const resource of this.resources.values()) {
      counts[resource.type] = (counts[resource.type] || 0) + 1;
    }

    return counts;
  }

  /**
   * Clean up old resources
   */
  cleanupOldResources(maxAgeMs: number = 3600000): void {
    // 1 hour default
    const now = new Date();
    const resourcesToCleanup: string[] = [];

    for (const [id, resource] of this.resources.entries()) {
      const age = now.getTime() - resource.created.getTime();
      if (age > maxAgeMs) {
        resourcesToCleanup.push(id);
      }
    }

    resourcesToCleanup.forEach((id) => this.unregisterResource(id));

    if (resourcesToCleanup.length > 0) {
      logger.info('Cleaned up old resources', {
        cleanedCount: resourcesToCleanup.length,
        maxAge: maxAgeMs,
      });
    }
  }

  /**
   * Clean up all resources
   */
  cleanup(): void {
    logger.info('Starting memory manager cleanup', {
      totalResources: this.resources.size,
    });

    // Stop monitoring
    this.stopMonitoring();

    // Clean up all registered resources
    const resourceIds = Array.from(this.resources.keys());
    resourceIds.forEach((id) => this.unregisterResource(id));

    // Clear memory history
    this.memoryHistory = [];

    // Remove all listeners
    this.removeAllListeners();

    logger.info('Memory manager cleanup completed');
  }

  /**
   * Get resource details
   */
  getResourceDetails(): CleanupResource[] {
    return Array.from(this.resources.values()).map((resource) => ({
      ...resource,
      resource: '[Object]', // Don't expose actual resource object
    }));
  }
}

// Event listener manager
export class EventListenerManager {
  private listeners: Map<
    string,
    {
      target: EventTarget | NodeJS.EventEmitter;
      event: string;
      listener: Function;
      options?: any;
    }
  > = new Map();

  /**
   * Add event listener with automatic cleanup
   */
  addEventListener(
    id: string,
    target: EventTarget | NodeJS.EventEmitter,
    event: string,
    listener: Function,
    options?: any
  ): void {
    // Remove existing listener if exists
    this.removeEventListener(id);

    // Add new listener
    if ('addEventListener' in target) {
      (target as EventTarget).addEventListener(event, listener as EventListener, options);
    } else {
      (target as NodeJS.EventEmitter).on(event, listener as (...args: any[]) => void);
    }

    // Store for cleanup
    this.listeners.set(id, { target, event, listener, options });
  }

  /**
   * Remove event listener
   */
  removeEventListener(id: string): void {
    const listenerInfo = this.listeners.get(id);
    if (listenerInfo) {
      const { target, event, listener, options } = listenerInfo;

      try {
        if ('removeEventListener' in target) {
          (target as EventTarget).removeEventListener(event, listener as EventListener, options);
        } else {
          (target as NodeJS.EventEmitter).off(event, listener as (...args: any[]) => void);
        }

        this.listeners.delete(id);
      } catch (error) {
        logger.error('Error removing event listener', {
          id,
          event,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    const listenerIds = Array.from(this.listeners.keys());
    listenerIds.forEach((id) => this.removeEventListener(id));
  }

  /**
   * Get listener count
   */
  getListenerCount(): number {
    return this.listeners.size;
  }
}

// Timer manager
export class TimerManager {
  private timers: Map<
    string,
    {
      type: 'timeout' | 'interval';
      timer: NodeJS.Timeout;
      created: Date;
    }
  > = new Map();

  /**
   * Set timeout with automatic cleanup
   */
  setTimeout(id: string, callback: () => void, delay: number): void {
    this.clearTimer(id);

    const timer = setTimeout(() => {
      callback();
      this.timers.delete(id);
    }, delay);

    this.timers.set(id, {
      type: 'timeout',
      timer,
      created: new Date(),
    });
  }

  /**
   * Set interval with automatic cleanup
   */
  setInterval(id: string, callback: () => void, interval: number): void {
    this.clearTimer(id);

    const timer = setInterval(callback, interval);

    this.timers.set(id, {
      type: 'interval',
      timer,
      created: new Date(),
    });
  }

  /**
   * Clear specific timer
   */
  clearTimer(id: string): void {
    const timerInfo = this.timers.get(id);
    if (timerInfo) {
      if (timerInfo.type === 'timeout') {
        clearTimeout(timerInfo.timer);
      } else {
        clearInterval(timerInfo.timer);
      }
      this.timers.delete(id);
    }
  }

  /**
   * Clear all timers
   */
  clearAllTimers(): void {
    const timerIds = Array.from(this.timers.keys());
    timerIds.forEach((id) => this.clearTimer(id));
  }

  /**
   * Get timer count
   */
  getTimerCount(): number {
    return this.timers.size;
  }

  /**
   * Get timer details
   */
  getTimerDetails(): Array<{
    id: string;
    type: 'timeout' | 'interval';
    created: Date;
    age: number;
  }> {
    const now = new Date();
    return Array.from(this.timers.entries()).map(([id, info]) => ({
      id,
      type: info.type,
      created: info.created,
      age: now.getTime() - info.created.getTime(),
    }));
  }
}

// Create global instances
export const memoryManager = new MemoryManager();
export const eventListenerManager = new EventListenerManager();
export const timerManager = new TimerManager();

// Utility functions
export const withCleanup = <T extends (...args: any[]) => any>(fn: T, cleanup: () => void): T => {
  const wrappedFn = ((...args: any[]) => {
    try {
      return fn(...args);
    } finally {
      cleanup();
    }
  }) as T;

  return wrappedFn;
};

export const withAsyncCleanup = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  cleanup: () => void | Promise<void>
): T => {
  const wrappedFn = (async (...args: any[]) => {
    try {
      return await fn(...args);
    } finally {
      await cleanup();
    }
  }) as T;

  return wrappedFn;
};

// Export default
export default {
  MemoryManager,
  EventListenerManager,
  TimerManager,
  memoryManager,
  eventListenerManager,
  timerManager,
  withCleanup,
  withAsyncCleanup,
};
