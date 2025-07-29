declare const _exports: ProductComparisonService;
export = _exports;
declare class ProductComparisonService {
    /**
     * Compare multiple products by their specifications
     * @param {Array} productIds - Array of product IDs to compare
     * @param {String} category - Product category (to determine comparison attributes)
     * @returns {Object} Comparison results
     */
    compareProducts(productIds: any[], category: string): Object;
    /**
     * Get comparison attributes based on product category
     * @param {String} category - Product category
     * @returns {Array} Array of comparison attributes
     */
    getComparisonAttributes(category: string): any[];
    /**
     * Build a comparison table for the products
     * @param {Array} products - Array of products to compare
     * @param {Array} attributes - Array of attributes to compare
     * @returns {Object} Comparison table
     */
    buildComparisonTable(products: any[], attributes: any[]): Object;
    /**
     * Calculate highlights for each product
     * @param {Array} products - Array of products to compare
     * @param {Array} attributes - Array of attributes to compare
     * @returns {Object} Highlights for each product
     */
    calculateHighlights(products: any[], attributes: any[]): Object;
    /**
     * Get a value from a nested object path
     * @param {Object} obj - Source object
     * @param {String} path - Dot notation path
     * @returns {*} Value at path
     */
    getNestedValue(obj: Object, path: string): any;
    /**
     * Save a comparison for later reference
     * @param {String} userId - User ID
     * @param {Array} productIds - Array of product IDs
     * @param {String} category - Product category
     * @returns {Object} Saved comparison
     */
    saveComparison(userId: string, productIds: any[], category: string): Object;
    /**
     * Get saved comparisons for a user
     * @param {String} userId - User ID
     * @returns {Array} Saved comparisons
     */
    getUserComparisons(userId: string): any[];
    /**
     * Compare complete PC builds
     * @param {Array} buildIds - Array of saved PC build IDs to compare
     * @returns {Object} Comparison results for complete PC builds
     */
    compareBuilds(buildIds: any[]): Object;
    /**
     * Calculate the total price of a PC build
     * @param {Object} build - PC build object
     * @returns {Number} Total price
     */
    calculateBuildPrice(build: Object): number;
    /**
     * Calculate the power requirements of a PC build
     * @param {Object} build - PC build object
     * @returns {Number} Total power in watts
     */
    calculateBuildPower(build: Object): number;
    /**
     * Calculate performance metrics for builds
     * @param {Array} builds - Array of PC build objects
     * @returns {Object} Performance metrics
     */
    calculateBuildPerformanceMetrics(builds: any[]): Object;
    /**
     * Estimate CPU performance score
     * @param {Object} cpu - CPU component
     * @returns {Number} CPU score
     */
    estimateCpuScore(cpu: Object): number;
    /**
     * Estimate GPU performance score
     * @param {Object} gpu - GPU component
     * @returns {Number} GPU score
     */
    estimateGpuScore(gpu: Object): number;
    /**
     * Estimate RAM performance score
     * @param {Object} ram - RAM component
     * @returns {Number} RAM score
     */
    estimateRamScore(ram: Object): number;
    /**
     * Calculate gaming performance score
     * @param {Number} cpuScore - CPU performance score
     * @param {Number} gpuScore - GPU performance score
     * @param {Number} ramScore - RAM performance score
     * @returns {Number} Gaming performance score
     */
    calculateGamingScore(cpuScore: number, gpuScore: number, ramScore: number): number;
    /**
     * Calculate productivity performance score
     * @param {Number} cpuScore - CPU performance score
     * @param {Number} gpuScore - GPU performance score
     * @param {Number} ramScore - RAM performance score
     * @returns {Number} Productivity performance score
     */
    calculateProductivityScore(cpuScore: number, gpuScore: number, ramScore: number): number;
    /**
     * Calculate multitasking performance score
     * @param {Number} cpuScore - CPU performance score
     * @param {Number} ramScore - RAM performance score
     * @returns {Number} Multitasking performance score
     */
    calculateMultitaskingScore(cpuScore: number, ramScore: number): number;
}
//# sourceMappingURL=productComparison.service.d.ts.map