// O'zbekiston manzil tizimi
export interface UzbekAddress {
  id?: string;
  userId?: string;
  type: UzbekAddressType;

  // O'zbekiston uchun manzil maydonlari
  region: string; // Viloyat (Toshkent, Samarqand, va h.k.)
  district: string; // Tuman
  city?: string; // Shahar (ixtiyoriy)
  mahalla?: string; // Mahalla (ixtiyoriy)
  street: string; // Ko'cha nomi
  house: string; // Uy raqami
  apartment?: string; // Xonadon raqami (ixtiyoriy)
  postalCode?: string; // Pochta indeksi (ixtiyoriy)

  // Qo'shimcha ma'lumotlar
  landmark?: string; // Mo'ljal (masalan, "Metro yonida")
  instructions?: string; // Yetkazib berish ko'rsatmalari

  // Meta
  country: 'UZ'; // Har doim O'zbekiston
  isDefault: boolean;
  isActive?: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };

  createdAt?: Date;
  updatedAt?: Date;
}

export enum UzbekAddressType {
  HOME = 'home', // Uy manzili
  WORK = 'work', // Ish manzili
  BILLING = 'billing', // Hisob manzili
  SHIPPING = 'shipping', // Yetkazib berish manzili
}

// O'zbekiston viloyatlari
export enum UzbekRegions {
  TASHKENT_CITY = 'Toshkent shahri',
  TASHKENT = 'Toshkent viloyati',
  SAMARKAND = 'Samarqand',
  BUKHARA = 'Buxoro',
  ANDIJAN = 'Andijon',
  FERGANA = "Farg'ona",
  NAMANGAN = 'Namangan',
  KASHKADARYA = 'Qashqadaryo',
  SURKHANDARYA = 'Surxondaryo',
  KHOREZM = 'Xorazm',
  KARAKALPAKSTAN = "Qoraqalpog'iston",
  NAVOI = 'Navoiy',
  JIZZAKH = 'Jizzax',
  SYRDARYA = 'Sirdaryo',
}

// Manzil validatsiya
export interface UzbekAddressValidation {
  valid: boolean;
  errors: string[];
  suggestions?: UzbekAddress[];
}

// Yetkazib berish zonalari
export interface UzbekDeliveryZone {
  id: string;
  name: string;
  regions: UzbekRegions[];
  deliveryTime: {
    min: number;
    max: number;
    unit: 'hours' | 'days';
  };
  cost: number;
  freeDeliveryThreshold?: number;
  isActive: boolean;
}

// O'zbekiston postal kodlari (asosiy shaharlar)
export const UZBEK_POSTAL_CODES: Record<string, string[]> = {
  [UzbekRegions.TASHKENT_CITY]: ['100000', '100001', '100002', '100003', '100004'],
  [UzbekRegions.SAMARKAND]: ['140100', '140101', '140102', '140103'],
  [UzbekRegions.BUKHARA]: ['200100', '200101', '200102'],
  [UzbekRegions.ANDIJAN]: ['170100', '170101', '170102'],
  [UzbekRegions.FERGANA]: ['150100', '150101', '150102'],
  [UzbekRegions.NAMANGAN]: ['160100', '160101', '160102'],
  // Qolgan viloyatlar...
};

// Address format function
export function formatUzbekAddress(address: UzbekAddress): string {
  const parts = [
    address.region,
    address.district,
    address.city,
    address.mahalla,
    address.street,
    address.house,
    address.apartment ? `kv. ${address.apartment}` : null,
  ].filter(Boolean);

  return parts.join(', ');
}

// Address validation function
export function validateUzbekAddress(address: Partial<UzbekAddress>): UzbekAddressValidation {
  const errors: string[] = [];

  if (!address.region) errors.push('Viloyat majburiy');
  if (!address.district) errors.push('Tuman majburiy');
  if (!address.street) errors.push("Ko'cha nomi majburiy");
  if (!address.house) errors.push('Uy raqami majburiy');

  // Postal code validation (if provided)
  if (address.postalCode && address.region) {
    const validCodes = UZBEK_POSTAL_CODES[address.region as UzbekRegions];
    if (
      validCodes &&
      !validCodes.some((code) => address.postalCode?.startsWith(code.substring(0, 3)))
    ) {
      errors.push("Noto'g'ri pochta indeksi");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
