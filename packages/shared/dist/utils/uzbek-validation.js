"use strict";
/**
 * O'zbekiston uchun validatsiya funksiyalari
 * Uzbek validation utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUzbekPhone = validateUzbekPhone;
exports.validateUzbekPhoneNumber = validateUzbekPhoneNumber;
exports.validateUzbekAddress = validateUzbekAddress;
exports.validateUzbekRegion = validateUzbekRegion;
exports.validateUzbekDistrict = validateUzbekDistrict;
exports.validateUzbekMahalla = validateUzbekMahalla;
exports.validateUzbekHouse = validateUzbekHouse;
exports.validateUzbekApartment = validateUzbekApartment;
exports.validateUzbekPostalCode = validateUzbekPostalCode;
// Local constants to avoid import issues
const UZBEK_PHONE_REGEX = /^\+998[0-9]{9}$/;
const UZBEK_POSTAL_CODE_REGEX = /^[0-9]{6}$/;
/**
 * O'zbek telefon raqamini tekshirish
 * @param phone - Telefon raqami
 * @returns true agar to'g'ri bo'lsa
 */
function validateUzbekPhone(phone) {
    if (!phone || typeof phone !== 'string') {
        return false;
    }
    return UZBEK_PHONE_REGEX.test(phone.trim());
}
/**
 * O'zbek telefon raqamini tekshirish (alias)
 * @param phone - Telefon raqami
 * @returns true agar to'g'ri bo'lsa
 */
function validateUzbekPhoneNumber(phone) {
    return validateUzbekPhone(phone);
}
/**
 * O'zbek manzilini tekshirish
 * @param address - Manzil obyekti
 * @returns true agar to'g'ri bo'lsa
 */
function validateUzbekAddress(address) {
    if (!address || typeof address !== 'object') {
        return false;
    }
    const requiredFields = ['type', 'region', 'district', 'street', 'house'];
    // Majburiy maydonlarni tekshirish
    for (const field of requiredFields) {
        if (!address[field] || typeof address[field] !== 'string') {
            return false;
        }
    }
    // Manzil turini tekshirish
    if (!['HOME', 'WORK', 'OTHER'].includes(address.type)) {
        return false;
    }
    // Pochta indeksini tekshirish (agar mavjud bo'lsa)
    if (address.postalCode && !UZBEK_POSTAL_CODE_REGEX.test(address.postalCode)) {
        return false;
    }
    return true;
}
/**
 * O'zbek viloyatini tekshirish
 * @param region - Viloyat nomi
 * @returns true agar to'g'ri bo'lsa
 */
function validateUzbekRegion(region) {
    const validRegions = [
        'Toshkent shahri',
        'Toshkent viloyati',
        'Andijon viloyati',
        'Buxoro viloyati',
        'Farg\'ona viloyati',
        'Jizzax viloyati',
        'Qashqadaryo viloyati',
        'Navoiy viloyati',
        'Namangan viloyati',
        'Samarqand viloyati',
        'Surxondaryo viloyati',
        'Sirdaryo viloyati',
        'Qoraqalpog\'iston Respublikasi'
    ];
    return validRegions.includes(region);
}
/**
 * O'zbek tumanini tekshirish
 * @param district - Tuman nomi
 * @returns true agar to'g'ri bo'lsa
 */
function validateUzbekDistrict(district) {
    if (!district || typeof district !== 'string') {
        return false;
    }
    // Tuman nomi kamida 2 belgidan iborat bo'lishi kerak
    return district.trim().length >= 2;
}
/**
 * O'zbek mahallasini tekshirish
 * @param mahalla - Mahalla nomi
 * @returns true agar to'g'ri bo'lsa
 */
function validateUzbekMahalla(mahalla) {
    if (!mahalla || typeof mahalla !== 'string') {
        return false;
    }
    // Mahalla nomi kamida 2 belgidan iborat bo'lishi kerak
    return mahalla.trim().length >= 2;
}
/**
 * O'zbek uy raqamini tekshirish
 * @param house - Uy raqami
 * @returns true agar to'g'ri bo'lsa
 */
function validateUzbekHouse(house) {
    if (!house || typeof house !== 'string') {
        return false;
    }
    // Uy raqami kamida 1 belgidan iborat bo'lishi kerak
    return house.trim().length >= 1;
}
/**
 * O'zbek xonadon raqamini tekshirish
 * @param apartment - Xonadon raqami
 * @returns true agar to'g'ri bo'lsa
 */
function validateUzbekApartment(apartment) {
    if (!apartment || typeof apartment !== 'string') {
        return false;
    }
    // Xonadon raqami kamida 1 belgidan iborat bo'lishi kerak
    return apartment.trim().length >= 1;
}
/**
 * O'zbek pochta indeksini tekshirish
 * @param postalCode - Pochta indeksi
 * @returns true agar to'g'ri bo'lsa
 */
function validateUzbekPostalCode(postalCode) {
    if (!postalCode || typeof postalCode !== 'string') {
        return false;
    }
    return UZBEK_POSTAL_CODE_REGEX.test(postalCode.trim());
}
//# sourceMappingURL=uzbek-validation.js.map