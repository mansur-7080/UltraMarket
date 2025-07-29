import React, { useState, useEffect } from 'react';
import './PCBuilder.css';
import './PCBuilderEnhancements.css'; // Yangi stillarni import qilamiz

interface Component {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  specifications: { [key: string]: any };
  socket?: string;
  tdp?: number;
  powerConsumption?: number;
  type?: string;
  supportedRAM?: string[];
  wattage?: number;
  formFactor?: string;
}

interface PCBuild {
  cpu: Component | null;
  motherboard: Component | null;
  ram: Component[];
  gpu: Component | null;
  storage: Component[];
  psu: Component | null;
  case: Component | null;
  cooling: Component | null;
}

interface CompatibilityCheck {
  issues: string[];
  warnings: string[];
  powerRequirement: number;
  isValid: boolean;
  performanceScore: {
    gaming: number;
    productivity: number;
    content: number;
  };
  thermalAnalysis: {
    cpuTemp: number;
    gpuTemp: number;
    caseAirflow: string;
  };
  upgradeRecommendations: string[];
}

const PCBuilder: React.FC = () => {
  const [currentBuild, setCurrentBuild] = useState<PCBuild>({
    cpu: null,
    motherboard: null,
    ram: [],
    gpu: null,
    storage: [],
    psu: null,
    case: null,
    cooling: null,
  });

  const [compatibility, setCompatibility] = useState<CompatibilityCheck>({
    issues: [],
    warnings: [],
    powerRequirement: 0,
    isValid: true,
    performanceScore: {
      gaming: 0,
      productivity: 0,
      content: 0,
    },
    thermalAnalysis: {
      cpuTemp: 0,
      gpuTemp: 0,
      caseAirflow: 'N/A',
    },
    upgradeRecommendations: [],
  });

  const [activeSelector, setActiveSelector] = useState<string | null>(null);
  const [availableComponents, setAvailableComponents] = useState<{ [key: string]: Component[] }>(
    {}
  );

  useEffect(() => {
    // Mock data - in real app, fetch from API
    setAvailableComponents({
      cpu: [
        {
          id: 'intel-i5-13600k',
          name: 'Intel Core i5-13600K',
          brand: 'Intel',
          price: 3200000,
          image: '/images/components/intel-i5-13600k.jpg',
          socket: 'LGA1700',
          tdp: 125,
          specifications: {
            cores: 14,
            threads: 20,
            baseClock: '3.5 GHz',
            boostClock: '5.1 GHz',
            cache: '24MB',
            architecture: 'Raptor Lake',
          },
        },
        {
          id: 'amd-ryzen5-7600x',
          name: 'AMD Ryzen 5 7600X',
          brand: 'AMD',
          price: 2800000,
          image: '/images/components/amd-ryzen5-7600x.jpg',
          socket: 'AM5',
          tdp: 105,
          specifications: {
            cores: 6,
            threads: 12,
            baseClock: '4.7 GHz',
            boostClock: '5.3 GHz',
            cache: '32MB',
            architecture: 'Zen 4',
          },
        },
      ],
      motherboard: [
        {
          id: 'asus-z790-prime',
          name: 'ASUS PRIME Z790-P',
          brand: 'ASUS',
          price: 2100000,
          image: '/images/components/asus-z790-prime.jpg',
          socket: 'LGA1700',
          formFactor: 'ATX',
          supportedRAM: ['DDR4', 'DDR5'],
          specifications: {
            chipset: 'Z790',
            memorySlots: 4,
            maxMemory: '128GB',
            pciSlots: '3x PCIe 4.0 x16',
            networking: '2.5Gb Ethernet',
            wifi: 'Wi-Fi 6E',
          },
        },
        {
          id: 'msi-b650-tomahawk',
          name: 'MSI MAG B650 TOMAHAWK',
          brand: 'MSI',
          price: 1800000,
          image: '/images/components/msi-b650-tomahawk.jpg',
          socket: 'AM5',
          formFactor: 'ATX',
          supportedRAM: ['DDR5'],
          specifications: {
            chipset: 'B650',
            memorySlots: 4,
            maxMemory: '128GB',
            pciSlots: '2x PCIe 4.0 x16',
            networking: '2.5Gb Ethernet',
            wifi: 'Wi-Fi 6E',
          },
        },
      ],
      gpu: [
        {
          id: 'rtx-4060',
          name: 'NVIDIA GeForce RTX 4060',
          brand: 'NVIDIA',
          price: 3800000,
          image: '/images/components/rtx-4060.jpg',
          powerConsumption: 115,
          specifications: {
            memory: '8GB GDDR6',
            coreClock: '1830 MHz',
            boostClock: '2460 MHz',
            memorySpeed: '17 Gbps',
            busWidth: '128-bit',
            outputs: 'HDMI 2.1, 3x DisplayPort 1.4a',
          },
        },
        {
          id: 'rtx-4070',
          name: 'NVIDIA GeForce RTX 4070',
          brand: 'NVIDIA',
          price: 5500000,
          image: '/images/components/rtx-4070.jpg',
          powerConsumption: 200,
          specifications: {
            memory: '12GB GDDR6X',
            coreClock: '1920 MHz',
            boostClock: '2475 MHz',
            memorySpeed: '21 Gbps',
            busWidth: '192-bit',
            outputs: 'HDMI 2.1, 3x DisplayPort 1.4a',
          },
        },
      ],
      ram: [
        {
          id: 'corsair-vengeance-32gb',
          name: 'Corsair Vengeance LPX 32GB (2x16GB) DDR4-3200',
          brand: 'Corsair',
          price: 1200000,
          image: '/images/components/corsair-vengeance-32gb.jpg',
          type: 'DDR4',
          specifications: {
            capacity: '32GB (2x16GB)',
            speed: 'DDR4-3200',
            timing: '16-18-18-36',
            voltage: '1.35V',
            formFactor: 'DIMM',
          },
        },
        {
          id: 'gskill-trident-32gb',
          name: 'G.SKILL Trident Z5 32GB (2x16GB) DDR5-5600',
          brand: 'G.SKILL',
          price: 1800000,
          image: '/images/components/gskill-trident-32gb.jpg',
          type: 'DDR5',
          specifications: {
            capacity: '32GB (2x16GB)',
            speed: 'DDR5-5600',
            timing: '36-36-36-76',
            voltage: '1.25V',
            formFactor: 'DIMM',
          },
        },
      ],
      psu: [
        {
          id: 'corsair-rm850x',
          name: 'Corsair RM850x 850W 80+ Gold Modular',
          brand: 'Corsair',
          price: 1400000,
          image: '/images/components/corsair-rm850x.jpg',
          wattage: 850,
          specifications: {
            efficiency: '80+ Gold',
            modular: 'Full Modular',
            fanSize: '135mm',
            cables: 'Sleeved',
            warranty: '10 years',
          },
        },
      ],
    });
  }, []);

  useEffect(() => {
    checkCompatibility(currentBuild);
  }, [currentBuild]);

  const handleComponentSelect = (componentType: keyof PCBuild, component: Component) => {
    if (componentType === 'ram' || componentType === 'storage') {
      setCurrentBuild((prev) => ({
        ...prev,
        [componentType]: [...(prev[componentType] as Component[]), component],
      }));
    } else {
      setCurrentBuild((prev) => ({
        ...prev,
        [componentType]: component,
      }));
    }
    setActiveSelector(null);
  };

  const removeComponent = (componentType: keyof PCBuild, index?: number) => {
    if (componentType === 'ram' || componentType === 'storage') {
      setCurrentBuild((prev) => ({
        ...prev,
        [componentType]: (prev[componentType] as Component[]).filter((_, i) => i !== index),
      }));
    } else {
      setCurrentBuild((prev) => ({
        ...prev,
        [componentType]: null,
      }));
    }
  };

  const checkCompatibility = (build: PCBuild) => {
    const issues: string[] = [];
    const warnings: string[] = [];
    let powerRequirement = 100; // Base system power

    // CPU and Motherboard socket compatibility
    if (build.cpu && build.motherboard) {
      if (build.cpu.socket !== build.motherboard.socket) {
        issues.push(
          `CPU socket (${build.cpu.socket}) is not compatible with motherboard socket (${build.motherboard.socket})`
        );
      }
    }

    // RAM and Motherboard compatibility
    if (build.ram.length > 0 && build.motherboard) {
      const ramType = build.ram[0].type;
      if (!build.motherboard.supportedRAM?.includes(ramType)) {
        issues.push(`RAM type (${ramType}) is not supported by the motherboard`);
      }

      if (build.ram.length > 4) {
        warnings.push('More than 4 RAM modules selected - check motherboard slot count');
      }
    }

    // Power calculation
    if (build.cpu) powerRequirement += build.cpu.tdp || 0;
    if (build.gpu) powerRequirement += build.gpu.powerConsumption || 0;
    powerRequirement += build.ram.length * 5; // 5W per RAM stick
    powerRequirement += build.storage.length * 10; // 10W per storage device

    // PSU power check
    if (build.psu) {
      const efficiency = 0.85; // Assume 85% efficiency
      const availablePower = (build.psu.wattage || 0) * efficiency;

      if (powerRequirement > availablePower) {
        issues.push(
          `Power supply insufficient: ${powerRequirement}W required, ${availablePower}W available`
        );
      } else if (powerRequirement > availablePower * 0.8) {
        warnings.push(
          'Power supply may be running close to capacity - consider higher wattage PSU'
        );
      }
    } else if (powerRequirement > 0) {
      warnings.push('No power supply selected');
    }

    // Graphics card and case compatibility
    if (build.gpu && !build.case) {
      warnings.push('No case selected - verify graphics card clearance');
    }

    // Yangi takomillashtirilgan performans tahlili
    const performanceScore = calculatePerformanceScore(build);
    const thermalAnalysis = calculateThermalAnalysis(build);
    const upgradeRecommendations = generateUpgradeRecommendations(build);

    setCompatibility({
      issues,
      warnings,
      powerRequirement,
      isValid: issues.length === 0,
      performanceScore,
      thermalAnalysis,
      upgradeRecommendations,
    });
  };

  // Yangi funksiya: Build performansini hisoblash
  const calculatePerformanceScore = (build: PCBuild) => {
    let gamingScore = 0;
    let productivityScore = 0;
    let contentScore = 0;

    // CPU baholash
    if (build.cpu) {
      const cpuCores = build.cpu.specifications.cores || 0;
      const cpuClockSpeed = parseFloat(build.cpu.specifications.boostClock) || 0;

      gamingScore += cpuClockSpeed * 10;
      productivityScore += cpuCores * 10;
      contentScore += (cpuCores * cpuClockSpeed) / 2;
    }

    // GPU baholash
    if (build.gpu) {
      gamingScore += 50; // Base GPU score

      // GPU VRAM hisoblash
      const gpuVRAM = build.gpu.specifications.vram || 0;
      gamingScore += gpuVRAM * 5;
      contentScore += gpuVRAM * 7;
    }

    // RAM baholash
    let totalRAM = 0;
    build.ram.forEach((ram) => {
      totalRAM += ram.specifications.capacity || 0;
    });

    productivityScore += totalRAM * 2;
    gamingScore += totalRAM;
    contentScore += totalRAM * 1.5;

    // Natijalarni normalizatsiya qilish (0-100 shkalaga)
    gamingScore = Math.min(100, Math.round(gamingScore / 2));
    productivityScore = Math.min(100, Math.round(productivityScore / 1.5));
    contentScore = Math.min(100, Math.round(contentScore / 2));

    return {
      gaming: gamingScore,
      productivity: productivityScore,
      content: contentScore,
    };
  };

  // Yangi funksiya: Issiqlik tahlili
  const calculateThermalAnalysis = (build: PCBuild) => {
    let cpuTemp = 0;
    let gpuTemp = 0;
    let caseAirflow = 'Yaxshi';

    if (build.cpu) {
      const cpuTDP = build.cpu.tdp || 0;
      cpuTemp = cpuTDP * 0.5; // Taxminiy CPU harorati

      if (build.cooling) {
        const coolingEfficiency = build.cooling.specifications.tdpCapacity || 0;
        cpuTemp = Math.max(45, cpuTemp - coolingEfficiency * 0.1);
      } else {
        cpuTemp += 10; // No dedicated cooling
      }
    }

    if (build.gpu) {
      gpuTemp = (build.gpu.specifications.tdp || 150) * 0.4;
    }

    if (build.case) {
      const airflowRating = build.case.specifications.airflow || "O'rta";

      if (airflowRating === 'Yuqori') {
        cpuTemp -= 5;
        gpuTemp -= 7;
        caseAirflow = 'Ajoyib';
      } else if (airflowRating === 'Past') {
        cpuTemp += 8;
        gpuTemp += 12;
        caseAirflow = 'Cheklangan';
      }
    } else {
      caseAirflow = 'Aniqlanmagan';
    }

    return {
      cpuTemp: Math.round(cpuTemp),
      gpuTemp: Math.round(gpuTemp),
      caseAirflow,
    };
  };

  // Yangi funksiya: Yangilash tavsiyanomalarini tayyorlash
  const generateUpgradeRecommendations = (build: PCBuild) => {
    const recommendations: string[] = [];

    if (build.cpu && build.gpu) {
      if (build.cpu.specifications.cores < 6 && build.gpu.specifications.tier > 2) {
        recommendations.push('Yuqori darajadagi GPU uchun kuchliroq CPU tavsiya etiladi');
      }
    }

    if (build.ram.length > 0) {
      const totalRAM = build.ram.reduce(
        (total, ram) => total + (ram.specifications.capacity || 0),
        0
      );
      if (totalRAM < 16) {
        recommendations.push('Zamonaviy dasturlar uchun kamida 16GB RAM tavsiya etiladi');
      }
    }

    if (build.psu && compatibility.powerRequirement > build.psu.wattage! * 0.8) {
      recommendations.push('Kuchli yoki barqaror tizim uchun quvvatliroq PSU tavsiya etiladi');
    }

    return recommendations;
  };

  const calculateTotalPrice = () => {
    let total = 0;
    Object.values(currentBuild).forEach((component) => {
      if (Array.isArray(component)) {
        component.forEach((c) => (total += c.price));
      } else if (component) {
        total += component.price;
      }
    });
    return total;
  };

  const formatPrice = (price: number) => {
    return (
      new Intl.NumberFormat('uz-UZ', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price) + " so'm"
    );
  };

  const addAllToCart = () => {
    if (!compatibility.isValid) return;

    // Mock implementation - in real app, add to cart
    // Track PC build addition through analytics service
    alert("Kompyuter konfiguratsiyasi savatga qo'shildi!");
  };

  const saveBuild = () => {
    // Mock implementation - in real app, save to user account
    const buildData = {
      ...currentBuild,
      totalPrice: calculateTotalPrice(),
      powerRequirement: compatibility.powerRequirement,
      createdAt: new Date(),
    };

    localStorage.setItem('savedPCBuild', JSON.stringify(buildData));
    alert('Konfiguratsiya saqlandi!');
  };

  const shareBuild = () => {
    const buildUrl = `${window.location.origin}/pc-builder/shared/${Date.now()}`;
    navigator.clipboard.writeText(buildUrl);
    alert('Konfiguratsiya havolasi nusxalandi!');
  };

  const ComponentSelector: React.FC<{
    componentType: keyof PCBuild;
    components: Component[];
    onSelect: (component: Component) => void;
  }> = ({ componentType, components, onSelect }) => (
    <div className="component-selector-modal">
      <div className="selector-content">
        <div className="selector-header">
          <h3>Komponent tanlang</h3>
          <button className="close-btn" onClick={() => setActiveSelector(null)}>
            ✕
          </button>
        </div>
        <div className="components-list">
          {components.map((component) => (
            <div
              key={component.id}
              className="component-option"
              onClick={() => onSelect(component)}
            >
              <img src={component.image} alt={component.name} />
              <div className="component-details">
                <h4>{component.name}</h4>
                <p className="brand">{component.brand}</p>
                <div className="key-specs">
                  {Object.entries(component.specifications)
                    .slice(0, 3)
                    .map(([key, value]) => (
                      <span key={key} className="spec">
                        {key}: {value}
                      </span>
                    ))}
                </div>
                <div className="price">{formatPrice(component.price)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const SelectedComponent: React.FC<{
    component: Component;
    onRemove: () => void;
  }> = ({ component, onRemove }) => (
    <div className="selected-component">
      <img src={component.image} alt={component.name} />
      <div className="component-info">
        <h4>{component.name}</h4>
        <p className="brand">{component.brand}</p>
        <span className="price">{formatPrice(component.price)}</span>
      </div>
      <button className="remove-btn" onClick={onRemove}>
        ✕
      </button>
    </div>
  );

  return (
    <div className="pc-builder">
      <div className="builder-header">
        <h1>🔧 PC Builder - Kompyuter Yig'ish</h1>
        <div className="build-summary">
          <div className="summary-item">
            <span className="label">Jami narx:</span>
            <span className="value">{formatPrice(calculateTotalPrice())}</span>
          </div>
          <div className="summary-item">
            <span className="label">Quvvat:</span>
            <span className="value">{compatibility.powerRequirement}W</span>
          </div>
          <div className="summary-item">
            <span className="label">Holat:</span>
            <span className={`status ${compatibility.isValid ? 'valid' : 'invalid'}`}>
              {compatibility.isValid ? '✅ Mos' : '❌ Muammo bor'}
            </span>
          </div>
        </div>
      </div>

      <div className="builder-content">
        <div className="components-selection">
          {/* CPU Selection */}
          <div className="component-section">
            <div className="section-header">
              <h3>
                <span className="step">1</span>
                Protsessor (CPU)
                <span className="required">*</span>
              </h3>
              <p>Kompyuterning "miyasi" - barcha hisoblarni bajaradi</p>
            </div>
            <div className="component-selector">
              {currentBuild.cpu ? (
                <SelectedComponent
                  component={currentBuild.cpu}
                  onRemove={() => removeComponent('cpu')}
                />
              ) : (
                <button className="select-component" onClick={() => setActiveSelector('cpu')}>
                  <span className="icon">🔧</span>
                  <span>Protsessor tanlang</span>
                </button>
              )}
            </div>
          </div>

          {/* Motherboard Selection */}
          <div className="component-section">
            <div className="section-header">
              <h3>
                <span className="step">2</span>
                Motherboard (Ona plata)
                <span className="required">*</span>
              </h3>
              <p>Barcha komponentlarni bog'laydigan asosiy plata</p>
            </div>
            <div className="component-selector">
              {currentBuild.motherboard ? (
                <SelectedComponent
                  component={currentBuild.motherboard}
                  onRemove={() => removeComponent('motherboard')}
                />
              ) : (
                <button
                  className="select-component"
                  onClick={() => setActiveSelector('motherboard')}
                  disabled={!currentBuild.cpu}
                >
                  <span className="icon">🔌</span>
                  <span>{currentBuild.cpu ? 'Motherboard tanlang' : 'Avval CPU tanlang'}</span>
                </button>
              )}
            </div>
          </div>

          {/* RAM Selection */}
          <div className="component-section">
            <div className="section-header">
              <h3>
                <span className="step">3</span>
                Xotira (RAM)
                <span className="required">*</span>
              </h3>
              <p>Tezkor ishlash uchun operativ xotira</p>
            </div>
            <div className="component-selector">
              {currentBuild.ram.length > 0 ? (
                <div className="ram-list">
                  {currentBuild.ram.map((ram, index) => (
                    <SelectedComponent
                      key={index}
                      component={ram}
                      onRemove={() => removeComponent('ram', index)}
                    />
                  ))}
                  <button className="add-more-ram" onClick={() => setActiveSelector('ram')}>
                    + Yana RAM qo'shish
                  </button>
                </div>
              ) : (
                <button
                  className="select-component"
                  onClick={() => setActiveSelector('ram')}
                  disabled={!currentBuild.motherboard}
                >
                  <span className="icon">💾</span>
                  <span>
                    {currentBuild.motherboard ? 'RAM tanlang' : 'Avval Motherboard tanlang'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* GPU Selection */}
          <div className="component-section">
            <div className="section-header">
              <h3>
                <span className="step">4</span>
                Videokarta (GPU)
                <span className="optional">Ixtiyoriy</span>
              </h3>
              <p>Gaming va grafik ishlar uchun</p>
            </div>
            <div className="component-selector">
              {currentBuild.gpu ? (
                <SelectedComponent
                  component={currentBuild.gpu}
                  onRemove={() => removeComponent('gpu')}
                />
              ) : (
                <button
                  className="select-component optional"
                  onClick={() => setActiveSelector('gpu')}
                >
                  <span className="icon">🎮</span>
                  <span>Videokarta tanlang</span>
                </button>
              )}
            </div>
          </div>

          {/* PSU Selection */}
          <div className="component-section">
            <div className="section-header">
              <h3>
                <span className="step">5</span>
                Quvvat manbai (PSU)
                <span className="required">*</span>
              </h3>
              <p>Kompyuterni tok bilan ta'minlaydi</p>
            </div>
            <div className="component-selector">
              {currentBuild.psu ? (
                <SelectedComponent
                  component={currentBuild.psu}
                  onRemove={() => removeComponent('psu')}
                />
              ) : (
                <button className="select-component" onClick={() => setActiveSelector('psu')}>
                  <span className="icon">⚡</span>
                  <span>PSU tanlang (Tavsiya: {compatibility.powerRequirement + 150}W+)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="compatibility-panel">
          {/* Yangi Performance panel */}
          <div className="performance-panel">
            <h3>📊 Performance Bahosi</h3>
            <div className="performance-charts">
              <div className="performance-meter">
                <label>Gaming</label>
                <div className="meter-bar">
                  <div
                    className="meter-fill"
                    style={{
                      width: `${compatibility.performanceScore.gaming}%`,
                      backgroundColor:
                        compatibility.performanceScore.gaming > 80
                          ? '#4caf50'
                          : compatibility.performanceScore.gaming > 50
                            ? '#ff9800'
                            : '#f44336',
                    }}
                  />
                </div>
                <span className="score">{compatibility.performanceScore.gaming}/100</span>
              </div>

              <div className="performance-meter">
                <label>Productivity</label>
                <div className="meter-bar">
                  <div
                    className="meter-fill"
                    style={{
                      width: `${compatibility.performanceScore.productivity}%`,
                      backgroundColor:
                        compatibility.performanceScore.productivity > 80
                          ? '#4caf50'
                          : compatibility.performanceScore.productivity > 50
                            ? '#ff9800'
                            : '#f44336',
                    }}
                  />
                </div>
                <span className="score">{compatibility.performanceScore.productivity}/100</span>
              </div>

              <div className="performance-meter">
                <label>Content Creation</label>
                <div className="meter-bar">
                  <div
                    className="meter-fill"
                    style={{
                      width: `${compatibility.performanceScore.content}%`,
                      backgroundColor:
                        compatibility.performanceScore.content > 80
                          ? '#4caf50'
                          : compatibility.performanceScore.content > 50
                            ? '#ff9800'
                            : '#f44336',
                    }}
                  />
                </div>
                <span className="score">{compatibility.performanceScore.content}/100</span>
              </div>
            </div>
          </div>

          {/* Yangi Thermal Analysis Panel */}
          <div className="thermal-panel">
            <h3>🌡️ Issiqlik Tahlili</h3>
            <div className="thermal-info">
              <div className="thermal-item">
                <span>CPU Harorati:</span>
                <span
                  className={
                    compatibility.thermalAnalysis.cpuTemp > 85
                      ? 'danger'
                      : compatibility.thermalAnalysis.cpuTemp > 75
                        ? 'warning'
                        : 'good'
                  }
                >
                  {compatibility.thermalAnalysis.cpuTemp}°C
                </span>
              </div>

              <div className="thermal-item">
                <span>GPU Harorati:</span>
                <span
                  className={
                    compatibility.thermalAnalysis.gpuTemp > 80
                      ? 'danger'
                      : compatibility.thermalAnalysis.gpuTemp > 70
                        ? 'warning'
                        : 'good'
                  }
                >
                  {compatibility.thermalAnalysis.gpuTemp > 0
                    ? `${compatibility.thermalAnalysis.gpuTemp}°C`
                    : 'N/A'}
                </span>
              </div>

              <div className="thermal-item">
                <span>Case Havo Aylanishi:</span>
                <span>{compatibility.thermalAnalysis.caseAirflow}</span>
              </div>
            </div>
          </div>

          {/* Yangi Upgrade Recommendations Panel */}
          {compatibility.upgradeRecommendations.length > 0 && (
            <div className="upgrade-panel">
              <h3>🚀 Yangilash Tavsiyanomalar</h3>
              <ul className="upgrade-list">
                {compatibility.upgradeRecommendations.map((recommendation, index) => (
                  <li key={index}>{recommendation}</li>
                ))}
              </ul>
            </div>
          )}
          <h3>🔍 Moslik Tekshiruvi</h3>

          {compatibility.issues.length > 0 && (
            <div className="compatibility-issues">
              <h4>❌ Kritik Muammolar</h4>
              {compatibility.issues.map((issue, index) => (
                <div key={index} className="issue">
                  {issue}
                </div>
              ))}
            </div>
          )}

          {compatibility.warnings.length > 0 && (
            <div className="compatibility-warnings">
              <h4>⚠️ Ogohlantirishlar</h4>
              {compatibility.warnings.map((warning, index) => (
                <div key={index} className="warning">
                  {warning}
                </div>
              ))}
            </div>
          )}

          {compatibility.isValid && compatibility.warnings.length === 0 && (
            <div className="compatibility-success">
              <h4>✅ Barcha komponentlar mos!</h4>
              <p>Konfiguratsiya tayyor va ishlatish uchun yaroqli</p>
            </div>
          )}

          <div className="power-info">
            <h4>⚡ Quvvat Ma'lumotlari</h4>
            <div className="power-breakdown">
              <div className="power-item">
                <span>Jami talab:</span>
                <span>{compatibility.powerRequirement}W</span>
              </div>
              {currentBuild.psu && (
                <div className="power-item">
                  <span>PSU quvvati:</span>
                  <span>{currentBuild.psu.wattage}W</span>
                </div>
              )}
            </div>
          </div>

          <div className="build-actions">
            <button
              className="btn-primary"
              disabled={!compatibility.isValid}
              onClick={addAllToCart}
            >
              🛒 Hammasini savatga qo'shish
            </button>
            <button className="btn-secondary" onClick={saveBuild}>
              💾 Konfiguratsiyani saqlash
            </button>
            <button className="btn-secondary" onClick={shareBuild}>
              📤 Ulashish
            </button>
          </div>
        </div>
      </div>

      {/* Component Selector Modal */}
      {activeSelector && availableComponents[activeSelector] && (
        <ComponentSelector
          componentType={activeSelector as keyof PCBuild}
          components={availableComponents[activeSelector]}
          onSelect={(component) =>
            handleComponentSelect(activeSelector as keyof PCBuild, component)
          }
        />
      )}
    </div>
  );
};

export default PCBuilder;
