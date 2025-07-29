import { Request, Response } from 'express';

import { ComponentSpecifications } from '../types/pc-components';

interface PCComponent {
  id: string;
  category: string;
  brand: string;
  name: string;
  price: number;
  specifications: Record<string, unknown>;
}

interface PCBuild {
  cpu?: PCComponent;
  motherboard?: PCComponent;
  ram: PCComponent[];
  gpu?: PCComponent;
  storage: PCComponent[];
  psu?: PCComponent;
  case?: PCComponent;
  cooling?: PCComponent;
}

export class PCBuilderController {
  static async validateBuild(req: Request, res: Response) {
    try {
      const build: PCBuild = req.body;
      const validation = PCBuilderController.performCompatibilityCheck(build);

      res.json({
        success: true,
        data: {
          isValid: validation.issues.length === 0,
          issues: validation.issues,
          warnings: validation.warnings,
          powerRequirement: validation.powerRequirement,
          estimatedPerformance: validation.performance,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Validation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async estimatePowerConsumption(req: Request, res: Response) {
    try {
      const build: PCBuild = req.body;
      let totalPower = 50; // Base system power

      // CPU power
      if (build.cpu) {
        totalPower += Number(build.cpu.specifications.tdp) || 65;
      }

      // GPU power
      if (build.gpu) {
        totalPower += Number(build.gpu.specifications.powerConsumption) || 150;
      }

      // RAM power (estimated 5W per stick)
      totalPower += build.ram.length * 5;

      // Storage power (estimated 10W per drive)
      totalPower += build.storage.length * 10;

      // Additional components
      if (build.cooling) totalPower += 15;
      if (build.case) totalPower += 20; // Case fans

      const recommendation = {
        minimumPSU: Math.ceil((totalPower * 1.2) / 50) * 50, // 20% overhead, rounded to nearest 50W
        recommendedPSU: Math.ceil((totalPower * 1.5) / 50) * 50, // 50% overhead for future upgrades
        efficiency: '80+ Gold recommended',
      };

      res.json({
        success: true,
        data: {
          estimatedPower: totalPower,
          breakdown: {
            cpu: build.cpu?.specifications.tdp || 0,
            gpu: build.gpu?.specifications.powerConsumption || 0,
            ram: build.ram.length * 5,
            storage: build.storage.length * 10,
            other: 50 + (build.cooling ? 15 : 0) + (build.case ? 20 : 0),
          },
          recommendation,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Power estimation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async calculatePerformance(req: Request, res: Response) {
    try {
      const build: PCBuild = req.body;

      // Mock performance calculation
      let gameScore = 50;
      let productivityScore = 50;

      // CPU contribution
      if (build.cpu) {
        const cores = Number(build.cpu.specifications.cores) || 4;
        const boost = parseFloat(String(build.cpu.specifications.boostClock)) || 3.0;
        gameScore += cores * 2 + boost * 5;
        productivityScore += cores * 3 + boost * 4;
      }

      // GPU contribution (mainly for gaming)
      if (build.gpu) {
        const memory = parseInt(String(build.gpu.specifications.memory)) || 4;
        const coreClock = parseInt(String(build.gpu.specifications.coreClock)) || 1500;
        gameScore += memory * 8 + coreClock / 20;
        productivityScore += memory * 3;
      }

      // RAM contribution
      const totalRAM = build.ram.reduce((sum, ram) => {
        const capacity = parseInt(String(ram.specifications.capacity)) || 8;
        return sum + capacity;
      }, 0);
      gameScore += Math.min(totalRAM * 2, 32);
      productivityScore += Math.min(totalRAM * 3, 48);

      // Normalize scores to 100 scale
      gameScore = Math.min(gameScore, 100);
      productivityScore = Math.min(productivityScore, 100);

      const performance = {
        overall: Math.round((gameScore + productivityScore) / 2),
        gaming: Math.round(gameScore),
        productivity: Math.round(productivityScore),
        categories: {
          '1080p_gaming': gameScore > 70 ? 'Excellent' : gameScore > 50 ? 'Good' : 'Fair',
          '1440p_gaming': gameScore > 80 ? 'Excellent' : gameScore > 60 ? 'Good' : 'Fair',
          '4k_gaming': gameScore > 90 ? 'Excellent' : gameScore > 75 ? 'Good' : 'Fair',
          video_editing:
            productivityScore > 75 ? 'Excellent' : productivityScore > 55 ? 'Good' : 'Fair',
          streaming: (gameScore + productivityScore) / 2 > 70 ? 'Excellent' : 'Good',
        },
      };

      res.json({
        success: true,
        data: performance,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Performance calculation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async optimizeBudget(req: Request, res: Response) {
    try {
      const { budget, useCase, currentBuild } = req.body;

      // Mock budget optimization
      const optimizedBuild = {
        totalPrice: budget * 0.95, // Use 95% of budget
        components: {
          cpu: { allocation: budget * 0.25, recommendation: 'AMD Ryzen 5 7600X' },
          gpu: { allocation: budget * 0.35, recommendation: 'NVIDIA RTX 4060' },
          motherboard: { allocation: budget * 0.15, recommendation: 'MSI B650 TOMAHAWK' },
          ram: { allocation: budget * 0.1, recommendation: '32GB DDR5-5600' },
          storage: { allocation: budget * 0.08, recommendation: '1TB NVMe SSD' },
          psu: { allocation: budget * 0.07, recommendation: '650W 80+ Gold' },
        },
        savings: budget * 0.05,
        performance: {
          gaming: 85,
          productivity: 78,
        },
      };

      res.json({
        success: true,
        data: optimizedBuild,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Budget optimization failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async saveBuild(req: Request, res: Response) {
    try {
      const { userId, buildName, build, isPublic } = req.body;

      // Mock save build
      const savedBuild = {
        id: `build-${Date.now()}`,
        userId,
        name: buildName,
        build,
        isPublic: isPublic || false,
        totalPrice: PCBuilderController.calculateTotalPrice(build),
        powerRequirement: 450, // Mock power calculation
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      res.json({
        success: true,
        data: savedBuild,
        message: 'Build saved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to save build',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async getUserBuilds(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      // Mock user builds
      const builds = [
        {
          id: 'build-1',
          name: 'Gaming Beast 4K',
          nameUz: 'Gaming Beast 4K',
          totalPrice: 18500000,
          powerRequirement: 650,
          performance: {
            gaming: 95,
            productivity: 85,
          },
          createdAt: '2024-01-15T10:30:00Z',
          isPublic: false,
        },
        {
          id: 'build-2',
          name: 'Budget Gaming',
          nameUz: 'Arzon Gaming',
          totalPrice: 8500000,
          powerRequirement: 450,
          performance: {
            gaming: 75,
            productivity: 65,
          },
          createdAt: '2024-01-10T14:20:00Z',
          isPublic: true,
        },
      ];

      res.json({
        success: true,
        data: builds,
        total: builds.length,
        userId,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user builds',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async getTrendingBuilds(req: Request, res: Response) {
    try {
      // Mock trending builds
      const trendingBuilds = [
        {
          id: 'trending-1',
          name: 'RTX 4060 Gaming Build',
          nameUz: 'RTX 4060 Gaming Build',
          author: 'TechExpert_UZ',
          totalPrice: 12500000,
          components: {
            cpu: 'AMD Ryzen 5 7600X',
            gpu: 'NVIDIA RTX 4060',
            ram: '32GB DDR5',
          },
          performance: {
            gaming: 85,
            productivity: 75,
          },
          likes: 234,
          views: 1520,
          createdAt: '2024-01-20T09:15:00Z',
        },
        {
          id: 'trending-2',
          name: 'Budget 1080p Beast',
          nameUz: 'Arzon 1080p Beast',
          author: 'PCBuilder_Pro',
          totalPrice: 7800000,
          components: {
            cpu: 'AMD Ryzen 5 5600',
            gpu: 'NVIDIA GTX 1660 Super',
            ram: '16GB DDR4',
          },
          performance: {
            gaming: 70,
            productivity: 65,
          },
          likes: 189,
          views: 980,
          createdAt: '2024-01-18T16:45:00Z',
        },
      ];

      res.json({
        success: true,
        data: trendingBuilds,
        total: trendingBuilds.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch trending builds',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  static async getCompatibleComponents(req: Request, res: Response) {
    try {
      const { category } = req.params;
      const { socket, budget, existing } = req.query;

      // Mock compatible components based on category
      let components: any[] = [];

      switch (category) {
        case 'cpu':
          components = [
            {
              id: 'intel-i5-13600k',
              name: 'Intel Core i5-13600K',
              brand: 'Intel',
              price: 3200000,
              socket: 'LGA1700',
              compatibility: 'full',
            },
            {
              id: 'amd-ryzen5-7600x',
              name: 'AMD Ryzen 5 7600X',
              brand: 'AMD',
              price: 2800000,
              socket: 'AM5',
              compatibility: 'full',
            },
          ];
          break;

        case 'motherboard':
          components = [
            {
              id: 'asus-z790-prime',
              name: 'ASUS PRIME Z790-P',
              brand: 'ASUS',
              price: 2100000,
              socket: socket || 'LGA1700',
              compatibility: socket === 'LGA1700' ? 'full' : 'none',
            },
          ];
          break;

        default:
          components = [];
      }

      // Filter by budget if provided
      if (budget) {
        const maxBudget = parseInt(budget as string);
        components = components.filter((c) => c.price <= maxBudget);
      }

      res.json({
        success: true,
        data: components,
        category,
        filters: { socket, budget, existing },
        total: components.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch compatible components',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Helper methods
  private static performCompatibilityCheck(build: PCBuild) {
    const issues: string[] = [];
    const warnings: string[] = [];
    let powerRequirement = 100; // Base power

    // Check CPU and Motherboard compatibility
    if (build.cpu && build.motherboard) {
      const cpuSocket = build.cpu.specifications.socket;
      const mbSocket = build.motherboard.specifications.socket;

      if (cpuSocket !== mbSocket) {
        issues.push(`CPU socket (${cpuSocket}) incompatible with motherboard socket (${mbSocket})`);
      }
    }

    // Check RAM compatibility
    if (build.ram.length > 0 && build.motherboard) {
      const ramType = build.ram[0].specifications.type;
      const supportedRAM = build.motherboard.specifications.supportedRAM || [];

      if (Array.isArray(supportedRAM) && !supportedRAM.includes(String(ramType))) {
        issues.push(`RAM type (${ramType}) not supported by motherboard`);
      }

      if (build.ram.length > 4) {
        warnings.push('More than 4 RAM modules may not fit in standard motherboard');
      }
    }

    // Calculate power requirement
    if (build.cpu) {
      powerRequirement += Number(build.cpu.specifications.tdp) || 65;
    }
    if (build.gpu) {
      powerRequirement += Number(build.gpu.specifications.powerConsumption) || 150;
    }
    powerRequirement += build.ram.length * 5;
    powerRequirement += build.storage.length * 10;

    // Check PSU adequacy
    if (build.psu) {
      const psuWattage = Number(build.psu.specifications.wattage) || 0;
      if (powerRequirement > psuWattage * 0.8) {
        if (powerRequirement > psuWattage) {
          issues.push(`Insufficient PSU: ${powerRequirement}W required, ${psuWattage}W available`);
        } else {
          warnings.push('PSU running close to capacity, consider higher wattage');
        }
      }
    }

    return {
      issues,
      warnings,
      powerRequirement,
      performance: {
        gaming: 75,
        productivity: 70,
      },
    };
  }

  private static calculateTotalPrice(build: PCBuild): number {
    let total = 0;

    if (build.cpu) total += build.cpu.price;
    if (build.motherboard) total += build.motherboard.price;
    if (build.gpu) total += build.gpu.price;
    if (build.psu) total += build.psu.price;
    if (build.case) total += build.case.price;
    if (build.cooling) total += build.cooling.price;

    build.ram.forEach((ram) => (total += ram.price));
    build.storage.forEach((storage) => (total += storage.price));

    return total;
  }
}
