/**
 * PROFESSIONAL MEMORY LEAK PREVENTION SYSTEM
 * UltraMarket - Production Ready Solution
 * 
 * SOLVES: Memory leaks from event listeners accumulating on restart
 * 
 * Before: Event listeners never cleaned up → Memory usage grows indefinitely
 * After: Automatic cleanup of all listeners, timers, and resources
 */

import EventEmitter from 'events';
import { logger } from '../logging/logger';

export interface CleanupResource {
  id: string;
  type: 'listener' | 'timer' | 'interval' | 'stream' | 'connection' | 'other';
  resource: any;
  cleanup: () => void | Promise<void>;
  created: Date;
  serviceName: string;
}

/**
 * Global Memory Leak Prevention Manager - SINGLETON
 * Automatically tracks and cleans up ALL resources across services
 */
export class MemoryLeakPrevention extends EventEmitter {
  private static instance: MemoryLeakPrevention;
  private resources = new Map<string, CleanupResource>();
  private timers = new Map<string, NodeJS.Timeout>();
  private intervals = new Map<string, NodeJS.Timeout>();
  private eventListeners = new Map<string, { target: any; event: string; handler: Function }>();
  private serviceResources = new Map<string, Set<string>>(); // serviceName -> resourceIds
  private isShuttingDown = false;
  private cleanupInterval?: NodeJS.Timeout;

  private constructor() {
    super();
    this.setMaxListeners(0); // Unlimited listeners for this manager
    this.setupProcessHandlers();
    this.startPeriodicCleanup();
  }

  public static getInstance(): MemoryLeakPrevention {
    if (!MemoryLeakPrevention.instance) {
      MemoryLeakPrevention.instance = new MemoryLeakPrevention();
    }
    return MemoryLeakPrevention.instance;
  }

  /**
   * Register service with memory manager
   */
  public registerService(serviceName: string): void {
    if (!this.serviceResources.has(serviceName)) {
      this.serviceResources.set(serviceName, new Set());
      logger.info('Service registered with memory leak prevention', { serviceName });
    }
  }

  /**
   * Register a resource for automatic cleanup
   */
  public registerResource(
    id: string,
    type: CleanupResource['type'],
    resource: any,
    cleanup: () => void | Promise<void>,
    serviceName: string
  ): void {
    // Remove existing resource with same ID
    this.unregisterResource(id);

    const cleanupResource: CleanupResource = {
      id,
      type,
      resource,
      cleanup,
      created: new Date(),
      serviceName
    };

    this.resources.set(id, cleanupResource);
    
    // Track service resources
    if (!this.serviceResources.has(serviceName)) {
      this.serviceResources.set(serviceName, new Set());
    }
    this.serviceResources.get(serviceName)!.add(id);

    logger.debug('Resource registered for cleanup', { id, type, serviceName });
  }

  /**
   * Register event listener with automatic cleanup
   */
  public registerEventListener(
    id: string,
    target: EventEmitter | NodeJS.EventEmitter | any,
    event: string,
    handler: Function,
    serviceName: string
  ): void {
    // Remove existing listener
    this.removeEventListener(id);

    // Add new listener
    if (target && typeof target.on === 'function') {
      target.on(event, handler);
    } else if (target && typeof target.addEventListener === 'function') {
      target.addEventListener(event, handler);
    }

    // Store for cleanup
    this.eventListeners.set(id, { target, event, handler });
    
    // Register as resource
    this.registerResource(
      id,
      'listener',
      { target, event, handler },
      () => this.removeEventListener(id),
      serviceName
    );

    logger.debug('Event listener registered', { id, event, serviceName });
  }

  /**
   * Register timer with automatic cleanup
   */
  public registerTimer(
    id: string,
    callback: () => void,
    delay: number,
    serviceName: string
  ): NodeJS.Timeout {
    // Clear existing timer
    this.clearTimer(id);

    const timer = setTimeout(() => {
      callback();
      this.timers.delete(id);
      this.unregisterResource(id);
    }, delay);

    this.timers.set(id, timer);
    
    this.registerResource(
      id,
      'timer',
      timer,
      () => this.clearTimer(id),
      serviceName
    );

    return timer;
  }

  /**
   * Register interval with automatic cleanup
   */
  public registerInterval(
    id: string,
    callback: () => void,
    interval: number,
    serviceName: string
  ): NodeJS.Timeout {
    // Clear existing interval
    this.clearInterval(id);

    const intervalTimer = setInterval(callback, interval);
    this.intervals.set(id, intervalTimer);
    
    this.registerResource(
      id,
      'interval',
      intervalTimer,
      () => this.clearInterval(id),
      serviceName
    );

    return intervalTimer;
  }

  /**
   * Remove event listener
   */
  private removeEventListener(id: string): void {
    const listener = this.eventListeners.get(id);
    if (listener) {
      const { target, event, handler } = listener;
      
      try {
        if (target && typeof target.off === 'function') {
          target.off(event, handler);
        } else if (target && typeof target.removeListener === 'function') {
          target.removeListener(event, handler);
        } else if (target && typeof target.removeEventListener === 'function') {
          target.removeEventListener(event, handler);
        }
      } catch (error) {
        logger.warn('Error removing event listener', { id, error });
      }
      
      this.eventListeners.delete(id);
    }
  }

  /**
   * Clear timer
   */
  private clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }

  /**
   * Clear interval
   */
  private clearInterval(id: string): void {
    const interval = this.intervals.get(id);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(id);
    }
  }

  /**
   * Unregister a resource
   */
  public unregisterResource(id: string): void {
    const resource = this.resources.get(id);
    if (resource) {
      try {
        const result = resource.cleanup();
        if (result instanceof Promise) {
          result.catch(error => {
            logger.error('Error during async resource cleanup', { id, error });
          });
        }
      } catch (error) {
        logger.error('Error during resource cleanup', { id, error });
      }

      this.resources.delete(id);
      
      // Remove from service tracking
      for (const [serviceName, resourceIds] of this.serviceResources.entries()) {
        resourceIds.delete(id);
        if (resourceIds.size === 0) {
          this.serviceResources.delete(serviceName);
        }
      }

      logger.debug('Resource unregistered', { id });
    }
  }

  /**
   * Clean up all resources for a specific service
   */
  public cleanupService(serviceName: string): Promise<void> {
    logger.info('Cleaning up service resources', { serviceName });
    
    const resourceIds = this.serviceResources.get(serviceName);
    if (!resourceIds) {
      return Promise.resolve();
    }

    const cleanupPromises: Promise<void>[] = [];
    
    for (const resourceId of Array.from(resourceIds)) {
      const resource = this.resources.get(resourceId);
      if (resource) {
        try {
          const result = resource.cleanup();
          if (result instanceof Promise) {
            cleanupPromises.push(result.catch(error => {
              logger.error('Error during service resource cleanup', { 
                serviceName, 
                resourceId, 
                error 
              });
            }));
          }
        } catch (error) {
          logger.error('Error during service resource cleanup', { 
            serviceName, 
            resourceId, 
            error 
          });
        }
      }
    }

    // Remove all service resources
    this.serviceResources.delete(serviceName);
    
    for (const resourceId of Array.from(resourceIds)) {
      this.resources.delete(resourceId);
      this.eventListeners.delete(resourceId);
      this.clearTimer(resourceId);
      this.clearInterval(resourceId);
    }

    logger.info('Service resources cleaned up', { 
      serviceName, 
      resourceCount: resourceIds.size 
    });

    return Promise.all(cleanupPromises).then(() => {});
  }

  /**
   * Periodic cleanup of old resources
   */
  private startPeriodicCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.periodicCleanup();
    }, 60000); // Every 1 minute
  }

  private periodicCleanup(): void {
    if (this.isShuttingDown) return;

    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const resourcesToClean: string[] = [];

    for (const [id, resource] of this.resources.entries()) {
      const age = now.getTime() - resource.created.getTime();
      if (age > maxAge) {
        resourcesToClean.push(id);
      }
    }

    if (resourcesToClean.length > 0) {
      logger.info('Cleaning up old resources', { count: resourcesToClean.length });
      resourcesToClean.forEach(id => this.unregisterResource(id));
    }

    // Log memory usage
    const memUsage = process.memoryUsage();
    logger.debug('Memory usage check', {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
      external: Math.round(memUsage.external / 1024 / 1024) + ' MB',
      rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
      activeResources: this.resources.size,
      activeServices: this.serviceResources.size
    });
  }

  /**
   * Get memory statistics
   */
  public getMemoryStats(): any {
    const memUsage = process.memoryUsage();
    const resourcesByType = new Map<string, number>();
    const resourcesByService = new Map<string, number>();

    for (const resource of this.resources.values()) {
      resourcesByType.set(
        resource.type, 
        (resourcesByType.get(resource.type) || 0) + 1
      );
      
      resourcesByService.set(
        resource.serviceName,
        (resourcesByService.get(resource.serviceName) || 0) + 1
      );
    }

    return {
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024),
      },
      resources: {
        total: this.resources.size,
        byType: Object.fromEntries(resourcesByType),
        byService: Object.fromEntries(resourcesByService),
      },
      services: Array.from(this.serviceResources.keys()),
    };
  }

  /**
   * Complete shutdown - Clean up everything
   */
  public async shutdown(): Promise<void> {
    if (this.isShuttingDown) return;
    
    this.isShuttingDown = true;
    logger.info('Starting memory leak prevention shutdown', {
      totalResources: this.resources.size,
      totalServices: this.serviceResources.size
    });

    // Clear periodic cleanup
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Clean up all services
    const serviceCleanupPromises = Array.from(this.serviceResources.keys())
      .map(serviceName => this.cleanupService(serviceName));

    await Promise.allSettled(serviceCleanupPromises);

    // Final cleanup
    this.resources.clear();
    this.eventListeners.clear();
    this.timers.clear();
    this.intervals.clear();
    this.serviceResources.clear();
    this.removeAllListeners();

    logger.info('Memory leak prevention shutdown completed');
  }

  /**
   * Setup process handlers for automatic cleanup
   */
  private setupProcessHandlers(): void {
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, cleaning up memory resources...`);
      await this.shutdown();
    };

    // Handle various shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2'));
    process.on('beforeExit', () => shutdown('beforeExit'));

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      logger.error('Uncaught exception, cleaning up memory', error);
      await this.shutdown();
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason, promise) => {
      logger.error('Unhandled rejection, cleaning up memory', { reason, promise });
      await this.shutdown();
      process.exit(1);
    });
  }
}

// Export singleton instance
export const memoryLeakPrevention = MemoryLeakPrevention.getInstance();

/**
 * Utility functions for easy resource management
 */
export const safeEventListener = (
  target: any,
  event: string,
  handler: Function,
  serviceName: string,
  id?: string
) => {
  const listenerId = id || `${serviceName}-${event}-${Date.now()}-${Math.random()}`;
  memoryLeakPrevention.registerEventListener(listenerId, target, event, handler, serviceName);
  return listenerId;
};

export const safeSetTimeout = (
  callback: () => void,
  delay: number,
  serviceName: string,
  id?: string
): NodeJS.Timeout => {
  const timerId = id || `${serviceName}-timeout-${Date.now()}-${Math.random()}`;
  return memoryLeakPrevention.registerTimer(timerId, callback, delay, serviceName);
};

export const safeSetInterval = (
  callback: () => void,
  interval: number,
  serviceName: string,
  id?: string
): NodeJS.Timeout => {
  const intervalId = id || `${serviceName}-interval-${Date.now()}-${Math.random()}`;
  return memoryLeakPrevention.registerInterval(intervalId, callback, interval, serviceName);
};

export const registerCleanup = (
  id: string,
  cleanup: () => void | Promise<void>,
  serviceName: string,
  type: CleanupResource['type'] = 'other'
) => {
  memoryLeakPrevention.registerResource(id, type, null, cleanup, serviceName);
};

export default memoryLeakPrevention; 