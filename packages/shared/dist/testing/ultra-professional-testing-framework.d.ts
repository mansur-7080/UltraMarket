/**
 * 🚀 ULTRA PROFESSIONAL TESTING FRAMEWORK
 * UltraMarket E-commerce Platform
 *
 * Comprehensive testing framework featuring:
 * - Advanced unit testing utilities with mocking
 * - Integration testing helpers and database setup
 * - End-to-end testing automation
 * - Performance testing and benchmarking
 * - Visual regression testing
 * - API testing and contract validation
 * - Test coverage analysis and reporting
 * - Parallel test execution
 * - Test data factories and fixtures
 * - Custom matchers and assertions
 *
 * @author UltraMarket Testing Team
 * @version 8.0.0
 * @date 2024-12-28
 */
import { jest } from '@jest/globals';
export interface TestConfig {
    environment: 'unit' | 'integration' | 'e2e' | 'performance';
    database: {
        enableTestDB: boolean;
        testDBUrl: string;
        seedData: boolean;
        cleanupAfterTests: boolean;
        transactionalTests: boolean;
    };
    api: {
        baseUrl: string;
        timeout: number;
        retries: number;
        enableMocking: boolean;
        mockDelay?: number;
    };
    performance: {
        enableBenchmarks: boolean;
        memoryThreshold: number;
        timeThreshold: number;
        cpuThreshold: number;
    };
    coverage: {
        statements: number;
        branches: number;
        functions: number;
        lines: number;
        excludePatterns: string[];
    };
    parallel: {
        enabled: boolean;
        workers: number;
        maxConcurrency: number;
    };
}
export interface TestSuite {
    name: string;
    description: string;
    type: 'unit' | 'integration' | 'e2e' | 'performance';
    setup?: () => Promise<void>;
    teardown?: () => Promise<void>;
    tests: TestCase[];
    tags: string[];
    priority: 'high' | 'medium' | 'low';
    timeout?: number;
}
export interface TestCase {
    name: string;
    description: string;
    test: () => Promise<void>;
    setup?: () => Promise<void>;
    teardown?: () => Promise<void>;
    tags: string[];
    expectedDuration?: number;
    retries?: number;
}
export interface TestResult {
    suiteName: string;
    testName: string;
    status: 'passed' | 'failed' | 'skipped' | 'timeout';
    duration: number;
    error?: Error;
    coverage?: CoverageData;
    performance?: PerformanceData;
    timestamp: Date;
}
export interface CoverageData {
    statements: {
        covered: number;
        total: number;
        percentage: number;
    };
    branches: {
        covered: number;
        total: number;
        percentage: number;
    };
    functions: {
        covered: number;
        total: number;
        percentage: number;
    };
    lines: {
        covered: number;
        total: number;
        percentage: number;
    };
    files: Array<{
        path: string;
        coverage: number;
        uncoveredLines: number[];
    }>;
}
export interface PerformanceData {
    memoryUsage: number;
    executionTime: number;
    cpuUsage: number;
    networkRequests: number;
    cacheHits: number;
    dbQueries: number;
}
export interface MockData {
    users: any[];
    products: any[];
    orders: any[];
    categories: any[];
    reviews: any[];
}
/**
 * Advanced Test Data Factory
 */
export declare class TestDataFactory {
    private static sequences;
    /**
     * Generate unique sequence number
     */
    private static sequence;
    /**
     * Create test user
     */
    static createUser(overrides?: Partial<any>): any;
    /**
     * Create test product
     */
    static createProduct(overrides?: Partial<any>): any;
    /**
     * Create test order
     */
    static createOrder(overrides?: Partial<any>): any;
    /**
     * Create test category
     */
    static createCategory(overrides?: Partial<any>): any;
    /**
     * Create test review
     */
    static createReview(overrides?: Partial<any>): any;
    /**
     * Create complete test dataset
     */
    static createTestDataset(counts?: {
        users?: number;
        products?: number;
        orders?: number;
        categories?: number;
        reviews?: number;
    }): MockData;
    /**
     * Reset sequences
     */
    static resetSequences(): void;
}
/**
 * API Mocking Server
 */
export declare class ApiMockServer {
    private server;
    private testData;
    constructor(testData?: MockData);
    /**
     * Create MSW handlers
     */
    private createHandlers;
    /**
     * Start mock server
     */
    start(): void;
    /**
     * Reset handlers
     */
    reset(): void;
    /**
     * Close server
     */
    close(): void;
    /**
     * Add custom handler
     */
    addHandler(handler: any): void;
    /**
     * Update test data
     */
    updateTestData(newData: Partial<MockData>): void;
}
/**
 * Performance Testing Utilities
 */
export declare class PerformanceTester {
    private static results;
    /**
     * Benchmark function execution
     */
    static benchmark(name: string, fn: () => Promise<any> | any, iterations?: number): Promise<PerformanceData>;
    /**
     * Memory leak detection
     */
    static detectMemoryLeaks(fn: () => Promise<any> | any, threshold?: number): Promise<boolean>;
    /**
     * Get performance report
     */
    static getReport(): {
        averageExecutionTime: number;
        totalMemoryUsage: number;
        totalNetworkRequests: number;
        benchmarks: number;
    };
    /**
     * Reset results
     */
    static reset(): void;
}
/**
 * Advanced Test Utilities
 */
export declare class TestUtils {
    /**
     * Wait for condition with timeout
     */
    static waitForCondition(condition: () => boolean | Promise<boolean>, timeout?: number, interval?: number): Promise<boolean>;
    /**
     * Mock local storage
     */
    static mockLocalStorage(): {
        getItem: jest.Mock;
        setItem: jest.Mock;
        removeItem: jest.Mock;
        clear: jest.Mock;
    };
    /**
     * Mock fetch API
     */
    static mockFetch(responses: Record<string, any>): jest.Mock;
    /**
     * Generate random test data
     */
    static randomString(length?: number): string;
    /**
     * Random number between min and max
     */
    static randomNumber(min?: number, max?: number): number;
    /**
     * Random email generator
     */
    static randomEmail(): string;
    /**
     * Deep clone object
     */
    static deepClone<T>(obj: T): T;
    /**
     * Assert error thrown
     */
    static assertThrows(fn: () => Promise<any> | any, expectedError?: string | RegExp): Promise<Error>;
}
/**
 * Custom Jest Matchers
 */
export declare const customMatchers: {
    toBeValidEmail: (received: string) => {
        message: () => string;
        pass: boolean;
    };
    toBeValidUUID: (received: string) => {
        message: () => string;
        pass: boolean;
    };
    toBeWithinTimeRange: (received: Date, expected: Date, toleranceMs?: number) => {
        message: () => string;
        pass: boolean;
    };
    toHaveValidStructure: (received: any, expectedStructure: any) => {
        message: () => string;
        pass: boolean;
    };
};
export declare const testDataFactory: typeof TestDataFactory;
export declare const apiMockServer: ApiMockServer;
export declare const performanceTester: typeof PerformanceTester;
export declare const testUtils: typeof TestUtils;
declare const _default: {
    TestDataFactory: typeof TestDataFactory;
    ApiMockServer: typeof ApiMockServer;
    PerformanceTester: typeof PerformanceTester;
    TestUtils: typeof TestUtils;
    customMatchers: {
        toBeValidEmail: (received: string) => {
            message: () => string;
            pass: boolean;
        };
        toBeValidUUID: (received: string) => {
            message: () => string;
            pass: boolean;
        };
        toBeWithinTimeRange: (received: Date, expected: Date, toleranceMs?: number) => {
            message: () => string;
            pass: boolean;
        };
        toHaveValidStructure: (received: any, expectedStructure: any) => {
            message: () => string;
            pass: boolean;
        };
    };
};
export default _default;
//# sourceMappingURL=ultra-professional-testing-framework.d.ts.map