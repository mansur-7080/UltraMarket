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
export declare class MemoryLeakPrevention extends EventEmitter {
    private static instance;
    private resources;
    private timers;
    private intervals;
    private eventListeners;
    private serviceResources;
    private isShuttingDown;
    private cleanupInterval?;
    private constructor();
    static getInstance(): MemoryLeakPrevention;
    /**
     * Register service with memory manager
     */
    registerService(serviceName: string): void;
    /**
     * Register a resource for automatic cleanup
     */
    registerResource(id: string, type: CleanupResource['type'], resource: any, cleanup: () => void | Promise<void>, serviceName: string): void;
    /**
     * Register event listener with automatic cleanup
     */
    registerEventListener(id: string, target: EventEmitter | NodeJS.EventEmitter | any, event: string, handler: Function, serviceName: string): void;
    /**
     * Register timer with automatic cleanup
     */
    registerTimer(id: string, callback: () => void, delay: number, serviceName: string): NodeJS.Timeout;
    /**
     * Register interval with automatic cleanup
     */
    registerInterval(id: string, callback: () => void, interval: number, serviceName: string): NodeJS.Timeout;
    /**
     * Remove event listener
     */
    private removeEventListener;
    /**
     * Clear timer
     */
    private clearTimer;
    /**
     * Clear interval
     */
    private clearInterval;
    /**
     * Unregister a resource
     */
    unregisterResource(id: string): void;
    /**
     * Clean up all resources for a specific service
     */
    cleanupService(serviceName: string): Promise<void>;
    /**
     * Periodic cleanup of old resources
     */
    private startPeriodicCleanup;
    private periodicCleanup;
    /**
     * Get memory statistics
     */
    getMemoryStats(): any;
    /**
     * Complete shutdown - Clean up everything
     */
    shutdown(): Promise<void>;
    /**
     * Setup process handlers for automatic cleanup
     */
    private setupProcessHandlers;
}
export declare const memoryLeakPrevention: MemoryLeakPrevention;
/**
 * Utility functions for easy resource management
 */
export declare const safeEventListener: (target: any, event: string, handler: Function, serviceName: string, id?: string) => string;
export declare const safeSetTimeout: (callback: () => void, delay: number, serviceName: string, id?: string) => NodeJS.Timeout;
export declare const safeSetInterval: (callback: () => void, interval: number, serviceName: string, id?: string) => NodeJS.Timeout;
export declare const registerCleanup: (id: string, cleanup: () => void | Promise<void>, serviceName: string, type?: CleanupResource["type"]) => void;
export default memoryLeakPrevention;
//# sourceMappingURL=memory-leak-prevention.d.ts.map