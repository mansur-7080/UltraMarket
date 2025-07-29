import React, { useState } from 'react';
import CompatibilityChecker, { Component } from '../../components/pc-builder/CompatibilityChecker';

// Qismlari kataloglari
const componentCategories = [
  { id: 'cpu', name: 'Protsessorlar', icon: 'cpu' },
  { id: 'motherboard', name: 'Ona platalar', icon: 'motherboard' },
  { id: 'gpu', name: 'Grafik kartalar', icon: 'gpu' },
  { id: 'ram', name: 'Operativ xotira', icon: 'ram' },
  { id: 'storage', name: 'Xotira qurilmalari', icon: 'storage' },
  { id: 'psu', name: 'Quvvat bloklari', icon: 'psu' },
  { id: 'case', name: 'Korpuslar', icon: 'case' },
  { id: 'cooler', name: 'Sovutish tizimlari', icon: 'cooler' },
];

// Namuna qismlari
const sampleComponents: Component[] = [
  {
    id: 'cpu1',
    name: 'AMD Ryzen 9 5900X',
    type: 'cpu',
    specs: {
      socket: 'AM4',
      cores: 12,
      threads: 24,
      baseFrequency: 3.7,
      boostFrequency: 4.8,
      tdp: 105,
    },
    imageUrl: 'https://via.placeholder.com/150?text=Ryzen+9+5900X',
    price: 449.99,
  },
  {
    id: 'cpu2',
    name: 'Intel Core i9-12900K',
    type: 'cpu',
    specs: {
      socket: 'LGA1700',
      cores: 16,
      threads: 24,
      baseFrequency: 3.2,
      boostFrequency: 5.2,
      tdp: 125,
    },
    imageUrl: 'https://via.placeholder.com/150?text=i9-12900K',
    price: 589.99,
  },
  {
    id: 'mb1',
    name: 'ASUS ROG Strix B550-F Gaming',
    type: 'motherboard',
    specs: {
      socket: 'AM4',
      formFactor: 'ATX',
      chipset: 'B550',
      memorySlots: 4,
      ramType: 'DDR4',
      maxMemory: 128,
    },
    imageUrl: 'https://via.placeholder.com/150?text=B550-F+Gaming',
    price: 189.99,
  },
  {
    id: 'mb2',
    name: 'MSI MPG Z690 EDGE WIFI',
    type: 'motherboard',
    specs: {
      socket: 'LGA1700',
      formFactor: 'ATX',
      chipset: 'Z690',
      memorySlots: 4,
      ramType: 'DDR5',
      maxMemory: 128,
    },
    imageUrl: 'https://via.placeholder.com/150?text=Z690+EDGE+WIFI',
    price: 289.99,
  },
  {
    id: 'gpu1',
    name: 'NVIDIA GeForce RTX 3080',
    type: 'gpu',
    specs: {
      memory: 10,
      memoryType: 'GDDR6X',
      boostClock: 1710,
      powerRequirement: 320,
    },
    imageUrl: 'https://via.placeholder.com/150?text=RTX+3080',
    price: 699.99,
  },
  {
    id: 'ram1',
    name: 'Corsair Vengeance RGB Pro 32GB (2x16GB)',
    type: 'ram',
    specs: {
      type: 'DDR4',
      speed: 3600,
      capacity: 32,
      channels: 2,
    },
    imageUrl: 'https://via.placeholder.com/150?text=Corsair+RGB+Pro',
    price: 149.99,
  },
  {
    id: 'ram2',
    name: 'G.Skill Trident Z5 RGB 32GB (2x16GB)',
    type: 'ram',
    specs: {
      type: 'DDR5',
      speed: 6000,
      capacity: 32,
      channels: 2,
    },
    imageUrl: 'https://via.placeholder.com/150?text=G.Skill+Trident+Z5',
    price: 309.99,
  },
  {
    id: 'storage1',
    name: 'Samsung 970 EVO Plus 1TB NVMe',
    type: 'storage',
    specs: {
      type: 'NVMe SSD',
      capacity: 1000,
      readSpeed: 3500,
      writeSpeed: 3300,
      interface: 'PCIe 3.0 x4',
    },
    imageUrl: 'https://via.placeholder.com/150?text=Samsung+970+EVO',
    price: 119.99,
  },
  {
    id: 'psu1',
    name: 'Corsair RM850x 850W 80+ Gold',
    type: 'psu',
    specs: {
      wattage: 850,
      efficiency: '80+ Gold',
      modular: true,
    },
    imageUrl: 'https://via.placeholder.com/150?text=Corsair+RM850x',
    price: 139.99,
  },
  {
    id: 'case1',
    name: 'Lian Li PC-O11 Dynamic',
    type: 'case',
    specs: {
      formFactor: 'Mid Tower',
      supportedFormFactors: ['ATX', 'Micro-ATX', 'Mini-ITX'],
      dimensions: '445mm x 272mm x 446mm',
    },
    imageUrl: 'https://via.placeholder.com/150?text=Lian+Li+O11',
    price: 149.99,
  },
  {
    id: 'cooler1',
    name: 'NZXT Kraken X63 280mm AIO',
    type: 'cooler',
    specs: {
      type: 'Liquid',
      radiatorSize: 280,
      fans: 2,
      noise: '21-38 dBA',
    },
    imageUrl: 'https://via.placeholder.com/150?text=NZXT+Kraken+X63',
    price: 149.99,
  },
];

const PCBuilderPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedComponents, setSelectedComponents] = useState<
    Partial<Record<Component['type'], Component>>
  >({});
  const [totalPrice, setTotalPrice] = useState(0);

  // Qism qo'shish
  const handleAddComponent = (component: Component) => {
    const updatedComponents = {
      ...selectedComponents,
      [component.type]: component,
    };

    setSelectedComponents(updatedComponents);

    // Umumiy narx hisoblash
    const newTotal = Object.values(updatedComponents).reduce((sum, comp) => sum + comp.price, 0);
    setTotalPrice(newTotal);

    // Kategoriya tanlovini bekor qilish
    setSelectedCategory(null);
  };

  // Qismni o'chirish
  const handleRemoveComponent = (componentType: string) => {
    const updatedComponents = { ...selectedComponents };
    delete updatedComponents[componentType as Component['type']];

    setSelectedComponents(updatedComponents);

    // Umumiy narx hisoblash
    const newTotal = Object.values(updatedComponents).reduce((sum, comp) => sum + comp.price, 0);
    setTotalPrice(newTotal);
  };

  // Tanlangan kategoriyaga mos qismlarni filtrlash
  const filteredComponents = selectedCategory
    ? sampleComponents.filter((comp) => comp.type === selectedCategory)
    : [];

  // Qismni ko'rsatish uchun ikonka tanlash
  const getCategoryIcon = (categoryId: string) => {
    const icons: Record<string, string> = {
      cpu: 'M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z',
      motherboard:
        'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
      gpu: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2',
      ram: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
      storage: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
      psu: 'M13 10V3L4 14h7v7l9-11h-7z',
      case: 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z',
      cooler: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0-11V3m0 0a7 7 0 017 7m-7-7a7 7 0 00-7 7',
    };

    return icons[categoryId] || '';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Kompyuter konfiguratori</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chap panel - qismlar va narx */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tarkibiy qismlar</h2>

            <div className="space-y-4">
              {componentCategories.map((category) => (
                <div
                  key={category.id}
                  className={`p-4 border rounded-lg flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${selectedComponents[category.id as Component['type']] ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg
                        className="h-6 w-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={getCategoryIcon(category.id)}
                        />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-900">{category.name}</h3>
                      {selectedComponents[category.id as Component['type']] ? (
                        <p className="text-xs text-gray-600 line-clamp-1">
                          {selectedComponents[category.id as Component['type']]?.name}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400">Tanlanmagan</p>
                      )}
                    </div>
                  </div>

                  {selectedComponents[category.id as Component['type']] && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveComponent(category.id);
                      }}
                      className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-gray-200"
                    >
                      <svg
                        className="h-5 w-5 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Umumiy:</span>
                <span className="text-lg font-bold text-gray-900">${totalPrice.toFixed(2)}</span>
              </div>

              <button
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
                disabled={Object.keys(selectedComponents).length === 0}
              >
                Savatga qo'shish
              </button>

              <button className="w-full mt-2 bg-white border border-blue-600 text-blue-600 py-3 px-4 rounded-md hover:bg-blue-50 transition-colors">
                Konfiguratsiyani saqlash
              </button>
            </div>
          </div>
        </div>

        {/* O'ng panel - qismlar tanlash yoki mos kelish tekshiruvi */}
        <div className="lg:col-span-2">
          {selectedCategory ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {componentCategories.find((c) => c.id === selectedCategory)?.name} tanlash
                </h2>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredComponents.map((component) => (
                  <div
                    key={component.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-w-1 aspect-h-1 mb-4">
                      <img
                        src={component.imageUrl}
                        alt={component.name}
                        className="w-full h-32 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://via.placeholder.com/150?text=No+Image';
                        }}
                      />
                    </div>

                    <h3 className="text-sm font-medium text-gray-900 mb-1">{component.name}</h3>

                    <div className="mb-3">
                      <ul className="text-xs text-gray-600 space-y-1">
                        {Object.entries(component.specs)
                          .slice(0, 3)
                          .map(([key, value]) => (
                            <li key={key} className="flex justify-between">
                              <span className="capitalize">{key}:</span>
                              <span className="font-medium">{value}</span>
                            </li>
                          ))}
                      </ul>
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      <span className="text-lg font-bold text-gray-900">
                        ${component.price.toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleAddComponent(component)}
                        className="bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700"
                      >
                        Tanlash
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <CompatibilityChecker selectedComponents={selectedComponents} />
          )}
        </div>
      </div>

      {/* Tavsiya etilgan konfiguratsiyalar */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Tavsiya etiladigan konfiguratsiyalar
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Gaming PC */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-40 bg-gradient-to-r from-purple-500 to-blue-600 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <h3 className="text-white text-2xl font-bold">Gaming PC</h3>
              </div>
            </div>
            <div className="p-4">
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex justify-between">
                  <span>CPU:</span>
                  <span className="font-medium">AMD Ryzen 7 5800X</span>
                </li>
                <li className="flex justify-between">
                  <span>GPU:</span>
                  <span className="font-medium">NVIDIA RTX 3070</span>
                </li>
                <li className="flex justify-between">
                  <span>RAM:</span>
                  <span className="font-medium">16GB DDR4 3600MHz</span>
                </li>
                <li className="flex justify-between">
                  <span>Storage:</span>
                  <span className="font-medium">1TB NVMe SSD</span>
                </li>
              </ul>

              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">$1,499.99</span>
                <button className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                  Tanlash
                </button>
              </div>
            </div>
          </div>

          {/* Workstation PC */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-40 bg-gradient-to-r from-green-500 to-teal-600 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <h3 className="text-white text-2xl font-bold">Workstation PC</h3>
              </div>
            </div>
            <div className="p-4">
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex justify-between">
                  <span>CPU:</span>
                  <span className="font-medium">Intel Core i9-12900K</span>
                </li>
                <li className="flex justify-between">
                  <span>GPU:</span>
                  <span className="font-medium">NVIDIA RTX 3080</span>
                </li>
                <li className="flex justify-between">
                  <span>RAM:</span>
                  <span className="font-medium">32GB DDR5 5200MHz</span>
                </li>
                <li className="flex justify-between">
                  <span>Storage:</span>
                  <span className="font-medium">2TB NVMe SSD</span>
                </li>
              </ul>

              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">$2,499.99</span>
                <button className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                  Tanlash
                </button>
              </div>
            </div>
          </div>

          {/* Budget PC */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-40 bg-gradient-to-r from-yellow-500 to-orange-500 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <h3 className="text-white text-2xl font-bold">Iqtisodiy PC</h3>
              </div>
            </div>
            <div className="p-4">
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex justify-between">
                  <span>CPU:</span>
                  <span className="font-medium">Intel Core i5-12400</span>
                </li>
                <li className="flex justify-between">
                  <span>GPU:</span>
                  <span className="font-medium">NVIDIA RTX 3050</span>
                </li>
                <li className="flex justify-between">
                  <span>RAM:</span>
                  <span className="font-medium">16GB DDR4 3200MHz</span>
                </li>
                <li className="flex justify-between">
                  <span>Storage:</span>
                  <span className="font-medium">500GB NVMe SSD</span>
                </li>
              </ul>

              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">$899.99</span>
                <button className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                  Tanlash
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PCBuilderPage;
