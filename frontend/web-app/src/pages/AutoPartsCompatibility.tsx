import React, { useState, useEffect } from 'react';
import {
  vehicleMakes,
  vehicleModels,
  vehicleGenerations,
  autoParts,
  autoPartCategories,
} from '../../data/autoPartsDatabase';

const AutoPartsCompatibility: React.FC = () => {
  const [selectedMake, setSelectedMake] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedGeneration, setSelectedGeneration] = useState<string>('');
  const [filteredModels, setFilteredModels] = useState(vehicleModels);
  const [filteredGenerations, setFilteredGenerations] = useState(vehicleGenerations);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [compatibleParts, setCompatibleParts] = useState<typeof autoParts>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Filter models when make changes
  useEffect(() => {
    if (selectedMake) {
      const models = vehicleModels.filter((model) => model.makeId === selectedMake);
      setFilteredModels(models);
      setSelectedModel('');
      setSelectedYear(null);
      setSelectedGeneration('');
      setCompatibleParts([]);
    } else {
      setFilteredModels([]);
      setSelectedModel('');
      setSelectedYear(null);
      setSelectedGeneration('');
      setCompatibleParts([]);
    }
  }, [selectedMake]);

  // Filter generations and set available years when model changes
  useEffect(() => {
    if (selectedModel) {
      const generations = vehicleGenerations.filter((gen) => gen.modelId === selectedModel);
      setFilteredGenerations(generations);

      const model = vehicleModels.find((m) => m.id === selectedModel);
      if (model) {
        setAvailableYears(model.years);
      } else {
        setAvailableYears([]);
      }

      setSelectedYear(null);
      setSelectedGeneration('');
      setCompatibleParts([]);
    } else {
      setFilteredGenerations([]);
      setAvailableYears([]);
      setSelectedYear(null);
      setSelectedGeneration('');
      setCompatibleParts([]);
    }
  }, [selectedModel]);

  // Filter parts when all selections are made
  useEffect(() => {
    if (selectedMake && selectedModel && selectedYear) {
      const filtered = autoParts.filter((part) => {
        return part.compatibleVehicles.some((vehicle) => {
          // Check make and model match
          const makeModelMatch =
            vehicle.makeId === selectedMake && vehicle.modelId === selectedModel;

          // Check if generation matches if one is selected
          const generationMatch =
            !selectedGeneration || vehicle.generationId === selectedGeneration;

          // Check if year is in compatible years
          const yearMatch = vehicle.years.includes(selectedYear);

          // Check if category matches if one is selected
          const categoryMatch = !selectedCategory || part.category === selectedCategory;

          // Filter by search query if provided
          const searchMatch =
            !searchQuery ||
            part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            part.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            part.brand.toLowerCase().includes(searchQuery.toLowerCase());

          return makeModelMatch && generationMatch && yearMatch && categoryMatch && searchMatch;
        });
      });

      setCompatibleParts(filtered);
    } else {
      setCompatibleParts([]);
    }
  }, [
    selectedMake,
    selectedModel,
    selectedYear,
    selectedGeneration,
    selectedCategory,
    searchQuery,
  ]);

  const handleSearch = () => {
    setIsSearching(true);
    // The actual search is handled by the useEffect hook above
    setTimeout(() => setIsSearching(false), 500);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Avtomobil qismlari mosligini tekshirish
      </h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Avtomobil modelini tanlang</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Ishlab chiqaruvchi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ishlab chiqaruvchi
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={selectedMake}
              onChange={(e) => setSelectedMake(e.target.value)}
            >
              <option value="">Tanlang...</option>
              {vehicleMakes.map((make) => (
                <option key={make.id} value={make.id}>
                  {make.name}
                </option>
              ))}
            </select>
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={!selectedMake}
            >
              <option value="">Tanlang...</option>
              {filteredModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Yil</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={selectedYear || ''}
              onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)}
              disabled={!selectedModel}
            >
              <option value="">Tanlang...</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Generation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Generatsiya</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={selectedGeneration}
              onChange={(e) => setSelectedGeneration(e.target.value)}
              disabled={!selectedModel || filteredGenerations.length === 0}
            >
              <option value="">Barcha generatsiyalar</option>
              {filteredGenerations.map((gen) => (
                <option key={gen.id} value={gen.id}>
                  {gen.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search and Category filters */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Qidiruv</label>
            <div className="relative rounded-md shadow-sm">
              <input
                type="text"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-4 pr-12 sm:text-sm border-gray-300 rounded-md"
                placeholder="Qism nomini yoki brend nomini kiriting..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                  onClick={handleSearch}
                >
                  {isSearching ? (
                    <span className="inline-block animate-spin">⟳</span>
                  ) : (
                    <span>Qidirish</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategoriya</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Barcha kategoriyalar</option>
              {autoPartCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Vehicle display when selected */}
      {selectedMake && selectedModel && selectedYear && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tanlangan avtomobil</h2>

          <div className="flex flex-col md:flex-row items-center">
            <div className="mb-4 md:mb-0 md:mr-8 flex-shrink-0">
              {selectedGeneration &&
              filteredGenerations.find((gen) => gen.id === selectedGeneration)?.image ? (
                <img
                  src={filteredGenerations.find((gen) => gen.id === selectedGeneration)?.image}
                  alt="Vehicle"
                  className="w-40 h-auto object-contain"
                />
              ) : (
                <div className="w-40 h-32 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">Rasm mavjud emas</span>
                </div>
              )}
            </div>

            <div className="flex-grow">
              <h3 className="text-lg font-medium text-gray-900">
                {vehicleMakes.find((make) => make.id === selectedMake)?.name}{' '}
                {vehicleModels.find((model) => model.id === selectedModel)?.name} {selectedYear}
              </h3>

              {selectedGeneration && (
                <p className="text-sm text-gray-600 mb-2">
                  Generatsiya:{' '}
                  {filteredGenerations.find((gen) => gen.id === selectedGeneration)?.name}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {selectedMake && (
                  <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    <img
                      src={vehicleMakes.find((make) => make.id === selectedMake)?.logo}
                      alt={vehicleMakes.find((make) => make.id === selectedMake)?.name}
                      className="h-4 w-auto mr-1"
                    />
                    {vehicleMakes.find((make) => make.id === selectedMake)?.name}
                  </span>
                )}

                {vehicleModels
                  .find((model) => model.id === selectedModel)
                  ?.bodyTypes.map((type) => (
                    <span
                      key={type}
                      className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800"
                    >
                      {type === 'sedan' && 'Sedan'}
                      {type === 'suv' && 'SUV'}
                      {type === 'hatchback' && 'Hetchbek'}
                      {type === 'coupe' && 'Kupe'}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compatible parts section */}
      {compatibleParts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Mos keladigan qismlar ({compatibleParts.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {compatibleParts.map((part) => (
              <div key={part.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4">
                  <div className="aspect-w-16 aspect-h-9 mb-4">
                    <img src={part.image} alt={part.name} className="w-full h-40 object-contain" />
                  </div>

                  <h3 className="text-lg font-medium text-gray-900 mb-1">{part.name}</h3>

                  <div className="flex items-center mb-2">
                    <div className="flex items-center">
                      <span className="text-yellow-400 text-xs">★</span>
                      <span className="ml-1 text-xs text-gray-600">
                        {part.rating} ({part.reviewCount} sharhlar)
                      </span>
                    </div>
                    <span className="mx-2 text-gray-300">|</span>
                    <span className="text-xs text-gray-600">Brend: {part.brand}</span>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{part.description}</p>

                  {part.fitmentNotes && (
                    <div className="mb-4 px-3 py-2 bg-blue-50 rounded-md">
                      <p className="text-xs text-blue-700">{part.fitmentNotes}</p>
                    </div>
                  )}

                  {/* Specifications */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Xususiyatlar:</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {Object.entries(part.specifications)
                        .slice(0, 3)
                        .map(([key, value]) => (
                          <li key={key} className="flex justify-between">
                            <span className="capitalize">{key}:</span>
                            <span className="font-medium">{value.toString()}</span>
                          </li>
                        ))}
                    </ul>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">
                      ${part.price.toFixed(2)}
                    </span>
                    <button className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                      Savatga qo'shish
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state when no parts found */}
      {selectedMake && selectedModel && selectedYear && compatibleParts.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 mb-8 text-center">
          <div className="mx-auto h-20 w-20 text-gray-400 mb-4">
            <svg
              className="h-full w-full"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Mos keladigan qismlar topilmadi
          </h3>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            Boshqa model, yil yoki kategoriya tanlashga harakat qiling. Yoki biz bilan bog'laning va
            biz sizga yordam beramiz.
          </p>
        </div>
      )}

      {/* Popular categories */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Ommabop kategoriyalar</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {autoPartCategories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
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
                      d={category.icon}
                    />
                  </svg>
                </div>
                <h3 className="ml-3 text-sm font-medium text-gray-900">{category.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Help section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Qism tanlashda yordam kerakmi?</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mb-4">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Qo'llanma</h3>
            <p className="text-sm text-gray-600">
              Qismlarni qanday tanlash va moslikni tekshirish bo'yicha qo'llanmalarimizni o'qing.
            </p>
            <a
              href="#"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium block mt-2"
            >
              Qo'llanmani ko'rish
            </a>
          </div>

          <div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mb-4">
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
                  d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Onlayn yordam</h3>
            <p className="text-sm text-gray-600">
              Mutaxassislar bilan suhbatlashing va to'g'ri qismlarni tanlash bo'yicha maslahat
              oling.
            </p>
            <a
              href="#"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium block mt-2"
            >
              Chatni boshlash
            </a>
          </div>

          <div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mb-4">
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
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Qo'ng'iroq qiling</h3>
            <p className="text-sm text-gray-600">
              Bizning avtomobil qismlari bo'yicha mutaxassislarimizga qo'ng'iroq qiling.
            </p>
            <a
              href="tel:+998901234567"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium block mt-2"
            >
              +998 90 123 45 67
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoPartsCompatibility;
