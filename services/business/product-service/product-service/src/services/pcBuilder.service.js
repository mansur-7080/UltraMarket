// PC Builder Component Service
// This service handles the logic for the PC Builder feature

const mongoose = require('mongoose');
const { logger, createError } = require('@ultramarket/shared');

class PCBuilderService {
  /**
   * Validates compatibility between PC components
   * @param {Object} components - Object containing selected PC components
   * @returns {Object} Compatibility results and issues
   */
  async validateCompatibility(components) {
    logger.info('Validating PC components compatibility');

    const issues = [];
    const warnings = [];
    let isCompatible = true;

    try {
      // CPU and Motherboard socket compatibility check
      if (components.cpu && components.motherboard) {
        const cpuSocket = components.cpu.specifications.socket;
        const motherboardSocket = components.motherboard.specifications.socket;

        if (cpuSocket !== motherboardSocket) {
          issues.push({
            type: 'critical',
            message: `CPU socket (${cpuSocket}) is not compatible with motherboard socket (${motherboardSocket})`,
            components: ['cpu', 'motherboard'],
          });
          isCompatible = false;
        }
      }

      // Memory compatibility check
      if (components.memory && components.motherboard) {
        const memoryType = components.memory.specifications.type; // DDR4, DDR5
        const motherboardMemoryType = components.motherboard.specifications.memoryType;

        if (memoryType !== motherboardMemoryType) {
          issues.push({
            type: 'critical',
            message: `Memory type (${memoryType}) is not compatible with motherboard memory type (${motherboardMemoryType})`,
            components: ['memory', 'motherboard'],
          });
          isCompatible = false;
        }
      }

      // Case compatibility check with motherboard form factor
      if (components.case && components.motherboard) {
        const caseFormFactors = components.case.specifications.supportedFormFactors;
        const motherboardFormFactor = components.motherboard.specifications.formFactor;

        if (!caseFormFactors.includes(motherboardFormFactor)) {
          issues.push({
            type: 'critical',
            message: `Case does not support motherboard form factor (${motherboardFormFactor})`,
            components: ['case', 'motherboard'],
          });
          isCompatible = false;
        }
      }

      // Power requirements check
      if (components.powerSupply && Object.keys(components).length > 1) {
        const powerRequirements = await this.calculatePowerRequirements(components);
        const psuWattage = components.powerSupply.specifications.wattage;

        if (powerRequirements.totalWattage > psuWattage * 0.8) {
          // 80% of PSU wattage for safety
          issues.push({
            type: 'critical',
            message: `Power supply wattage (${psuWattage}W) may not be sufficient for system requirements (${powerRequirements.totalWattage}W)`,
            components: ['powerSupply'],
          });
          isCompatible = false;
        } else if (powerRequirements.totalWattage > psuWattage * 0.7) {
          warnings.push({
            type: 'warning',
            message: `Power supply is close to its limit. Consider upgrading for future expansion.`,
            components: ['powerSupply'],
          });
        }
      }

      // Storage compatibility check
      if (components.storage && components.motherboard) {
        const storageInterface = components.storage.specifications.interface;
        const motherboardInterfaces = components.motherboard.specifications.storageInterfaces;

        if (storageInterface === 'M.2 NVMe' && !motherboardInterfaces.includes('M.2 NVMe')) {
          issues.push({
            type: 'critical',
            message: `Motherboard does not support M.2 NVMe storage`,
            components: ['storage', 'motherboard'],
          });
          isCompatible = false;
        }
      }

      return {
        isCompatible,
        issues,
        warnings,
        components,
      };
    } catch (error) {
      logger.error('Error validating PC components compatibility:', error);
      throw createError(500, 'Failed to validate component compatibility');
    }
  }

  /**
   * Calculates the estimated power requirements for selected components
   * @param {Object} components - Object containing selected PC components
   * @returns {Object} Power requirement details
   */
  async calculatePowerRequirements(components) {
    logger.info('Calculating power requirements for PC build');

    try {
      let totalWattage = 0;
      const componentWattage = {};

      // CPU power
      if (components.cpu) {
        const cpuWattage = components.cpu.specifications.tdp || 65;
        componentWattage.cpu = cpuWattage;
        totalWattage += cpuWattage;
      }

      // GPU power
      if (components.gpu) {
        const gpuWattage = components.gpu.specifications.tdp || 75;
        componentWattage.gpu = gpuWattage;
        totalWattage += gpuWattage;
      }

      // Memory power (estimate based on number of sticks)
      if (components.memory) {
        const memoryCount = components.memory.specifications.count || 1;
        const memoryWattage = memoryCount * 5; // ~5W per stick
        componentWattage.memory = memoryWattage;
        totalWattage += memoryWattage;
      }

      // Storage power
      if (components.storage) {
        let storageWattage = 0;

        if (components.storage.specifications.type === 'HDD') {
          storageWattage = 10; // ~10W for HDD
        } else if (components.storage.specifications.type === 'SSD') {
          storageWattage = 3; // ~3W for SATA SSD
        } else if (components.storage.specifications.type === 'NVMe') {
          storageWattage = 8; // ~8W for NVMe SSD
        }

        componentWattage.storage = storageWattage;
        totalWattage += storageWattage;
      }

      // Motherboard power
      if (components.motherboard) {
        const motherboardWattage = 50; // Average motherboard power
        componentWattage.motherboard = motherboardWattage;
        totalWattage += motherboardWattage;
      }

      // Cooling power
      if (components.cooling) {
        const coolingWattage = components.cooling.specifications.tdp || 10;
        componentWattage.cooling = coolingWattage;
        totalWattage += coolingWattage;
      }

      // Add 20% buffer for other components, efficiency loss, and future-proofing
      const recommendedWattage = Math.ceil(totalWattage * 1.2);

      return {
        totalWattage,
        recommendedWattage,
        componentWattage,
      };
    } catch (error) {
      logger.error('Error calculating power requirements:', error);
      throw createError(500, 'Failed to calculate power requirements');
    }
  }

  /**
   * Finds compatible components based on currently selected components
   * @param {Object} components - Currently selected components
   * @param {String} targetComponent - Type of component to find compatible options for
   * @returns {Array} List of compatible components
   */
  async findCompatibleComponents(components, targetComponent) {
    logger.info(`Finding compatible ${targetComponent} options`);

    try {
      let filter = {};

      switch (targetComponent) {
        case 'motherboard':
          if (components.cpu) {
            filter['specifications.socket'] = components.cpu.specifications.socket;
          }
          break;

        case 'cpu':
          if (components.motherboard) {
            filter['specifications.socket'] = components.motherboard.specifications.socket;
          }
          break;

        case 'memory':
          if (components.motherboard) {
            filter['specifications.type'] = components.motherboard.specifications.memoryType;
          }
          break;

        case 'case':
          if (components.motherboard) {
            filter[`specifications.supportedFormFactors`] =
              components.motherboard.specifications.formFactor;
          }
          break;

        case 'powerSupply':
          if (Object.keys(components).length > 0) {
            const powerRequirements = await this.calculatePowerRequirements(components);
            filter['specifications.wattage'] = { $gte: powerRequirements.recommendedWattage };
          }
          break;

        default:
          // No specific filters for other component types
          break;
      }

      // Get the component model based on target type
      const ComponentModel = mongoose.model(this.getModelName(targetComponent));
      const compatibleComponents = await ComponentModel.find(filter).sort({ price: 1 }).limit(10);

      return compatibleComponents;
    } catch (error) {
      logger.error(`Error finding compatible ${targetComponent} options:`, error);
      throw createError(500, `Failed to find compatible ${targetComponent} options`);
    }
  }

  /**
   * Maps component type to corresponding Mongoose model name
   * @param {String} componentType - Type of component
   * @returns {String} Mongoose model name
   */
  getModelName(componentType) {
    const modelMap = {
      cpu: 'CPU',
      motherboard: 'Motherboard',
      memory: 'Memory',
      gpu: 'GraphicsCard',
      storage: 'Storage',
      case: 'Case',
      powerSupply: 'PowerSupply',
      cooling: 'Cooling',
      monitor: 'Monitor',
    };

    return modelMap[componentType] || 'Product';
  }

  /**
   * Saves a PC build configuration
   * @param {String} userId - User ID
   * @param {Object} buildConfig - PC build configuration
   * @param {String} name - Name of the build
   * @returns {Object} Saved build
   */
  async saveBuild(userId, buildConfig, name) {
    logger.info(`Saving PC build "${name}" for user ${userId}`);

    try {
      const Build = mongoose.model('PCBuild');

      const newBuild = new Build({
        userId,
        name,
        components: buildConfig,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await newBuild.save();
      return newBuild;
    } catch (error) {
      logger.error('Error saving PC build:', error);
      throw createError(500, 'Failed to save PC build');
    }
  }

  /**
   * Retrieves PC build configurations for a user
   * @param {String} userId - User ID
   * @returns {Array} List of builds
   */
  async getUserBuilds(userId) {
    logger.info(`Retrieving PC builds for user ${userId}`);

    try {
      const Build = mongoose.model('PCBuild');
      const builds = await Build.find({ userId }).sort({ updatedAt: -1 });

      return builds;
    } catch (error) {
      logger.error('Error retrieving PC builds:', error);
      throw createError(500, 'Failed to retrieve PC builds');
    }
  }

  /**
   * Get suggested builds based on budget and use case
   * @param {Object} options - Build options
   * @param {Number} options.budget - Budget in local currency
   * @param {String} options.useCase - Intended use case (gaming, productivity, etc.)
   * @returns {Array} Suggested builds
   */
  async getSuggestedBuilds(options) {
    logger.info('Getting suggested PC builds', options);

    try {
      const { budget, useCase } = options;

      if (!budget || budget <= 0) {
        throw createError(400, 'Valid budget is required');
      }

      if (!useCase) {
        throw createError(400, 'Use case is required');
      }

      // Get products for each component type
      const Product = mongoose.model('Product');

      // Allocate budget based on use case
      let budgetAllocations;

      switch (useCase.toLowerCase()) {
        case 'gaming':
          budgetAllocations = {
            cpu: 0.2, // 20% of budget
            motherboard: 0.1,
            memory: 0.1,
            gpu: 0.35, // Gaming prioritizes GPU
            storage: 0.1,
            case: 0.05,
            power: 0.07,
            cooling: 0.03,
          };
          break;

        case 'productivity':
          budgetAllocations = {
            cpu: 0.35, // Productivity prioritizes CPU
            motherboard: 0.12,
            memory: 0.15, // And RAM
            gpu: 0.15,
            storage: 0.1,
            case: 0.05,
            power: 0.05,
            cooling: 0.03,
          };
          break;

        case 'streaming':
          budgetAllocations = {
            cpu: 0.3, // Streaming needs good CPU
            motherboard: 0.1,
            memory: 0.15,
            gpu: 0.25, // And decent GPU
            storage: 0.07,
            case: 0.05,
            power: 0.05,
            cooling: 0.03,
          };
          break;

        default: // Balanced
          budgetAllocations = {
            cpu: 0.25,
            motherboard: 0.1,
            memory: 0.12,
            gpu: 0.25,
            storage: 0.1,
            case: 0.08,
            power: 0.05,
            cooling: 0.05,
          };
      }

      // Create component budget limits
      const componentBudgets = {};
      let totalAllocation = 0;

      for (const component in budgetAllocations) {
        componentBudgets[component] = Math.floor(budget * budgetAllocations[component]);
        totalAllocation += componentBudgets[component];
      }

      // Adjust for rounding errors
      const remaining = budget - totalAllocation;
      componentBudgets.cpu += remaining;

      // Build component query filters
      const componentFilters = {
        cpu: { category: 'processors', price: { $lte: componentBudgets.cpu } },
        motherboard: { category: 'motherboards', price: { $lte: componentBudgets.motherboard } },
        memory: { category: 'memory', price: { $lte: componentBudgets.memory } },
        gpu: { category: 'video-cards', price: { $lte: componentBudgets.gpu } },
        storage: { category: 'storage', price: { $lte: componentBudgets.storage } },
        case: { category: 'cases', price: { $lte: componentBudgets.case } },
        power: { category: 'power-supplies', price: { $lte: componentBudgets.power } },
        cooling: { category: 'cpu-coolers', price: { $lte: componentBudgets.cooling } },
      };

      // Add use case specific filters
      if (useCase.toLowerCase() === 'gaming') {
        componentFilters.gpu['specifications.gaming'] = { $gte: 7 }; // Gaming score at least 7/10
      } else if (useCase.toLowerCase() === 'productivity') {
        componentFilters.cpu['specifications.cores'] = { $gte: 6 }; // At least 6 cores
        componentFilters.memory['specifications.capacity'] = { $gte: 16 }; // At least 16GB RAM
      }

      // Find components
      const components = {};

      for (const type in componentFilters) {
        // Find top component for each type based on price (closest to allocated budget)
        const options = await Product.find(componentFilters[type])
          .sort({ price: -1 })
          .limit(3)
          .lean();

        if (options.length > 0) {
          // Pick the best value (highest price within budget)
          components[type] = options[0];
        }
      }

      // Validate compatibility between components
      const compatibilityResult = await this.validateCompatibility(components);

      // If incompatible, try to fix
      if (!compatibilityResult.isCompatible) {
        for (const issue of compatibilityResult.issues) {
          // Try to resolve the first critical issue
          if (issue.type === 'critical') {
            const [componentType1, componentType2] = issue.components;

            // For example, if CPU and motherboard are incompatible, try to find a compatible motherboard
            if (componentType1 === 'cpu' && componentType2 === 'motherboard') {
              const compatibleMotherboards = await Product.find({
                category: 'motherboards',
                price: { $lte: componentBudgets.motherboard },
                'specifications.socket': components.cpu.specifications.socket,
              })
                .sort({ price: -1 })
                .limit(1)
                .lean();

              if (compatibleMotherboards.length > 0) {
                components.motherboard = compatibleMotherboards[0];
              }
            }
          }
        }
      }

      // Calculate total price
      let totalPrice = 0;
      for (const type in components) {
        totalPrice += components[type].price || 0;
      }

      // Create the build
      const suggestedBuild = {
        name: `${useCase} Build (${budget} so'm)`,
        components,
        totalPrice,
        budget,
        useCase,
        performance: this.calculateBuildPerformance(components, useCase),
      };

      return { suggestedBuild };
    } catch (error) {
      logger.error(`Error getting suggested builds: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate performance scores for a build
   * @param {Object} components - The components of the build
   * @param {String} useCase - The intended use case
   * @returns {Object} Performance metrics
   */
  calculateBuildPerformance(components, useCase) {
    const performance = {
      overall: 0,
      gaming: 0,
      productivity: 0,
    };

    // CPU score (0-100)
    let cpuScore = 0;
    if (components.cpu) {
      const cpu = components.cpu;
      const cores = cpu.specifications?.cores || 0;
      const threads = cpu.specifications?.threads || 0;
      const clockSpeed = cpu.specifications?.clockSpeed || 0;

      cpuScore = cores * 10 + threads * 5 + clockSpeed * 10;
      cpuScore = Math.min(100, cpuScore); // Cap at 100
    }

    // GPU score (0-100)
    let gpuScore = 0;
    if (components.gpu) {
      const gpu = components.gpu;
      const vram = gpu.specifications?.memory || 0;
      const gaming = gpu.specifications?.gaming || 0;

      gpuScore = vram * 10 + gaming * 10;
      gpuScore = Math.min(100, gpuScore); // Cap at 100
    }

    // RAM score (0-100)
    let ramScore = 0;
    if (components.memory) {
      const memory = components.memory;
      const capacity = memory.specifications?.capacity || 0;
      const speed = memory.specifications?.speed || 0;

      ramScore = capacity * 5 + speed / 100;
      ramScore = Math.min(100, ramScore); // Cap at 100
    }

    // Calculate scores based on use case
    switch (useCase.toLowerCase()) {
      case 'gaming':
        performance.gaming = gpuScore * 0.6 + cpuScore * 0.3 + ramScore * 0.1;
        performance.productivity = cpuScore * 0.5 + ramScore * 0.3 + gpuScore * 0.2;
        performance.overall = performance.gaming * 0.7 + performance.productivity * 0.3;
        break;

      case 'productivity':
        performance.gaming = gpuScore * 0.6 + cpuScore * 0.3 + ramScore * 0.1;
        performance.productivity = cpuScore * 0.6 + ramScore * 0.3 + gpuScore * 0.1;
        performance.overall = performance.productivity * 0.7 + performance.gaming * 0.3;
        break;

      default:
        performance.gaming = gpuScore * 0.6 + cpuScore * 0.3 + ramScore * 0.1;
        performance.productivity = cpuScore * 0.5 + ramScore * 0.3 + gpuScore * 0.2;
        performance.overall = performance.gaming * 0.5 + performance.productivity * 0.5;
    }

    return performance;
  }
}

module.exports = new PCBuilderService();
