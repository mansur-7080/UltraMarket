"use strict";
/**
 * O'zbekiston manzil turlari
 * Uzbek address types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UZBEK_POSTAL_CODES = exports.UzbekRegions = void 0;
exports.formatUzbekAddress = formatUzbekAddress;
exports.validateUzbekAddress = validateUzbekAddress;
// O'zbekiston viloyatlari
var UzbekRegions;
(function (UzbekRegions) {
    UzbekRegions["TASHKENT_CITY"] = "Toshkent shahri";
    UzbekRegions["TASHKENT"] = "Toshkent viloyati";
    UzbekRegions["SAMARKAND"] = "Samarqand";
    UzbekRegions["BUKHARA"] = "Buxoro";
    UzbekRegions["ANDIJAN"] = "Andijon";
    UzbekRegions["FERGANA"] = "Farg'ona";
    UzbekRegions["NAMANGAN"] = "Namangan";
    UzbekRegions["KASHKADARYA"] = "Qashqadaryo";
    UzbekRegions["SURKHANDARYA"] = "Surxondaryo";
    UzbekRegions["KHOREZM"] = "Xorazm";
    UzbekRegions["KARAKALPAKSTAN"] = "Qoraqalpog'iston";
    UzbekRegions["NAVOI"] = "Navoiy";
    UzbekRegions["JIZZAKH"] = "Jizzax";
    UzbekRegions["SYRDARYA"] = "Sirdaryo";
})(UzbekRegions || (exports.UzbekRegions = UzbekRegions = {}));
// O'zbekiston postal kodlari (asosiy shaharlar)
exports.UZBEK_POSTAL_CODES = {
    [UzbekRegions.TASHKENT_CITY]: ['100000', '100001', '100002', '100003', '100004'],
    [UzbekRegions.SAMARKAND]: ['140100', '140101', '140102', '140103'],
    [UzbekRegions.BUKHARA]: ['200100', '200101', '200102'],
    [UzbekRegions.ANDIJAN]: ['170100', '170101', '170102'],
    [UzbekRegions.FERGANA]: ['150100', '150101', '150102'],
    [UzbekRegions.NAMANGAN]: ['160100', '160101', '160102'],
    // Qolgan viloyatlar...
};
// Address format function
function formatUzbekAddress(address) {
    const parts = [
        address.region,
        address.district,
        // address.city, // city property removed
        address.mahalla,
        address.street,
        address.house,
        address.apartment ? `kv. ${address.apartment}` : null,
    ].filter(Boolean);
    return parts.join(', ');
}
// Address validation function
function validateUzbekAddress(address) {
    const errors = [];
    if (!address.region)
        errors.push('Viloyat majburiy');
    if (!address.district)
        errors.push('Tuman majburiy');
    if (!address.street)
        errors.push("Ko'cha nomi majburiy");
    if (!address.house)
        errors.push('Uy raqami majburiy');
    // Postal code validation (if provided)
    if (address.postalCode && address.region) {
        const validCodes = exports.UZBEK_POSTAL_CODES[address.region];
        if (validCodes &&
            !validCodes.some((code) => address.postalCode?.startsWith(code.substring(0, 3)))) {
            errors.push("Noto'g'ri pochta indeksi");
        }
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
//# sourceMappingURL=uzbek-address.js.map