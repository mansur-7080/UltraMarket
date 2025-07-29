import React, { useState } from 'react';

interface FilterOption {
  id: string;
  label: string;
  checked: boolean;
}

interface FilterGroup {
  id: string;
  title: string;
  options: FilterOption[];
  expanded: boolean;
}

interface PriceRange {
  min: string;
  max: string;
}

interface AdvancedFilterProps {
  onFilterChange: (filters: any) => void;
  category?: string;
}

const AdvancedFilters: React.FC<AdvancedFilterProps> = ({ onFilterChange, category = 'all' }) => {
  // Initial filter state based on category
  const getInitialFilters = (): FilterGroup[] => {
    // This is sample data - in a real implementation, you might fetch this from an API
    switch (category) {
      case 'electronics':
        return [
          {
            id: 'brand',
            title: 'Brand',
            expanded: true,
            options: [
              { id: 'samsung', label: 'Samsung', checked: false },
              { id: 'apple', label: 'Apple', checked: false },
              { id: 'xiaomi', label: 'Xiaomi', checked: false },
              { id: 'huawei', label: 'Huawei', checked: false },
              { id: 'sony', label: 'Sony', checked: false },
            ],
          },
          {
            id: 'ratings',
            title: 'Reyting',
            expanded: true,
            options: [
              { id: '5', label: '5 yulduz', checked: false },
              { id: '4', label: '4+ yulduz', checked: false },
              { id: '3', label: '3+ yulduz', checked: false },
            ],
          },
        ];
      case 'computers':
        return [
          {
            id: 'brand',
            title: 'Brand',
            expanded: true,
            options: [
              { id: 'lenovo', label: 'Lenovo', checked: false },
              { id: 'hp', label: 'HP', checked: false },
              { id: 'dell', label: 'Dell', checked: false },
              { id: 'asus', label: 'Asus', checked: false },
              { id: 'acer', label: 'Acer', checked: false },
            ],
          },
          {
            id: 'processor',
            title: 'Protsessor',
            expanded: true,
            options: [
              { id: 'intel_i9', label: 'Intel Core i9', checked: false },
              { id: 'intel_i7', label: 'Intel Core i7', checked: false },
              { id: 'intel_i5', label: 'Intel Core i5', checked: false },
              { id: 'amd_ryzen9', label: 'AMD Ryzen 9', checked: false },
              { id: 'amd_ryzen7', label: 'AMD Ryzen 7', checked: false },
              { id: 'amd_ryzen5', label: 'AMD Ryzen 5', checked: false },
            ],
          },
          {
            id: 'ram',
            title: 'RAM',
            expanded: true,
            options: [
              { id: '32gb', label: '32 GB va undan yuqori', checked: false },
              { id: '16gb', label: '16 GB', checked: false },
              { id: '8gb', label: '8 GB', checked: false },
            ],
          },
        ];
      default:
        return [
          {
            id: 'brand',
            title: 'Brand',
            expanded: true,
            options: [
              { id: 'samsung', label: 'Samsung', checked: false },
              { id: 'apple', label: 'Apple', checked: false },
              { id: 'xiaomi', label: 'Xiaomi', checked: false },
              { id: 'lenovo', label: 'Lenovo', checked: false },
              { id: 'hp', label: 'HP', checked: false },
              { id: 'dell', label: 'Dell', checked: false },
            ],
          },
          {
            id: 'ratings',
            title: 'Reyting',
            expanded: true,
            options: [
              { id: '5', label: '5 yulduz', checked: false },
              { id: '4', label: '4+ yulduz', checked: false },
              { id: '3', label: '3+ yulduz', checked: false },
            ],
          },
        ];
    }
  };

  const [filters, setFilters] = useState<FilterGroup[]>(getInitialFilters);
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: '', max: '' });
  const [availability, setAvailability] = useState<boolean>(false);

  // Toggle filter group expanded state
  const toggleFilterGroup = (groupId: string) => {
    setFilters(
      filters.map((group) =>
        group.id === groupId ? { ...group, expanded: !group.expanded } : group
      )
    );
  };

  // Handle checkbox change
  const handleCheckboxChange = (groupId: string, optionId: string) => {
    const updatedFilters = filters.map((group) =>
      group.id === groupId
        ? {
            ...group,
            options: group.options.map((option) =>
              option.id === optionId ? { ...option, checked: !option.checked } : option
            ),
          }
        : group
    );

    setFilters(updatedFilters);

    // Trigger callback with updated filters
    const activeFilters = {
      checkboxes: updatedFilters.reduce(
        (acc, group) => {
          acc[group.id] = group.options
            .filter((option) => option.checked)
            .map((option) => option.id);
          return acc;
        },
        {} as Record<string, string[]>
      ),
      price: priceRange,
      availability,
    };

    onFilterChange(activeFilters);
  };

  // Handle price range change
  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    // Only allow numeric input
    if (value !== '' && !/^\d+$/.test(value)) {
      return;
    }

    const updatedPriceRange = {
      ...priceRange,
      [type]: value,
    };

    setPriceRange(updatedPriceRange);

    // Trigger callback with updated filters
    const activeFilters = {
      checkboxes: filters.reduce(
        (acc, group) => {
          acc[group.id] = group.options
            .filter((option) => option.checked)
            .map((option) => option.id);
          return acc;
        },
        {} as Record<string, string[]>
      ),
      price: updatedPriceRange,
      availability,
    };

    onFilterChange(activeFilters);
  };

  // Handle availability toggle
  const handleAvailabilityChange = () => {
    const updatedAvailability = !availability;
    setAvailability(updatedAvailability);

    // Trigger callback with updated filters
    const activeFilters = {
      checkboxes: filters.reduce(
        (acc, group) => {
          acc[group.id] = group.options
            .filter((option) => option.checked)
            .map((option) => option.id);
          return acc;
        },
        {} as Record<string, string[]>
      ),
      price: priceRange,
      availability: updatedAvailability,
    };

    onFilterChange(activeFilters);
  };

  // Reset all filters
  const resetFilters = () => {
    const resetFiltersData = filters.map((group) => ({
      ...group,
      options: group.options.map((option) => ({ ...option, checked: false })),
    }));

    setFilters(resetFiltersData);
    setPriceRange({ min: '', max: '' });
    setAvailability(false);

    // Trigger callback with reset filters
    onFilterChange({
      checkboxes: {},
      price: { min: '', max: '' },
      availability: false,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Filtrlash</h3>
        <button onClick={resetFilters} className="text-sm text-blue-600 hover:text-blue-800">
          Barcha filtrlarni tozalash
        </button>
      </div>

      {/* Price Range Filter */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-2">Narx diapazoni</h4>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Min"
            value={priceRange.min}
            onChange={(e) => handlePriceChange('min', e.target.value)}
            className="w-1/2 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-gray-500">-</span>
          <input
            type="text"
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) => handlePriceChange('max', e.target.value)}
            className="w-1/2 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Availability Filter */}
      <div className="mb-6">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={availability}
            onChange={handleAvailabilityChange}
            className="form-checkbox h-5 w-5 text-blue-600 transition duration-150 rounded border-gray-300"
          />
          <span className="ml-2 text-gray-700">Faqat mavjud mahsulotlar</span>
        </label>
      </div>

      {/* Filter Groups */}
      {filters.map((group) => (
        <div key={group.id} className="mb-6 border-t pt-4">
          <div
            className="flex justify-between items-center mb-2 cursor-pointer"
            onClick={() => toggleFilterGroup(group.id)}
          >
            <h4 className="font-medium text-gray-700">{group.title}</h4>
            <button className="text-gray-500">
              {group.expanded ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
            </button>
          </div>

          {group.expanded && (
            <div className="space-y-2 mt-2">
              {group.options.map((option) => (
                <label key={option.id} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={option.checked}
                    onChange={() => handleCheckboxChange(group.id, option.id)}
                    className="form-checkbox h-5 w-5 text-blue-600 transition duration-150 rounded border-gray-300"
                  />
                  <span className="ml-2 text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}

      <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200">
        Filtrlash
      </button>
    </div>
  );
};

export default AdvancedFilters;
