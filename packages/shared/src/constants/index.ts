/**
 * UltraMarket Constants
 * O'zbekiston uchun maxsus konstantalar
 */

export enum UzbekPaymentMethod {
  PAYME = 'PAYME',
  CLICK = 'CLICK',
  UZCARD = 'UZCARD',
  HUMO = 'HUMO',
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  WALLET = 'WALLET'
}

export enum UzbekRegion {
  TASHKENT = 'Toshkent shahri',
  TASHKENT_REGION = 'Toshkent viloyati',
  ANDIJAN = 'Andijon viloyati',
  BUKHARA = 'Buxoro viloyati',
  FERGANA = 'Farg\'ona viloyati',
  JIZZAKH = 'Jizzax viloyati',
  KASHKADARYA = 'Qashqadaryo viloyati',
  NAVOIY = 'Navoiy viloyati',
  NAMANGAN = 'Namangan viloyati',
  SAMARKAND = 'Samarqand viloyati',
  SURKHANDARYA = 'Surxondaryo viloyati',
  SYRDARYA = 'Sirdaryo viloyati',
  KARAKALPAKSTAN = 'Qoraqalpog\'iston Respublikasi'
}

export enum UzbekAddressType {
  HOME = 'HOME',
  WORK = 'WORK',
  OTHER = 'OTHER'
}

export const UZBEK_PHONE_REGEX = /^\+998[0-9]{9}$/;
export const UZBEK_POSTAL_CODE_REGEX = /^[0-9]{6}$/;

export const UZBEK_CURRENCY = {
  CODE: 'UZS',
  SYMBOL: '₸',
  NAME: 'O\'zbek so\'mi'
};

export const UZBEK_LANGUAGE = {
  CODE: 'uz',
  NAME: 'O\'zbekcha',
  NATIVE_NAME: 'O\'zbekcha'
};

export const UZBEK_TIMEZONE = 'Asia/Tashkent'; 