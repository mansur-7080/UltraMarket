// Avtomobil qismlari ma'lumotlar bazasi
// Newegg'dagi kabi avtomobil qismlarining mosligini tekshirish uchun

export interface VehicleMake {
  id: string;
  name: string;
  country: string;
  logo: string;
}

export interface VehicleModel {
  id: string;
  makeId: string;
  name: string;
  years: number[];
  bodyTypes: string[];
}

export interface VehicleGeneration {
  id: string;
  modelId: string;
  name: string;
  startYear: number;
  endYear: number;
  image?: string;
}

export interface AutoPart {
  id: string;
  name: string;
  category: string;
  subCategory?: string;
  price: number;
  rating: number;
  reviewCount: number;
  image: string;
  description: string;
  brand: string;
  compatibleVehicles: {
    makeId: string;
    modelId: string;
    generationId?: string;
    years: number[];
  }[];
  fitmentNotes?: string;
  specifications: Record<string, string | number | boolean>;
}

// Avtomobil ishlab chiqaruvchilar ma'lumotlar bazasi
export const vehicleMakes: VehicleMake[] = [
  {
    id: 'toyota',
    name: 'Toyota',
    country: 'Japan',
    logo: 'https://via.placeholder.com/50x30?text=Toyota',
  },
  {
    id: 'honda',
    name: 'Honda',
    country: 'Japan',
    logo: 'https://via.placeholder.com/50x30?text=Honda',
  },
  {
    id: 'chevrolet',
    name: 'Chevrolet',
    country: 'USA',
    logo: 'https://via.placeholder.com/50x30?text=Chevrolet',
  },
  {
    id: 'ford',
    name: 'Ford',
    country: 'USA',
    logo: 'https://via.placeholder.com/50x30?text=Ford',
  },
  {
    id: 'bmw',
    name: 'BMW',
    country: 'Germany',
    logo: 'https://via.placeholder.com/50x30?text=BMW',
  },
  {
    id: 'mercedes',
    name: 'Mercedes-Benz',
    country: 'Germany',
    logo: 'https://via.placeholder.com/50x30?text=Mercedes',
  },
  {
    id: 'hyundai',
    name: 'Hyundai',
    country: 'South Korea',
    logo: 'https://via.placeholder.com/50x30?text=Hyundai',
  },
  {
    id: 'kia',
    name: 'Kia',
    country: 'South Korea',
    logo: 'https://via.placeholder.com/50x30?text=Kia',
  },
];

// Avtomobil modellari ma'lumotlar bazasi (qisqartirilgan)
export const vehicleModels: VehicleModel[] = [
  {
    id: 'camry',
    makeId: 'toyota',
    name: 'Camry',
    years: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    bodyTypes: ['sedan'],
  },
  {
    id: 'corolla',
    makeId: 'toyota',
    name: 'Corolla',
    years: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    bodyTypes: ['sedan', 'hatchback'],
  },
  {
    id: 'rav4',
    makeId: 'toyota',
    name: 'RAV4',
    years: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    bodyTypes: ['suv'],
  },
  {
    id: 'civic',
    makeId: 'honda',
    name: 'Civic',
    years: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    bodyTypes: ['sedan', 'hatchback', 'coupe'],
  },
  {
    id: 'accord',
    makeId: 'honda',
    name: 'Accord',
    years: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    bodyTypes: ['sedan'],
  },
  {
    id: 'cruze',
    makeId: 'chevrolet',
    name: 'Cruze',
    years: [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019],
    bodyTypes: ['sedan', 'hatchback'],
  },
  {
    id: 'malibu',
    makeId: 'chevrolet',
    name: 'Malibu',
    years: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    bodyTypes: ['sedan'],
  },
  {
    id: 'focus',
    makeId: 'ford',
    name: 'Focus',
    years: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018],
    bodyTypes: ['sedan', 'hatchback'],
  },
  {
    id: 'fusion',
    makeId: 'ford',
    name: 'Fusion',
    years: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020],
    bodyTypes: ['sedan'],
  },
];

// Avtomobil generatsiyalari ma'lumotlar bazasi (qisqartirilgan)
export const vehicleGenerations: VehicleGeneration[] = [
  {
    id: 'camry-xv70',
    modelId: 'camry',
    name: 'XV70 (8th gen)',
    startYear: 2017,
    endYear: 2023,
    image: 'https://via.placeholder.com/200x150?text=Camry+XV70',
  },
  {
    id: 'camry-xv50',
    modelId: 'camry',
    name: 'XV50 (7th gen)',
    startYear: 2011,
    endYear: 2017,
    image: 'https://via.placeholder.com/200x150?text=Camry+XV50',
  },
  {
    id: 'corolla-e210',
    modelId: 'corolla',
    name: 'E210 (12th gen)',
    startYear: 2018,
    endYear: 2023,
    image: 'https://via.placeholder.com/200x150?text=Corolla+E210',
  },
  {
    id: 'corolla-e170',
    modelId: 'corolla',
    name: 'E170 (11th gen)',
    startYear: 2012,
    endYear: 2018,
    image: 'https://via.placeholder.com/200x150?text=Corolla+E170',
  },
  {
    id: 'civic-fk8',
    modelId: 'civic',
    name: '10th gen (FK8)',
    startYear: 2016,
    endYear: 2021,
    image: 'https://via.placeholder.com/200x150?text=Civic+10th+gen',
  },
  {
    id: 'civic-fb6',
    modelId: 'civic',
    name: '9th gen (FB6)',
    startYear: 2011,
    endYear: 2016,
    image: 'https://via.placeholder.com/200x150?text=Civic+9th+gen',
  },
];

// Avtomobil qismlari ma'lumotlar bazasi (qisqartirilgan)
export const autoParts: AutoPart[] = [
  {
    id: 'brake-pad-1',
    name: 'Brembo Premium Ceramic Brake Pads',
    category: 'brakes',
    subCategory: 'brake-pads',
    price: 89.99,
    rating: 4.8,
    reviewCount: 128,
    image: 'https://via.placeholder.com/200x150?text=Brembo+Brake+Pads',
    description:
      'Premium ceramic brake pads offering superior stopping power and reduced brake dust.',
    brand: 'Brembo',
    compatibleVehicles: [
      {
        makeId: 'toyota',
        modelId: 'camry',
        generationId: 'camry-xv70',
        years: [2018, 2019, 2020, 2021, 2022, 2023],
      },
      {
        makeId: 'toyota',
        modelId: 'corolla',
        generationId: 'corolla-e210',
        years: [2019, 2020, 2021, 2022, 2023],
      },
      {
        makeId: 'honda',
        modelId: 'civic',
        generationId: 'civic-fk8',
        years: [2016, 2017, 2018, 2019, 2020, 2021],
      },
    ],
    fitmentNotes: 'Fits front wheels only. For rear wheel brake pads, see part BP-R8945',
    specifications: {
      material: 'Ceramic',
      position: 'Front',
      wearIndicator: true,
      hardwareIncluded: true,
      thickness: '15mm',
      breakInPeriod: '500 miles',
    },
  },
  {
    id: 'air-filter-1',
    name: 'K&N High-Performance Air Filter',
    category: 'air-intake',
    subCategory: 'air-filters',
    price: 49.99,
    rating: 4.7,
    reviewCount: 203,
    image: 'https://via.placeholder.com/200x150?text=K%26N+Air+Filter',
    description:
      'Washable and reusable high-flow air filter designed to increase horsepower and acceleration.',
    brand: 'K&N',
    compatibleVehicles: [
      {
        makeId: 'toyota',
        modelId: 'camry',
        generationId: 'camry-xv70',
        years: [2018, 2019, 2020, 2021, 2022, 2023],
      },
      {
        makeId: 'toyota',
        modelId: 'camry',
        generationId: 'camry-xv50',
        years: [2011, 2012, 2013, 2014, 2015, 2016, 2017],
      },
      {
        makeId: 'honda',
        modelId: 'accord',
        years: [2018, 2019, 2020, 2021, 2022, 2023],
      },
    ],
    specifications: {
      type: 'Panel',
      reusable: true,
      washable: true,
      height: '1.75 inches',
      length: '11.25 inches',
      width: '6.875 inches',
      serviceInterval: '50,000 miles',
    },
  },
  {
    id: 'oil-filter-1',
    name: 'Mobil 1 Extended Performance Oil Filter',
    category: 'engine',
    subCategory: 'oil-filters',
    price: 14.99,
    rating: 4.9,
    reviewCount: 317,
    image: 'https://via.placeholder.com/200x150?text=Mobil1+Oil+Filter',
    description:
      'Advanced synthetic fiber filter media for outstanding filtration and extended service life.',
    brand: 'Mobil 1',
    compatibleVehicles: [
      {
        makeId: 'toyota',
        modelId: 'camry',
        years: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022],
      },
      {
        makeId: 'toyota',
        modelId: 'corolla',
        years: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022],
      },
      {
        makeId: 'toyota',
        modelId: 'rav4',
        years: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021],
      },
      {
        makeId: 'honda',
        modelId: 'civic',
        years: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017],
      },
    ],
    specifications: {
      capacity: '15,000 miles',
      filterMedia: 'Synthetic',
      bypassValve: true,
      antiDrainbackValve: true,
      threadSize: '3/4-16 inch',
      gasketIncluded: true,
    },
  },
  {
    id: 'spark-plug-1',
    name: 'NGK Laser Iridium Spark Plugs',
    category: 'ignition',
    subCategory: 'spark-plugs',
    price: 12.99,
    rating: 4.6,
    reviewCount: 175,
    image: 'https://via.placeholder.com/200x150?text=NGK+Spark+Plugs',
    description:
      'Laser iridium spark plugs for superior ignitability, improved throttle response and fuel efficiency.',
    brand: 'NGK',
    compatibleVehicles: [
      {
        makeId: 'toyota',
        modelId: 'camry',
        years: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021],
      },
      {
        makeId: 'honda',
        modelId: 'civic',
        years: [2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020],
      },
      {
        makeId: 'honda',
        modelId: 'accord',
        years: [2013, 2014, 2015, 2016, 2017, 2018, 2019],
      },
      {
        makeId: 'ford',
        modelId: 'focus',
        years: [2012, 2013, 2014, 2015, 2016, 2017, 2018],
      },
    ],
    specifications: {
      type: 'Iridium',
      gapSize: '0.044 inch',
      threadSize: '14mm',
      threadReach: '19mm',
      hexSize: '5/8 inch',
      seatType: 'Gasket',
      resistor: true,
    },
  },
  {
    id: 'wiper-blade-1',
    name: 'Bosch ICON Wiper Blades',
    category: 'exterior',
    subCategory: 'wiper-blades',
    price: 29.99,
    rating: 4.5,
    reviewCount: 240,
    image: 'https://via.placeholder.com/200x150?text=Bosch+ICON+Wipers',
    description:
      'All-weather wiper blades with exclusive FX dual rubber technology for longer life and superior performance.',
    brand: 'Bosch',
    compatibleVehicles: [
      {
        makeId: 'toyota',
        modelId: 'camry',
        years: [2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
      },
      {
        makeId: 'toyota',
        modelId: 'corolla',
        years: [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
      },
      {
        makeId: 'honda',
        modelId: 'civic',
        years: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
      },
      {
        makeId: 'honda',
        modelId: 'accord',
        years: [2018, 2019, 2020, 2021, 2022, 2023],
      },
      {
        makeId: 'ford',
        modelId: 'focus',
        years: [2012, 2013, 2014, 2015, 2016, 2017, 2018],
      },
    ],
    fitmentNotes: 'Driver side: 26", Passenger side: 19"',
    specifications: {
      style: 'Beam',
      material: 'FX dual rubber',
      seasonRating: 'All-weather',
      durability: 'Up to 40% longer life',
      bracketType: 'Universal',
      installation: 'Easy hook adapter system',
    },
  },
];

export const autoPartCategories = [
  { id: 'brakes', name: 'Tormoz tizimlari', icon: 'M7 20l4-16m2 16l4-16M6 9h14M4 15h14' },
  {
    id: 'engine',
    name: 'Dvigatel qismlari',
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    id: 'suspension',
    name: 'Osma tizimi',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  },
  { id: 'electrical', name: 'Elektr tizimi', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  {
    id: 'air-intake',
    name: 'Havo filtrlari',
    icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
  },
  {
    id: 'exhaust',
    name: 'Tutun chiqarish tizimi',
    icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222',
  },
  {
    id: 'exterior',
    name: 'Tashqi qismlar',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    id: 'interior',
    name: 'Ichki qismlar',
    icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2',
  },
  {
    id: 'heating-cooling',
    name: 'Isitish va sovutish',
    icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z',
  },
];

export default {
  vehicleMakes,
  vehicleModels,
  vehicleGenerations,
  autoParts,
  autoPartCategories,
};
