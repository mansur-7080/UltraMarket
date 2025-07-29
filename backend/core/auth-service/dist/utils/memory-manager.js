"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryManager = exports.MemoryManager = void 0;
const logger_1 = require("./logger");
class MemoryManager {
    static instance;
    thresholds;
    cleanupTasks = new Map();
    monitoringInterval = null;
    isMonitoring = false;
    constructor() {
        this.thresholds = {
            warning: 70,
            critical: 85,
            emergency: 95,
        };
    }
    static getInstance() {
        if (!MemoryManager.instance) {
            MemoryManager.instance = new MemoryManager();
        }
        return MemoryManager.instance;
    }
    getMemoryStats() {
        const memUsage = process.memoryUsage();
        const total = memUsage.heapTotal;
        const used = memUsage.heapUsed;
        const free = total - used;
        const percentage = (used / total) * 100;
        let status = 'healthy';
        if (percentage >= this.thresholds.emergency) {
            status = 'emergency';
        }
        else if (percentage >= this.thresholds.critical) {
            status = 'critical';
        }
        else if (percentage >= this.thresholds.warning) {
            status = 'warning';
        }
        return {
            used: Math.round(used / 1024 / 1024),
            total: Math.round(total / 1024 / 1024),
            free: Math.round(free / 1024 / 1024),
            percentage: Math.round(percentage * 100) / 100,
            status,
        };
    }
    startMonitoring(intervalMs = 30000) {
        if (this.isMonitoring) {
            logger_1.logger.warn('Memory monitoring is already active');
            return;
        }
        this.isMonitoring = true;
        this.monitoringInterval = setInterval(() => {
            this.checkMemoryUsage();
        }, intervalMs);
        logger_1.logger.info('Memory monitoring started', { intervalMs });
    }
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.isMonitoring = false;
        logger_1.logger.info('Memory monitoring stopped');
    }
    checkMemoryUsage() {
        const stats = this.getMemoryStats();
        logger_1.logger.debug('Memory usage check', {
            used: `${stats.used}MB`,
            total: `${stats.total}MB`,
            percentage: `${stats.percentage}%`,
            status: stats.status,
        });
        switch (stats.status) {
            case 'warning':
                logger_1.logger.warn('Memory usage is high', { stats });
                this.performCleanup('warning');
                break;
            case 'critical':
                logger_1.logger.error('Memory usage is critical', { stats });
                this.performCleanup('critical');
                this.forceGarbageCollection();
                break;
            case 'emergency':
                logger_1.logger.error('Memory usage is at emergency level', { stats });
                this.performCleanup('emergency');
                this.forceGarbageCollection();
                this.restartIfNeeded();
                break;
            default:
                break;
        }
    }
    registerCleanupTask(id, task) {
        this.cleanupTasks.set(id, task);
        logger_1.logger.debug('Cleanup task registered', { id });
    }
    unregisterCleanupTask(id) {
        this.cleanupTasks.delete(id);
        logger_1.logger.debug('Cleanup task unregistered', { id });
    }
    performCleanup(level) {
        logger_1.logger.info(`Performing memory cleanup (${level})`);
        let cleanedCount = 0;
        for (const [id, task] of this.cleanupTasks) {
            try {
                task();
                cleanedCount++;
                logger_1.logger.debug('Cleanup task executed', { id });
            }
            catch (error) {
                logger_1.logger.error('Cleanup task failed', { id, error });
            }
        }
        logger_1.logger.info('Memory cleanup completed', {
            level,
            tasksExecuted: cleanedCount,
            totalTasks: this.cleanupTasks.size
        });
    }
    forceGarbageCollection() {
        if (global.gc) {
            try {
                global.gc();
                logger_1.logger.info('Garbage collection forced');
            }
            catch (error) {
                logger_1.logger.error('Failed to force garbage collection', { error });
            }
        }
        else {
            logger_1.logger.warn('Garbage collection not available (use --expose-gc flag)');
        }
    }
    restartIfNeeded() {
        const stats = this.getMemoryStats();
        if (stats.status === 'emergency' && stats.percentage > 98) {
            logger_1.logger.error('Memory usage critical - restarting process', { stats });
            setTimeout(() => {
                process.exit(1);
            }, 5000);
        }
    }
    getMemorySummary() {
        const stats = this.getMemoryStats();
        return {
            ...stats,
            monitoring: this.isMonitoring,
            cleanupTasks: this.cleanupTasks.size,
            uptime: process.uptime(),
            pid: process.pid,
        };
    }
    setThresholds(thresholds) {
        this.thresholds = { ...this.thresholds, ...thresholds };
        logger_1.logger.info('Memory thresholds updated', { thresholds: this.thresholds });
    }
}
exports.MemoryManager = MemoryManager;
exports.memoryManager = MemoryManager.getInstance();
//# sourceMappingURL=memory-manager.js.map