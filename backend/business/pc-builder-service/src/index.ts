import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { logger } from '@shared/logger';

config();

const app = express();
const PORT = process.env.PORT || 3025;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  })
);

// Rate limiting
const builderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per 15 minutes
  message: { error: 'Too many PC builder requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/pc-builder', builderLimiter);

// General middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// PC Component interfaces
interface Component {
  id: string;
  name: string;
  brand: string;
  model: string;
  price: number;
  category: ComponentCategory;
  specifications: Record<string, unknown>;
  compatibility: string[];
  powerConsumption?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  inStock: boolean;
  imageUrl?: string;
}

enum ComponentCategory {
  CPU = 'cpu',
  GPU = 'gpu',
  MOTHERBOARD = 'motherboard',
  RAM = 'ram',
  STORAGE = 'storage',
  PSU = 'psu',
  CASE = 'case',
  COOLING = 'cooling',
  MONITOR = 'monitor',
  KEYBOARD = 'keyboard',
  MOUSE = 'mouse',
  SPEAKERS = 'speakers',
}

interface PCBuild {
  id: string;
  name: string;
  userId?: string;
  components: {
    cpu?: Component;
    gpu?: Component;
    motherboard?: Component;
    ram?: Component[];
    storage?: Component[];
    psu?: Component;
    case?: Component;
    cooling?: Component[];
    monitor?: Component[];
    peripherals?: Component[];
  };
  totalPrice: number;
  powerConsumption: number;
  compatibility: {
    isCompatible: boolean;
    issues: string[];
    warnings: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

class PCBuilderService {
  private builds: Map<string, PCBuild> = new Map();
  private components: Map<string, Component> = new Map();

  constructor() {
    this.initializeSampleComponents();
  }

  private initializeSampleComponents() {
    // Sample CPU
    this.components.set('cpu-1', {
      id: 'cpu-1',
      name: 'Intel Core i7-13700K',
      brand: 'Intel',
      model: 'Core i7-13700K',
      price: 419.99,
      category: ComponentCategory.CPU,
      specifications: {
        cores: 16,
        threads: 24,
        baseClock: '3.4 GHz',
        boostClock: '5.4 GHz',
        socket: 'LGA1700',
        tdp: '125W',
      },
      compatibility: ['LGA1700'],
      powerConsumption: 125,
      inStock: true,
    });

    // Sample GPU
    this.components.set('gpu-1', {
      id: 'gpu-1',
      name: 'NVIDIA RTX 4070',
      brand: 'NVIDIA',
      model: 'GeForce RTX 4070',
      price: 599.99,
      category: ComponentCategory.GPU,
      specifications: {
        memory: '12GB GDDR6X',
        coreClock: '2475 MHz',
        memorySpeed: '21 Gbps',
        interface: 'PCIe 4.0 x16',
      },
      compatibility: ['PCIe 4.0', 'PCIe 3.0'],
      powerConsumption: 200,
      dimensions: { length: 304, width: 137, height: 61 },
      inStock: true,
    });

    // Sample Motherboard
    this.components.set('mb-1', {
      id: 'mb-1',
      name: 'ASUS ROG STRIX Z790-E',
      brand: 'ASUS',
      model: 'ROG STRIX Z790-E',
      price: 479.99,
      category: ComponentCategory.MOTHERBOARD,
      specifications: {
        socket: 'LGA1700',
        chipset: 'Z790',
        memorySlots: 4,
        maxMemory: '128GB',
        memoryType: 'DDR5',
        pciSlots: ['PCIe 5.0 x16', 'PCIe 4.0 x16', 'PCIe 3.0 x1'],
        formFactor: 'ATX',
      },
      compatibility: ['LGA1700', 'DDR5', 'PCIe 5.0'],
      inStock: true,
    });
  }

  createBuild(name: string, userId?: string): PCBuild {
    const build: PCBuild = {
      id: `build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      userId,
      components: {},
      totalPrice: 0,
      powerConsumption: 0,
      compatibility: {
        isCompatible: true,
        issues: [],
        warnings: [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.builds.set(build.id, build);
    return build;
  }

  addComponentToBuild(
    buildId: string,
    componentId: string,
    category: ComponentCategory
  ): PCBuild | null {
    const build = this.builds.get(buildId);
    const component = this.components.get(componentId);

    if (!build || !component) {
      return null;
    }

    // Add component to build based on category
    switch (category) {
      case ComponentCategory.CPU:
        build.components.cpu = component;
        break;
      case ComponentCategory.GPU:
        build.components.gpu = component;
        break;
      case ComponentCategory.MOTHERBOARD:
        build.components.motherboard = component;
        break;
      case ComponentCategory.RAM:
        if (!build.components.ram) {
          build.components.ram = [];
        }
        build.components.ram.push(component);
        break;
      case ComponentCategory.STORAGE:
        if (!build.components.storage) {
          build.components.storage = [];
        }
        build.components.storage.push(component);
        break;
      case ComponentCategory.PSU:
        build.components.psu = component;
        break;
      case ComponentCategory.CASE:
        build.components.case = component;
        break;
      case ComponentCategory.COOLING:
        if (!build.components.cooling) {
          build.components.cooling = [];
        }
        build.components.cooling.push(component);
        break;
      default:
        return null;
    }

    // Recalculate totals and compatibility
    this.calculateBuildTotals(build);
    this.checkCompatibility(build);

    build.updatedAt = new Date();
    this.builds.set(buildId, build);

    return build;
  }

  private calculateBuildTotals(build: PCBuild) {
    let totalPrice = 0;
    let totalPower = 0;

    Object.values(build.components).forEach((component) => {
      if (Array.isArray(component)) {
        component.forEach((comp) => {
          totalPrice += comp.price;
          totalPower += comp.powerConsumption || 0;
        });
      } else if (component) {
        totalPrice += component.price;
        totalPower += component.powerConsumption || 0;
      }
    });

    build.totalPrice = totalPrice;
    build.powerConsumption = totalPower;
  }

  private checkCompatibility(build: PCBuild) {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check CPU and Motherboard compatibility
    if (build.components.cpu && build.components.motherboard) {
      const cpuSocket = build.components.cpu.specifications.socket;
      const mbSocket = build.components.motherboard.specifications.socket;

      if (cpuSocket !== mbSocket) {
        issues.push(
          `CPU socket ${cpuSocket} is not compatible with motherboard socket ${mbSocket}`
        );
      }
    }

    // Check PSU power capacity
    if (build.components.psu) {
      const psuWattage = build.components.psu.specifications.wattage as number;
      const recommendedWattage = build.powerConsumption * 1.2; // 20% headroom

      if (psuWattage < recommendedWattage) {
        warnings.push(
          `PSU wattage (${psuWattage}W) may be insufficient. Recommended: ${Math.ceil(recommendedWattage)}W`
        );
      }
    }

    build.compatibility = {
      isCompatible: issues.length === 0,
      issues,
      warnings,
    };
  }

  getBuild(buildId: string): PCBuild | undefined {
    return this.builds.get(buildId);
  }

  getUserBuilds(userId: string): PCBuild[] {
    return Array.from(this.builds.values()).filter((build) => build.userId === userId);
  }

  getComponents(category?: ComponentCategory): Component[] {
    const components = Array.from(this.components.values());
    return category ? components.filter((comp) => comp.category === category) : components;
  }

  deleteBuild(buildId: string): boolean {
    return this.builds.delete(buildId);
  }
}

const pcBuilderService = new PCBuilderService();

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'pc-builder-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Create new PC build
app.post('/api/pc-builder/builds', (req, res) => {
  try {
    const { name, userId } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_NAME', message: 'Build name is required' },
      });
    }

    const build = pcBuilderService.createBuild(name, userId);

    logger.info('PC build created', { buildId: build.id, name, userId });

    res.status(201).json({
      success: true,
      data: build,
    });
  } catch (error) {
    logger.error('Failed to create PC build', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create PC build' },
    });
  }
});

// Get PC build
app.get('/api/pc-builder/builds/:buildId', (req, res) => {
  try {
    const { buildId } = req.params;
    const build = pcBuilderService.getBuild(buildId);

    if (!build) {
      return res.status(404).json({
        success: false,
        error: { code: 'BUILD_NOT_FOUND', message: 'PC build not found' },
      });
    }

    res.json({
      success: true,
      data: build,
    });
  } catch (error) {
    logger.error('Failed to get PC build', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get PC build' },
    });
  }
});

// Add component to build
app.post('/api/pc-builder/builds/:buildId/components', (req, res) => {
  try {
    const { buildId } = req.params;
    const { componentId, category } = req.body;

    if (!componentId || !category) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_DATA', message: 'Component ID and category are required' },
      });
    }

    const updatedBuild = pcBuilderService.addComponentToBuild(buildId, componentId, category);

    if (!updatedBuild) {
      return res.status(404).json({
        success: false,
        error: { code: 'BUILD_OR_COMPONENT_NOT_FOUND', message: 'Build or component not found' },
      });
    }

    logger.info('Component added to PC build', { buildId, componentId, category });

    res.json({
      success: true,
      data: updatedBuild,
    });
  } catch (error) {
    logger.error('Failed to add component to build', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to add component to build' },
    });
  }
});

// Get components
app.get('/api/pc-builder/components', (req, res) => {
  try {
    const { category } = req.query;
    const components = pcBuilderService.getComponents(category as ComponentCategory);

    res.json({
      success: true,
      data: components,
      total: components.length,
    });
  } catch (error) {
    logger.error('Failed to get components', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get components' },
    });
  }
});

// Get user builds
app.get('/api/pc-builder/users/:userId/builds', (req, res) => {
  try {
    const { userId } = req.params;
    const builds = pcBuilderService.getUserBuilds(userId);

    res.json({
      success: true,
      data: builds,
      total: builds.length,
    });
  } catch (error) {
    logger.error('Failed to get user builds', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get user builds' },
    });
  }
});

// Delete build
app.delete('/api/pc-builder/builds/:buildId', (req, res) => {
  try {
    const { buildId } = req.params;
    const deleted = pcBuilderService.deleteBuild(buildId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'BUILD_NOT_FOUND', message: 'PC build not found' },
      });
    }

    logger.info('PC build deleted', { buildId });

    res.json({
      success: true,
      message: 'PC build deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete PC build', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete PC build' },
    });
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('PC Builder service error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
  });
});

// Start server
app.listen(PORT, () => {
  logger.info('PC Builder Service started successfully', {
    port: PORT,
    service: 'pc-builder-service',
    operation: 'startup',
    timestamp: new Date().toISOString(),
  });
});

export default app;
