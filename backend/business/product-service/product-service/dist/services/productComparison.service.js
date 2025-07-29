"use strict";
// Product Comparison Service
// This service handles the logic for comparing multiple products
const { logger, createError } = require('@ultramarket/shared');
const mongoose = require('mongoose');
class ProductComparisonService {
    /**
     * Compare multiple products by their specifications
     * @param {Array} productIds - Array of product IDs to compare
     * @param {String} category - Product category (to determine comparison attributes)
     * @returns {Object} Comparison results
     */
    async compareProducts(productIds, category) {
        logger.info(`Comparing products: ${productIds.join(', ')} in category: ${category}`);
        try {
            if (!productIds || productIds.length < 2) {
                throw createError(400, 'At least two products are required for comparison');
            }
            if (!category) {
                throw createError(400, 'Category is required for comparison');
            }
            const Product = mongoose.model('Product');
            const products = await Product.find({
                _id: { $in: productIds },
                category,
            }).lean();
            if (products.length !== productIds.length) {
                throw createError(404, 'Some products could not be found or do not belong to the specified category');
            }
            // Get comparison attributes based on category
            const comparisonAttributes = this.getComparisonAttributes(category);
            // Build comparison table
            const comparisonTable = this.buildComparisonTable(products, comparisonAttributes);
            // Calculate differences and highlights
            const highlights = this.calculateHighlights(products, comparisonAttributes);
            return {
                products,
                comparisonTable,
                highlights,
                timestamp: new Date(),
            };
        }
        catch (error) {
            logger.error('Error comparing products:', error);
            throw error.statusCode ? error : createError(500, 'Failed to compare products');
        }
    }
    /**
     * Get comparison attributes based on product category
     * @param {String} category - Product category
     * @returns {Array} Array of comparison attributes
     */
    getComparisonAttributes(category) {
        const categoryAttributes = {
            cpu: [
                { key: 'brand', label: 'Brand', type: 'string' },
                { key: 'model', label: 'Model', type: 'string' },
                { key: 'specifications.socket', label: 'Socket', type: 'string' },
                { key: 'specifications.cores', label: 'Cores', type: 'number' },
                { key: 'specifications.threads', label: 'Threads', type: 'number' },
                { key: 'specifications.baseClock', label: 'Base Clock', type: 'number', unit: 'GHz' },
                { key: 'specifications.boostClock', label: 'Boost Clock', type: 'number', unit: 'GHz' },
                { key: 'specifications.tdp', label: 'TDP', type: 'number', unit: 'W' },
                { key: 'specifications.cache', label: 'Cache', type: 'number', unit: 'MB' },
                { key: 'price', label: 'Price', type: 'number', unit: 'UZS' },
            ],
            gpu: [
                { key: 'brand', label: 'Brand', type: 'string' },
                { key: 'model', label: 'Model', type: 'string' },
                { key: 'specifications.chipset', label: 'Chipset', type: 'string' },
                { key: 'specifications.memory', label: 'Memory', type: 'number', unit: 'GB' },
                { key: 'specifications.memoryType', label: 'Memory Type', type: 'string' },
                { key: 'specifications.coreClock', label: 'Core Clock', type: 'number', unit: 'MHz' },
                { key: 'specifications.boostClock', label: 'Boost Clock', type: 'number', unit: 'MHz' },
                { key: 'specifications.tdp', label: 'TDP', type: 'number', unit: 'W' },
                { key: 'specifications.length', label: 'Card Length', type: 'number', unit: 'mm' },
                { key: 'price', label: 'Price', type: 'number', unit: 'UZS' },
            ],
            monitor: [
                { key: 'brand', label: 'Brand', type: 'string' },
                { key: 'model', label: 'Model', type: 'string' },
                { key: 'specifications.size', label: 'Screen Size', type: 'number', unit: '"' },
                { key: 'specifications.resolution', label: 'Resolution', type: 'string' },
                { key: 'specifications.panelType', label: 'Panel Type', type: 'string' },
                { key: 'specifications.refreshRate', label: 'Refresh Rate', type: 'number', unit: 'Hz' },
                { key: 'specifications.responseTime', label: 'Response Time', type: 'number', unit: 'ms' },
                { key: 'specifications.aspectRatio', label: 'Aspect Ratio', type: 'string' },
                { key: 'specifications.ports', label: 'Ports', type: 'array' },
                { key: 'price', label: 'Price', type: 'number', unit: 'UZS' },
            ],
            storage: [
                { key: 'brand', label: 'Brand', type: 'string' },
                { key: 'model', label: 'Model', type: 'string' },
                { key: 'specifications.capacity', label: 'Capacity', type: 'number', unit: 'GB' },
                { key: 'specifications.interface', label: 'Interface', type: 'string' },
                { key: 'specifications.type', label: 'Type', type: 'string' },
                { key: 'specifications.readSpeed', label: 'Read Speed', type: 'number', unit: 'MB/s' },
                { key: 'specifications.writeSpeed', label: 'Write Speed', type: 'number', unit: 'MB/s' },
                { key: 'specifications.cache', label: 'Cache', type: 'number', unit: 'MB' },
                { key: 'specifications.formFactor', label: 'Form Factor', type: 'string' },
                { key: 'price', label: 'Price', type: 'number', unit: 'UZS' },
            ],
        };
        return (categoryAttributes[category.toLowerCase()] || [
            { key: 'brand', label: 'Brand', type: 'string' },
            { key: 'model', label: 'Model', type: 'string' },
            { key: 'price', label: 'Price', type: 'number', unit: 'UZS' },
        ]);
    }
    /**
     * Build a comparison table for the products
     * @param {Array} products - Array of products to compare
     * @param {Array} attributes - Array of attributes to compare
     * @returns {Object} Comparison table
     */
    buildComparisonTable(products, attributes) {
        const table = {
            headers: ['Attribute', ...products.map((p) => p.name || p.model)],
            rows: [],
        };
        attributes.forEach((attr) => {
            const row = [attr.label];
            products.forEach((product) => {
                let value = this.getNestedValue(product, attr.key);
                // Format value based on type
                if (attr.type === 'number' && value !== undefined) {
                    value = `${value}${attr.unit || ''}`;
                }
                else if (attr.type === 'array' && Array.isArray(value)) {
                    value = value.join(', ');
                }
                else if (value === undefined || value === null) {
                    value = 'N/A';
                }
                row.push(value);
            });
            table.rows.push(row);
        });
        return table;
    }
    /**
     * Calculate highlights for each product
     * @param {Array} products - Array of products to compare
     * @param {Array} attributes - Array of attributes to compare
     * @returns {Object} Highlights for each product
     */
    calculateHighlights(products, attributes) {
        const highlights = {};
        products.forEach((product) => {
            highlights[product._id] = [];
        });
        // Only process numeric attributes for highlights
        const numericAttributes = attributes.filter((attr) => attr.type === 'number');
        numericAttributes.forEach((attr) => {
            // Find the best value (highest or lowest depending on attribute)
            const values = products
                .map((product) => {
                const value = this.getNestedValue(product, attr.key);
                return {
                    productId: product._id,
                    value: value === undefined ? null : value,
                };
            })
                .filter((item) => item.value !== null);
            if (values.length === 0)
                return;
            // For most attributes, higher is better
            let isBetterIfHigher = true;
            // Exceptions where lower is better
            if (attr.key.includes('price') ||
                attr.key.includes('responseTime') ||
                attr.key.includes('tdp') ||
                attr.key.includes('latency')) {
                isBetterIfHigher = false;
            }
            // Sort values
            values.sort((a, b) => {
                return isBetterIfHigher ? b.value - a.value : a.value - b.value;
            });
            // The first one is the best
            const bestValue = values[0];
            // Add to highlights if it's significantly better
            // For numeric comparison, we require at least 10% difference
            const secondBestValue = values[1];
            if (secondBestValue && bestValue) {
                const diff = isBetterIfHigher
                    ? (bestValue.value - secondBestValue.value) / secondBestValue.value
                    : (secondBestValue.value - bestValue.value) / bestValue.value;
                if (diff >= 0.1) {
                    // 10% threshold
                    highlights[bestValue.productId].push({
                        attribute: attr.label,
                        reason: isBetterIfHigher
                            ? `Best ${attr.label} (${bestValue.value}${attr.unit || ''})`
                            : `Lowest ${attr.label} (${bestValue.value}${attr.unit || ''})`,
                    });
                }
            }
        });
        return highlights;
    }
    /**
     * Get a value from a nested object path
     * @param {Object} obj - Source object
     * @param {String} path - Dot notation path
     * @returns {*} Value at path
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((prev, curr) => {
            return prev ? prev[curr] : undefined;
        }, obj);
    }
    /**
     * Save a comparison for later reference
     * @param {String} userId - User ID
     * @param {Array} productIds - Array of product IDs
     * @param {String} category - Product category
     * @returns {Object} Saved comparison
     */
    async saveComparison(userId, productIds, category) {
        logger.info(`Saving comparison for user ${userId}`);
        try {
            const Comparison = mongoose.model('ProductComparison');
            const newComparison = new Comparison({
                userId,
                productIds,
                category,
                createdAt: new Date(),
            });
            await newComparison.save();
            return newComparison;
        }
        catch (error) {
            logger.error('Error saving comparison:', error);
            throw createError(500, 'Failed to save comparison');
        }
    }
    /**
     * Get saved comparisons for a user
     * @param {String} userId - User ID
     * @returns {Array} Saved comparisons
     */
    async getUserComparisons(userId) {
        logger.info(`Retrieving comparisons for user ${userId}`);
        try {
            const Comparison = mongoose.model('ProductComparison');
            const comparisons = await Comparison.find({ userId }).sort({ createdAt: -1 }).limit(10);
            return comparisons;
        }
        catch (error) {
            logger.error('Error retrieving comparisons:', error);
            throw createError(500, 'Failed to retrieve comparisons');
        }
    }
    /**
     * Compare complete PC builds
     * @param {Array} buildIds - Array of saved PC build IDs to compare
     * @returns {Object} Comparison results for complete PC builds
     */
    async compareBuilds(buildIds) {
        logger.info(`Comparing PC builds: ${buildIds.join(', ')}`);
        try {
            if (!buildIds || buildIds.length < 2) {
                throw createError(400, 'At least two builds are required for comparison');
            }
            // Find the builds in the database
            const PCBuild = mongoose.model('PCBuild');
            const builds = await PCBuild.find({
                _id: { $in: buildIds },
            }).lean();
            if (builds.length !== buildIds.length) {
                throw createError(404, 'Some builds could not be found');
            }
            // Prepare the comparison data structure
            const buildComparison = {
                builds: builds.map((build) => ({
                    id: build._id,
                    name: build.name,
                    createdAt: build.createdAt,
                    totalPrice: this.calculateBuildPrice(build),
                    totalPower: this.calculateBuildPower(build),
                })),
                components: {},
                performance: {},
            };
            // Compare components across builds
            const componentTypes = [
                'cpu',
                'motherboard',
                'memory',
                'gpu',
                'storage',
                'case',
                'power',
                'cooling',
            ];
            for (const type of componentTypes) {
                buildComparison.components[type] = [];
                for (const build of builds) {
                    const component = build.components[type] || null;
                    buildComparison.components[type].push(component
                        ? {
                            id: component._id || component.id,
                            name: component.name,
                            brand: component.brand,
                            model: component.model,
                            price: component.price,
                            specifications: component.specifications || {},
                        }
                        : null);
                }
            }
            // Calculate estimated performance metrics
            buildComparison.performance = this.calculateBuildPerformanceMetrics(builds);
            return buildComparison;
        }
        catch (error) {
            logger.error(`Error comparing builds: ${error.message}`);
            throw error;
        }
    }
    /**
     * Calculate the total price of a PC build
     * @param {Object} build - PC build object
     * @returns {Number} Total price
     */
    calculateBuildPrice(build) {
        let total = 0;
        for (const type in build.components) {
            if (build.components[type] && build.components[type].price) {
                total += build.components[type].price;
            }
        }
        return total;
    }
    /**
     * Calculate the power requirements of a PC build
     * @param {Object} build - PC build object
     * @returns {Number} Total power in watts
     */
    calculateBuildPower(build) {
        let totalPower = 0;
        // CPU power
        if (build.components.cpu &&
            build.components.cpu.specifications &&
            build.components.cpu.specifications.tdp) {
            totalPower += build.components.cpu.specifications.tdp;
        }
        // GPU power
        if (build.components.gpu &&
            build.components.gpu.specifications &&
            build.components.gpu.specifications.tdp) {
            totalPower += build.components.gpu.specifications.tdp;
        }
        // Add base power for other components
        totalPower += 75; // Base system power
        return totalPower;
    }
    /**
     * Calculate performance metrics for builds
     * @param {Array} builds - Array of PC build objects
     * @returns {Object} Performance metrics
     */
    calculateBuildPerformanceMetrics(builds) {
        const metrics = {};
        for (let i = 0; i < builds.length; i++) {
            const build = builds[i];
            const cpuScore = this.estimateCpuScore(build.components.cpu);
            const gpuScore = this.estimateGpuScore(build.components.gpu);
            const ramScore = this.estimateRamScore(build.components.memory);
            metrics[build._id] = {
                gaming: this.calculateGamingScore(cpuScore, gpuScore, ramScore),
                productivity: this.calculateProductivityScore(cpuScore, gpuScore, ramScore),
                multitasking: this.calculateMultitaskingScore(cpuScore, ramScore),
            };
        }
        return metrics;
    }
    /**
     * Estimate CPU performance score
     * @param {Object} cpu - CPU component
     * @returns {Number} CPU score
     */
    estimateCpuScore(cpu) {
        if (!cpu || !cpu.specifications)
            return 0;
        const { cores = 0, threads = 0, clockSpeed = 0 } = cpu.specifications;
        // Simple formula for CPU score
        return cores * 100 + threads * 25 + clockSpeed * 1000;
    }
    /**
     * Estimate GPU performance score
     * @param {Object} gpu - GPU component
     * @returns {Number} GPU score
     */
    estimateGpuScore(gpu) {
        if (!gpu || !gpu.specifications)
            return 0;
        const { memory = 0, clockSpeed = 0 } = gpu.specifications;
        // Simple formula for GPU score
        return memory * 500 + clockSpeed * 100;
    }
    /**
     * Estimate RAM performance score
     * @param {Object} ram - RAM component
     * @returns {Number} RAM score
     */
    estimateRamScore(ram) {
        if (!ram || !ram.specifications)
            return 0;
        const { capacity = 0, speed = 0 } = ram.specifications;
        // Simple formula for RAM score
        return capacity * 100 + speed * 0.5;
    }
    /**
     * Calculate gaming performance score
     * @param {Number} cpuScore - CPU performance score
     * @param {Number} gpuScore - GPU performance score
     * @param {Number} ramScore - RAM performance score
     * @returns {Number} Gaming performance score
     */
    calculateGamingScore(cpuScore, gpuScore, ramScore) {
        // Gaming relies heavily on GPU, then CPU, then RAM
        return gpuScore * 0.6 + cpuScore * 0.3 + ramScore * 0.1;
    }
    /**
     * Calculate productivity performance score
     * @param {Number} cpuScore - CPU performance score
     * @param {Number} gpuScore - GPU performance score
     * @param {Number} ramScore - RAM performance score
     * @returns {Number} Productivity performance score
     */
    calculateProductivityScore(cpuScore, gpuScore, ramScore) {
        // Productivity relies heavily on CPU, then RAM, then GPU
        return cpuScore * 0.6 + ramScore * 0.3 + gpuScore * 0.1;
    }
    /**
     * Calculate multitasking performance score
     * @param {Number} cpuScore - CPU performance score
     * @param {Number} ramScore - RAM performance score
     * @returns {Number} Multitasking performance score
     */
    calculateMultitaskingScore(cpuScore, ramScore) {
        // Multitasking relies on CPU and RAM
        return cpuScore * 0.5 + ramScore * 0.5;
    }
}
module.exports = new ProductComparisonService();
//# sourceMappingURL=productComparison.service.js.map