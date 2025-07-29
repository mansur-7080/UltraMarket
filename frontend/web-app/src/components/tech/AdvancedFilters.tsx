import React, { useState, useEffect } from 'react';
import './AdvancedFilters.css';

interface FilterOption {
  id: string;
  label: string;
  labelUz: string;
  count: number;
  value: any;
}

interface SpecFilter {
  key: string;
  name: string;
  nameUz: string;
  type: 'range' | 'select' | 'checkbox' | 'multiselect';
  unit?: string;
  options?: FilterOption[];
  min?: number;
  max?: number;
  step?: number;
}

interface FilterState {
  brands: string[];
  categories: string[];
  priceRange: [number, number];
  specs: { [key: string]: any };
  availability: string[];
  features: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface AdvancedFiltersProps {
  category?: string;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  totalResults: number;
  isLoading?: boolean;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  category = 'all',
  onFiltersChange,
  onClearFilters,
  totalResults,
  isLoading = false,
}) => {
  const [filters, setFilters] = useState<FilterState>({
    brands: [],
    categories: [],
    priceRange: [0, 50000000], // UZS
    specs: {},
    availability: [],
    features: [],
    sortBy: 'popularity',
    sortOrder: 'desc',
  });

  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    brands: true,
    price: true,
    specs: true,
    availability: true,
    features: false,
  });

  const [availableFilters, setAvailableFilters] = useState<{
    brands: FilterOption[];
    categories: FilterOption[];
    specs: SpecFilter[];
    features: FilterOption[];
  }>({
    brands: [],
    categories: [],
    specs: [],
    features: [],
  });

  useEffect(() => {
    loadAvailableFilters();
  }, [category]);

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const loadAvailableFilters = async () => {
    // Mock data - in real app, fetch from API based on category
    const mockData = {
      brands: [
        { id: 'intel', label: 'Intel', labelUz: 'Intel', count: 45, value: 'intel' },
        { id: 'amd', label: 'AMD', labelUz: 'AMD', count: 38, value: 'amd' },
        { id: 'nvidia', label: 'NVIDIA', labelUz: 'NVIDIA', count: 52, value: 'nvidia' },
        { id: 'asus', label: 'ASUS', labelUz: 'ASUS', count: 89, value: 'asus' },
        { id: 'msi', label: 'MSI', labelUz: 'MSI', count: 67, value: 'msi' },
        { id: 'gigabyte', label: 'Gigabyte', labelUz: 'Gigabyte', count: 43, value: 'gigabyte' },
      ],
      categories: [
        { id: 'cpu', label: 'Processors', labelUz: 'Protsessorlar', count: 125, value: 'cpu' },
        { id: 'gpu', label: 'Graphics Cards', labelUz: 'Videokartalar', count: 95, value: 'gpu' },
        {
          id: 'motherboard',
          label: 'Motherboards',
          labelUz: 'Motherboardlar',
          count: 180,
          value: 'motherboard',
        },
        { id: 'ram', label: 'Memory', labelUz: 'Xotira', count: 150, value: 'ram' },
        { id: 'storage', label: 'Storage', labelUz: 'Saqlash', count: 200, value: 'storage' },
        { id: 'monitors', label: 'Monitors', labelUz: 'Monitorlar', count: 220, value: 'monitors' },
      ],
      specs: getSpecFiltersForCategory(category),
      features: [
        {
          id: 'ray-tracing',
          label: 'Ray Tracing',
          labelUz: 'Ray Tracing',
          count: 45,
          value: 'ray-tracing',
        },
        { id: 'dlss', label: 'DLSS/FSR', labelUz: 'DLSS/FSR', count: 38, value: 'dlss' },
        {
          id: 'overclocking',
          label: 'Overclockable',
          labelUz: 'Overclocking',
          count: 67,
          value: 'overclocking',
        },
        {
          id: '4k-gaming',
          label: '4K Gaming',
          labelUz: '4K Gaming',
          count: 25,
          value: '4k-gaming',
        },
        { id: 'rgb', label: 'RGB Lighting', labelUz: 'RGB Yoritish', count: 156, value: 'rgb' },
        {
          id: 'silent',
          label: 'Silent Operation',
          labelUz: 'Sokin ishlash',
          count: 89,
          value: 'silent',
        },
      ],
    };

    setAvailableFilters(mockData);
  };

  const getSpecFiltersForCategory = (cat: string): SpecFilter[] => {
    switch (cat) {
      case 'cpu':
        return [
          {
            key: 'cores',
            name: 'Cores',
            nameUz: 'Yadrolar',
            type: 'range',
            min: 2,
            max: 32,
            step: 2,
          },
          {
            key: 'threads',
            name: 'Threads',
            nameUz: 'Oqimlar',
            type: 'range',
            min: 2,
            max: 64,
            step: 2,
          },
          {
            key: 'baseClock',
            name: 'Base Clock',
            nameUz: 'Bazaviy chastota',
            type: 'range',
            unit: 'GHz',
            min: 1.0,
            max: 5.0,
            step: 0.1,
          },
          {
            key: 'socket',
            name: 'Socket',
            nameUz: 'Socket',
            type: 'multiselect',
            options: [
              { id: 'lga1700', label: 'LGA1700', labelUz: 'LGA1700', count: 42, value: 'LGA1700' },
              { id: 'am5', label: 'AM5', labelUz: 'AM5', count: 35, value: 'AM5' },
              { id: 'am4', label: 'AM4', labelUz: 'AM4', count: 28, value: 'AM4' },
            ],
          },
          {
            key: 'tdp',
            name: 'TDP',
            nameUz: "Quvvat iste'moli",
            type: 'range',
            unit: 'W',
            min: 35,
            max: 250,
            step: 5,
          },
        ];

      case 'gpu':
        return [
          {
            key: 'memory',
            name: 'Memory',
            nameUz: 'Video xotira',
            type: 'multiselect',
            unit: 'GB',
            options: [
              { id: '4gb', label: '4GB', labelUz: '4GB', count: 15, value: 4 },
              { id: '6gb', label: '6GB', labelUz: '6GB', count: 22, value: 6 },
              { id: '8gb', label: '8GB', labelUz: '8GB', count: 35, value: 8 },
              { id: '12gb', label: '12GB', labelUz: '12GB', count: 28, value: 12 },
              { id: '16gb', label: '16GB+', labelUz: '16GB+', count: 24, value: 16 },
            ],
          },
          {
            key: 'coreClock',
            name: 'Core Clock',
            nameUz: 'Yadro chastotasi',
            type: 'range',
            unit: 'MHz',
            min: 1000,
            max: 3000,
            step: 50,
          },
          {
            key: 'powerConsumption',
            name: 'Power Consumption',
            nameUz: "Quvvat iste'moli",
            type: 'range',
            unit: 'W',
            min: 75,
            max: 500,
            step: 25,
          },
        ];

      case 'ram':
        return [
          {
            key: 'capacity',
            name: 'Capacity',
            nameUz: 'Hajmi',
            type: 'multiselect',
            unit: 'GB',
            options: [
              { id: '8gb', label: '8GB', labelUz: '8GB', count: 45, value: 8 },
              { id: '16gb', label: '16GB', labelUz: '16GB', count: 67, value: 16 },
              { id: '32gb', label: '32GB', labelUz: '32GB', count: 38, value: 32 },
              { id: '64gb', label: '64GB+', labelUz: '64GB+', count: 15, value: 64 },
            ],
          },
          {
            key: 'speed',
            name: 'Speed',
            nameUz: 'Tezlik',
            type: 'multiselect',
            unit: 'MHz',
            options: [
              { id: '3200', label: 'DDR4-3200', labelUz: 'DDR4-3200', count: 35, value: 3200 },
              { id: '3600', label: 'DDR4-3600', labelUz: 'DDR4-3600', count: 28, value: 3600 },
              { id: '4800', label: 'DDR5-4800', labelUz: 'DDR5-4800', count: 22, value: 4800 },
              { id: '5600', label: 'DDR5-5600', labelUz: 'DDR5-5600', count: 18, value: 5600 },
            ],
          },
          {
            key: 'type',
            name: 'Type',
            nameUz: 'Turi',
            type: 'multiselect',
            options: [
              { id: 'ddr4', label: 'DDR4', labelUz: 'DDR4', count: 89, value: 'DDR4' },
              { id: 'ddr5', label: 'DDR5', labelUz: 'DDR5', count: 67, value: 'DDR5' },
            ],
          },
        ];

      default:
        return [];
    }
  };

  const handleBrandToggle = (brandId: string) => {
    setFilters((prev) => ({
      ...prev,
      brands: prev.brands.includes(brandId)
        ? prev.brands.filter((b) => b !== brandId)
        : [...prev.brands, brandId],
    }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter((c) => c !== categoryId)
        : [...prev.categories, categoryId],
    }));
  };

  const handlePriceRangeChange = (newRange: [number, number]) => {
    setFilters((prev) => ({
      ...prev,
      priceRange: newRange,
    }));
  };

  const handleSpecChange = (specKey: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      specs: {
        ...prev.specs,
        [specKey]: value,
      },
    }));
  };

  const handleFeatureToggle = (featureId: string) => {
    setFilters((prev) => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter((f) => f !== featureId)
        : [...prev.features, featureId],
    }));
  };

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFilters((prev) => ({
      ...prev,
      sortBy,
      sortOrder,
    }));
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      brands: [],
      categories: [],
      priceRange: [0, 50000000],
      specs: {},
      availability: [],
      features: [],
      sortBy: 'popularity',
      sortOrder: 'desc',
    });
    onClearFilters();
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`;
    }
    if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K`;
    }
    return price.toString();
  };

  const hasActiveFilters = () => {
    return (
      filters.brands.length > 0 ||
      filters.categories.length > 0 ||
      filters.priceRange[0] > 0 ||
      filters.priceRange[1] < 50000000 ||
      Object.keys(filters.specs).length > 0 ||
      filters.features.length > 0
    );
  };

  return (
    <div className="advanced-filters">
      <div className="filters-header">
        <h3>🔍 Filters</h3>
        <div className="filters-summary">
          <span className="results-count">
            {isLoading ? 'Qidirilmoqda...' : `${totalResults} mahsulot topildi`}
          </span>
          {hasActiveFilters() && (
            <button className="clear-filters" onClick={clearAllFilters}>
              Tozalash
            </button>
          )}
        </div>
      </div>

      {/* Sort Options */}
      <div className="filter-section">
        <div className="section-header" onClick={() => toggleSection('sort')}>
          <h4>📊 Saralash</h4>
          <span className={`toggle-icon ${expandedSections.sort ? 'expanded' : ''}`}>▼</span>
        </div>
        {expandedSections.sort !== false && (
          <div className="section-content">
            <div className="sort-options">
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  handleSortChange(sortBy, sortOrder as 'asc' | 'desc');
                }}
              >
                <option value="popularity-desc">Mashhurlik</option>
                <option value="price-asc">Narx: Kamdan ko'pga</option>
                <option value="price-desc">Narx: Ko'pdan kamga</option>
                <option value="rating-desc">Reyting</option>
                <option value="newest-desc">Yangilar</option>
                <option value="name-asc">Nom: A-Z</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Brand Filter */}
      <div className="filter-section">
        <div className="section-header" onClick={() => toggleSection('brands')}>
          <h4>🏢 Brendlar</h4>
          <span className={`toggle-icon ${expandedSections.brands ? 'expanded' : ''}`}>▼</span>
        </div>
        {expandedSections.brands && (
          <div className="section-content">
            <div className="filter-options">
              {availableFilters.brands.map((brand) => (
                <label key={brand.id} className="filter-option">
                  <input
                    type="checkbox"
                    checked={filters.brands.includes(brand.id)}
                    onChange={() => handleBrandToggle(brand.id)}
                  />
                  <span className="checkmark"></span>
                  <span className="option-label">{brand.labelUz}</span>
                  <span className="option-count">({brand.count})</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Category Filter */}
      {category === 'all' && (
        <div className="filter-section">
          <div className="section-header" onClick={() => toggleSection('categories')}>
            <h4>📱 Kategoriyalar</h4>
            <span className={`toggle-icon ${expandedSections.categories ? 'expanded' : ''}`}>
              ▼
            </span>
          </div>
          {expandedSections.categories && (
            <div className="section-content">
              <div className="filter-options">
                {availableFilters.categories.map((cat) => (
                  <label key={cat.id} className="filter-option">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(cat.id)}
                      onChange={() => handleCategoryToggle(cat.id)}
                    />
                    <span className="checkmark"></span>
                    <span className="option-label">{cat.labelUz}</span>
                    <span className="option-count">({cat.count})</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Price Range Filter */}
      <div className="filter-section">
        <div className="section-header" onClick={() => toggleSection('price')}>
          <h4>💰 Narx</h4>
          <span className={`toggle-icon ${expandedSections.price ? 'expanded' : ''}`}>▼</span>
        </div>
        {expandedSections.price && (
          <div className="section-content">
            <div className="price-range">
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder="Dan"
                  value={filters.priceRange[0]}
                  onChange={(e) =>
                    handlePriceRangeChange([Number(e.target.value), filters.priceRange[1]])
                  }
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Gacha"
                  value={filters.priceRange[1]}
                  onChange={(e) =>
                    handlePriceRangeChange([filters.priceRange[0], Number(e.target.value)])
                  }
                />
              </div>
              <div className="price-display">
                {formatPrice(filters.priceRange[0])} - {formatPrice(filters.priceRange[1])} so'm
              </div>

              {/* Quick Price Ranges */}
              <div className="quick-prices">
                <button
                  className={`quick-price ${filters.priceRange[0] === 0 && filters.priceRange[1] === 2000000 ? 'active' : ''}`}
                  onClick={() => handlePriceRangeChange([0, 2000000])}
                >
                  2M gacha
                </button>
                <button
                  className={`quick-price ${filters.priceRange[0] === 2000000 && filters.priceRange[1] === 5000000 ? 'active' : ''}`}
                  onClick={() => handlePriceRangeChange([2000000, 5000000])}
                >
                  2M-5M
                </button>
                <button
                  className={`quick-price ${filters.priceRange[0] === 5000000 && filters.priceRange[1] === 10000000 ? 'active' : ''}`}
                  onClick={() => handlePriceRangeChange([5000000, 10000000])}
                >
                  5M-10M
                </button>
                <button
                  className={`quick-price ${filters.priceRange[0] === 10000000 ? 'active' : ''}`}
                  onClick={() => handlePriceRangeChange([10000000, 50000000])}
                >
                  10M+
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Specifications Filters */}
      {availableFilters.specs.length > 0 && (
        <div className="filter-section">
          <div className="section-header" onClick={() => toggleSection('specs')}>
            <h4>⚙️ Spetsifikatsiyalar</h4>
            <span className={`toggle-icon ${expandedSections.specs ? 'expanded' : ''}`}>▼</span>
          </div>
          {expandedSections.specs && (
            <div className="section-content">
              {availableFilters.specs.map((spec) => (
                <div key={spec.key} className="spec-filter">
                  <label className="spec-label">
                    {spec.nameUz} {spec.unit && `(${spec.unit})`}
                  </label>

                  {spec.type === 'range' && (
                    <div className="range-filter">
                      <input
                        type="range"
                        min={spec.min}
                        max={spec.max}
                        step={spec.step}
                        value={filters.specs[spec.key] || spec.min}
                        onChange={(e) => handleSpecChange(spec.key, Number(e.target.value))}
                      />
                      <div className="range-value">
                        {filters.specs[spec.key] || spec.min} {spec.unit}
                      </div>
                    </div>
                  )}

                  {spec.type === 'multiselect' && spec.options && (
                    <div className="multiselect-filter">
                      {spec.options.map((option) => (
                        <label key={option.id} className="filter-option">
                          <input
                            type="checkbox"
                            checked={(filters.specs[spec.key] || []).includes(option.value)}
                            onChange={() => {
                              const currentValues = filters.specs[spec.key] || [];
                              const newValues = currentValues.includes(option.value)
                                ? currentValues.filter((v: any) => v !== option.value)
                                : [...currentValues, option.value];
                              handleSpecChange(spec.key, newValues);
                            }}
                          />
                          <span className="checkmark"></span>
                          <span className="option-label">{option.labelUz}</span>
                          <span className="option-count">({option.count})</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Features Filter */}
      <div className="filter-section">
        <div className="section-header" onClick={() => toggleSection('features')}>
          <h4>✨ Xususiyatlar</h4>
          <span className={`toggle-icon ${expandedSections.features ? 'expanded' : ''}`}>▼</span>
        </div>
        {expandedSections.features && (
          <div className="section-content">
            <div className="filter-options">
              {availableFilters.features.map((feature) => (
                <label key={feature.id} className="filter-option">
                  <input
                    type="checkbox"
                    checked={filters.features.includes(feature.id)}
                    onChange={() => handleFeatureToggle(feature.id)}
                  />
                  <span className="checkmark"></span>
                  <span className="option-label">{feature.labelUz}</span>
                  <span className="option-count">({feature.count})</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Availability Filter */}
      <div className="filter-section">
        <div className="section-header" onClick={() => toggleSection('availability')}>
          <h4>📦 Mavjudlik</h4>
          <span className={`toggle-icon ${expandedSections.availability ? 'expanded' : ''}`}>
            ▼
          </span>
        </div>
        {expandedSections.availability && (
          <div className="section-content">
            <div className="filter-options">
              <label className="filter-option">
                <input
                  type="checkbox"
                  checked={filters.availability.includes('in-stock')}
                  onChange={() => {
                    const newAvailability = filters.availability.includes('in-stock')
                      ? filters.availability.filter((a) => a !== 'in-stock')
                      : [...filters.availability, 'in-stock'];
                    setFilters((prev) => ({ ...prev, availability: newAvailability }));
                  }}
                />
                <span className="checkmark"></span>
                <span className="option-label">Omborda mavjud</span>
              </label>
              <label className="filter-option">
                <input
                  type="checkbox"
                  checked={filters.availability.includes('same-day')}
                  onChange={() => {
                    const newAvailability = filters.availability.includes('same-day')
                      ? filters.availability.filter((a) => a !== 'same-day')
                      : [...filters.availability, 'same-day'];
                    setFilters((prev) => ({ ...prev, availability: newAvailability }));
                  }}
                />
                <span className="checkmark"></span>
                <span className="option-label">Bir kunlik yetkazib berish</span>
              </label>
              <label className="filter-option">
                <input
                  type="checkbox"
                  checked={filters.availability.includes('pickup')}
                  onChange={() => {
                    const newAvailability = filters.availability.includes('pickup')
                      ? filters.availability.filter((a) => a !== 'pickup')
                      : [...filters.availability, 'pickup'];
                    setFilters((prev) => ({ ...prev, availability: newAvailability }));
                  }}
                />
                <span className="checkmark"></span>
                <span className="option-label">Do'kondan olish mumkin</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <div className="active-filters">
          <h5>Faol filterlar:</h5>
          <div className="active-filter-tags">
            {filters.brands.map((brandId) => {
              const brand = availableFilters.brands.find((b) => b.id === brandId);
              return brand ? (
                <span key={brandId} className="filter-tag">
                  {brand.labelUz}
                  <button onClick={() => handleBrandToggle(brandId)}>×</button>
                </span>
              ) : null;
            })}

            {filters.features.map((featureId) => {
              const feature = availableFilters.features.find((f) => f.id === featureId);
              return feature ? (
                <span key={featureId} className="filter-tag">
                  {feature.labelUz}
                  <button onClick={() => handleFeatureToggle(featureId)}>×</button>
                </span>
              ) : null;
            })}

            {(filters.priceRange[0] > 0 || filters.priceRange[1] < 50000000) && (
              <span className="filter-tag">
                {formatPrice(filters.priceRange[0])} - {formatPrice(filters.priceRange[1])} so'm
                <button onClick={() => handlePriceRangeChange([0, 50000000])}>×</button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;
