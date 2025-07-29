declare const _exports: PCBuilderService;
export = _exports;
declare class PCBuilderService {
    /**
     * Validates compatibility between PC components
     * @param {Object} components - Object containing selected PC components
     * @returns {Object} Compatibility results and issues
     */
    validateCompatibility(components: Object): Object;
    /**
     * Calculates the estimated power requirements for selected components
     * @param {Object} components - Object containing selected PC components
     * @returns {Object} Power requirement details
     */
    calculatePowerRequirements(components: Object): Object;
    /**
     * Finds compatible components based on currently selected components
     * @param {Object} components - Currently selected components
     * @param {String} targetComponent - Type of component to find compatible options for
     * @returns {Array} List of compatible components
     */
    findCompatibleComponents(components: Object, targetComponent: string): any[];
    /**
     * Maps component type to corresponding Mongoose model name
     * @param {String} componentType - Type of component
     * @returns {String} Mongoose model name
     */
    getModelName(componentType: string): string;
    /**
     * Saves a PC build configuration
     * @param {String} userId - User ID
     * @param {Object} buildConfig - PC build configuration
     * @param {String} name - Name of the build
     * @returns {Object} Saved build
     */
    saveBuild(userId: string, buildConfig: Object, name: string): Object;
    /**
     * Retrieves PC build configurations for a user
     * @param {String} userId - User ID
     * @returns {Array} List of builds
     */
    getUserBuilds(userId: string): any[];
    /**
     * Get suggested builds based on budget and use case
     * @param {Object} options - Build options
     * @param {Number} options.budget - Budget in local currency
     * @param {String} options.useCase - Intended use case (gaming, productivity, etc.)
     * @returns {Array} Suggested builds
     */
    getSuggestedBuilds(options: {
        budget: number;
        useCase: string;
    }): any[];
    /**
     * Calculate performance scores for a build
     * @param {Object} components - The components of the build
     * @param {String} useCase - The intended use case
     * @returns {Object} Performance metrics
     */
    calculateBuildPerformance(components: Object, useCase: string): Object;
}
//# sourceMappingURL=pcBuilder.service.d.ts.map