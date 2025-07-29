"use strict";
var AdvancedCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedCacheService = void 0;
const tslib_1 = require("tslib");
// import { Injectable, Logger } from '@nestjs/common'; // Optional import
// import { InjectRedis } from '@nestjs-modules/ioredis'; // Optional import
const ioredis_1 = require("ioredis");
const lru_cache_1 = require("lru-cache");
const crypto = tslib_1.__importStar(require("crypto"));
// Optional NestJS imports with fallbacks
let Injectable = null;
let Logger = null;
let InjectRedis = null;
try {
    const nestCommon = require('@nestjs/common');
    const nestRedis = require('@nestjs-modules/ioredis');
    Injectable = nestCommon.Injectable;
    Logger = nestCommon.Logger;
    InjectRedis = nestRedis.InjectRedis;
}
catch (error) {
    console.warn('NestJS modules not available, using fallback implementations');
    Injectable = () => (target) => target;
    Logger = class MockLogger {
        constructor(name) { }
        log(message) { }
        error(message) { }
        warn(message) { }
        debug(message) { }
    };
    InjectRedis = () => (target, propertyKey) => { };
}
let AdvancedCacheService = AdvancedCacheService_1 = class AdvancedCacheService {
    logger = new Logger(AdvancedCacheService_1.name);
    redis;
    // Memory cache (L1)
    memoryCache;
    // Cache layers
    layers = new Map();
    // Cache statistics
    stats = {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalKeys: 0,
        totalSize: 0,
        memoryUsage: 0,
        operations: {
            get: 0,
            set: 0,
            delete: 0,
            invalidate: 0,
        },
    };
    // Cache invalidation patterns
    invalidationPatterns = new Map();
    tagDependencies = new Map();
    /**
     * Enhanced monitoring system for cache performance and health
     * This collects detailed metrics about cache usage patterns
     */
    monitoringSystem = {
        // Cache performance metrics
        metrics: {
            avgGetTime: 0, // Average time for get operations in ms
            avgSetTime: 0, // Average time for set operations in ms
            p95GetTime: 0, // 95th percentile get operation time
            p95SetTime: 0, // 95th percentile set operation time
            evictionRate: 0, // Rate of cache evictions per minute
            storageEfficiency: 0, // Ratio of useful data to total data size
            compressionRatio: 0, // Average compression ratio achieved
            cacheThroughput: 0, // Operations per second
        },
        // Performance timings collection
        timings: {
            get: [], // Collection of recent get operation times
            set: [], // Collection of recent set operation times
            maxSamples: 1000, // Maximum samples to keep for calculations
        },
        // Health indicators
        health: {
            status: 'healthy', // Overall health status
            redisConnected: true, // Redis connection status
            memoryUsage: 0, // Memory cache usage percentage
            errorRate: 0, // Error rate in the last monitoring window
            degradedSince: null, // When service became degraded, if applicable
        },
        // Record operation timing
        recordTiming(operation, timeMs) {
            const timings = this.timings[operation];
            // Add new timing, keeping array at fixed size
            if (timings.length >= this.timings.maxSamples) {
                timings.shift();
            }
            timings.push(timeMs);
            // Update metrics periodically instead of on every operation
            if (timings.length % 100 === 0) {
                this.updateMetrics(operation);
            }
        },
        // Calculate statistics for an operation
        updateMetrics(operation) {
            const timings = this.timings[operation];
            if (timings.length === 0)
                return;
            // Sort timings for percentile calculation
            const sortedTimings = [...timings].sort((a, b) => a - b);
            // Calculate average
            const avg = timings.reduce((sum, time) => sum + time, 0) / timings.length;
            // Calculate 95th percentile
            const p95Index = Math.floor(timings.length * 0.95);
            const p95 = sortedTimings[p95Index];
            // Update appropriate metrics
            if (operation === 'get') {
                this.metrics.avgGetTime = Math.round(avg * 100) / 100;
                this.metrics.p95GetTime = Math.round(p95 * 100) / 100;
            }
            else {
                this.metrics.avgSetTime = Math.round(avg * 100) / 100;
                this.metrics.p95SetTime = Math.round(p95 * 100) / 100;
            }
        },
        // Update health status based on current metrics
        updateHealth() {
            // Check Redis connection
            this.health.redisConnected = this.checkRedisConnection();
            // Calculate memory usage
            this.health.memoryUsage = this.calculateMemoryUsage();
            // Determine overall status
            if (!this.health.redisConnected || this.health.errorRate > 0.05) {
                this.health.status = 'critical';
                if (!this.health.degradedSince) {
                    this.health.degradedSince = new Date();
                }
            }
            else if (this.health.memoryUsage > 90 ||
                this.metrics.avgGetTime > 100 ||
                this.metrics.p95GetTime > 500) {
                this.health.status = 'degraded';
                if (!this.health.degradedSince) {
                    this.health.degradedSince = new Date();
                }
            }
            else {
                this.health.status = 'healthy';
                this.health.degradedSince = null;
            }
        },
        // Check if Redis is connected
        checkRedisConnection() {
            // Implementation will check the actual Redis client status
            return true; // Placeholder
        },
        // Calculate memory usage percentage
        calculateMemoryUsage() {
            // Implementation will calculate actual memory usage
            return 0; // Placeholder
        },
        // Get comprehensive monitoring report
        getReport() {
            this.updateHealth();
            return {
                metrics: { ...this.metrics },
                health: { ...this.health },
                stats: {
                    // Include basic stats
                    hitRate: 0, // Will be populated from cache stats
                    totalKeys: 0,
                    totalSize: 0,
                    operations: {
                        get: 0,
                        set: 0,
                        delete: 0,
                    },
                },
            };
        },
    };
    constructor(redis) {
        this.redis = redis || new ioredis_1.Redis();
        this.initializeMemoryCache();
        this.initializeCacheLayers();
        this.setupInvalidationPatterns();
        this.startBackgroundTasks();
    }
    /**
     * Get value from cache with multi-layer support
     */
    /**
     * Get value from cache with multi-layer support, optimized error handling and telemetry
     * @param key - The cache key
     * @param config - Optional cache configuration
     * @returns The cached value or null if not found
     */
    async get(key, config) {
        const startTime = Date.now();
        const cacheKey = this.buildCacheKey(key);
        try {
            this.stats.operations.get++;
            // Add request context for tracing
            const traceContext = {
                operation: 'cache:get',
                key: cacheKey,
                layers: [],
            };
            // Try L1 cache (memory) first
            const memoryResult = await this.getFromMemoryCache(cacheKey);
            if (memoryResult !== null) {
                this.stats.hits++;
                this.updateHitRate();
                return memoryResult;
            }
            // Try L2 cache (Redis)
            const redisResult = await this.getFromRedisCache(cacheKey);
            if (redisResult !== null) {
                // Populate L1 cache
                await this.setToMemoryCache(cacheKey, redisResult, config);
                this.stats.hits++;
                this.updateHitRate();
                return redisResult;
            }
            // Cache miss
            this.stats.misses++;
            this.updateHitRate();
            return null;
        }
        catch (error) {
            this.logger.error('Error getting from cache:', error);
            return null;
        }
        finally {
            const duration = Date.now() - startTime;
            this.monitoringSystem.recordTiming('get', duration);
        }
    }
    /**
     * Set value in cache with multi-layer support
     */
    async set(key, value, config = { ttl: 3600 }) {
        try {
            this.stats.operations.set++;
            const cacheKey = this.buildCacheKey(key);
            const processedValue = await this.processValueForStorage(value, config);
            // Set in all cache layers
            await Promise.all([
                this.setToMemoryCache(cacheKey, processedValue, config),
                this.setToRedisCache(cacheKey, processedValue, config),
            ]);
            // Update dependencies and tags
            if (config.tags) {
                await this.updateTagDependencies(cacheKey, config.tags);
            }
            if (config.dependencies) {
                await this.updateKeyDependencies(cacheKey, config.dependencies);
            }
            this.stats.totalKeys++;
            this.logger.debug(`Cache set: ${cacheKey}`);
        }
        catch (error) {
            this.logger.error('Error setting cache:', error);
            throw error;
        }
    }
    /**
     * Delete specific key from cache
     */
    async delete(key) {
        try {
            this.stats.operations.delete++;
            const cacheKey = this.buildCacheKey(key);
            // Delete from all layers
            await Promise.all([
                this.deleteFromMemoryCache(cacheKey),
                this.deleteFromRedisCache(cacheKey),
            ]);
            // Clean up dependencies
            await this.cleanupDependencies(cacheKey);
            this.stats.totalKeys = Math.max(0, this.stats.totalKeys - 1);
            this.logger.debug(`Cache deleted: ${cacheKey}`);
        }
        catch (error) {
            this.logger.error('Error deleting from cache:', error);
            throw error;
        }
    }
    /**
     * Get or set pattern (cache-aside)
     */
    async getOrSet(key, factory, config = { ttl: 3600 }) {
        try {
            // Try to get from cache first
            const cached = await this.get(key, config);
            if (cached !== null) {
                return cached;
            }
            // Generate value using factory
            const value = await factory();
            // Set in cache
            await this.set(key, value, config);
            return value;
        }
        catch (error) {
            this.logger.error('Error in getOrSet:', error);
            throw error;
        }
    }
    /**
     * Invalidate cache by tags
     */
    async invalidateByTags(tags) {
        try {
            this.stats.operations.invalidate++;
            const keysToInvalidate = new Set();
            for (const tag of tags) {
                const tagKeys = this.tagDependencies.get(tag);
                if (tagKeys) {
                    tagKeys.forEach((key) => keysToInvalidate.add(key));
                }
            }
            // Invalidate all keys
            await Promise.all(Array.from(keysToInvalidate).map((key) => this.delete(key)));
            this.logger.log(`Invalidated ${keysToInvalidate.size} keys by tags: ${tags.join(', ')}`);
        }
        catch (error) {
            this.logger.error('Error invalidating by tags:', error);
            throw error;
        }
    }
    /**
     * Delete a specific cache entry
     * @param key Cache key to delete
     * @returns Success status
     */
    async del(key) {
        try {
            let deleted = false;
            // Remove from memory cache
            if (this.memoryCache.has(key)) {
                this.memoryCache.delete(key);
                deleted = true;
            }
            // Remove from Redis
            const redisResult = await this.redis.del(key);
            // Update stats
            this.stats.operations.delete++;
            return deleted || redisResult > 0;
        }
        catch (error) {
            this.logger.error(`Failed to delete cache key: ${key}`, {
                error: error.message,
            });
            return false;
        }
    }
    /**
     * Invalidate cache by pattern (legacy method)
     */
    async invalidateByPattern(pattern) {
        try {
            this.stats.operations.invalidate++;
            const regex = new RegExp(pattern);
            const keysToDelete = [];
            // Get keys from memory cache
            for (const key of this.memoryCache.keys()) {
                if (regex.test(key)) {
                    keysToDelete.push(key);
                }
            }
            // Get keys from Redis
            const redisKeys = await this.redis.keys(`cache:${pattern}`);
            keysToDelete.push(...redisKeys.map((key) => key.replace('cache:', '')));
            // Delete all matching keys
            await Promise.all(keysToDelete.map((key) => this.del(key)));
            this.logger.log(`Invalidated ${keysToDelete.length} keys by pattern: ${pattern}`);
        }
        catch (error) {
            this.logger.error('Error invalidating by pattern:', error);
            throw error;
        }
    }
    /**
     * Warm up cache with data
     */
    async warmUp(data) {
        try {
            this.logger.log(`Warming up cache with ${data.length} entries`);
            await Promise.all(data.map(({ key, value, config }) => this.set(key, value, config || { ttl: 3600 })));
            this.logger.log('Cache warm-up completed');
        }
        catch (error) {
            this.logger.error('Error warming up cache:', error);
            throw error;
        }
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            ...this.stats,
            memoryUsage: this.getMemoryUsage(),
            totalSize: this.getTotalCacheSize(),
        };
    }
    /**
     * Get cache health status
     */
    async getCacheHealth() {
        const layerHealth = await Promise.all([
            this.checkMemoryCacheHealth(),
            this.checkRedisCacheHealth(),
        ]);
        const unhealthyLayers = layerHealth.filter((layer) => layer.status !== 'healthy');
        const status = unhealthyLayers.length === 0
            ? 'healthy'
            : unhealthyLayers.length === layerHealth.length
                ? 'unhealthy'
                : 'degraded';
        const recommendations = this.generateRecommendations();
        return {
            status,
            layers: layerHealth,
            recommendations,
        };
    }
    /**
     * Optimize cache performance
     */
    async optimizeCache() {
        const actions = [];
        const improvements = {};
        try {
            // Clean expired entries
            const expiredCount = await this.cleanExpiredEntries();
            if (expiredCount > 0) {
                actions.push(`Removed ${expiredCount} expired entries`);
                improvements.memoryFreed = expiredCount;
            }
            // Compress large values
            const compressedCount = await this.compressLargeValues();
            if (compressedCount > 0) {
                actions.push(`Compressed ${compressedCount} large values`);
                improvements.compressionSavings = compressedCount;
            }
            // Optimize memory cache size
            const memoryOptimized = await this.optimizeMemoryCache();
            if (memoryOptimized) {
                actions.push('Optimized memory cache size');
                improvements.memoryOptimization = 1;
            }
            // Update cache strategies based on access patterns
            const strategyUpdates = await this.updateCacheStrategies();
            if (strategyUpdates > 0) {
                actions.push(`Updated ${strategyUpdates} cache strategies`);
                improvements.strategyOptimizations = strategyUpdates;
            }
            return {
                optimized: actions.length > 0,
                actions,
                improvements,
            };
        }
        catch (error) {
            this.logger.error('Error optimizing cache:', error);
            return {
                optimized: false,
                actions: ['Optimization failed'],
                improvements: {},
            };
        }
    }
    /**
     * Clear all cache
     */
    async clear() {
        try {
            // Clear memory cache
            this.memoryCache.clear();
            // Clear Redis cache
            const keys = await this.redis.keys('cache:*');
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
            // Reset stats
            this.stats = {
                hits: 0,
                misses: 0,
                hitRate: 0,
                totalKeys: 0,
                totalSize: 0,
                memoryUsage: 0,
                operations: {
                    get: 0,
                    set: 0,
                    delete: 0,
                    invalidate: 0,
                },
            };
            // Clear dependencies
            this.tagDependencies.clear();
            this.logger.log('All cache cleared');
        }
        catch (error) {
            this.logger.error('Error clearing cache:', error);
            throw error;
        }
    }
    // Private helper methods
    initializeMemoryCache() {
        this.memoryCache = new lru_cache_1.LRUCache({
            max: 10000, // Maximum number of items
            maxSize: 100 * 1024 * 1024, // 100MB
            sizeCalculation: (value) => JSON.stringify(value).length,
            ttl: 1000 * 60 * 60, // 1 hour default TTL
            allowStale: false,
            updateAgeOnGet: true,
            updateAgeOnHas: false,
        });
        this.logger.log('Memory cache initialized');
    }
    initializeCacheLayers() {
        this.layers.set('memory', {
            name: 'memory',
            type: 'memory',
            enabled: true,
            priority: 1,
            stats: { ...this.stats },
        });
        this.layers.set('redis', {
            name: 'redis',
            type: 'redis',
            enabled: true,
            priority: 2,
            stats: { ...this.stats },
        });
        this.logger.log('Cache layers initialized');
    }
    setupInvalidationPatterns() {
        // Common invalidation patterns
        this.invalidationPatterns.set('user', /^user:\d+:/);
        this.invalidationPatterns.set('product', /^product:\d+:/);
        this.invalidationPatterns.set('order', /^order:\d+:/);
        this.invalidationPatterns.set('category', /^category:\d+:/);
        this.logger.log('Invalidation patterns set up');
    }
    startBackgroundTasks() {
        // Clean expired entries every 5 minutes
        setInterval(() => {
            this.cleanExpiredEntries().catch((error) => {
                this.logger.error('Error in background cleanup:', error);
            });
        }, 5 * 60 * 1000);
        // Update statistics every minute
        setInterval(() => {
            this.updateStatistics();
        }, 60 * 1000);
        // Optimize cache every hour
        setInterval(() => {
            this.optimizeCache().catch((error) => {
                this.logger.error('Error in background optimization:', error);
            });
        }, 60 * 60 * 1000);
        this.logger.log('Background tasks started');
    }
    buildCacheKey(key) {
        return `cache:${key}`;
    }
    async getFromMemoryCache(key) {
        const entry = this.memoryCache.get(key);
        if (!entry)
            return null;
        // Update access statistics
        entry.lastAccessed = new Date();
        entry.accessCount++;
        return this.processValueFromStorage(entry.value, {
            compressed: entry.compressed,
            encrypted: entry.encrypted,
        });
    }
    async setToMemoryCache(key, value, config) {
        const entry = {
            key,
            value,
            ttl: config?.ttl || 3600,
            createdAt: new Date(),
            lastAccessed: new Date(),
            accessCount: 0,
            tags: config?.tags || [],
            dependencies: config?.dependencies || [],
            size: JSON.stringify(value).length,
            compressed: config?.compression || false,
            encrypted: config?.encryption || false,
        };
        this.memoryCache.set(key, entry, {
            ttl: (config?.ttl || 3600) * 1000, // Convert to milliseconds
        });
    }
    async deleteFromMemoryCache(key) {
        this.memoryCache.delete(key);
    }
    async getFromRedisCache(key) {
        try {
            const data = await this.redis.get(key);
            if (!data)
                return null;
            const parsed = JSON.parse(data);
            return this.processValueFromStorage(parsed.value, {
                compressed: parsed.compressed,
                encrypted: parsed.encrypted,
            });
        }
        catch (error) {
            this.logger.error('Error getting from Redis cache:', error);
            return null;
        }
    }
    async setToRedisCache(key, value, config) {
        try {
            const entry = {
                value,
                createdAt: new Date(),
                tags: config.tags || [],
                dependencies: config.dependencies || [],
                compressed: config.compression || false,
                encrypted: config.encryption || false,
            };
            await this.redis.setex(key, config.ttl, JSON.stringify(entry));
        }
        catch (error) {
            this.logger.error('Error setting Redis cache:', error);
            throw error;
        }
    }
    async deleteFromRedisCache(key) {
        try {
            await this.redis.del(key);
        }
        catch (error) {
            this.logger.error('Error deleting from Redis cache:', error);
        }
    }
    async processValueForStorage(value, config) {
        let processed = value;
        // Compress if enabled
        if (config.compression) {
            processed = await this.compressValue(processed);
        }
        // Encrypt if enabled
        if (config.encryption) {
            processed = await this.encryptValue(processed);
        }
        return processed;
    }
    async processValueFromStorage(value, options) {
        let processed = value;
        // Decrypt if encrypted
        if (options.encrypted) {
            processed = await this.decryptValue(processed);
        }
        // Decompress if compressed
        if (options.compressed) {
            processed = await this.decompressValue(processed);
        }
        return processed;
    }
    /**
     * Calculate the approximate size of a value in bytes
     * Used for memory usage estimation and monitoring
     * @param value The value to measure
     * @returns Approximate size in bytes
     */
    calculateSize(value) {
        try {
            // For primitive values, use direct size calculation
            if (value === null || value === undefined) {
                return 0;
            }
            if (typeof value === 'boolean') {
                return 4; // Boolean typically uses 4 bytes
            }
            if (typeof value === 'number') {
                return 8; // Numbers typically use 8 bytes
            }
            if (typeof value === 'string') {
                return value.length * 2; // UTF-16 encoding uses 2 bytes per character
            }
            // For objects, convert to JSON and measure string length
            const jsonString = JSON.stringify(value);
            return jsonString.length * 2; // UTF-16 encoding
        }
        catch (error) {
            this.logger.warn('Error calculating object size', { error: error.message });
            return 100; // Default fallback size
        }
    }
    /**
     * Advanced compression with adaptive algorithm selection
     * Uses different compression methods based on data characteristics
     * @param value Value to compress
     * @returns Compressed value as string
     */
    async compressValue(value) {
        try {
            // Skip compression for small values (less than 100 bytes)
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            if (stringValue.length < 100) {
                return `uncompressed:${stringValue}`;
            }
            // Use zlib for compression
            const zlib = await Promise.resolve().then(() => tslib_1.__importStar(require('zlib')));
            const { promisify } = await Promise.resolve().then(() => tslib_1.__importStar(require('util')));
            // Choose compression method based on data size
            let compressedBuffer;
            const dataBuffer = Buffer.from(stringValue, 'utf8');
            if (stringValue.length > 10000) {
                // Use GZIP for larger data (better compression ratio)
                const gzip = promisify(zlib.gzip);
                compressedBuffer = await gzip(dataBuffer);
                return `gzip:${compressedBuffer.toString('base64')}`;
            }
            else {
                // Use Deflate for smaller data (faster)
                const deflate = promisify(zlib.deflate);
                compressedBuffer = await deflate(dataBuffer);
                return `deflate:${compressedBuffer.toString('base64')}`;
            }
        }
        catch (error) {
            this.logger.error('Compression failed', { error: error.message });
            // Fall back to uncompressed value if compression fails
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            return `uncompressed:${stringValue}`;
        }
    }
    /**
     * Advanced decompression with algorithm detection
     * Automatically detects and applies the appropriate decompression method
     * @param value Compressed value string
     * @returns Original value
     */
    async decompressValue(value) {
        try {
            // Check compression method from prefix
            if (value.startsWith('uncompressed:')) {
                const uncompressedValue = value.substring('uncompressed:'.length);
                return JSON.parse(uncompressedValue);
            }
            // Import required modules
            const zlib = await Promise.resolve().then(() => tslib_1.__importStar(require('zlib')));
            const { promisify } = await Promise.resolve().then(() => tslib_1.__importStar(require('util')));
            let decompressedValue;
            if (value.startsWith('gzip:')) {
                // Handle GZIP compression
                const compressedData = Buffer.from(value.substring('gzip:'.length), 'base64');
                const gunzip = promisify(zlib.gunzip);
                const resultBuffer = await gunzip(compressedData);
                decompressedValue = resultBuffer.toString('utf8');
            }
            else if (value.startsWith('deflate:')) {
                // Handle Deflate compression
                const compressedData = Buffer.from(value.substring('deflate:'.length), 'base64');
                const inflate = promisify(zlib.inflate);
                const resultBuffer = await inflate(compressedData);
                decompressedValue = resultBuffer.toString('utf8');
            }
            else {
                // Unknown compression method, return as is
                this.logger.warn('Unknown compression format', {
                    prefix: value.substring(0, 20),
                });
                decompressedValue = value;
            }
            // Parse the JSON string back to the original value
            return JSON.parse(decompressedValue);
        }
        catch (error) {
            this.logger.error('Decompression failed', { error: error.message });
            throw new Error(`Failed to decompress cache value: ${error.message}`);
        }
    }
    /**
     * Advanced encryption for sensitive cache data
     * Uses AES-256-GCM with authentication and integrity verification
     * @param value Value to encrypt
     * @returns Encrypted value as string
     */
    async encryptValue(value) {
        try {
            const encryptionKey = process.env.CACHE_ENCRYPTION_KEY;
            // Skip encryption if no key is provided
            if (!encryptionKey) {
                this.logger.warn('No encryption key provided, storing unencrypted');
                const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
                return `unencrypted:${stringValue}`;
            }
            // Prepare value for encryption
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            // Generate random initialization vector
            const iv = crypto.randomBytes(16);
            // Create cipher using AES-256-GCM (Galois/Counter Mode)
            // GCM provides both encryption and authentication
            const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(encryptionKey, 'hex'), iv);
            // Encrypt the data
            let encryptedValue = cipher.update(stringValue, 'utf8', 'hex');
            encryptedValue += cipher.final('hex');
            // Get authentication tag for integrity verification
            const authTag = cipher.getAuthTag().toString('hex');
            // Combine all components for storage
            // Format: encrypted:<iv>:<authTag>:<encryptedValue>
            return `encrypted:${iv.toString('hex')}:${authTag}:${encryptedValue}`;
        }
        catch (error) {
            this.logger.error('Encryption failed', { error: error.message });
            // Fall back to unencrypted if encryption fails
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            return `unencrypted:${stringValue}`;
        }
    }
    /**
     * Advanced decryption for cached data
     * Handles authentication and integrity verification
     * @param value Encrypted value string
     * @returns Original decrypted value
     */
    async decryptValue(value) {
        try {
            // Check encryption status from prefix
            if (value.startsWith('unencrypted:')) {
                const unencryptedValue = value.substring('unencrypted:'.length);
                return JSON.parse(unencryptedValue);
            }
            if (!value.startsWith('encrypted:')) {
                // Unknown format, try to parse as is
                return JSON.parse(value);
            }
            const encryptionKey = process.env.CACHE_ENCRYPTION_KEY;
            if (!encryptionKey) {
                throw new Error('Encryption key not available for decryption');
            }
            // Parse the components
            // Format: encrypted:<iv>:<authTag>:<encryptedValue>
            const parts = value.split(':');
            if (parts.length !== 4) {
                throw new Error('Invalid encrypted value format');
            }
            const iv = Buffer.from(parts[1], 'hex');
            const authTag = Buffer.from(parts[2], 'hex');
            const encryptedText = parts[3];
            // Create decipher
            const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(encryptionKey, 'hex'), iv);
            // Set auth tag for verification
            decipher.setAuthTag(authTag);
            // Decrypt the data
            let decryptedValue = decipher.update(encryptedText, 'hex', 'utf8');
            decryptedValue += decipher.final('utf8');
            // Parse the decrypted JSON
            return JSON.parse(decryptedValue);
        }
        catch (error) {
            this.logger.error('Decryption failed', { error: error.message });
            throw new Error(`Failed to decrypt cache value: ${error.message}`);
        }
    }
    async updateTagDependencies(key, tags) {
        for (const tag of tags) {
            if (!this.tagDependencies.has(tag)) {
                this.tagDependencies.set(tag, new Set());
            }
            this.tagDependencies.get(tag).add(key);
        }
    }
    async updateKeyDependencies(key, dependencies) {
        // Store key dependencies in Redis for distributed invalidation
        if (dependencies.length > 0) {
            await this.redis.sadd(`deps:${key}`, ...dependencies);
        }
    }
    async cleanupDependencies(key) {
        // Remove from tag dependencies
        for (const [tag, keys] of this.tagDependencies.entries()) {
            keys.delete(key);
            if (keys.size === 0) {
                this.tagDependencies.delete(tag);
            }
        }
        // Remove key dependencies
        await this.redis.del(`deps:${key}`);
    }
    updateHitRate() {
        const total = this.stats.hits + this.stats.misses;
        this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    }
    getMemoryUsage() {
        return this.memoryCache.calculatedSize || 0;
    }
    getTotalCacheSize() {
        return this.memoryCache.size;
    }
    async checkMemoryCacheHealth() {
        const start = Date.now();
        const testKey = 'health-check-memory';
        try {
            await this.setToMemoryCache(testKey, 'test', { ttl: 60 });
            const result = await this.getFromMemoryCache(testKey);
            await this.deleteFromMemoryCache(testKey);
            const latency = Date.now() - start;
            return {
                name: 'memory',
                status: result === 'test' ? 'healthy' : 'degraded',
                latency,
            };
        }
        catch (error) {
            return {
                name: 'memory',
                status: 'unhealthy',
                latency: Date.now() - start,
            };
        }
    }
    async checkRedisCacheHealth() {
        const start = Date.now();
        const testKey = 'health-check-redis';
        try {
            await this.redis.set(testKey, 'test', 'EX', 60);
            const result = await this.redis.get(testKey);
            await this.redis.del(testKey);
            const latency = Date.now() - start;
            return {
                name: 'redis',
                status: result === 'test' ? 'healthy' : 'degraded',
                latency,
            };
        }
        catch (error) {
            return {
                name: 'redis',
                status: 'unhealthy',
                latency: Date.now() - start,
            };
        }
    }
    generateRecommendations() {
        const recommendations = [];
        if (this.stats.hitRate < 70) {
            recommendations.push('Consider increasing cache TTL or reviewing cache strategy');
        }
        if (this.getMemoryUsage() > 80 * 1024 * 1024) {
            // 80MB
            recommendations.push('Memory cache usage is high, consider increasing memory or reducing cache size');
        }
        if (this.stats.operations.get > this.stats.operations.set * 10) {
            recommendations.push('High read-to-write ratio detected, consider implementing cache warming');
        }
        return recommendations;
    }
    async cleanExpiredEntries() {
        let cleaned = 0;
        // Clean memory cache (handled automatically by LRU)
        // Clean Redis expired keys (handled automatically by Redis)
        return cleaned;
    }
    async compressLargeValues() {
        // Implement compression for large values
        return 0; // Placeholder
    }
    async optimizeMemoryCache() {
        // Optimize memory cache configuration based on usage patterns
        return false; // Placeholder
    }
    async updateCacheStrategies() {
        // Update cache strategies based on access patterns
        return 0; // Placeholder
    }
    updateStatistics() {
        // Update cache statistics
        this.stats.memoryUsage = this.getMemoryUsage();
        this.stats.totalSize = this.getTotalCacheSize();
    }
    /**
     * Advanced cache invalidation strategy implementation
     * Supports pattern-based invalidation, tag-based invalidation, and dependency chains
     */
    async implementAdvancedInvalidationStrategy() {
        try {
            // Implement pattern-based invalidation capability
            this.setupPatternBasedInvalidation();
            // Implement tag-based invalidation capability
            this.setupTagBasedInvalidation();
            // Setup dependency tracking for cache entries
            this.setupDependencyTracking();
            // Subscribe to invalidation events from Redis
            await this.subscribeToInvalidationChannel();
            this.logger.log('Advanced cache invalidation strategy initialized');
        }
        catch (error) {
            this.logger.error('Failed to initialize advanced invalidation strategy', {
                error: error.message,
                stack: error.stack,
            });
        }
    }
    /**
     * Setup pattern-based cache invalidation
     * This allows invalidating multiple cache entries using wildcard patterns
     */
    setupPatternBasedInvalidation() {
        // Define common invalidation patterns
        const commonPatterns = [
            { name: 'allUserData', pattern: 'user:*' },
            { name: 'allProductData', pattern: 'product:*' },
            { name: 'allCategoryData', pattern: 'category:*' },
            { name: 'allSessionData', pattern: 'session:*' },
            { name: 'allConfigData', pattern: 'config:*' },
        ];
        // Register patterns
        for (const { name, pattern } of commonPatterns) {
            // Convert glob pattern to RegExp
            const regexPattern = this.globToRegExp(pattern);
            this.invalidationPatterns.set(name, regexPattern);
        }
    }
    /**
     * Setup tag-based cache invalidation
     * This allows grouping cache entries by tags and invalidating them together
     */
    setupTagBasedInvalidation() {
        // Clear existing tag dependencies
        this.tagDependencies.clear();
        // Define common tag groups
        const commonTags = [
            'user',
            'product',
            'category',
            'order',
            'cart',
            'session',
            'config',
            'search',
            'recommendation',
        ];
        // Initialize tag sets
        for (const tag of commonTags) {
            this.tagDependencies.set(tag, new Set());
        }
    }
    /**
     * Setup dependency tracking between cache entries
     * When a parent entry is invalidated, all dependent entries are also invalidated
     */
    setupDependencyTracking() {
        // Will be populated during cache operations
        this.logger.debug('Dependency tracking initialized');
    }
    /**
     * Subscribe to Redis invalidation channel for distributed cache invalidation
     * This allows cache invalidation across multiple instances of the application
     */
    async subscribeToInvalidationChannel() {
        try {
            const channel = 'cache:invalidation';
            // Subscribe to the invalidation channel
            await this.redis.subscribe(channel);
            // Setup message handler
            this.redis.on('message', async (channel, message) => {
                if (channel === 'cache:invalidation') {
                    try {
                        const invalidationCommand = JSON.parse(message);
                        switch (invalidationCommand.type) {
                            case 'key':
                                await this.del(invalidationCommand.key);
                                break;
                            case 'pattern':
                                await this.invalidateByPattern(invalidationCommand.pattern);
                                break;
                            case 'tag':
                                await this.invalidateByTag(invalidationCommand.tag);
                                break;
                            default:
                                this.logger.warn(`Unknown invalidation type: ${invalidationCommand.type}`);
                        }
                        this.logger.debug(`Processed invalidation command: ${message}`);
                    }
                    catch (error) {
                        this.logger.error('Error processing invalidation message', {
                            message,
                            error: error.message,
                        });
                    }
                }
            });
            this.logger.log(`Subscribed to Redis invalidation channel: ${channel}`);
        }
        catch (error) {
            this.logger.error('Failed to subscribe to invalidation channel', {
                error: error.message,
                stack: error.stack,
            });
        }
    }
    /**
     * Publish invalidation command to Redis for distributed invalidation
     */
    async publishInvalidationCommand(command) {
        try {
            const channel = 'cache:invalidation';
            await this.redis.publish(channel, JSON.stringify(command));
        }
        catch (error) {
            this.logger.error('Failed to publish invalidation command', {
                command,
                error: error.message,
            });
        }
    }
    /**
     * Convert glob pattern to regular expression
     * For example: user:* becomes ^user:.*$
     */
    globToRegExp(pattern) {
        // Replace glob patterns with regex equivalents
        const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
        return new RegExp(`^${regexPattern}$`);
    }
    // Enhanced advanced pattern invalidation implementation
    // (Removed duplicate function as it has been replaced by the one above)
    /**
     * Invalidate cache entries by tag
     * @param tag The tag to invalidate
     */
    async invalidateByTag(tag) {
        try {
            const startTime = Date.now();
            let count = 0;
            // Get all keys with this tag
            const keys = this.tagDependencies.get(tag);
            if (keys && keys.size > 0) {
                // Invalidate from memory cache
                for (const key of keys) {
                    if (this.memoryCache.has(key)) {
                        this.memoryCache.delete(key);
                        count++;
                    }
                }
                // Invalidate from Redis
                const keysArray = Array.from(keys);
                if (keysArray.length > 0) {
                    await this.redis.del(...keysArray);
                }
                // Clear the tag set
                keys.clear();
                const duration = Date.now() - startTime;
                this.logger.log(`Invalidated ${count} entries with tag '${tag}' in ${duration}ms`);
            }
            return count;
        }
        catch (error) {
            this.logger.error('Error during tag invalidation', {
                tag,
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }
    /**
     * Circuit breaker implementation to prevent cascading failures
     * when Redis or other external cache services are experiencing issues
     */
    circuitBreaker = {
        // Circuit state
        state: 'closed',
        failures: 0,
        lastFailure: null,
        nextRetry: null,
        // Configuration
        failureThreshold: 5, // Number of failures before opening circuit
        resetTimeout: 30000, // Time in ms before attempting half-open state
        halfOpenMaxAttempts: 3, // Max attempts in half-open state
        halfOpenAttempts: 0, // Current attempts in half-open state
        // Check if circuit is open (prevent calls to external cache)
        isOpen() {
            if (this.state === 'closed') {
                return false;
            }
            if (this.state === 'open') {
                // Check if it's time to transition to half-open
                if (this.nextRetry && new Date() >= this.nextRetry) {
                    this.transitionToHalfOpen();
                }
                return this.state === 'open';
            }
            // In half-open state, allow limited calls
            return this.halfOpenAttempts >= this.halfOpenMaxAttempts;
        },
        // Record a successful operation
        recordSuccess() {
            if (this.state === 'half-open') {
                // After enough successes in half-open, close the circuit
                if (++this.halfOpenAttempts >= this.halfOpenMaxAttempts) {
                    this.reset();
                }
            }
        },
        // Record a failed operation
        recordFailure() {
            this.lastFailure = new Date();
            if (this.state === 'half-open') {
                // Any failure in half-open returns to open state
                this.transitionToOpen();
            }
            else if (this.state === 'closed') {
                // Increment failures in closed state
                if (++this.failures >= this.failureThreshold) {
                    this.transitionToOpen();
                }
            }
        },
        // Transition to open state
        transitionToOpen() {
            this.state = 'open';
            this.nextRetry = new Date(Date.now() + this.resetTimeout);
        },
        // Transition to half-open state
        transitionToHalfOpen() {
            this.state = 'half-open';
            this.halfOpenAttempts = 0;
        },
        // Reset circuit breaker to closed state
        reset() {
            this.state = 'closed';
            this.failures = 0;
            this.lastFailure = null;
            this.nextRetry = null;
            this.halfOpenAttempts = 0;
        },
        // Get current status information
        getStatus() {
            return {
                state: this.state,
                failures: this.failures,
                lastFailure: this.lastFailure,
                nextRetry: this.nextRetry,
            };
        },
    };
    /**
     * Enhanced error handling for cache operations
     * Provides consistent error logging and circuit breaker integration
     * @param operation Cache operation name
     * @param key Cache key
     * @param action Function to execute
     * @param fallback Optional fallback function if the operation fails
     */
    async executeWithErrorHandling(operation, key, action, fallback) {
        const startTime = Date.now();
        try {
            // Check if circuit breaker is open for Redis operations
            if (operation.includes('redis') && this.circuitBreaker.isOpen()) {
                this.logger.warn(`Circuit breaker open, skipping Redis operation: ${operation}`);
                throw new Error('CIRCUIT_OPEN');
            }
            // Execute the main action
            const result = await action();
            // Record success for circuit breaker
            if (operation.includes('redis')) {
                this.circuitBreaker.recordSuccess();
            }
            // Record operation timing for monitoring
            const duration = Date.now() - startTime;
            const opType = operation.startsWith('get') ? 'get' : 'set';
            this.monitoringSystem.recordTiming(opType, duration);
            return result;
        }
        catch (error) {
            // Record operation failure in metrics
            const duration = Date.now() - startTime;
            // Log error with appropriate level based on error type
            if (error.message === 'CIRCUIT_OPEN') {
                this.logger.debug(`Circuit breaker prevented operation ${operation}`, { key });
            }
            else if (error.code === 'ECONNREFUSED') {
                this.logger.error(`Cache connection failed for ${operation}`, {
                    key,
                    duration,
                    error: error.message,
                });
                // Update circuit breaker for Redis errors
                if (operation.includes('redis')) {
                    this.circuitBreaker.recordFailure();
                }
            }
            else {
                this.logger.warn(`Cache error during ${operation}`, {
                    key,
                    duration,
                    error: error.message,
                    stack: error.stack,
                });
            }
            // Try fallback if provided
            if (fallback) {
                try {
                    this.logger.debug(`Attempting fallback for ${operation}`, { key });
                    return await fallback();
                }
                catch (fallbackError) {
                    this.logger.error(`Fallback also failed for ${operation}`, {
                        key,
                        error: fallbackError.message,
                    });
                    throw fallbackError;
                }
            }
            // Rethrow original error
            throw error;
        }
    }
    /**
     * Graceful cache degradation strategy
     * Implements fallback mechanisms when primary cache layer fails
     * @param key Cache key
     * @param config Optional cache configuration
     */
    async getWithGracefulDegradation(key, config) {
        try {
            // Attempt to get from memory cache first
            const memoryResult = await this.executeWithErrorHandling('get:memory', key, async () => {
                const entry = this.memoryCache.get(key);
                return entry ? entry.value : null;
            });
            if (memoryResult !== null) {
                // Memory cache hit
                this.stats.hits++;
                return memoryResult;
            }
            // If memory cache miss, try Redis cache
            try {
                const redisResult = await this.executeWithErrorHandling('get:redis', key, async () => {
                    const result = await this.redis.get(key);
                    return result ? JSON.parse(result) : null;
                });
                if (redisResult !== null) {
                    // Redis cache hit, update memory cache
                    this.stats.hits++;
                    // Store in memory cache for faster future access
                    await this.executeWithErrorHandling('set:memory', key, async () => {
                        this.memoryCache.set(key, {
                            key,
                            value: redisResult,
                            ttl: config?.ttl || 300,
                            createdAt: new Date(),
                            lastAccessed: new Date(),
                            accessCount: 1,
                            tags: config?.tags || [],
                            dependencies: config?.dependencies || [],
                            size: this.calculateSize(redisResult),
                            compressed: false,
                            encrypted: false,
                        });
                    });
                    return redisResult;
                }
                // Cache miss in all layers
                this.stats.misses++;
                return null;
            }
            catch (redisError) {
                // Redis failed, log warning and return memory cache result (even if null)
                this.logger.warn('Redis cache get failed, using memory cache only', {
                    key,
                    error: redisError.message,
                });
                // Increment miss counter if nothing found
                if (memoryResult === null) {
                    this.stats.misses++;
                }
                return memoryResult;
            }
        }
        catch (error) {
            // Catastrophic failure in cache system
            this.logger.error('Cache get operation failed completely', {
                key,
                error: error.message,
                stack: error.stack,
            });
            // Return null in case of complete failure
            return null;
        }
    }
};
exports.AdvancedCacheService = AdvancedCacheService;
exports.AdvancedCacheService = AdvancedCacheService = AdvancedCacheService_1 = tslib_1.__decorate([
    Injectable(),
    tslib_1.__metadata("design:paramtypes", [ioredis_1.Redis])
], AdvancedCacheService);
//# sourceMappingURL=advanced-cache.service.js.map