"use strict";
/**
 * UltraMarket Constants
 * O'zbekiston uchun maxsus konstantalar
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UZBEK_TIMEZONE = exports.UZBEK_LANGUAGE = exports.UZBEK_CURRENCY = exports.UZBEK_POSTAL_CODE_REGEX = exports.UZBEK_PHONE_REGEX = exports.UzbekAddressType = exports.UzbekRegion = exports.UzbekPaymentMethod = void 0;
var UzbekPaymentMethod;
(function (UzbekPaymentMethod) {
    UzbekPaymentMethod["PAYME"] = "PAYME";
    UzbekPaymentMethod["CLICK"] = "CLICK";
    UzbekPaymentMethod["UZCARD"] = "UZCARD";
    UzbekPaymentMethod["HUMO"] = "HUMO";
    UzbekPaymentMethod["CASH"] = "CASH";
    UzbekPaymentMethod["BANK_TRANSFER"] = "BANK_TRANSFER";
    UzbekPaymentMethod["WALLET"] = "WALLET";
})(UzbekPaymentMethod || (exports.UzbekPaymentMethod = UzbekPaymentMethod = {}));
var UzbekRegion;
(function (UzbekRegion) {
    UzbekRegion["TASHKENT"] = "Toshkent shahri";
    UzbekRegion["TASHKENT_REGION"] = "Toshkent viloyati";
    UzbekRegion["ANDIJAN"] = "Andijon viloyati";
    UzbekRegion["BUKHARA"] = "Buxoro viloyati";
    UzbekRegion["FERGANA"] = "Farg'ona viloyati";
    UzbekRegion["JIZZAKH"] = "Jizzax viloyati";
    UzbekRegion["KASHKADARYA"] = "Qashqadaryo viloyati";
    UzbekRegion["NAVOIY"] = "Navoiy viloyati";
    UzbekRegion["NAMANGAN"] = "Namangan viloyati";
    UzbekRegion["SAMARKAND"] = "Samarqand viloyati";
    UzbekRegion["SURKHANDARYA"] = "Surxondaryo viloyati";
    UzbekRegion["SYRDARYA"] = "Sirdaryo viloyati";
    UzbekRegion["KARAKALPAKSTAN"] = "Qoraqalpog'iston Respublikasi";
})(UzbekRegion || (exports.UzbekRegion = UzbekRegion = {}));
var UzbekAddressType;
(function (UzbekAddressType) {
    UzbekAddressType["HOME"] = "HOME";
    UzbekAddressType["WORK"] = "WORK";
    UzbekAddressType["OTHER"] = "OTHER";
})(UzbekAddressType || (exports.UzbekAddressType = UzbekAddressType = {}));
exports.UZBEK_PHONE_REGEX = /^\+998[0-9]{9}$/;
exports.UZBEK_POSTAL_CODE_REGEX = /^[0-9]{6}$/;
exports.UZBEK_CURRENCY = {
    CODE: 'UZS',
    SYMBOL: '₸',
    NAME: 'O\'zbek so\'mi'
};
exports.UZBEK_LANGUAGE = {
    CODE: 'uz',
    NAME: 'O\'zbekcha',
    NATIVE_NAME: 'O\'zbekcha'
};
exports.UZBEK_TIMEZONE = 'Asia/Tashkent';
//# sourceMappingURL=index.js.map