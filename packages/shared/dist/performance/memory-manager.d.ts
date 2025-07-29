import { EventEmitter } from 'events';
export interface MemoryUsage {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
    timestamp: Date;
}
export interface MemoryThresholds {
    warning: number;
    critical: number;
    maxHeapSize: number;
}
export interface CleanupResource {
    id: string;
    type: 'interval' | 'timeout' | 'listener' | 'stream' | 'connection' | 'other';
    resource: any;
    cleanup: () => void;
    created: Date;
}
export declare class MemoryManager extends EventEmitter {
    private resources;
    private monitoringInterval?;
    private thresholds;
    private memoryHistory;
    private maxHistorySize;
    private isMonitoring;
    constructor(thresholds?: Partial<MemoryThresholds>);
    /**
     * Start memory monitoring
     */
    startMonitoring(intervalMs?: number): void;
    /**
     * Stop memory monitoring
     */
    stopMonitoring(): void;
    /**
     * Register a resource for cleanup
     */
    registerResource(id: string, type: CleanupResource['type'], resource: any, cleanup: () => void): void;
    /**
     * Unregister a resource
     */
    unregisterResource(id: string): void;
    /**
     * Check current memory usage
     */
    checkMemoryUsage(): MemoryUsage;
    /**
     * Check memory thresholds
     */
    private checkThresholds;
    /**
     * Force garbage collection if available
     */
    forceGarbageCollection(): void;
    /**
     * Get memory usage statistics
     */
    getMemoryStats(): {
        current: MemoryUsage;
        average: Partial<MemoryUsage>;
        peak: Partial<MemoryUsage>;
        resourceCount: number;
        resourceTypes: Record<string, number>;
    };
    /**
     * Get resource type counts
     */
    private getResourceTypeCounts;
    /**
     * Clean up old resources
     */
    cleanupOldResources(maxAgeMs?: number): void;
    /**
     * Clean up all resources
     */
    cleanup(): void;
    /**
     * Get resource details
     */
    getResourceDetails(): CleanupResource[];
}
export declare class EventListenerManager {
    private listeners;
    /**
     * Add event listener with automatic cleanup
     */
    addEventListener(id: string, target: EventTarget | NodeJS.EventEmitter, event: string, listener: Function, options?: any): void;
    /**
     * Remove event listener
     */
    removeEventListener(id: string): void;
    /**
     * Remove all event listeners
     */
    removeAllListeners(): void;
    /**
     * Get listener count
     */
    getListenerCount(): number;
}
export declare class TimerManager {
    private timers;
    /**
     * Set timeout with automatic cleanup
     */
    setTimeout(id: string, callback: () => void, delay: number): void;
    /**
     * Set interval with automatic cleanup
     */
    setInterval(id: string, callback: () => void, interval: number): void;
    /**
     * Clear specific timer
     */
    clearTimer(id: string): void;
    /**
     * Clear all timers
     */
    clearAllTimers(): void;
    /**
     * Get timer count
     */
    getTimerCount(): number;
    /**
     * Get timer details
     */
    getTimerDetails(): Array<{
        id: string;
        type: 'timeout' | 'interval';
        created: Date;
        age: number;
    }>;
}
export declare const memoryManager: MemoryManager;
export declare const eventListenerManager: EventListenerManager;
export declare const timerManager: TimerManager;
export declare const withCleanup: <T extends (...args: any[]) => any>(fn: T, cleanup: () => void) => T;
export declare const withAsyncCleanup: <T extends (...args: any[]) => Promise<any>>(fn: T, cleanup: () => void | Promise<void>) => T;
declare const _default: {
    MemoryManager: typeof MemoryManager;
    EventListenerManager: typeof EventListenerManager;
    TimerManager: typeof TimerManager;
    memoryManager: MemoryManager;
    eventListenerManager: EventListenerManager;
    timerManager: TimerManager;
    withCleanup: <T extends (...args: any[]) => any>(fn: T, cleanup: () => void) => T;
    withAsyncCleanup: <T extends (...args: any[]) => Promise<any>>(fn: T, cleanup: () => void | Promise<void>) => T;
};
export default _default;
//# sourceMappingURL=memory-manager.d.ts.map