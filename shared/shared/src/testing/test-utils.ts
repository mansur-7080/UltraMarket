/**
 * Professional Testing Utilities
 * Comprehensive test helpers and utilities for UltraMarket testing
 */

import { performance } from 'perf_hooks';
import { logger } from '../logging/logger';

// =================== TYPES ===================

export interface TestConfig {
  timeout: number;
  retries: number;
  parallel: boolean;
  verbose: boolean;
  coverage: boolean;
}

export interface MockConfig {
  returnValue?: any;
  throwError?: Error;
  delay?: number;
  callCount?: number;
}

export interface TestMetrics {
  duration: number;
  memoryUsage: NodeJS.MemoryUsage;
  passed: number;
  failed: number;
  skipped: number;
  coverage: number;
}

export interface DatabaseTestConfig {
  useTransaction: boolean;
  isolateTests: boolean;
  seedData: boolean;
  cleanupAfter: boolean;
}

// =================== TEST UTILITIES ===================

/**
 * Test runner with metrics
 */
export class TestRunner {
  private config: TestConfig;
  private metrics: TestMetrics;
  private startTime: number;

  constructor(config: Partial<TestConfig> = {}) {
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

    this.startTime = performance.now();
  }

  /**
   * Run test with timeout and retries
   */
  async runTest(
    name: string,
    testFn: () => Promise<void> | void,
    options: Partial<TestConfig> = {}
  ): Promise<boolean> {
    const testConfig = { ...this.config, ...options };
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts <= testConfig.retries) {
      try {
        if (testConfig.verbose) {
          logger.debug(`Running test: ${name} (attempt ${attempts + 1})`);
        }

        await this.withTimeout(testFn, testConfig.timeout);
        this.metrics.passed++;

        if (testConfig.verbose) {
          logger.debug(`✓ ${name} passed`);
        }

        return true;
      } catch (error) {
        lastError = error as Error;
        attempts++;

        if (attempts <= testConfig.retries) {
          if (testConfig.verbose) {
            logger.warn(`✗ ${name} failed (attempt ${attempts}), retrying...`);
          }
          await this.delay(1000); // Wait 1 second before retry
        }
      }
    }

    this.metrics.failed++;
    if (testConfig.verbose) {
      logger.error(`✗ ${name} failed after ${attempts} attempts:`, { error: lastError?.message });
    }

    return false;
  }

  /**
   * Run test with timeout
   */
  private async withTimeout<T>(fn: () => Promise<T> | T, timeout: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Test timeout after ${timeout}ms`)), timeout);
    });

    return Promise.race([Promise.resolve(fn()), timeoutPromise]);
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get test metrics
   */
  getMetrics(): TestMetrics {
    this.metrics.duration = performance.now() - this.startTime;
    this.metrics.memoryUsage = process.memoryUsage();
    return { ...this.metrics };
  }
}

// =================== MOCK UTILITIES ===================

/**
 * Advanced mock function
 */
export class MockFunction {
  private calls: any[][] = [];
  private config: MockConfig;
  private callIndex = 0;

  constructor(config: MockConfig = {}) {
    this.config = config;
  }

  /**
   * Mock function implementation
   */
  async fn(...args: any[]): Promise<any> {
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
  getCallCount(): number {
    return this.calls.length;
  }

  /**
   * Get call arguments
   */
  getCall(index: number): any[] | undefined {
    return this.calls[index];
  }

  /**
   * Get all calls
   */
  getCalls(): any[][] {
    return [...this.calls];
  }

  /**
   * Check if called with specific arguments
   */
  wasCalledWith(...args: any[]): boolean {
    return this.calls.some(
      (call) =>
        call.length === args.length && call.every((arg, index) => this.deepEqual(arg, args[index]))
    );
  }

  /**
   * Reset mock
   */
  reset(): void {
    this.calls = [];
    this.callIndex = 0;
  }

  /**
   * Deep equal comparison
   */
  private deepEqual(a: any, b: any): boolean {
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

// =================== DATABASE TEST UTILITIES ===================

/**
 * Database test helper
 */
export class DatabaseTestHelper {
  private config: DatabaseTestConfig;
  private transactions: any[] = [];
  private seedData: any[] = [];

  constructor(config: DatabaseTestConfig) {
    this.config = config;
  }

  /**
   * Setup test database
   */
  async setup(): Promise<void> {
    if (this.config.seedData) {
      await this.seedTestData();
    }
  }

  /**
   * Cleanup test database
   */
  async cleanup(): Promise<void> {
    if (this.config.cleanupAfter) {
      await this.cleanupTestData();
    }

    // Rollback transactions
    for (const transaction of this.transactions) {
      try {
        await transaction.rollback();
      } catch (error) {
        console.warn('Failed to rollback transaction:', error);
      }
    }
    this.transactions = [];
  }

  /**
   * Create test transaction
   */
  async createTransaction(connection: any): Promise<any> {
    const transaction = await connection.beginTransaction();
    this.transactions.push(transaction);
    return transaction;
  }

  /**
   * Seed test data
   */
  private async seedTestData(): Promise<void> {
    // Implementation would depend on database type
    console.log('Seeding test data...');
  }

  /**
   * Cleanup test data
   */
  private async cleanupTestData(): Promise<void> {
    // Implementation would depend on database type
    console.log('Cleaning up test data...');
  }
}

// =================== API TEST UTILITIES ===================

/**
 * API test helper
 */
export class ApiTestHelper {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string, defaultHeaders: Record<string, string> = {}) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    };
  }

  /**
   * Make HTTP request
   */
  async request(
    method: string,
    path: string,
    options: {
      body?: any;
      headers?: Record<string, string>;
      query?: Record<string, string>;
    } = {}
  ): Promise<{
    status: number;
    headers: Record<string, string>;
    body: any;
    responseTime: number;
  }> {
    const startTime = performance.now();
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

    const requestOptions: RequestInit = {
      method: method.toUpperCase(),
      headers,
    };

    if (options.body) {
      requestOptions.body =
        typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url.toString(), requestOptions);
      const responseTime = performance.now() - startTime;

      let body: any;
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        body = await response.json();
      } else {
        body = await response.text();
      }

      return {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body,
        responseTime,
      };
    } catch (error) {
      throw new Error(`Request failed: ${error}`);
    }
  }

  /**
   * GET request
   */
  async get(
    path: string,
    options: { headers?: Record<string, string>; query?: Record<string, string> } = {}
  ) {
    return this.request('GET', path, options);
  }

  /**
   * POST request
   */
  async post(path: string, body?: any, options: { headers?: Record<string, string> } = {}) {
    return this.request('POST', path, { ...options, body });
  }

  /**
   * PUT request
   */
  async put(path: string, body?: any, options: { headers?: Record<string, string> } = {}) {
    return this.request('PUT', path, { ...options, body });
  }

  /**
   * DELETE request
   */
  async delete(path: string, options: { headers?: Record<string, string> } = {}) {
    return this.request('DELETE', path, options);
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Clear authentication
   */
  clearAuth(): void {
    delete this.defaultHeaders['Authorization'];
  }
}

// =================== PERFORMANCE TEST UTILITIES ===================

/**
 * Performance test helper
 */
export class PerformanceTestHelper {
  private measurements: Array<{
    name: string;
    duration: number;
    memoryUsage: NodeJS.MemoryUsage;
    timestamp: Date;
  }> = [];

  /**
   * Measure function execution time
   */
  async measure<T>(name: string, fn: () => Promise<T> | T): Promise<T> {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();

    try {
      const result = await fn();
      const endTime = performance.now();
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
    } catch (error) {
      const endTime = performance.now();

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
  async loadTest(
    name: string,
    fn: () => Promise<void> | void,
    options: {
      concurrent: number;
      duration: number; // milliseconds
      rampUp?: number; // milliseconds
    }
  ): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    requestsPerSecond: number;
    errors: Error[];
  }> {
    const results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      requestsPerSecond: 0,
      errors: [] as Error[],
    };

    const startTime = performance.now();
    const endTime = startTime + options.duration;
    const responseTimes: number[] = [];
    const promises: Promise<void>[] = [];

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
    const totalDuration = performance.now() - startTime;
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
  private async createWorker(
    fn: () => Promise<void> | void,
    endTime: number,
    results: any,
    responseTimes: number[]
  ): Promise<void> {
    while (performance.now() < endTime) {
      const requestStart = performance.now();
      results.totalRequests++;

      try {
        await fn();
        results.successfulRequests++;
        responseTimes.push(performance.now() - requestStart);
      } catch (error) {
        results.failedRequests++;
        results.errors.push(error as Error);
      }
    }
  }

  /**
   * Get performance measurements
   */
  getMeasurements(): Array<{
    name: string;
    duration: number;
    memoryUsage: NodeJS.MemoryUsage;
    timestamp: Date;
  }> {
    return [...this.measurements];
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    totalMeasurements: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    totalMemoryUsed: number;
  } {
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
  clear(): void {
    this.measurements = [];
  }
}

// =================== ASSERTION UTILITIES ===================

/**
 * Custom assertion utilities
 */
export class AssertionHelper {
  /**
   * Assert that value is truthy
   */
  static assertTrue(value: any, message?: string): void {
    if (!value) {
      throw new Error(message || `Expected truthy value, got: ${value}`);
    }
  }

  /**
   * Assert that value is falsy
   */
  static assertFalse(value: any, message?: string): void {
    if (value) {
      throw new Error(message || `Expected falsy value, got: ${value}`);
    }
  }

  /**
   * Assert equality
   */
  static assertEqual(actual: any, expected: any, message?: string): void {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got: ${actual}`);
    }
  }

  /**
   * Assert deep equality
   */
  static assertDeepEqual(actual: any, expected: any, message?: string): void {
    if (!this.deepEqual(actual, expected)) {
      throw new Error(
        message || `Expected ${JSON.stringify(expected)}, got: ${JSON.stringify(actual)}`
      );
    }
  }

  /**
   * Assert that function throws
   */
  static async assertThrows(
    fn: () => Promise<any> | any,
    expectedError?: string | RegExp | Error,
    message?: string
  ): Promise<void> {
    try {
      await fn();
      throw new Error(message || 'Expected function to throw');
    } catch (error) {
      if (expectedError) {
        if (typeof expectedError === 'string') {
          if (!(error as Error).message.includes(expectedError)) {
            throw new Error(
              `Expected error message to contain "${expectedError}", got: ${(error as Error).message}`
            );
          }
        } else if (expectedError instanceof RegExp) {
          if (!expectedError.test((error as Error).message)) {
            throw new Error(
              `Expected error message to match ${expectedError}, got: ${(error as Error).message}`
            );
          }
        } else if (expectedError instanceof Error) {
          if ((error as Error).message !== expectedError.message) {
            throw new Error(
              `Expected error message "${expectedError.message}", got: ${(error as Error).message}`
            );
          }
        }
      }
    }
  }

  /**
   * Assert array contains element
   */
  static assertContains(array: any[], element: any, message?: string): void {
    if (!array.includes(element)) {
      throw new Error(message || `Expected array to contain ${element}`);
    }
  }

  /**
   * Assert object has property
   */
  static assertHasProperty(object: any, property: string, message?: string): void {
    if (!(property in object)) {
      throw new Error(message || `Expected object to have property "${property}"`);
    }
  }

  /**
   * Deep equality check
   */
  private static deepEqual(a: any, b: any): boolean {
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

// =================== UTILITY FUNCTIONS ===================

/**
 * Create test data factory
 */
export function createFactory<T>(template: T): (overrides?: Partial<T>) => T {
  return (overrides = {}) => {
    return { ...template, ...overrides };
  };
}

/**
 * Wait for condition
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = performance.now();

  while (performance.now() - startTime < timeout) {
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
export const testDataGenerator = {
  string: (length = 10): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  },

  number: (min = 0, max = 1000): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  email: (): string => {
    return `${testDataGenerator.string(8)}@${testDataGenerator.string(5)}.com`;
  },

  uuid: (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },

  date: (start = new Date(2020, 0, 1), end = new Date()): Date => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  },

  boolean: (): boolean => {
    return Math.random() > 0.5;
  },

  array: <T>(generator: () => T, length = 5): T[] => {
    return Array.from({ length }, generator);
  },
};

export default {
  TestRunner,
  MockFunction,
  DatabaseTestHelper,
  ApiTestHelper,
  PerformanceTestHelper,
  AssertionHelper,
  createFactory,
  waitFor,
  testDataGenerator,
};
