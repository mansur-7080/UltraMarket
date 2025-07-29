"use strict";
/**
 * Professional Testing Utilities
 * Comprehensive test helpers and utilities for UltraMarket testing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.testDataGenerator = exports.AssertionHelper = exports.PerformanceTestHelper = exports.ApiTestHelper = exports.DatabaseTestHelper = exports.MockFunction = exports.TestRunner = void 0;
exports.createFactory = createFactory;
exports.waitFor = waitFor;
const perf_hooks_1 = require("perf_hooks");
const logger_1 = require("../logging/logger");
// =================== TEST UTILITIES ===================
/**
 * Test runner with metrics
 */
class TestRunner {
    config;
    metrics;
    startTime;
    constructor(config = {}) {
        this.config = {
            timeout: 30000,
            retries: 0,
            parallel: false,
            verbose: false,
            coverage: true,
            ...config,
        };
        this.metrics = {
            duration: 0,
            memoryUsage: process.memoryUsage(),
            passed: 0,
            failed: 0,
            skipped: 0,
            coverage: 0,
        };
        this.startTime = perf_hooks_1.performance.now();
    }
    /**
     * Run test with timeout and retries
     */
    async runTest(name, testFn, options = {}) {
        const testConfig = { ...this.config, ...options };
        let attempts = 0;
        let lastError = null;
        while (attempts <= testConfig.retries) {
            try {
                if (testConfig.verbose) {
                    logger_1.logger.debug(`Running test: ${name} (attempt ${attempts + 1})`);
                }
                await this.withTimeout(testFn, testConfig.timeout);
                this.metrics.passed++;
                if (testConfig.verbose) {
                    logger_1.logger.debug(`✓ ${name} passed`);
                }
                return true;
            }
            catch (error) {
                lastError = error;
                attempts++;
                if (attempts <= testConfig.retries) {
                    if (testConfig.verbose) {
                        logger_1.logger.warn(`✗ ${name} failed (attempt ${attempts}), retrying...`);
                    }
                    await this.delay(1000); // Wait 1 second before retry
                }
            }
        }
        this.metrics.failed++;
        if (testConfig.verbose) {
            logger_1.logger.error(`✗ ${name} failed after ${attempts} attempts:`, { error: lastError?.message });
        }
        return false;
    }
    /**
     * Run test with timeout
     */
    async withTimeout(fn, timeout) {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Test timeout after ${timeout}ms`)), timeout);
        });
        return Promise.race([Promise.resolve(fn()), timeoutPromise]);
    }
    /**
     * Delay execution
     */
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * Get test metrics
     */
    getMetrics() {
        this.metrics.duration = perf_hooks_1.performance.now() - this.startTime;
        this.metrics.memoryUsage = process.memoryUsage();
        return { ...this.metrics };
    }
}
exports.TestRunner = TestRunner;
// =================== MOCK UTILITIES ===================
/**
 * Advanced mock function
 */
class MockFunction {
    calls = [];
    config;
    callIndex = 0;
    constructor(config = {}) {
        this.config = config;
    }
    /**
     * Mock function implementation
     */
    async fn(...args) {
        this.calls.push(args);
        this.callIndex++;
        // Simulate delay if configured
        if (this.config.delay) {
            await new Promise((resolve) => setTimeout(resolve, this.config.delay));
        }
        // Throw error if configured
        if (this.config.throwError) {
            throw this.config.throwError;
        }
        // Return configured value
        if (this.config.returnValue !== undefined) {
            return typeof this.config.returnValue === 'function'
                ? this.config.returnValue(...args)
                : this.config.returnValue;
        }
        return undefined;
    }
    /**
     * Get call count
     */
    getCallCount() {
        return this.calls.length;
    }
    /**
     * Get call arguments
     */
    getCall(index) {
        return this.calls[index];
    }
    /**
     * Get all calls
     */
    getCalls() {
        return [...this.calls];
    }
    /**
     * Check if called with specific arguments
     */
    wasCalledWith(...args) {
        return this.calls.some((call) => call.length === args.length && call.every((arg, index) => this.deepEqual(arg, args[index])));
    }
    /**
     * Reset mock
     */
    reset() {
        this.calls = [];
        this.callIndex = 0;
    }
    /**
     * Deep equal comparison
     */
    deepEqual(a, b) {
        if (a === b) {
            return true;
        }
        if (a == null || b == null) {
            return false;
        }
        if (typeof a !== typeof b) {
            return false;
        }
        if (typeof a === 'object') {
            const keysA = Object.keys(a);
            const keysB = Object.keys(b);
            if (keysA.length !== keysB.length) {
                return false;
            }
            for (const key of keysA) {
                if (!keysB.includes(key)) {
                    return false;
                }
                if (!this.deepEqual(a[key], b[key])) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }
}
exports.MockFunction = MockFunction;
// =================== DATABASE TEST UTILITIES ===================
/**
 * Database test helper
 */
class DatabaseTestHelper {
    config;
    transactions = [];
    seedData = [];
    constructor(config) {
        this.config = config;
    }
    /**
     * Setup test database
     */
    async setup() {
        if (this.config.seedData) {
            await this.seedTestData();
        }
    }
    /**
     * Cleanup test database
     */
    async cleanup() {
        if (this.config.cleanupAfter) {
            await this.cleanupTestData();
        }
        // Rollback transactions
        for (const transaction of this.transactions) {
            try {
                await transaction.rollback();
            }
            catch (error) {
                console.warn('Failed to rollback transaction:', error);
            }
        }
        this.transactions = [];
    }
    /**
     * Create test transaction
     */
    async createTransaction(connection) {
        const transaction = await connection.beginTransaction();
        this.transactions.push(transaction);
        return transaction;
    }
    /**
     * Seed test data
     */
    async seedTestData() {
        // Implementation would depend on database type
        console.log('Seeding test data...');
    }
    /**
     * Cleanup test data
     */
    async cleanupTestData() {
        // Implementation would depend on database type
        console.log('Cleaning up test data...');
    }
}
exports.DatabaseTestHelper = DatabaseTestHelper;
// =================== API TEST UTILITIES ===================
/**
 * API test helper
 */
class ApiTestHelper {
    baseUrl;
    defaultHeaders;
    constructor(baseUrl, defaultHeaders = {}) {
        this.baseUrl = baseUrl;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            ...defaultHeaders,
        };
    }
    /**
     * Make HTTP request
     */
    async request(method, path, options = {}) {
        const startTime = perf_hooks_1.performance.now();
        const url = new URL(path, this.baseUrl);
        // Add query parameters
        if (options.query) {
            Object.entries(options.query).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });
        }
        const headers = {
            ...this.defaultHeaders,
            ...options.headers,
        };
        const requestOptions = {
            method: method.toUpperCase(),
            headers,
        };
        if (options.body) {
            requestOptions.body =
                typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
        }
        try {
            const response = await fetch(url.toString(), requestOptions);
            const responseTime = perf_hooks_1.performance.now() - startTime;
            let body;
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                body = await response.json();
            }
            else {
                body = await response.text();
            }
            return {
                status: response.status,
                headers: Object.fromEntries(response.headers.entries()),
                body,
                responseTime,
            };
        }
        catch (error) {
            throw new Error(`Request failed: ${error}`);
        }
    }
    /**
     * GET request
     */
    async get(path, options = {}) {
        return this.request('GET', path, options);
    }
    /**
     * POST request
     */
    async post(path, body, options = {}) {
        return this.request('POST', path, { ...options, body });
    }
    /**
     * PUT request
     */
    async put(path, body, options = {}) {
        return this.request('PUT', path, { ...options, body });
    }
    /**
     * DELETE request
     */
    async delete(path, options = {}) {
        return this.request('DELETE', path, options);
    }
    /**
     * Set authentication token
     */
    setAuthToken(token) {
        this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    /**
     * Clear authentication
     */
    clearAuth() {
        delete this.defaultHeaders['Authorization'];
    }
}
exports.ApiTestHelper = ApiTestHelper;
// =================== PERFORMANCE TEST UTILITIES ===================
/**
 * Performance test helper
 */
class PerformanceTestHelper {
    measurements = [];
    /**
     * Measure function execution time
     */
    async measure(name, fn) {
        const startTime = perf_hooks_1.performance.now();
        const startMemory = process.memoryUsage();
        try {
            const result = await fn();
            const endTime = perf_hooks_1.performance.now();
            const endMemory = process.memoryUsage();
            this.measurements.push({
                name,
                duration: endTime - startTime,
                memoryUsage: {
                    rss: endMemory.rss - startMemory.rss,
                    heapTotal: endMemory.heapTotal - startMemory.heapTotal,
                    heapUsed: endMemory.heapUsed - startMemory.heapUsed,
                    external: endMemory.external - startMemory.external,
                    arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers,
                },
                timestamp: new Date(),
            });
            return result;
        }
        catch (error) {
            const endTime = perf_hooks_1.performance.now();
            this.measurements.push({
                name: `${name} (failed)`,
                duration: endTime - startTime,
                memoryUsage: process.memoryUsage(),
                timestamp: new Date(),
            });
            throw error;
        }
    }
    /**
     * Load test function
     */
    async loadTest(name, fn, options) {
        const results = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            requestsPerSecond: 0,
            errors: [],
        };
        const startTime = perf_hooks_1.performance.now();
        const endTime = startTime + options.duration;
        const responseTimes = [];
        const promises = [];
        // Ramp up gradually if specified
        const rampUpDelay = options.rampUp ? options.rampUp / options.concurrent : 0;
        for (let i = 0; i < options.concurrent; i++) {
            const workerPromise = this.createWorker(fn, endTime, results, responseTimes);
            promises.push(workerPromise);
            if (rampUpDelay > 0) {
                await new Promise((resolve) => setTimeout(resolve, rampUpDelay));
            }
        }
        await Promise.all(promises);
        // Calculate metrics
        const totalDuration = perf_hooks_1.performance.now() - startTime;
        results.averageResponseTime =
            responseTimes.length > 0
                ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
                : 0;
        results.requestsPerSecond = (results.totalRequests / totalDuration) * 1000;
        return results;
    }
    /**
     * Create worker for load testing
     */
    async createWorker(fn, endTime, results, responseTimes) {
        while (perf_hooks_1.performance.now() < endTime) {
            const requestStart = perf_hooks_1.performance.now();
            results.totalRequests++;
            try {
                await fn();
                results.successfulRequests++;
                responseTimes.push(perf_hooks_1.performance.now() - requestStart);
            }
            catch (error) {
                results.failedRequests++;
                results.errors.push(error);
            }
        }
    }
    /**
     * Get performance measurements
     */
    getMeasurements() {
        return [...this.measurements];
    }
    /**
     * Get performance summary
     */
    getSummary() {
        if (this.measurements.length === 0) {
            return {
                totalMeasurements: 0,
                averageDuration: 0,
                minDuration: 0,
                maxDuration: 0,
                totalMemoryUsed: 0,
            };
        }
        const durations = this.measurements.map((m) => m.duration);
        const memoryUsages = this.measurements.map((m) => m.memoryUsage.heapUsed);
        return {
            totalMeasurements: this.measurements.length,
            averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
            minDuration: Math.min(...durations),
            maxDuration: Math.max(...durations),
            totalMemoryUsed: memoryUsages.reduce((a, b) => a + b, 0),
        };
    }
    /**
     * Clear measurements
     */
    clear() {
        this.measurements = [];
    }
}
exports.PerformanceTestHelper = PerformanceTestHelper;
// =================== ASSERTION UTILITIES ===================
/**
 * Custom assertion utilities
 */
class AssertionHelper {
    /**
     * Assert that value is truthy
     */
    static assertTrue(value, message) {
        if (!value) {
            throw new Error(message || `Expected truthy value, got: ${value}`);
        }
    }
    /**
     * Assert that value is falsy
     */
    static assertFalse(value, message) {
        if (value) {
            throw new Error(message || `Expected falsy value, got: ${value}`);
        }
    }
    /**
     * Assert equality
     */
    static assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, got: ${actual}`);
        }
    }
    /**
     * Assert deep equality
     */
    static assertDeepEqual(actual, expected, message) {
        if (!this.deepEqual(actual, expected)) {
            throw new Error(message || `Expected ${JSON.stringify(expected)}, got: ${JSON.stringify(actual)}`);
        }
    }
    /**
     * Assert that function throws
     */
    static async assertThrows(fn, expectedError, message) {
        try {
            await fn();
            throw new Error(message || 'Expected function to throw');
        }
        catch (error) {
            if (expectedError) {
                if (typeof expectedError === 'string') {
                    if (!error.message.includes(expectedError)) {
                        throw new Error(`Expected error message to contain "${expectedError}", got: ${error.message}`);
                    }
                }
                else if (expectedError instanceof RegExp) {
                    if (!expectedError.test(error.message)) {
                        throw new Error(`Expected error message to match ${expectedError}, got: ${error.message}`);
                    }
                }
                else if (expectedError instanceof Error) {
                    if (error.message !== expectedError.message) {
                        throw new Error(`Expected error message "${expectedError.message}", got: ${error.message}`);
                    }
                }
            }
        }
    }
    /**
     * Assert array contains element
     */
    static assertContains(array, element, message) {
        if (!array.includes(element)) {
            throw new Error(message || `Expected array to contain ${element}`);
        }
    }
    /**
     * Assert object has property
     */
    static assertHasProperty(object, property, message) {
        if (!(property in object)) {
            throw new Error(message || `Expected object to have property "${property}"`);
        }
    }
    /**
     * Deep equality check
     */
    static deepEqual(a, b) {
        if (a === b) {
            return true;
        }
        if (a == null || b == null) {
            return false;
        }
        if (typeof a !== typeof b) {
            return false;
        }
        if (typeof a === 'object') {
            const keysA = Object.keys(a);
            const keysB = Object.keys(b);
            if (keysA.length !== keysB.length) {
                return false;
            }
            for (const key of keysA) {
                if (!keysB.includes(key)) {
                    return false;
                }
                if (!this.deepEqual(a[key], b[key])) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }
}
exports.AssertionHelper = AssertionHelper;
// =================== UTILITY FUNCTIONS ===================
/**
 * Create test data factory
 */
function createFactory(template) {
    return (overrides = {}) => {
        return { ...template, ...overrides };
    };
}
/**
 * Wait for condition
 */
async function waitFor(condition, timeout = 5000, interval = 100) {
    const startTime = perf_hooks_1.performance.now();
    while (perf_hooks_1.performance.now() - startTime < timeout) {
        if (await condition()) {
            return;
        }
        await new Promise((resolve) => setTimeout(resolve, interval));
    }
    throw new Error(`Condition not met within ${timeout}ms`);
}
/**
 * Generate random test data
 */
exports.testDataGenerator = {
    string: (length = 10) => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    },
    number: (min = 0, max = 1000) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    email: () => {
        return `${exports.testDataGenerator.string(8)}@${exports.testDataGenerator.string(5)}.com`;
    },
    uuid: () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    },
    date: (start = new Date(2020, 0, 1), end = new Date()) => {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    },
    boolean: () => {
        return Math.random() > 0.5;
    },
    array: (generator, length = 5) => {
        return Array.from({ length }, generator);
    },
};
exports.default = {
    TestRunner,
    MockFunction,
    DatabaseTestHelper,
    ApiTestHelper,
    PerformanceTestHelper,
    AssertionHelper,
    createFactory,
    waitFor,
    testDataGenerator: exports.testDataGenerator,
};
//# sourceMappingURL=test-utils.js.map