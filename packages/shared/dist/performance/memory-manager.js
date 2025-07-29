"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAsyncCleanup = exports.withCleanup = exports.timerManager = exports.eventListenerManager = exports.memoryManager = exports.TimerManager = exports.EventListenerManager = exports.MemoryManager = void 0;
const logger_1 = require("../logging/logger");
const events_1 = require("events");
// Memory manager class
class MemoryManager extends events_1.EventEmitter {
    resources = new Map();
    monitoringInterval;
    thresholds;
    memoryHistory = [];
    maxHistorySize = 100;
    isMonitoring = false;
    constructor(thresholds) {
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
            logger_1.logger.error('Uncaught exception, cleaning up', { error: error.message });
            this.cleanup();
        });
    }
    /**
     * Start memory monitoring
     */
    startMonitoring(intervalMs = 30000) {
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
        logger_1.logger.info('Memory monitoring started', {
            interval: intervalMs,
            thresholds: this.thresholds,
        });
    }
    /**
     * Stop memory monitoring
     */
    stopMonitoring() {
        if (!this.isMonitoring) {
            return;
        }
        this.isMonitoring = false;
        this.unregisterResource('memory-monitor');
        logger_1.logger.info('Memory monitoring stopped');
    }
    /**
     * Register a resource for cleanup
     */
    registerResource(id, type, resource, cleanup) {
        const cleanupResource = {
            id,
            type,
            resource,
            cleanup,
            created: new Date(),
        };
        this.resources.set(id, cleanupResource);
        logger_1.logger.debug('Resource registered for cleanup', {
            id,
            type,
            totalResources: this.resources.size,
        });
    }
    /**
     * Unregister a resource
     */
    unregisterResource(id) {
        const resource = this.resources.get(id);
        if (resource) {
            try {
                resource.cleanup();
                this.resources.delete(id);
                logger_1.logger.debug('Resource unregistered and cleaned up', {
                    id,
                    type: resource.type,
                    totalResources: this.resources.size,
                });
            }
            catch (error) {
                logger_1.logger.error('Error cleaning up resource', {
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
    checkMemoryUsage() {
        const memoryUsage = process.memoryUsage();
        const usage = {
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
    checkThresholds(usage) {
        const heapUsedMB = usage.heapUsed;
        if (heapUsedMB >= this.thresholds.critical) {
            logger_1.logger.error('Critical memory usage detected', {
                heapUsed: heapUsedMB,
                threshold: this.thresholds.critical,
                totalResources: this.resources.size,
            });
            this.emit('critical-memory', usage);
            this.forceGarbageCollection();
        }
        else if (heapUsedMB >= this.thresholds.warning) {
            logger_1.logger.warn('High memory usage detected', {
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
    forceGarbageCollection() {
        if (global.gc) {
            try {
                global.gc();
                logger_1.logger.info('Garbage collection forced');
            }
            catch (error) {
                logger_1.logger.error('Failed to force garbage collection', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        else {
            logger_1.logger.warn('Garbage collection not available (run with --expose-gc)');
        }
    }
    /**
     * Get memory usage statistics
     */
    getMemoryStats() {
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
            rss: Math.round(this.memoryHistory.reduce((sum, usage) => sum + usage.rss, 0) / this.memoryHistory.length),
            heapTotal: Math.round(this.memoryHistory.reduce((sum, usage) => sum + usage.heapTotal, 0) /
                this.memoryHistory.length),
            heapUsed: Math.round(this.memoryHistory.reduce((sum, usage) => sum + usage.heapUsed, 0) /
                this.memoryHistory.length),
            external: Math.round(this.memoryHistory.reduce((sum, usage) => sum + usage.external, 0) /
                this.memoryHistory.length),
            arrayBuffers: Math.round(this.memoryHistory.reduce((sum, usage) => sum + usage.arrayBuffers, 0) /
                this.memoryHistory.length),
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
    getResourceTypeCounts() {
        const counts = {};
        for (const resource of this.resources.values()) {
            counts[resource.type] = (counts[resource.type] || 0) + 1;
        }
        return counts;
    }
    /**
     * Clean up old resources
     */
    cleanupOldResources(maxAgeMs = 3600000) {
        // 1 hour default
        const now = new Date();
        const resourcesToCleanup = [];
        for (const [id, resource] of this.resources.entries()) {
            const age = now.getTime() - resource.created.getTime();
            if (age > maxAgeMs) {
                resourcesToCleanup.push(id);
            }
        }
        resourcesToCleanup.forEach((id) => this.unregisterResource(id));
        if (resourcesToCleanup.length > 0) {
            logger_1.logger.info('Cleaned up old resources', {
                cleanedCount: resourcesToCleanup.length,
                maxAge: maxAgeMs,
            });
        }
    }
    /**
     * Clean up all resources
     */
    cleanup() {
        logger_1.logger.info('Starting memory manager cleanup', {
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
        logger_1.logger.info('Memory manager cleanup completed');
    }
    /**
     * Get resource details
     */
    getResourceDetails() {
        return Array.from(this.resources.values()).map((resource) => ({
            ...resource,
            resource: '[Object]', // Don't expose actual resource object
        }));
    }
}
exports.MemoryManager = MemoryManager;
// Event listener manager
class EventListenerManager {
    listeners = new Map();
    /**
     * Add event listener with automatic cleanup
     */
    addEventListener(id, target, event, listener, options) {
        // Remove existing listener if exists
        this.removeEventListener(id);
        // Add new listener
        if ('addEventListener' in target) {
            target.addEventListener(event, listener, options);
        }
        else {
            target.on(event, listener);
        }
        // Store for cleanup
        this.listeners.set(id, { target, event, listener, options });
    }
    /**
     * Remove event listener
     */
    removeEventListener(id) {
        const listenerInfo = this.listeners.get(id);
        if (listenerInfo) {
            const { target, event, listener, options } = listenerInfo;
            try {
                if ('removeEventListener' in target) {
                    target.removeEventListener(event, listener, options);
                }
                else {
                    target.off(event, listener);
                }
                this.listeners.delete(id);
            }
            catch (error) {
                logger_1.logger.error('Error removing event listener', {
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
    removeAllListeners() {
        const listenerIds = Array.from(this.listeners.keys());
        listenerIds.forEach((id) => this.removeEventListener(id));
    }
    /**
     * Get listener count
     */
    getListenerCount() {
        return this.listeners.size;
    }
}
exports.EventListenerManager = EventListenerManager;
// Timer manager
class TimerManager {
    timers = new Map();
    /**
     * Set timeout with automatic cleanup
     */
    setTimeout(id, callback, delay) {
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
    setInterval(id, callback, interval) {
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
    clearTimer(id) {
        const timerInfo = this.timers.get(id);
        if (timerInfo) {
            if (timerInfo.type === 'timeout') {
                clearTimeout(timerInfo.timer);
            }
            else {
                clearInterval(timerInfo.timer);
            }
            this.timers.delete(id);
        }
    }
    /**
     * Clear all timers
     */
    clearAllTimers() {
        const timerIds = Array.from(this.timers.keys());
        timerIds.forEach((id) => this.clearTimer(id));
    }
    /**
     * Get timer count
     */
    getTimerCount() {
        return this.timers.size;
    }
    /**
     * Get timer details
     */
    getTimerDetails() {
        const now = new Date();
        return Array.from(this.timers.entries()).map(([id, info]) => ({
            id,
            type: info.type,
            created: info.created,
            age: now.getTime() - info.created.getTime(),
        }));
    }
}
exports.TimerManager = TimerManager;
// Create global instances
exports.memoryManager = new MemoryManager();
exports.eventListenerManager = new EventListenerManager();
exports.timerManager = new TimerManager();
// Utility functions
const withCleanup = (fn, cleanup) => {
    const wrappedFn = ((...args) => {
        try {
            return fn(...args);
        }
        finally {
            cleanup();
        }
    });
    return wrappedFn;
};
exports.withCleanup = withCleanup;
const withAsyncCleanup = (fn, cleanup) => {
    const wrappedFn = (async (...args) => {
        try {
            return await fn(...args);
        }
        finally {
            await cleanup();
        }
    });
    return wrappedFn;
};
exports.withAsyncCleanup = withAsyncCleanup;
// Export default
exports.default = {
    MemoryManager,
    EventListenerManager,
    TimerManager,
    memoryManager: exports.memoryManager,
    eventListenerManager: exports.eventListenerManager,
    timerManager: exports.timerManager,
    withCleanup: exports.withCleanup,
    withAsyncCleanup: exports.withAsyncCleanup,
};
//# sourceMappingURL=memory-manager.js.map