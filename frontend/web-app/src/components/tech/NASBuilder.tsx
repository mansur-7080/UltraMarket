import React, { useState, useEffect } from 'react';
import './NASBuilder.css';

interface NASComponent {
  id: string;
  type: 'case' | 'drive' | 'ram' | 'processor' | 'motherboard' | 'network';
  name: string;
  brand: string;
  price: number;
  image: string;
  specs: {
    [key: string]: any;
  };
}

interface NASConfiguration {
  case: NASComponent | null;
  drives: NASComponent[];
  ram: NASComponent | null;
  processor: NASComponent | null;
  motherboard: NASComponent | null;
  network: NASComponent | null;
}

interface NASRecommendation {
  type: 'home' | 'business' | 'media' | 'backup';
  name: string;
  description: string;
  storageMin: number;
  ramMin: number;
  configuration: Partial<NASConfiguration>;
}

const NASBuilder: React.FC = () => {
  const [configuration, setConfiguration] = useState<NASConfiguration>({
    case: null,
    drives: [],
    ram: null,
    processor: null,
    motherboard: null,
    network: null,
  });

  const [availableComponents, setAvailableComponents] = useState<{ [key: string]: NASComponent[] }>(
    {}
  );
  const [activeSelector, setActiveSelector] = useState<string | null>(null);
  const [totalStorage, setTotalStorage] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [recommendations, setRecommendations] = useState<NASRecommendation[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState<NASRecommendation | null>(
    null
  );
  const [usageType, setUsageType] = useState<'home' | 'business' | 'media' | 'backup'>('home');

  useEffect(() => {
    // Ma'lumotlar bazasi simulyatsiyasi
    fetchAvailableComponents();
    fetchRecommendations();
  }, []);

  useEffect(() => {
    // Har safar konfiguratsiya o'zgarganda
    calculateTotalStorage();
    calculateTotalPrice();
  }, [configuration]);

  const fetchAvailableComponents = () => {
    // API so'rov simulyatsiyasi
    const mockComponents: { [key: string]: NASComponent[] } = {
      case: [
        {
          id: 'synology-ds220j',
          type: 'case',
          name: 'Synology DiskStation DS220j',
          brand: 'Synology',
          price: 2500000,
          image: '/images/nas/synology-ds220j.jpg',
          specs: {
            bays: 2,
            maxCapacity: '32TB',
            dimensions: '165 x 100 x 225.5 mm',
            weight: '0.88 kg',
            ports: '1x Gigabit Ethernet, 2x USB 3.0',
            power: '12.6W (Access), 5.4W (HDD Hibernation)',
          },
        },
        {
          id: 'qnap-ts-253d',
          type: 'case',
          name: 'QNAP TS-253D',
          brand: 'QNAP',
          price: 5800000,
          image: '/images/nas/qnap-ts253d.jpg',
          specs: {
            bays: 2,
            maxCapacity: '36TB',
            dimensions: '168 x 105 x 226 mm',
            weight: '1.5 kg',
            ports: '2x 2.5GbE, 3x USB 3.2 Gen 1, 1x USB 2.0, 1x HDMI',
            power: '20.2W (Operation), 11.8W (HDD Standby)',
          },
        },
      ],
      drive: [
        {
          id: 'wd-red-4tb',
          type: 'drive',
          name: 'WD Red 4TB NAS Hard Drive',
          brand: 'Western Digital',
          price: 1200000,
          image: '/images/nas/wd-red-4tb.jpg',
          specs: {
            capacity: '4TB',
            type: 'CMR',
            rpm: '5400 RPM',
            cache: '256MB',
            interface: 'SATA 6 Gb/s',
            mtbf: '1,000,000 hours',
          },
        },
        {
          id: 'seagate-ironwolf-6tb',
          type: 'drive',
          name: 'Seagate IronWolf 6TB NAS Hard Drive',
          brand: 'Seagate',
          price: 1650000,
          image: '/images/nas/seagate-ironwolf-6tb.jpg',
          specs: {
            capacity: '6TB',
            type: 'CMR',
            rpm: '7200 RPM',
            cache: '256MB',
            interface: 'SATA 6 Gb/s',
            mtbf: '1,000,000 hours',
          },
        },
        {
          id: 'wd-red-ssd-1tb',
          type: 'drive',
          name: 'WD Red SSD 1TB NAS Drive',
          brand: 'Western Digital',
          price: 980000,
          image: '/images/nas/wd-red-ssd-1tb.jpg',
          specs: {
            capacity: '1TB',
            type: 'SSD',
            interface: 'SATA 6 Gb/s',
            endurance: '500 TBW',
            mtbf: '1,750,000 hours',
          },
        },
      ],
      ram: [
        {
          id: 'crucial-4gb-ddr4',
          type: 'ram',
          name: 'Crucial 4GB DDR4 SODIMM',
          brand: 'Crucial',
          price: 350000,
          image: '/images/nas/crucial-4gb-ddr4.jpg',
          specs: {
            capacity: '4GB',
            type: 'DDR4 SODIMM',
            speed: '2666 MHz',
            voltage: '1.2V',
          },
        },
        {
          id: 'kingston-8gb-ddr4',
          type: 'ram',
          name: 'Kingston 8GB DDR4 SODIMM',
          brand: 'Kingston',
          price: 650000,
          image: '/images/nas/kingston-8gb-ddr4.jpg',
          specs: {
            capacity: '8GB',
            type: 'DDR4 SODIMM',
            speed: '3200 MHz',
            voltage: '1.2V',
          },
        },
      ],
      processor: [
        {
          id: 'intel-celeron-j4125',
          type: 'processor',
          name: 'Intel Celeron J4125',
          brand: 'Intel',
          price: 0, // Already included in NAS
          image: '/images/nas/intel-celeron-j4125.jpg',
          specs: {
            cores: 4,
            frequency: '2.0 GHz (up to 2.7 GHz)',
            tdp: '10W',
            architecture: '14nm',
          },
        },
        {
          id: 'intel-pentium-j4205',
          type: 'processor',
          name: 'Intel Pentium Silver J4205',
          brand: 'Intel',
          price: 0, // Already included in NAS
          image: '/images/nas/intel-pentium-j4205.jpg',
          specs: {
            cores: 4,
            frequency: '1.5 GHz (up to 2.6 GHz)',
            tdp: '10W',
            architecture: '14nm',
          },
        },
      ],
      network: [
        {
          id: 'tp-link-tl-sg105',
          type: 'network',
          name: 'TP-Link TL-SG105 5-Port Gigabit Switch',
          brand: 'TP-Link',
          price: 200000,
          image: '/images/nas/tp-link-tl-sg105.jpg',
          specs: {
            ports: '5x 10/100/1000Mbps',
            switching: '10 Gbps',
            power: '2.5W',
          },
        },
        {
          id: 'netgear-gs308',
          type: 'network',
          name: 'NETGEAR GS308 8-Port Gigabit Switch',
          brand: 'NETGEAR',
          price: 320000,
          image: '/images/nas/netgear-gs308.jpg',
          specs: {
            ports: '8x 10/100/1000Mbps',
            switching: '16 Gbps',
            power: '3.5W',
          },
        },
      ],
    };

    setAvailableComponents(mockComponents);
  };

  const fetchRecommendations = () => {
    // API so'rov simulyatsiyasi
    const mockRecommendations: NASRecommendation[] = [
      {
        type: 'home',
        name: 'Uy NAS',
        description: 'Uy uchun asosiy fayl saqlash va media streaming',
        storageMin: 4, // TB
        ramMin: 4, // GB
        configuration: {
          case: {
            id: 'synology-ds220j',
            type: 'case',
            name: 'Synology DiskStation DS220j',
            brand: 'Synology',
            price: 2500000,
            image: '/images/nas/synology-ds220j.jpg',
            specs: {
              bays: 2,
              maxCapacity: '32TB',
              dimensions: '165 x 100 x 225.5 mm',
              weight: '0.88 kg',
              ports: '1x Gigabit Ethernet, 2x USB 3.0',
              power: '12.6W (Access), 5.4W (HDD Hibernation)',
            },
          },
          drives: [
            {
              id: 'wd-red-4tb',
              type: 'drive',
              name: 'WD Red 4TB NAS Hard Drive',
              brand: 'Western Digital',
              price: 1200000,
              image: '/images/nas/wd-red-4tb.jpg',
              specs: {
                capacity: '4TB',
                type: 'CMR',
                rpm: '5400 RPM',
                cache: '256MB',
                interface: 'SATA 6 Gb/s',
                mtbf: '1,000,000 hours',
              },
            },
          ],
        },
      },
      {
        type: 'media',
        name: 'Media Server',
        description: 'Yuqori sifatli video va audio streaming uchun',
        storageMin: 8, // TB
        ramMin: 8, // GB
        configuration: {
          case: {
            id: 'qnap-ts-253d',
            type: 'case',
            name: 'QNAP TS-253D',
            brand: 'QNAP',
            price: 5800000,
            image: '/images/nas/qnap-ts253d.jpg',
            specs: {
              bays: 2,
              maxCapacity: '36TB',
              dimensions: '168 x 105 x 226 mm',
              weight: '1.5 kg',
              ports: '2x 2.5GbE, 3x USB 3.2 Gen 1, 1x USB 2.0, 1x HDMI',
              power: '20.2W (Operation), 11.8W (HDD Standby)',
            },
          },
          drives: [
            {
              id: 'seagate-ironwolf-6tb',
              type: 'drive',
              name: 'Seagate IronWolf 6TB NAS Hard Drive',
              brand: 'Seagate',
              price: 1650000,
              image: '/images/nas/seagate-ironwolf-6tb.jpg',
              specs: {
                capacity: '6TB',
                type: 'CMR',
                rpm: '7200 RPM',
                cache: '256MB',
                interface: 'SATA 6 Gb/s',
                mtbf: '1,000,000 hours',
              },
            },
            {
              id: 'seagate-ironwolf-6tb',
              type: 'drive',
              name: 'Seagate IronWolf 6TB NAS Hard Drive',
              brand: 'Seagate',
              price: 1650000,
              image: '/images/nas/seagate-ironwolf-6tb.jpg',
              specs: {
                capacity: '6TB',
                type: 'CMR',
                rpm: '7200 RPM',
                cache: '256MB',
                interface: 'SATA 6 Gb/s',
                mtbf: '1,000,000 hours',
              },
            },
          ],
          ram: {
            id: 'kingston-8gb-ddr4',
            type: 'ram',
            name: 'Kingston 8GB DDR4 SODIMM',
            brand: 'Kingston',
            price: 650000,
            image: '/images/nas/kingston-8gb-ddr4.jpg',
            specs: {
              capacity: '8GB',
              type: 'DDR4 SODIMM',
              speed: '3200 MHz',
              voltage: '1.2V',
            },
          },
        },
      },
      {
        type: 'business',
        name: 'Biznes Server',
        description: "Kichik biznes uchun ma'lumotlar saqlash va zaxiralash",
        storageMin: 12, // TB
        ramMin: 8, // GB
        configuration: {
          case: {
            id: 'qnap-ts-253d',
            type: 'case',
            name: 'QNAP TS-253D',
            brand: 'QNAP',
            price: 5800000,
            image: '/images/nas/qnap-ts253d.jpg',
            specs: {
              bays: 2,
              maxCapacity: '36TB',
              dimensions: '168 x 105 x 226 mm',
              weight: '1.5 kg',
              ports: '2x 2.5GbE, 3x USB 3.2 Gen 1, 1x USB 2.0, 1x HDMI',
              power: '20.2W (Operation), 11.8W (HDD Standby)',
            },
          },
          drives: [
            {
              id: 'wd-red-ssd-1tb',
              type: 'drive',
              name: 'WD Red SSD 1TB NAS Drive',
              brand: 'Western Digital',
              price: 980000,
              image: '/images/nas/wd-red-ssd-1tb.jpg',
              specs: {
                capacity: '1TB',
                type: 'SSD',
                interface: 'SATA 6 Gb/s',
                endurance: '500 TBW',
                mtbf: '1,750,000 hours',
              },
            },
            {
              id: 'seagate-ironwolf-6tb',
              type: 'drive',
              name: 'Seagate IronWolf 6TB NAS Hard Drive',
              brand: 'Seagate',
              price: 1650000,
              image: '/images/nas/seagate-ironwolf-6tb.jpg',
              specs: {
                capacity: '6TB',
                type: 'CMR',
                rpm: '7200 RPM',
                cache: '256MB',
                interface: 'SATA 6 Gb/s',
                mtbf: '1,000,000 hours',
              },
            },
          ],
          network: {
            id: 'netgear-gs308',
            type: 'network',
            name: 'NETGEAR GS308 8-Port Gigabit Switch',
            brand: 'NETGEAR',
            price: 320000,
            image: '/images/nas/netgear-gs308.jpg',
            specs: {
              ports: '8x 10/100/1000Mbps',
              switching: '16 Gbps',
              power: '3.5W',
            },
          },
        },
      },
    ];

    setRecommendations(mockRecommendations);
  };

  const calculateTotalStorage = () => {
    // Disklardan saqlash hajmi hisoblash
    const storage = configuration.drives.reduce((total, drive) => {
      const capacity = drive.specs.capacity;
      if (typeof capacity === 'string') {
        const match = capacity.match(/(\d+)TB/);
        if (match && match[1]) {
          return total + parseInt(match[1]);
        }
      }
      return total;
    }, 0);

    setTotalStorage(storage);
  };

  const calculateTotalPrice = () => {
    let price = 0;

    // Case narxi
    if (configuration.case) {
      price += configuration.case.price;
    }

    // Disklar narxi
    configuration.drives.forEach((drive) => {
      price += drive.price;
    });

    // RAM narxi
    if (configuration.ram) {
      price += configuration.ram.price;
    }

    // Network asboblar narxi
    if (configuration.network) {
      price += configuration.network.price;
    }

    setTotalPrice(price);
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

  const addComponent = (type: keyof NASConfiguration, component: NASComponent) => {
    if (type === 'drives') {
      const currentCase = configuration.case;
      if (currentCase && currentCase.specs.bays <= configuration.drives.length) {
        alert(`${currentCase.name} faqat ${currentCase.specs.bays} ta diskni qo'llab-quvvatlaydi`);
        return;
      }

      setConfiguration({
        ...configuration,
        drives: [...configuration.drives, component],
      });
    } else {
      setConfiguration({
        ...configuration,
        [type]: component,
      });
    }

    setActiveSelector(null);
  };

  const removeComponent = (type: keyof NASConfiguration, index?: number) => {
    if (type === 'drives' && index !== undefined) {
      const newDrives = [...configuration.drives];
      newDrives.splice(index, 1);
      setConfiguration({
        ...configuration,
        drives: newDrives,
      });
    } else {
      setConfiguration({
        ...configuration,
        [type]: null,
      });
    }
  };

  const applyRecommendation = (recommendation: NASRecommendation) => {
    const newConfig: NASConfiguration = {
      ...configuration,
      case: recommendation.configuration.case || null,
      drives: recommendation.configuration.drives || [],
      ram: recommendation.configuration.ram || null,
      processor: recommendation.configuration.processor || null,
      motherboard: recommendation.configuration.motherboard || null,
      network: recommendation.configuration.network || null,
    };

    setConfiguration(newConfig);
    setSelectedRecommendation(recommendation);
  };

  const handleUsageTypeChange = (type: 'home' | 'business' | 'media' | 'backup') => {
    setUsageType(type);

    // Tavsiya tanlash
    const matchingRecommendation = recommendations.find((rec) => rec.type === type);
    if (matchingRecommendation) {
      applyRecommendation(matchingRecommendation);
    }
  };

  const ComponentSelector = ({
    componentType,
    components,
  }: {
    componentType: string;
    components: NASComponent[];
  }) => (
    <div className="component-selector-modal">
      <div className="modal-header">
        <h3>{componentType.charAt(0).toUpperCase() + componentType.slice(1)} tanlash</h3>
        <button className="close-button" onClick={() => setActiveSelector(null)}>
          ×
        </button>
      </div>
      <div className="component-list">
        {components.map((component) => (
          <div
            key={component.id}
            className="component-item"
            onClick={() => addComponent(componentType as keyof NASConfiguration, component)}
          >
            <div className="component-image">
              <img src={component.image} alt={component.name} />
            </div>
            <div className="component-details">
              <h4>{component.name}</h4>
              <p className="brand">{component.brand}</p>
              <div className="specs">
                {Object.entries(component.specs)
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
  );

  const SelectedComponent = ({
    component,
    onRemove,
  }: {
    component: NASComponent;
    onRemove: () => void;
    index?: number;
  }) => (
    <div className="selected-component">
      <div className="component-image">
        <img src={component.image} alt={component.name} />
      </div>
      <div className="component-details">
        <h4>{component.name}</h4>
        <p className="brand">{component.brand}</p>
        <div className="specs">
          {Object.entries(component.specs)
            .slice(0, 2)
            .map(([key, value]) => (
              <span key={key} className="spec">
                {key}: {value}
              </span>
            ))}
        </div>
        <div className="price">{formatPrice(component.price)}</div>
      </div>
      <button className="remove-button" onClick={onRemove}>
        ×
      </button>
    </div>
  );

  return (
    <div className="nas-builder">
      <div className="builder-header">
        <h1>NAS Builder - Ma'lumotlar saqlash tizimini yarating</h1>

        <div className="builder-tabs">
          <button
            className={usageType === 'home' ? 'active' : ''}
            onClick={() => handleUsageTypeChange('home')}
          >
            Uy uchun
          </button>
          <button
            className={usageType === 'media' ? 'active' : ''}
            onClick={() => handleUsageTypeChange('media')}
          >
            Media Server
          </button>
          <button
            className={usageType === 'business' ? 'active' : ''}
            onClick={() => handleUsageTypeChange('business')}
          >
            Biznes
          </button>
          <button
            className={usageType === 'backup' ? 'active' : ''}
            onClick={() => handleUsageTypeChange('backup')}
          >
            Zaxiralash
          </button>
        </div>

        <div className="builder-summary">
          <div className="summary-item">
            <div className="summary-label">Umumiy xotira</div>
            <div className="summary-value">{totalStorage} TB</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Narxi</div>
            <div className="summary-value">{formatPrice(totalPrice)}</div>
          </div>
        </div>
      </div>

      <div className="builder-content">
        <div className="components-panel">
          {/* NAS Case */}
          <div className="component-section">
            <div className="section-header">
              <h3>NAS Korpus</h3>
            </div>
            {configuration.case ? (
              <SelectedComponent
                component={configuration.case}
                onRemove={() => removeComponent('case')}
              />
            ) : (
              <button className="add-component" onClick={() => setActiveSelector('case')}>
                + NAS korpus tanlang
              </button>
            )}
          </div>

          {/* Drives */}
          <div className="component-section">
            <div className="section-header">
              <h3>Disklar</h3>
              {configuration.case && (
                <span className="bays-info">
                  {configuration.drives.length} / {configuration.case.specs.bays} disklar
                </span>
              )}
            </div>

            {configuration.drives.map((drive, index) => (
              <SelectedComponent
                key={`${drive.id}-${index}`}
                component={drive}
                index={index}
                onRemove={() => removeComponent('drives', index)}
              />
            ))}

            {configuration.case && configuration.drives.length < configuration.case.specs.bays ? (
              <button className="add-component" onClick={() => setActiveSelector('drive')}>
                + Disk qo'shish
              </button>
            ) : !configuration.case ? (
              <div className="component-placeholder">Avval NAS korpusini tanlang</div>
            ) : null}
          </div>

          {/* RAM */}
          <div className="component-section">
            <div className="section-header">
              <h3>RAM Xotira</h3>
            </div>
            {configuration.ram ? (
              <SelectedComponent
                component={configuration.ram}
                onRemove={() => removeComponent('ram')}
              />
            ) : (
              <button
                className="add-component"
                onClick={() => setActiveSelector('ram')}
                disabled={!configuration.case}
              >
                + RAM tanlang
              </button>
            )}
          </div>

          {/* Network */}
          <div className="component-section">
            <div className="section-header">
              <h3>Tarmoq qurilmalari</h3>
            </div>
            {configuration.network ? (
              <SelectedComponent
                component={configuration.network}
                onRemove={() => removeComponent('network')}
              />
            ) : (
              <button className="add-component" onClick={() => setActiveSelector('network')}>
                + Tarmoq qurilmasi tanlang
              </button>
            )}
          </div>
        </div>

        <div className="info-panel">
          <div className="nas-info">
            <h3>Saqlash tizimi haqida</h3>

            <div className="info-box">
              <h4>Umumiy xotira</h4>
              <div className="info-content">
                <span className="big-number">{totalStorage} TB</span>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min((totalStorage / 20) * 100, 100)}%` }}
                  ></div>
                </div>
                {selectedRecommendation && (
                  <p className="recommendation-note">
                    {selectedRecommendation.name} uchun tavsiya: {selectedRecommendation.storageMin}
                    + TB
                  </p>
                )}
              </div>
            </div>

            <div className="info-box">
              <h4>Narx</h4>
              <div className="price-breakdown">
                <div className="price-total">{formatPrice(totalPrice)}</div>
                {configuration.case && (
                  <div className="price-item">
                    <span>NAS Korpus:</span>
                    <span>{formatPrice(configuration.case.price)}</span>
                  </div>
                )}
                {configuration.drives.length > 0 && (
                  <div className="price-item">
                    <span>Disklar ({configuration.drives.length}):</span>
                    <span>
                      {formatPrice(
                        configuration.drives.reduce((sum, drive) => sum + drive.price, 0)
                      )}
                    </span>
                  </div>
                )}
                {configuration.ram && (
                  <div className="price-item">
                    <span>RAM:</span>
                    <span>{formatPrice(configuration.ram.price)}</span>
                  </div>
                )}
                {configuration.network && (
                  <div className="price-item">
                    <span>Tarmoq:</span>
                    <span>{formatPrice(configuration.network.price)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="usage-info">
              <h4>Foydalanish usullari</h4>
              <ul className="usage-list">
                {usageType === 'home' && (
                  <>
                    <li>
                      <span className="icon">🎬</span>
                      <span>Oilaviy fotosurat va videolarni saqlash</span>
                    </li>
                    <li>
                      <span className="icon">🎵</span>
                      <span>Media kontentni uy tarmog'ida ulashish</span>
                    </li>
                    <li>
                      <span className="icon">📱</span>
                      <span>Avtomatik telefon va kompyuter zaxiralash</span>
                    </li>
                  </>
                )}
                {usageType === 'media' && (
                  <>
                    <li>
                      <span className="icon">🎬</span>
                      <span>4K video streamingi (Plex, Emby)</span>
                    </li>
                    <li>
                      <span className="icon">🎵</span>
                      <span>Yuqori sifatli audio kolleksiyasi</span>
                    </li>
                    <li>
                      <span className="icon">📺</span>
                      <span>Bir nechta qurilmalarga stream uzatish</span>
                    </li>
                  </>
                )}
                {usageType === 'business' && (
                  <>
                    <li>
                      <span className="icon">📊</span>
                      <span>Muhim biznes fayllarni saqlash</span>
                    </li>
                    <li>
                      <span className="icon">👥</span>
                      <span>Jamoa a'zolari bilan fayl almashish</span>
                    </li>
                    <li>
                      <span className="icon">🔒</span>
                      <span>Ma'lumotlar xavfsizligi</span>
                    </li>
                  </>
                )}
                {usageType === 'backup' && (
                  <>
                    <li>
                      <span className="icon">💾</span>
                      <span>Muhim ma'lumotlar zaxira nusxalari</span>
                    </li>
                    <li>
                      <span className="icon">⏱️</span>
                      <span>Avtomatik rejali zaxiralash</span>
                    </li>
                    <li>
                      <span className="icon">🔄</span>
                      <span>Tezkor qayta tiklash imkoniyati</span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            <div className="builder-actions">
              <button
                className="btn-add-to-cart"
                disabled={!configuration.case || configuration.drives.length === 0}
              >
                Savatga qo'shish - {formatPrice(totalPrice)}
              </button>
              <button className="btn-save-config">Konfiguratsiyani saqlash</button>
              <button className="btn-share-config">Ulashish</button>
            </div>
          </div>
        </div>
      </div>

      {activeSelector && availableComponents[activeSelector] && (
        <div className="selector-overlay">
          <ComponentSelector
            componentType={activeSelector}
            components={availableComponents[activeSelector]}
          />
        </div>
      )}
    </div>
  );
};

export default NASBuilder;
