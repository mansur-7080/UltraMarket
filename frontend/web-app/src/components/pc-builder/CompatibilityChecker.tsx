import React, { useState } from 'react';

export interface Component {
  id: string;
  name: string;
  type: 'cpu' | 'motherboard' | 'gpu' | 'ram' | 'storage' | 'psu' | 'case' | 'cooler';
  specs: Record<string, string | number | boolean>;
  compatibleWith?: {
    type: string;
    condition: string;
    value: string | number | boolean;
  }[];
  imageUrl: string;
  price: number;
}

interface CompatibilityCheckerProps {
  selectedComponents: Partial<Record<Component['type'], Component>>;
  onAddComponent?: (component: Component) => void;
}

// Compatibility rules
const compatibilityRules = {
  cpu_motherboard: (cpu: Component, motherboard: Component) => {
    // Check socket compatibility
    if (cpu.specs.socket !== motherboard.specs.socket) {
      return {
        isCompatible: false,
        message: `CPU socketi (${cpu.specs.socket}) motherboard socketi (${motherboard.specs.socket}) bilan mos kelmaydi.`,
      };
    }
    return { isCompatible: true, message: 'CPU va motherboard mos keladi.' };
  },

  ram_motherboard: (ram: Component, motherboard: Component) => {
    // Check RAM type compatibility
    if (ram.specs.type !== motherboard.specs.ramType) {
      return {
        isCompatible: false,
        message: `RAM turi (${ram.specs.type}) motherboard qo'llab-quvvatlaydigan tur (${motherboard.specs.ramType}) bilan mos kelmaydi.`,
      };
    }
    return { isCompatible: true, message: 'RAM va motherboard mos keladi.' };
  },

  gpu_psu: (gpu: Component, psu: Component) => {
    // Check if PSU has enough power for GPU
    const gpuPower = Number(gpu.specs.powerRequirement || 0);
    const psuPower = Number(psu.specs.wattage || 0);

    if (gpuPower > psuPower * 0.65) {
      // Rule of thumb: GPU should use no more than 65% of PSU power
      return {
        isCompatible: false,
        message: `GPU uchun yetarli quvvat yo'q. GPU ${gpuPower}W talab qiladi, PSU ${psuPower}W ta'minlaydi.`,
      };
    }
    return { isCompatible: true, message: 'GPU va PSU mos keladi.' };
  },

  case_motherboard: (pcCase: Component, motherboard: Component) => {
    // Check form factor compatibility
    if (
      pcCase.specs.supportedFormFactors &&
      Array.isArray(pcCase.specs.supportedFormFactors) &&
      !pcCase.specs.supportedFormFactors.includes(motherboard.specs.formFactor)
    ) {
      return {
        isCompatible: false,
        message: `Korpus motherboard form faktorini (${motherboard.specs.formFactor}) qo'llab-quvvatlamaydi.`,
      };
    }
    return { isCompatible: true, message: 'Korpus va motherboard mos keladi.' };
  },
};

const CompatibilityChecker: React.FC<CompatibilityCheckerProps> = ({ selectedComponents }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Check compatibility between all selected components
  const checkCompatibility = () => {
    const issues: { pair: string; message: string }[] = [];

    // CPU and Motherboard compatibility
    if (selectedComponents.cpu && selectedComponents.motherboard) {
      const result = compatibilityRules.cpu_motherboard(
        selectedComponents.cpu,
        selectedComponents.motherboard
      );
      if (!result.isCompatible) {
        issues.push({
          pair: 'CPU va Motherboard',
          message: result.message,
        });
      }
    }

    // RAM and Motherboard compatibility
    if (selectedComponents.ram && selectedComponents.motherboard) {
      const result = compatibilityRules.ram_motherboard(
        selectedComponents.ram,
        selectedComponents.motherboard
      );
      if (!result.isCompatible) {
        issues.push({
          pair: 'RAM va Motherboard',
          message: result.message,
        });
      }
    }

    // GPU and PSU compatibility
    if (selectedComponents.gpu && selectedComponents.psu) {
      const result = compatibilityRules.gpu_psu(selectedComponents.gpu, selectedComponents.psu);
      if (!result.isCompatible) {
        issues.push({
          pair: 'GPU va PSU',
          message: result.message,
        });
      }
    }

    // Case and Motherboard compatibility
    if (selectedComponents.case && selectedComponents.motherboard) {
      const result = compatibilityRules.case_motherboard(
        selectedComponents.case,
        selectedComponents.motherboard
      );
      if (!result.isCompatible) {
        issues.push({
          pair: 'Korpus va Motherboard',
          message: result.message,
        });
      }
    }

    return {
      isCompatible: issues.length === 0,
      issues,
    };
  };

  const compatibilityResult = checkCompatibility();
  const selectedComponentCount = Object.keys(selectedComponents).length;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Komponentlar mosligini tekshirish</h2>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center ${compatibilityResult.isCompatible ? 'bg-green-100' : 'bg-red-100'}`}
            >
              {compatibilityResult.isCompatible ? (
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              )}
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium">
                {compatibilityResult.isCompatible
                  ? 'Barcha tanlangan komponentlar mos keladi'
                  : `${compatibilityResult.issues.length} ta moslik muammosi topildi`}
              </h3>
              <p className="text-sm text-gray-500">
                {selectedComponentCount} ta komponent tanlangan
              </p>
            </div>
          </div>

          {compatibilityResult.issues.length > 0 && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
            >
              {showDetails ? 'Tafsilotlarni yashirish' : "Tafsilotlarni ko'rsatish"}
            </button>
          )}
        </div>

        {compatibilityResult.issues.length > 0 && showDetails && (
          <div className="bg-red-50 rounded-md p-4 border border-red-100">
            <h4 className="font-medium text-red-700 mb-2">Moslik muammolari:</h4>
            <ul className="space-y-2">
              {compatibilityResult.issues.map((issue, index) => (
                <li key={index} className="flex items-start">
                  <svg
                    className="h-5 w-5 text-red-500 mt-0.5 mr-2"
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
                  <div>
                    <span className="font-medium">{issue.pair}:</span> {issue.message}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(selectedComponents).map(([type, component]) => (
          <div key={type} className="bg-gray-50 rounded-md p-4 border border-gray-200">
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
            <h3 className="text-sm font-medium mb-1 capitalize">{type}</h3>
            <p className="text-xs text-gray-600 line-clamp-2">{component.name}</p>
            <p className="text-sm font-bold mt-1">${component.price.toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-medium mb-2">Sizga foydali bo'lishi mumkin:</h3>
        <ul className="space-y-2">
          <li className="flex items-center">
            <svg
              className="h-5 w-5 text-blue-500 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm">
              PC qismlari tanlashda, avval protsessor (CPU) va motherboard mosligini tekshiring
            </span>
          </li>
          <li className="flex items-center">
            <svg
              className="h-5 w-5 text-blue-500 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm">
              GPU uchun tavsiya etilgan PSU quvvatini yoki xotirani tekshiring
            </span>
          </li>
          <li className="flex items-center">
            <svg
              className="h-5 w-5 text-blue-500 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm">
              Korpus o'lchamini motherboard form faktoriga mosligini tekshiring
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CompatibilityChecker;
