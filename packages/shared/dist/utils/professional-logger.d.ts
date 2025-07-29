import winston from 'winston';
export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    HTTP = "http",
    DEBUG = "debug",
    VERBOSE = "verbose"
}
export declare enum LogCategory {
    PERFORMANCE_TEST = "performance-test",
    SECURITY_AUDIT = "security-audit",
    LOAD_TEST = "load-test",
    E2E_TEST = "e2e-test",
    INTEGRATION_TEST = "integration-test",
    PENETRATION_TEST = "penetration-test"
}
declare class ProfessionalLogger {
    private loggers;
    private logDir;
    constructor();
    private ensureLogDirectory;
    private initializeLoggers;
    private getEmojiForLevel;
    getLogger(category: LogCategory): winston.Logger;
    performanceTest(level: LogLevel, message: string, meta?: any): void;
    securityAudit(level: LogLevel, message: string, meta?: any): void;
    loadTest(level: LogLevel, message: string, meta?: any): void;
    penetrationTest(level: LogLevel, message: string, meta?: any): void;
    log(category: LogCategory, level: LogLevel, message: string, meta?: any): void;
    testStart(category: LogCategory, testName: string, meta?: any): void;
    testComplete(category: LogCategory, testName: string, duration: number, results?: any): void;
    testError(category: LogCategory, testName: string, error: Error | string, meta?: any): void;
    securityVulnerability(severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW', vulnerability: string, details: any): void;
    performanceMetric(metricName: string, value: number, unit: string, meta?: any): void;
    close(): void;
}
export declare const professionalLogger: ProfessionalLogger;
export declare const testLogger: {
    performanceTest: (level: LogLevel, message: string, meta?: any) => void;
    securityAudit: (level: LogLevel, message: string, meta?: any) => void;
    loadTest: (level: LogLevel, message: string, meta?: any) => void;
    penetrationTest: (level: LogLevel, message: string, meta?: any) => void;
    testStart: (category: LogCategory, testName: string, meta?: any) => void;
    testComplete: (category: LogCategory, testName: string, duration: number, results?: any) => void;
    testError: (category: LogCategory, testName: string, error: Error | string, meta?: any) => void;
    securityVulnerability: (severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW", vulnerability: string, details: any) => void;
    performanceMetric: (metricName: string, value: number, unit: string, meta?: any) => void;
};
export default professionalLogger;
//# sourceMappingURL=professional-logger.d.ts.map