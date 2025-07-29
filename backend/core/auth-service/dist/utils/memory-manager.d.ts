interface MemoryThresholds {
    warning: number;
    critical: number;
    emergency: number;
}
interface MemoryStats {
    used: number;
    total: number;
    free: number;
    percentage: number;
    status: 'healthy' | 'warning' | 'critical' | 'emergency';
}
export declare class MemoryManager {
    private static instance;
    private thresholds;
    private cleanupTasks;
    private monitoringInterval;
    private isMonitoring;
    constructor();
    static getInstance(): MemoryManager;
    getMemoryStats(): MemoryStats;
    startMonitoring(intervalMs?: number): void;
    stopMonitoring(): void;
    private checkMemoryUsage;
    registerCleanupTask(id: string, task: () => void): void;
    unregisterCleanupTask(id: string): void;
    private performCleanup;
    private forceGarbageCollection;
    private restartIfNeeded;
    getMemorySummary(): any;
    setThresholds(thresholds: Partial<MemoryThresholds>): void;
}
export declare const memoryManager: MemoryManager;
export {};
//# sourceMappingURL=memory-manager.d.ts.map