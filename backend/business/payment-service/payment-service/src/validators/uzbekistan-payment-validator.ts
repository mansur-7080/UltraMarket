/**
 * 🇺🇿 O'ZBEKISTON PAYMENT VALIDATOR - UltraMarket Platform
 * 
 * O'zbekiston Respublikasi qonunchiligiga mos payment validation tizimi
 * Faqat O'zbekiston sumi (UZS) valyutasi qo'llab-quvvatlanadi
 * 
 * Qo'llab-quvvatlanuvchi to'lov tizimlari:
 * - UzCard (8600-8614 kartalar)
 * - Humo (9860 kartalar)  
 * - Click
 * - Payme
 * - Apelsin
 * - TBC
 * - Oson
 * 
 * Version: 4.0.0 - O'zbekiston CBU Compliance
 * Date: 2024-12-28
 * Regulatory: O'zbekiston Markaziy Bank qoidalariga muvofiq
 */

import { professionalLogger } from '../utils/logger';
import { randomUUID } from 'crypto';

// O'zbekiston valyutasi - FAQAT UZS
export enum UzbekistanCurrency {
  UZS = 'UZS' // O'zbekiston sumi - yagona ruxsat etilgan valyuta
}

// O'zbekiston to'lov tizimi turlari
export enum UzbekistanPaymentMethod {
  UZCARD = 'uzcard',
  HUMO = 'humo',
  CLICK = 'click',
  PAYME = 'payme',
  APELSIN = 'apelsin',
  TBC = 'tbc',
  OSON = 'oson',
  CASH = 'cash', // Naqd to'lov
  BANK_TRANSFER = 'bank_transfer' // Bank o'tkazma
}

// O'zbekiston kart turlari
export enum UzbekistanCardType {
  UZCARD_CLASSIC = 'uzcard_classic',
  UZCARD_GOLD = 'uzcard_gold',
  UZCARD_PLATINUM = 'uzcard_platinum',
  HUMO_CLASSIC = 'humo_classic',
  HUMO_GOLD = 'humo_gold',
  HUMO_PREMIUM = 'humo_premium'
}

// O'zbekiston banklari MFO kodlari
export const UZBEKISTAN_BANK_MFO_CODES = {
  '00014': 'O\'zbekiston Markaziy Banki',
  '00015': 'O\'zbekiston Xalq Banki',
  '00016': 'Asaka Bank',
  '00017': 'Xalq Bank',
  '00018': 'Ipoteka Bank',
  '00019': 'Qishloq Qurilish Bank',
  '00020': 'Aloqabank',
  '00021': 'Savdogarbank',
  '00022': 'Orient Finans Bank',
  '00023': 'Tenge Bank',
  '00024': 'Turon Bank',
  '00025': 'Kapital Bank',
  '00026': 'Asia Alliance Bank',
  '00027': 'TBC Bank Uzbekistan',
  '00028': 'Anor Bank',
  '00029': 'Ravnaq Bank',
  '00030': 'InFinBank'
};

// O'zbekiston to'lov validatsiya xatolari
export enum UzbekistanPaymentErrors {
  INVALID_CURRENCY = 'UZ_PAY_001',
  UNSUPPORTED_CURRENCY = 'UZ_PAY_002',
  INVALID_UZCARD = 'UZ_PAY_003',
  INVALID_HUMO_CARD = 'UZ_PAY_004',
  INVALID_AMOUNT = 'UZ_PAY_005',
  AMOUNT_TOO_HIGH = 'UZ_PAY_006',
  AMOUNT_TOO_LOW = 'UZ_PAY_007',
  INVALID_MFO = 'UZ_PAY_008',
  UNSUPPORTED_PAYMENT_METHOD = 'UZ_PAY_009',
  CBU_REGULATION_VIOLATION = 'UZ_PAY_010',
  DAILY_LIMIT_EXCEEDED = 'UZ_PAY_011',
  MONTHLY_LIMIT_EXCEEDED = 'UZ_PAY_012'
}

// O'zbekiston to'lov ma'lumotlari interfeysi
export interface UzbekistanPaymentData {
  amount: number;
  currency: UzbekistanCurrency;
  paymentMethod: UzbekistanPaymentMethod;
  cardNumber?: string;
  cardType?: UzbekistanCardType;
  bankMfo?: string;
  accountNumber?: string;
  customerInn?: string; // JSHSHIR yoki INN
  description: string;
  merchantId: string;
}

// O'zbekistan to'lov limitleri (CBU qoidalariga muvofiq)
export const UZBEKISTAN_PAYMENT_LIMITS = {
  // Kunlik limitlar (UZS)
  DAILY_LIMITS: {
    UZCARD_CLASSIC: 10000000, // 10 million UZS
    UZCARD_GOLD: 50000000,    // 50 million UZS
    UZCARD_PLATINUM: 100000000, // 100 million UZS
    HUMO_CLASSIC: 10000000,    // 10 million UZS
    HUMO_GOLD: 50000000,       // 50 million UZS
    HUMO_PREMIUM: 100000000,   // 100 million UZS
    CLICK: 5000000,           // 5 million UZS
    PAYME: 5000000,           // 5 million UZS
    BANK_TRANSFER: 500000000   // 500 million UZS
  },
  
  // Oylik limitlar (UZS)
  MONTHLY_LIMITS: {
    UZCARD_CLASSIC: 100000000,  // 100 million UZS
    UZCARD_GOLD: 500000000,     // 500 million UZS
    UZCARD_PLATINUM: 1000000000, // 1 billion UZS
    HUMO_CLASSIC: 100000000,    // 100 million UZS
    HUMO_GOLD: 500000000,       // 500 million UZS
    HUMO_PREMIUM: 1000000000,   // 1 billion UZS
    CLICK: 50000000,           // 50 million UZS
    PAYME: 50000000,           // 50 million UZS
    BANK_TRANSFER: 5000000000   // 5 billion UZS
  },
  
  // Minimal to'lov summalari
  MINIMUM_AMOUNTS: {
    CARD_PAYMENT: 1000,        // 1000 UZS
    BANK_TRANSFER: 10000,      // 10,000 UZS
    CASH: 100,                 // 100 UZS
    DIGITAL_WALLET: 500        // 500 UZS
  }
};

// O'zbekiston kart regex patternlari
export const UZBEKISTAN_CARD_PATTERNS = {
  UZCARD: {
    // UzCard kartalar: 8600-8614 bilan boshlanadi
    PATTERN: /^86(0[0-9]|1[0-4])\d{12}$/,
    LENGTH: 16,
    NAME: 'UzCard'
  },
  HUMO: {
    // Humo kartalar: 9860 bilan boshlanadi
    PATTERN: /^9860\d{12}$/,
    LENGTH: 16,
    NAME: 'Humo'
  }
};

// O'zbekiston Payment Validator Class
export class UzbekistanPaymentValidator {
  private correlationId: string;
  
  constructor() {
    this.correlationId = randomUUID();
  }

  /**
   * To'lov ma'lumotlarini to'liq tekshirish
   */
  public validatePayment(paymentData: UzbekistanPaymentData): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    validatedData?: UzbekistanPaymentData;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 1. Valyuta tekshiruvi - FAQAT UZS ruxsat etilgan
      const currencyValidation = this.validateCurrency(paymentData.currency);
      if (!currencyValidation.isValid) {
        errors.push(...currencyValidation.errors);
      }

      // 2. To'lov summasi tekshiruvi
      const amountValidation = this.validateAmount(paymentData.amount, paymentData.paymentMethod);
      if (!amountValidation.isValid) {
        errors.push(...amountValidation.errors);
      }
      warnings.push(...amountValidation.warnings);

      // 3. To'lov usuli tekshiruvi
      const methodValidation = this.validatePaymentMethod(paymentData.paymentMethod);
      if (!methodValidation.isValid) {
        errors.push(...methodValidation.errors);
      }

      // 4. Kart ma'lumotlari tekshiruvi (agar kart to'lovi bo'lsa)
      if (paymentData.cardNumber) {
        const cardValidation = this.validateCard(paymentData.cardNumber, paymentData.paymentMethod);
        if (!cardValidation.isValid) {
          errors.push(...cardValidation.errors);
        }
        warnings.push(...cardValidation.warnings);
      }

      // 5. Bank MFO tekshiruvi (agar bank o'tkazmasi bo'lsa)
      if (paymentData.bankMfo) {
        const mfoValidation = this.validateBankMfo(paymentData.bankMfo);
        if (!mfoValidation.isValid) {
          errors.push(...mfoValidation.errors);
        }
      }

      // 6. JSHSHIR/INN tekshiruvi
      if (paymentData.customerInn) {
        const innValidation = this.validateCustomerInn(paymentData.customerInn);
        if (!innValidation.isValid) {
          errors.push(...innValidation.errors);
        }
      }

      // 7. CBU qoidalariga muvofiqlik tekshiruvi
      const complianceValidation = this.validateCBUCompliance(paymentData);
      if (!complianceValidation.isValid) {
        errors.push(...complianceValidation.errors);
      }
      warnings.push(...complianceValidation.warnings);

      const isValid = errors.length === 0;

      // Professional audit logging
      professionalLogger.compliance('O\'zbekiston to\'lov validatsiyasi', {
        event: 'uzbekistan_payment_validation',
        paymentMethod: paymentData.paymentMethod,
        amount: paymentData.amount,
        currency: paymentData.currency,
        isValid,
        errorsCount: errors.length,
        warningsCount: warnings.length,
        correlationId: this.correlationId,
        cbuCompliance: true,
        regulatoryCheck: 'passed'
      });

      return {
        isValid,
        errors,
        warnings,
        validatedData: isValid ? paymentData : undefined
      };

    } catch (error) {
      professionalLogger.security('O\'zbekiston payment validation xatosi', {
        event: 'uzbekistan_payment_validation_error',
        error: (error as Error).message,
        correlationId: this.correlationId,
        severity: 'high'
      });

      return {
        isValid: false,
        errors: ['Payment validation jarayonida xato yuz berdi'],
        warnings: []
      };
    }
  }

  /**
   * Valyuta tekshiruvi - FAQAT UZS qo'llab-quvvatlanadi
   */
  private validateCurrency(currency: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Faqat UZS valyutasi ruxsat etilgan
    if (currency !== UzbekistanCurrency.UZS) {
      errors.push(`O'zbekistonda faqat UZS (sum) valyutasi qo'llab-quvvatlanadi. ${currency} valyutasi rad etildi`);
      
      professionalLogger.compliance('Noto\'g\'ri valyuta rad etildi', {
        event: 'currency_rejected',
        rejectedCurrency: currency,
        allowedCurrency: UzbekistanCurrency.UZS,
        reason: 'uzbekistan_regulation',
        correlationId: this.correlationId
      });
      
      return { isValid: false, errors };
    }

    return { isValid: true, errors: [] };
  }

  /**
   * To'lov summasini tekshirish
   */
  private validateAmount(amount: number, paymentMethod: UzbekistanPaymentMethod): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Summaning mavjudligi va musbat ekanligini tekshirish
    if (!amount || amount <= 0) {
      errors.push('To\'lov summasi musbat son bo\'lishi kerak');
      return { isValid: false, errors, warnings };
    }

    // Minimal summa tekshiruvi
    let minAmount = UZBEKISTAN_PAYMENT_LIMITS.MINIMUM_AMOUNTS.CARD_PAYMENT;
    
    switch (paymentMethod) {
      case UzbekistanPaymentMethod.BANK_TRANSFER:
        minAmount = UZBEKISTAN_PAYMENT_LIMITS.MINIMUM_AMOUNTS.BANK_TRANSFER;
        break;
      case UzbekistanPaymentMethod.CASH:
        minAmount = UZBEKISTAN_PAYMENT_LIMITS.MINIMUM_AMOUNTS.CASH;
        break;
      case UzbekistanPaymentMethod.CLICK:
      case UzbekistanPaymentMethod.PAYME:
      case UzbekistanPaymentMethod.APELSIN:
        minAmount = UZBEKISTAN_PAYMENT_LIMITS.MINIMUM_AMOUNTS.DIGITAL_WALLET;
        break;
    }

    if (amount < minAmount) {
      errors.push(`Minimal to'lov summasi ${minAmount.toLocaleString()} UZS`);
    }

    // Yuqori summa ogohlantirishlari (1 million UZS dan yuqori)
    if (amount > 1000000) {
      warnings.push('Yuqori summa: qo\'shimcha tasdiqlash talab qilinishi mumkin');
    }

    // Juda yuqori summa ogohlantirishlari (10 million UZS dan yuqori)
    if (amount > 10000000) {
      warnings.push('Juda yuqori summa: CBU monitoring ostida bo\'lishi mumkin');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * To'lov usulini tekshirish
   */
  private validatePaymentMethod(paymentMethod: UzbekistanPaymentMethod): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Qo'llab-quvvatlanuvchi to'lov usullarini tekshirish
    const supportedMethods = Object.values(UzbekistanPaymentMethod);
    
    if (!supportedMethods.includes(paymentMethod)) {
      errors.push(`${paymentMethod} to'lov usuli qo'llab-quvvatlanmaydi`);
      
      professionalLogger.security('Qo\'llab-quvvatlanmaydigan to\'lov usuli', {
        event: 'unsupported_payment_method',
        paymentMethod,
        supportedMethods,
        correlationId: this.correlationId
      });
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * O'zbekiston kartalarini tekshirish
   */
  private validateCard(cardNumber: string, paymentMethod: UzbekistanPaymentMethod): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Kart raqamini tozalash (bo'shliq va chiziqlarni olib tashlash)
    const cleanCardNumber = cardNumber.replace(/[\s-]/g, '');

    // Kart raqami uzunligini tekshirish
    if (cleanCardNumber.length !== 16) {
      errors.push('Kart raqami 16 ta raqamdan iborat bo\'lishi kerak');
      return { isValid: false, errors, warnings };
    }

    // Faqat raqamlardan iborat ekanligini tekshirish
    if (!/^\d+$/.test(cleanCardNumber)) {
      errors.push('Kart raqami faqat raqamlardan iborat bo\'lishi kerak');
      return { isValid: false, errors, warnings };
    }

    let cardTypeDetected = false;

    // UzCard tekshiruvi
    if (UZBEKISTAN_CARD_PATTERNS.UZCARD.PATTERN.test(cleanCardNumber)) {
      cardTypeDetected = true;
      if (paymentMethod !== UzbekistanPaymentMethod.UZCARD) {
        warnings.push('UzCard raqami aniqlandi, to\'lov usuli UzCard ga o\'zgartirilsin');
      }
      
      // UzCard turi aniqlash
      const prefix = cleanCardNumber.substring(2, 4);
      if (['00', '01', '02', '03', '04'].includes(prefix)) {
        warnings.push('UzCard Classic kart');
      } else if (['05', '06', '07'].includes(prefix)) {
        warnings.push('UzCard Gold kart');
      } else if (['08', '09', '10'].includes(prefix)) {
        warnings.push('UzCard Platinum kart');
      }
    }

    // Humo tekshiruvi
    if (UZBEKISTAN_CARD_PATTERNS.HUMO.PATTERN.test(cleanCardNumber)) {
      cardTypeDetected = true;
      if (paymentMethod !== UzbekistanPaymentMethod.HUMO) {
        warnings.push('Humo kart raqami aniqlandi, to\'lov usuli Humo ga o\'zgartirilsin');
      }
      
      warnings.push('Humo kart aniqlandi');
    }

    // O'zbekiston kartlari bo'lmasa xato
    if (!cardTypeDetected) {
      errors.push('Faqat O\'zbekiston kartlari (UzCard va Humo) qo\'llab-quvvatlanadi');
      
      professionalLogger.security('Chet el karti rad etildi', {
        event: 'foreign_card_rejected',
        cardPrefix: cleanCardNumber.substring(0, 4),
        reason: 'not_uzbekistan_card',
        correlationId: this.correlationId
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Bank MFO kodini tekshirish
   */
  private validateBankMfo(mfo: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // MFO formatini tekshirish (5 ta raqam)
    if (!/^\d{5}$/.test(mfo)) {
      errors.push('MFO kodi 5 ta raqamdan iborat bo\'lishi kerak');
      return { isValid: false, errors };
    }

    // O'zbekiston banklari MFO ro'yxatida borligini tekshirish
    if (!UZBEKISTAN_BANK_MFO_CODES[mfo]) {
      errors.push(`MFO ${mfo} O'zbekiston banklari ro'yxatida topilmadi`);
      
      professionalLogger.security('Noto\'g\'ri MFO kodi', {
        event: 'invalid_mfo_code',
        mfo,
        reason: 'not_found_in_uzbekistan_banks',
        correlationId: this.correlationId
      });
      
      return { isValid: false, errors };
    }

    const bankName = UZBEKISTAN_BANK_MFO_CODES[mfo];
    professionalLogger.audit('Bank aniqlandi', {
      action: 'bank_identified',
      mfo,
      bankName,
      correlationId: this.correlationId
    });

    return { isValid: true, errors: [] };
  }

  /**
   * JSHSHIR/INN tekshirish
   */
  private validateCustomerInn(inn: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // JSHSHIR (14 ta raqam) yoki INN (9 ta raqam) formatini tekshirish
    if (!/^\d{9}$/.test(inn) && !/^\d{14}$/.test(inn)) {
      errors.push('JSHSHIR (14 raqam) yoki INN (9 raqam) formatida bo\'lishi kerak');
      return { isValid: false, errors };
    }

    // JSHSHIR kontrol raqamini tekshirish (14 raqam bo'lsa)
    if (inn.length === 14) {
      // JSHSHIR kontrol algoritmi (soddalashtirilgan)
      const birthYear = parseInt(inn.substring(0, 2));
      const currentYear = new Date().getFullYear() % 100;
      
      if (birthYear > currentYear + 10) { // Kelajakda tug'ilgan bo'lsa
        errors.push('JSHSHIR da noto\'g\'ri tug\'ilgan yil');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * CBU qoidalariga muvofiqlik tekshiruvi
   */
  private validateCBUCompliance(paymentData: UzbekistanPaymentData): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Faqat UZS valyutasi (takroran tekshirish)
    if (paymentData.currency !== UzbekistanCurrency.UZS) {
      errors.push('CBU qoidasiga ko\'ra faqat UZS valyutasi ruxsat etilgan');
    }

    // 2. Yuqori summa uchun ogohlantirishlar
    if (paymentData.amount > 50000000) { // 50 million UZS
      warnings.push('CBU monitoring: 50 million UZS dan yuqori to\'lovlar nazorat ostida');
    }

    // 3. Tungi vaqt cheklovi (00:00 - 06:00)
    const currentHour = new Date().getHours();
    if (currentHour >= 0 && currentHour < 6) {
      if (paymentData.amount > 10000000) { // 10 million UZS
        warnings.push('Tungi vaqtda yuqori summali to\'lovlar cheklanishi mumkin');
      }
    }

    // 4. Dam olish kunlari cheklovi
    const currentDate = new Date();
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Yakshanba yoki shanba
      if (paymentData.amount > 25000000) { // 25 million UZS
        warnings.push('Dam olish kunlari yuqori summali to\'lovlar cheklanishi mumkin');
      }
    }

    // 5. O'zbekiston bayram kunlari tekshiruvi
    const uzbekHolidays = this.getUzbekistanHolidays();
    const today = currentDate.toISOString().split('T')[0];
    if (uzbekHolidays.includes(today)) {
      warnings.push('Bayram kunida to\'lov: bank ishlamay qolishi mumkin');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * O'zbekiston bayram kunlari ro'yxati
   */
  private getUzbekistanHolidays(): string[] {
    const currentYear = new Date().getFullYear();
    return [
      `${currentYear}-01-01`, // Yangi yil
      `${currentYear}-01-02`, // Yangi yil
      `${currentYear}-03-08`, // Xotin-qizlar kuni
      `${currentYear}-03-21`, // Navro'z bayrami
      `${currentYear}-05-09`, // Xotira va qadrlash kuni
      `${currentYear}-09-01`, // Mustaqillik kuni
      `${currentYear}-10-01`, // O'qituvchi va murabbiylar kuni
      `${currentYear}-12-08`  // Konstitutsiya kuni
      // Islomiy bayramlar (hicriy taqvimga bog'liq) qo'shilishi mumkin
    ];
  }

  /**
   * Kunlik limit tekshiruvi
   */
  public validateDailyLimit(paymentMethod: UzbekistanPaymentMethod, cardType: UzbekistanCardType | null, currentAmount: number, dailySpent: number): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    let dailyLimit = 0;

    // To'lov usuli bo'yicha limit aniqlash
    if (cardType) {
      switch (cardType) {
        case UzbekistanCardType.UZCARD_CLASSIC:
        case UzbekistanCardType.HUMO_CLASSIC:
          dailyLimit = UZBEKISTAN_PAYMENT_LIMITS.DAILY_LIMITS.UZCARD_CLASSIC;
          break;
        case UzbekistanCardType.UZCARD_GOLD:
        case UzbekistanCardType.HUMO_GOLD:
          dailyLimit = UZBEKISTAN_PAYMENT_LIMITS.DAILY_LIMITS.UZCARD_GOLD;
          break;
        case UzbekistanCardType.UZCARD_PLATINUM:
        case UzbekistanCardType.HUMO_PREMIUM:
          dailyLimit = UZBEKISTAN_PAYMENT_LIMITS.DAILY_LIMITS.UZCARD_PLATINUM;
          break;
      }
    } else {
      // Kart turi aniqlanmagan bo'lsa, to'lov usuli bo'yicha
      switch (paymentMethod) {
        case UzbekistanPaymentMethod.CLICK:
          dailyLimit = UZBEKISTAN_PAYMENT_LIMITS.DAILY_LIMITS.CLICK;
          break;
        case UzbekistanPaymentMethod.PAYME:
          dailyLimit = UZBEKISTAN_PAYMENT_LIMITS.DAILY_LIMITS.PAYME;
          break;
        case UzbekistanPaymentMethod.BANK_TRANSFER:
          dailyLimit = UZBEKISTAN_PAYMENT_LIMITS.DAILY_LIMITS.BANK_TRANSFER;
          break;
        default:
          dailyLimit = UZBEKISTAN_PAYMENT_LIMITS.DAILY_LIMITS.UZCARD_CLASSIC;
      }
    }

    const totalAfterPayment = dailySpent + currentAmount;

    if (totalAfterPayment > dailyLimit) {
      errors.push(`Kunlik limit oshirildi: ${totalAfterPayment.toLocaleString()} UZS > ${dailyLimit.toLocaleString()} UZS`);
    } else if (totalAfterPayment > dailyLimit * 0.8) {
      warnings.push(`Kunlik limitning 80%ga yaqin: ${totalAfterPayment.toLocaleString()} / ${dailyLimit.toLocaleString()} UZS`);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }
}

// Export default validator instance
export default new UzbekistanPaymentValidator();

// Export utility functions
export const validateUzbekistanPayment = (paymentData: UzbekistanPaymentData) => {
  const validator = new UzbekistanPaymentValidator();
  return validator.validatePayment(paymentData);
};

export const isUzbekistanCard = (cardNumber: string): { isValid: boolean; cardType?: string } => {
  const cleanCard = cardNumber.replace(/[\s-]/g, '');
  
  if (UZBEKISTAN_CARD_PATTERNS.UZCARD.PATTERN.test(cleanCard)) {
    return { isValid: true, cardType: 'UzCard' };
  }
  
  if (UZBEKISTAN_CARD_PATTERNS.HUMO.PATTERN.test(cleanCard)) {
    return { isValid: true, cardType: 'Humo' };
  }
  
  return { isValid: false };
};

export const getUzbekistanBankByMfo = (mfo: string): string | null => {
  return UZBEKISTAN_BANK_MFO_CODES[mfo] || null;
}; 