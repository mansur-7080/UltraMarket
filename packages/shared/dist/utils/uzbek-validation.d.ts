/**
 * O'zbekiston uchun validatsiya funksiyalari
 * Uzbek validation utilities
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
/**
 * O'zbek telefon raqamini tekshirish
 * @param phone - Telefon raqami
 * @returns true agar to'g'ri bo'lsa
 */
export declare function validateUzbekPhone(phone: string): boolean;
/**
 * O'zbek telefon raqamini tekshirish (alias)
 * @param phone - Telefon raqami
 * @returns true agar to'g'ri bo'lsa
 */
export declare function validateUzbekPhoneNumber(phone: string): boolean;
/**
 * O'zbek manzilini tekshirish
 * @param address - Manzil obyekti
 * @returns true agar to'g'ri bo'lsa
 */
export declare function validateUzbekAddress(address: any): boolean;
/**
 * O'zbek viloyatini tekshirish
 * @param region - Viloyat nomi
 * @returns true agar to'g'ri bo'lsa
 */
export declare function validateUzbekRegion(region: string): boolean;
/**
 * O'zbek tumanini tekshirish
 * @param district - Tuman nomi
 * @returns true agar to'g'ri bo'lsa
 */
export declare function validateUzbekDistrict(district: string): boolean;
/**
 * O'zbek mahallasini tekshirish
 * @param mahalla - Mahalla nomi
 * @returns true agar to'g'ri bo'lsa
 */
export declare function validateUzbekMahalla(mahalla: string): boolean;
/**
 * O'zbek uy raqamini tekshirish
 * @param house - Uy raqami
 * @returns true agar to'g'ri bo'lsa
 */
export declare function validateUzbekHouse(house: string): boolean;
/**
 * O'zbek xonadon raqamini tekshirish
 * @param apartment - Xonadon raqami
 * @returns true agar to'g'ri bo'lsa
 */
export declare function validateUzbekApartment(apartment: string): boolean;
/**
 * O'zbek pochta indeksini tekshirish
 * @param postalCode - Pochta indeksi
 * @returns true agar to'g'ri bo'lsa
 */
export declare function validateUzbekPostalCode(postalCode: string): boolean;
//# sourceMappingURL=uzbek-validation.d.ts.map