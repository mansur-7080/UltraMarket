import React, { useState, useEffect } from 'react';
import './MemoryFinder.css';

interface MemoryProduct {
  id: string;
  name: string;
  brand: string;
  type: string;
  capacity: string;
  speed: string;
  compatibility: string[];
  price: number;
  image: string;
  inStock: boolean;
  rating: number;
  specs: {
    timing: string;
    voltage: string;
    casLatency: number;
    modules: string;
    features: string[];
  };
}

interface DeviceType {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface DeviceBrand {
  id: string;
  name: string;
  image: string;
}

interface DeviceModel {
  id: string;
  brandId: string;
  name: string;
  compatibleMemory: {
    types: string[];
    maxCapacity: string;
    slots: number;
    maxSpeed: string;
  };
}

const MemoryFinder: React.FC = () => {
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [deviceBrands, setDeviceBrands] = useState<DeviceBrand[]>([]);
  const [deviceModels, setDeviceModels] = useState<DeviceModel[]>([]);
  const [compatibleMemory, setCompatibleMemory] = useState<MemoryProduct[]>([]);

  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedMemoryType, setSelectedMemoryType] = useState<string>('');
  const [selectedCapacity, setSelectedCapacity] = useState<string>('');

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loadingMemory, setLoadingMemory] = useState<boolean>(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceModel | null>(null);

  // Filter options
  const [filters, setFilters] = useState({
    brands: [] as string[],
    capacities: [] as string[],
    speeds: [] as string[],
  });
  const [activeFilters, setActiveFilters] = useState({
    brands: [] as string[],
    capacities: [] as string[],
    speeds: [] as string[],
  });
  const [sortBy, setSortBy] = useState<string>('recommended');

  useEffect(() => {
    // Fetch data
    fetchDeviceTypes();
  }, []);

  useEffect(() => {
    if (selectedType) {
      fetchDeviceBrands(selectedType);
    }
  }, [selectedType]);

  useEffect(() => {
    if (selectedBrand) {
      fetchDeviceModels(selectedBrand);
    }
  }, [selectedBrand]);

  useEffect(() => {
    if (selectedModel) {
      fetchDeviceInfo(selectedModel);
    }
  }, [selectedModel]);

  useEffect(() => {
    if (deviceInfo) {
      findCompatibleMemory();
    }
  }, [deviceInfo, selectedMemoryType, selectedCapacity, activeFilters, sortBy]);

  const fetchDeviceTypes = () => {
    // API so'rov simulyatsiyasi
    const types: DeviceType[] = [
      {
        id: 'laptop',
        name: 'Laptop',
        description: 'Noutbuklar uchun xotira',
        icon: '💻',
      },
      {
        id: 'desktop',
        name: 'Desktop Kompyuter',
        description: 'Shaxsiy kompyuterlar uchun xotira',
        icon: '🖥️',
      },
      {
        id: 'server',
        name: 'Server',
        description: 'Serverlar uchun xotira modullari',
        icon: '🖧',
      },
      {
        id: 'mac',
        name: 'Mac/Apple',
        description: 'Apple qurilmalar uchun xotira',
        icon: '🍎',
      },
    ];

    setDeviceTypes(types);
  };

  const fetchDeviceBrands = (typeId: string) => {
    // API so'rov simulyatsiyasi
    const brands: { [key: string]: DeviceBrand[] } = {
      laptop: [
        { id: 'lenovo', name: 'Lenovo', image: '/images/memory/brands/lenovo.png' },
        { id: 'hp', name: 'HP', image: '/images/memory/brands/hp.png' },
        { id: 'dell', name: 'Dell', image: '/images/memory/brands/dell.png' },
        { id: 'asus', name: 'Asus', image: '/images/memory/brands/asus.png' },
        { id: 'acer', name: 'Acer', image: '/images/memory/brands/acer.png' },
      ],
      desktop: [
        { id: 'asus', name: 'Asus', image: '/images/memory/brands/asus.png' },
        { id: 'gigabyte', name: 'Gigabyte', image: '/images/memory/brands/gigabyte.png' },
        { id: 'msi', name: 'MSI', image: '/images/memory/brands/msi.png' },
        { id: 'asrock', name: 'ASRock', image: '/images/memory/brands/asrock.png' },
      ],
      server: [
        { id: 'dell', name: 'Dell', image: '/images/memory/brands/dell.png' },
        { id: 'hp', name: 'HP', image: '/images/memory/brands/hp.png' },
        { id: 'ibm', name: 'IBM', image: '/images/memory/brands/ibm.png' },
        { id: 'supermicro', name: 'Supermicro', image: '/images/memory/brands/supermicro.png' },
      ],
      mac: [{ id: 'apple', name: 'Apple', image: '/images/memory/brands/apple.png' }],
    };

    setDeviceBrands(brands[typeId] || []);
    setSelectedBrand('');
    setDeviceModels([]);
  };

  const fetchDeviceModels = (brandId: string) => {
    // API so'rov simulyatsiyasi
    const models: { [key: string]: DeviceModel[] } = {
      lenovo: [
        {
          id: 'thinkpad-t14',
          brandId: 'lenovo',
          name: 'ThinkPad T14',
          compatibleMemory: {
            types: ['DDR4'],
            maxCapacity: '32GB',
            slots: 2,
            maxSpeed: '3200MHz',
          },
        },
        {
          id: 'legion-5',
          brandId: 'lenovo',
          name: 'Legion 5',
          compatibleMemory: {
            types: ['DDR4'],
            maxCapacity: '64GB',
            slots: 2,
            maxSpeed: '3200MHz',
          },
        },
      ],
      hp: [
        {
          id: 'pavilion-15',
          brandId: 'hp',
          name: 'Pavilion 15',
          compatibleMemory: {
            types: ['DDR4'],
            maxCapacity: '32GB',
            slots: 2,
            maxSpeed: '2666MHz',
          },
        },
        {
          id: 'elitebook-840',
          brandId: 'hp',
          name: 'EliteBook 840',
          compatibleMemory: {
            types: ['DDR4'],
            maxCapacity: '32GB',
            slots: 2,
            maxSpeed: '3200MHz',
          },
        },
      ],
      asus: [
        {
          id: 'rog-strix-b550',
          brandId: 'asus',
          name: 'ROG Strix B550',
          compatibleMemory: {
            types: ['DDR4'],
            maxCapacity: '128GB',
            slots: 4,
            maxSpeed: '4400MHz',
          },
        },
        {
          id: 'tuf-gaming-z690',
          brandId: 'asus',
          name: 'TUF Gaming Z690',
          compatibleMemory: {
            types: ['DDR5'],
            maxCapacity: '128GB',
            slots: 4,
            maxSpeed: '6400MHz',
          },
        },
      ],
      apple: [
        {
          id: 'macbook-pro-2020',
          brandId: 'apple',
          name: 'MacBook Pro 2020',
          compatibleMemory: {
            types: ['LPDDR4X'],
            maxCapacity: '16GB',
            slots: 0, // soldered
            maxSpeed: '4266MHz',
          },
        },
        {
          id: 'mac-mini-m1',
          brandId: 'apple',
          name: 'Mac Mini (M1, 2020)',
          compatibleMemory: {
            types: ['Unified Memory'],
            maxCapacity: '16GB',
            slots: 0, // soldered
            maxSpeed: 'Apple Silicon',
          },
        },
      ],
    };

    setDeviceModels(models[brandId] || []);
    setSelectedModel('');
  };

  const fetchDeviceInfo = (modelId: string) => {
    // Find device from models
    const device = deviceModels.find((model) => model.id === modelId);
    if (device) {
      setDeviceInfo(device);
      setSelectedMemoryType(device.compatibleMemory.types[0]);
      setCurrentStep(2);
    }
  };

  const findCompatibleMemory = () => {
    setLoadingMemory(true);

    // API so'rov simulyatsiyasi
    setTimeout(() => {
      const memory: MemoryProduct[] = [
        {
          id: 'crucial-16gb-3200',
          name: 'Crucial 16GB DDR4 3200MHz',
          brand: 'Crucial',
          type: 'DDR4',
          capacity: '16GB',
          speed: '3200MHz',
          compatibility: [
            'lenovo-thinkpad-t14',
            'lenovo-legion-5',
            'hp-pavilion-15',
            'hp-elitebook-840',
          ],
          price: 850000,
          image: '/images/memory/crucial-16gb.jpg',
          inStock: true,
          rating: 4.7,
          specs: {
            timing: '22-22-22',
            voltage: '1.2V',
            casLatency: 22,
            modules: '1 x 16GB',
            features: ['XMP Support', 'Low profile'],
          },
        },
        {
          id: 'kingston-32gb-3200',
          name: 'Kingston Fury 32GB DDR4 3200MHz',
          brand: 'Kingston',
          type: 'DDR4',
          capacity: '32GB',
          speed: '3200MHz',
          compatibility: ['lenovo-legion-5', 'hp-elitebook-840', 'asus-rog-strix-b550'],
          price: 1350000,
          image: '/images/memory/kingston-32gb.jpg',
          inStock: true,
          rating: 4.8,
          specs: {
            timing: '16-18-18',
            voltage: '1.35V',
            casLatency: 16,
            modules: '2 x 16GB',
            features: ['XMP Support', 'RGB Lighting', 'Aluminum heat spreader'],
          },
        },
        {
          id: 'corsair-16gb-3600',
          name: 'Corsair Vengeance LPX 16GB DDR4 3600MHz',
          brand: 'Corsair',
          type: 'DDR4',
          capacity: '16GB',
          speed: '3600MHz',
          compatibility: ['asus-rog-strix-b550'],
          price: 750000,
          image: '/images/memory/corsair-16gb.jpg',
          inStock: true,
          rating: 4.9,
          specs: {
            timing: '18-22-22',
            voltage: '1.35V',
            casLatency: 18,
            modules: '2 x 8GB',
            features: ['XMP Support', 'Low profile', 'Black heat spreader'],
          },
        },
        {
          id: 'gskill-32gb-4400',
          name: 'G.Skill Trident Z RGB 32GB DDR4 4400MHz',
          brand: 'G.Skill',
          type: 'DDR4',
          capacity: '32GB',
          speed: '4400MHz',
          compatibility: ['asus-rog-strix-b550'],
          price: 1950000,
          image: '/images/memory/gskill-32gb.jpg',
          inStock: false,
          rating: 4.9,
          specs: {
            timing: '18-19-19-39',
            voltage: '1.5V',
            casLatency: 18,
            modules: '2 x 16GB',
            features: ['XMP Support', 'RGB Lighting', 'Premium heat spreader'],
          },
        },
        {
          id: 'teamgroup-16gb-6000',
          name: 'TeamGroup T-Force Delta RGB 16GB DDR5 6000MHz',
          brand: 'TeamGroup',
          type: 'DDR5',
          capacity: '16GB',
          speed: '6000MHz',
          compatibility: ['asus-tuf-gaming-z690'],
          price: 1750000,
          image: '/images/memory/teamgroup-16gb.jpg',
          inStock: true,
          rating: 4.5,
          specs: {
            timing: '38-38-38-78',
            voltage: '1.25V',
            casLatency: 38,
            modules: '2 x 8GB',
            features: ['XMP Support', 'RGB Lighting', 'Aluminum heat spreader'],
          },
        },
      ];

      // Apply filters
      let filteredMemory = memory;

      // Filter by device compatibility
      if (deviceInfo && deviceInfo.id) {
        filteredMemory = filteredMemory.filter(
          (mem) =>
            mem.type === selectedMemoryType &&
            (!selectedCapacity || mem.capacity === selectedCapacity)
        );
      }

      // Apply brand filter
      if (activeFilters.brands.length > 0) {
        filteredMemory = filteredMemory.filter((mem) => activeFilters.brands.includes(mem.brand));
      }

      // Apply capacity filter
      if (activeFilters.capacities.length > 0) {
        filteredMemory = filteredMemory.filter((mem) =>
          activeFilters.capacities.includes(mem.capacity)
        );
      }

      // Apply speed filter
      if (activeFilters.speeds.length > 0) {
        filteredMemory = filteredMemory.filter((mem) => activeFilters.speeds.includes(mem.speed));
      }

      // Apply search filter
      if (searchTerm.trim() !== '') {
        filteredMemory = filteredMemory.filter(
          (mem) =>
            mem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mem.brand.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Apply sorting
      if (sortBy === 'price-asc') {
        filteredMemory.sort((a, b) => a.price - b.price);
      } else if (sortBy === 'price-desc') {
        filteredMemory.sort((a, b) => b.price - a.price);
      } else if (sortBy === 'rating') {
        filteredMemory.sort((a, b) => b.rating - a.rating);
      }

      // Extract all available filter options
      const brands = [...new Set(memory.map((mem) => mem.brand))];
      const capacities = [...new Set(memory.map((mem) => mem.capacity))];
      const speeds = [...new Set(memory.map((mem) => mem.speed))];

      setFilters({
        brands,
        capacities,
        speeds,
      });

      setCompatibleMemory(filteredMemory);
      setLoadingMemory(false);
    }, 800);
  };

  const toggleFilter = (type: 'brands' | 'capacities' | 'speeds', value: string) => {
    setActiveFilters((prev) => {
      const currentFilters = [...prev[type]];
      const index = currentFilters.indexOf(value);

      if (index === -1) {
        // Add filter
        return {
          ...prev,
          [type]: [...currentFilters, value],
        };
      } else {
        // Remove filter
        currentFilters.splice(index, 1);
        return {
          ...prev,
          [type]: currentFilters,
        };
      }
    });
  };

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    setSelectedBrand('');
    setSelectedModel('');
    setDeviceInfo(null);
    setCurrentStep(1);
  };

  const handleBrandSelect = (brandId: string) => {
    setSelectedBrand(brandId);
    setSelectedModel('');
    setDeviceInfo(null);
  };

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
  };

  const handleMemoryTypeSelect = (type: string) => {
    setSelectedMemoryType(type);
  };

  const handleCapacitySelect = (capacity: string) => {
    setSelectedCapacity(capacity);
  };

  const resetSelection = () => {
    setSelectedType('');
    setSelectedBrand('');
    setSelectedModel('');
    setDeviceInfo(null);
    setCompatibleMemory([]);
    setCurrentStep(1);
    setActiveFilters({
      brands: [],
      capacities: [],
      speeds: [],
    });
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

  return (
    <div className="memory-finder">
      <div className="memory-finder-header">
        <h1>Xotira Topish - RAM Finder</h1>
        <p>O'z qurilmangiz uchun to'g'ri RAM toping</p>
      </div>

      {currentStep === 1 && (
        <div className="device-selection">
          <div className="selection-step">
            <div className="step-header">
              <div className="step-number">1</div>
              <h3>Qurilma turini tanlang</h3>
            </div>
            <div className="device-types">
              {deviceTypes.map((type) => (
                <div
                  key={type.id}
                  className={`device-type-card ${selectedType === type.id ? 'selected' : ''}`}
                  onClick={() => handleTypeSelect(type.id)}
                >
                  <div className="type-icon">{type.icon}</div>
                  <div className="type-name">{type.name}</div>
                  <div className="type-desc">{type.description}</div>
                </div>
              ))}
            </div>
          </div>

          {selectedType && (
            <div className="selection-step">
              <div className="step-header">
                <div className="step-number">2</div>
                <h3>Brand tanlang</h3>
              </div>
              <div className="brand-list">
                {deviceBrands.map((brand) => (
                  <div
                    key={brand.id}
                    className={`brand-card ${selectedBrand === brand.id ? 'selected' : ''}`}
                    onClick={() => handleBrandSelect(brand.id)}
                  >
                    <div className="brand-image">
                      <img src={brand.image} alt={brand.name} />
                    </div>
                    <div className="brand-name">{brand.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedBrand && (
            <div className="selection-step">
              <div className="step-header">
                <div className="step-number">3</div>
                <h3>Model tanlang</h3>
              </div>
              <div className="model-list">
                {deviceModels.map((model) => (
                  <div
                    key={model.id}
                    className={`model-card ${selectedModel === model.id ? 'selected' : ''}`}
                    onClick={() => handleModelSelect(model.id)}
                  >
                    <div className="model-name">{model.name}</div>
                    <div className="model-memory-info">
                      <div>RAM turi: {model.compatibleMemory.types.join(', ')}</div>
                      <div>Maksimal sig'im: {model.compatibleMemory.maxCapacity}</div>
                      <div>Slotlar soni: {model.compatibleMemory.slots}</div>
                    </div>
                    <button className="select-model-btn">Tanlash</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {currentStep === 2 && deviceInfo && (
        <div className="memory-results">
          <div className="results-header">
            <button className="back-button" onClick={() => setCurrentStep(1)}>
              &larr; Orqaga
            </button>
            <div className="device-summary">
              <h3>
                {deviceBrands.find((b) => b.id === deviceInfo.brandId)?.name} {deviceInfo.name}
              </h3>
              <div className="device-memory-specs">
                <div className="spec-item">
                  <span className="spec-label">RAM turlari:</span>
                  <span className="spec-value">{deviceInfo.compatibleMemory.types.join(', ')}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Max. sig'im:</span>
                  <span className="spec-value">{deviceInfo.compatibleMemory.maxCapacity}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Slotlar:</span>
                  <span className="spec-value">{deviceInfo.compatibleMemory.slots}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Max. tezlik:</span>
                  <span className="spec-value">{deviceInfo.compatibleMemory.maxSpeed}</span>
                </div>
              </div>
            </div>
            <button className="reset-button" onClick={resetSelection}>
              ↺ Qayta boshlash
            </button>
          </div>

          <div className="memory-selection-filters">
            <div className="memory-type-filters">
              <div className="filter-label">Xotira turi:</div>
              <div className="memory-type-buttons">
                {deviceInfo.compatibleMemory.types.map((type) => (
                  <button
                    key={type}
                    className={selectedMemoryType === type ? 'active' : ''}
                    onClick={() => handleMemoryTypeSelect(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="capacity-filters">
              <div className="filter-label">Xotira sig'imi:</div>
              <div className="capacity-buttons">
                <button
                  className={selectedCapacity === '' ? 'active' : ''}
                  onClick={() => handleCapacitySelect('')}
                >
                  Hammasi
                </button>
                <button
                  className={selectedCapacity === '8GB' ? 'active' : ''}
                  onClick={() => handleCapacitySelect('8GB')}
                >
                  8GB
                </button>
                <button
                  className={selectedCapacity === '16GB' ? 'active' : ''}
                  onClick={() => handleCapacitySelect('16GB')}
                >
                  16GB
                </button>
                <button
                  className={selectedCapacity === '32GB' ? 'active' : ''}
                  onClick={() => handleCapacitySelect('32GB')}
                >
                  32GB
                </button>
              </div>
            </div>
          </div>

          <div className="memory-results-grid">
            <div className="filter-sidebar">
              <div className="search-filter">
                <input
                  type="text"
                  placeholder="Qidirish..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="sort-filter">
                <label>Saralash:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="recommended">Tavsiya etilgan</option>
                  <option value="price-asc">Narxi (o'sish)</option>
                  <option value="price-desc">Narxi (kamayish)</option>
                  <option value="rating">Reyting</option>
                </select>
              </div>

              <div className="filter-group">
                <h4>Brendlar</h4>
                {filters.brands.map((brand) => (
                  <div className="filter-item" key={brand}>
                    <label>
                      <input
                        type="checkbox"
                        checked={activeFilters.brands.includes(brand)}
                        onChange={() => toggleFilter('brands', brand)}
                      />
                      {brand}
                    </label>
                  </div>
                ))}
              </div>

              <div className="filter-group">
                <h4>Tezliklar</h4>
                {filters.speeds.map((speed) => (
                  <div className="filter-item" key={speed}>
                    <label>
                      <input
                        type="checkbox"
                        checked={activeFilters.speeds.includes(speed)}
                        onChange={() => toggleFilter('speeds', speed)}
                      />
                      {speed}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="memory-products">
              {loadingMemory ? (
                <div className="loading-indicator">
                  <div className="spinner"></div>
                  <p>Ma'lumot yuklanmoqda...</p>
                </div>
              ) : compatibleMemory.length > 0 ? (
                compatibleMemory.map((memory) => (
                  <div className="memory-product-card" key={memory.id}>
                    <div className="product-image">
                      <img src={memory.image} alt={memory.name} />
                      {memory.inStock ? (
                        <div className="stock-badge in-stock">Mavjud</div>
                      ) : (
                        <div className="stock-badge out-of-stock">Mavjud emas</div>
                      )}
                    </div>

                    <div className="product-info">
                      <h4 className="product-name">{memory.name}</h4>
                      <div className="product-rating">
                        <div className="stars">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={i < Math.floor(memory.rating) ? 'star filled' : 'star'}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="rating-value">{memory.rating.toFixed(1)}</span>
                      </div>

                      <div className="memory-specs">
                        <div className="spec-item">
                          <span className="spec-icon">📊</span>
                          <span>{memory.capacity}</span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-icon">⚡</span>
                          <span>{memory.speed}</span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-icon">🧩</span>
                          <span>{memory.specs.modules}</span>
                        </div>
                      </div>

                      <div className="product-price">
                        <span className="price-value">{formatPrice(memory.price)}</span>
                      </div>

                      <div className="product-actions">
                        <button className="view-details-btn">Batafsil</button>
                        <button className="add-to-cart-btn" disabled={!memory.inStock}>
                          {memory.inStock ? "Savatga qo'shish" : 'Mavjud emas'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-results">
                  <p>Afsuski, ushbu qurilma uchun mos keladigan xotira topilmadi.</p>
                  <p>
                    Iltimos, boshqa turdagi xotirani tanlang yoki filtrlash parametrlarini
                    o'zgartiring.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryFinder;
