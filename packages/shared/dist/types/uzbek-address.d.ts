/**
 * O'zbekiston manzil turlari
 * Uzbek address types
 */
export interface UzbekAddressType {
    type: 'HOME' | 'WORK' | 'OTHER';
    region: string;
    district: string;
    mahalla?: string;
    street: string;
    house: string;
    apartment?: string;
    postalCode?: string;
    landmark?: string;
    deliveryInstructions?: string;
}
export interface UzbekAddress {
    id?: string;
    userId?: string;
    type: UzbekAddressType['type'];
    region: string;
    district: string;
    mahalla?: string;
    street: string;
    house: string;
    apartment?: string;
    postalCode?: string;
    landmark?: string;
    deliveryInstructions?: string;
    isDefault?: boolean;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface UzbekAddressCreateRequest {
    type: UzbekAddressType['type'];
    region: string;
    district: string;
    mahalla?: string;
    street: string;
    house: string;
    apartment?: string;
    postalCode?: string;
    landmark?: string;
    deliveryInstructions?: string;
    isDefault?: boolean;
}
export interface UzbekAddressUpdateRequest {
    type?: UzbekAddressType['type'];
    region?: string;
    district?: string;
    mahalla?: string;
    street?: string;
    house?: string;
    apartment?: string;
    postalCode?: string;
    landmark?: string;
    deliveryInstructions?: string;
    isDefault?: boolean;
    isActive?: boolean;
}
export declare enum UzbekRegions {
    TASHKENT_CITY = "Toshkent shahri",
    TASHKENT = "Toshkent viloyati",
    SAMARKAND = "Samarqand",
    BUKHARA = "Buxoro",
    ANDIJAN = "Andijon",
    FERGANA = "Farg'ona",
    NAMANGAN = "Namangan",
    KASHKADARYA = "Qashqadaryo",
    SURKHANDARYA = "Surxondaryo",
    KHOREZM = "Xorazm",
    KARAKALPAKSTAN = "Qoraqalpog'iston",
    NAVOI = "Navoiy",
    JIZZAKH = "Jizzax",
    SYRDARYA = "Sirdaryo"
}
export interface UzbekAddressValidation {
    valid: boolean;
    errors: string[];
    suggestions?: UzbekAddress[];
}
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
export declare const UZBEK_POSTAL_CODES: Record<string, string[]>;
export declare function formatUzbekAddress(address: UzbekAddress): string;
export declare function validateUzbekAddress(address: Partial<UzbekAddress>): UzbekAddressValidation;
//# sourceMappingURL=uzbek-address.d.ts.map