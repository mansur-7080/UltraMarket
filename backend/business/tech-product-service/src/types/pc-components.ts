/**
 * PC Component Specifications
 */

export interface CpuSpecifications {
  cores: number;
  threads: number;
  baseClock: string; // in GHz
  boostClock?: string; // in GHz
  socket: string;
  tdp: number; // in watts
  cache: string; // e.g. "16 MB L3"
  architecture: string; // e.g. "Zen 3"
  integratedGraphics?: boolean;
}

export interface GpuSpecifications {
  memory: number; // in GB
  memoryType: string; // e.g. "GDDR6"
  coreClock: number; // in MHz
  boostClock?: number; // in MHz
  powerConsumption: number; // in watts
  connectors: string[]; // e.g. ["HDMI", "DisplayPort"]
  architecture: string; // e.g. "RDNA 2"
  rayTracing?: boolean;
}

export interface RamSpecifications {
  capacity: number; // in GB
  type: string; // e.g. "DDR4"
  speed: number; // in MHz
  timing: string; // e.g. "CL16"
  modules: number; // number of sticks
}

export interface MotherboardSpecifications {
  socket: string; // e.g. "AM4"
  formFactor: string; // e.g. "ATX"
  chipset: string; // e.g. "X570"
  memorySlots: number;
  maxMemory: number; // in GB
  supportedRAM: string[]; // e.g. ["DDR4"]
  pciSlots: {
    pcie_x16: number;
    pcie_x8: number;
    pcie_x4: number;
    pcie_x1: number;
  };
  storageSlots: {
    sata: number;
    m2: number;
  };
}

export interface StorageSpecifications {
  type: 'SSD' | 'HDD' | 'NVME';
  capacity: number; // in GB
  readSpeed?: number; // in MB/s
  writeSpeed?: number; // in MB/s
  interface: string; // e.g. "SATA III" or "PCIe 4.0"
  formFactor: string; // e.g. "2.5\"" or "M.2"
  cache?: number; // in MB
}

export interface PsuSpecifications {
  wattage: number;
  efficiency: string; // e.g. "80+ Gold"
  modular: 'Full' | 'Semi' | 'No';
  certification?: string;
}

export interface CaseSpecifications {
  formFactor: string[]; // e.g. ["ATX", "Micro-ATX"]
  dimensions: {
    height: number; // in mm
    width: number; // in mm
    depth: number; // in mm
  };
  gpuClearance: number; // in mm
  cpuCoolerClearance: number; // in mm
  fans: {
    included: number;
    maxSupported: number;
  };
  radiatorSupport: string[]; // e.g. ["240mm", "360mm"]
}

export interface CoolerSpecifications {
  type: 'Air' | 'Liquid';
  tdpSupport: number; // in watts
  noise?: number; // in dB
  fans: number;
  radiatorSize?: string; // for liquid, e.g. "240mm"
  height?: number; // for air, in mm
}

export type ComponentSpecifications =
  | CpuSpecifications
  | GpuSpecifications
  | RamSpecifications
  | MotherboardSpecifications
  | StorageSpecifications
  | PsuSpecifications
  | CaseSpecifications
  | CoolerSpecifications;
