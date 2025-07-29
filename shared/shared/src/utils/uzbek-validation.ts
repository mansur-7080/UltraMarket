// O'zbekiston uchun validatsiya utilitilari

// O'zbek telefon raqami validatsiyasi
export function validateUzbekPhoneNumber(phone: string): {
  valid: boolean;
  formatted?: string;
  error?: string;
} {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');

  // O'zbek telefon raqami formatlari:
  // +998901234567 (13 ta raqam)
  // 998901234567 (12 ta raqam)
  // 901234567 (9 ta raqam - ichki format)

  let normalizedPhone = cleanPhone;

  // If starts with +998, remove +
  if (normalizedPhone.startsWith('998')) {
    normalizedPhone = normalizedPhone;
  }
  // If starts with 8, replace with 998
  else if (normalizedPhone.startsWith('8') && normalizedPhone.length === 10) {
    normalizedPhone = '998' + normalizedPhone.substring(1);
  }
  // If 9 digits, add 998 prefix
  else if (normalizedPhone.length === 9) {
    normalizedPhone = '998' + normalizedPhone;
  }

  // Check if it's a valid Uzbek number
  if (normalizedPhone.length !== 12 || !normalizedPhone.startsWith('998')) {
    return {
      valid: false,
      error: "O'zbek telefon raqami 12 ta raqamdan iborat bo'lishi kerak (+998901234567)",
    };
  }

  // Check valid operator codes
  const operatorCode = normalizedPhone.substring(3, 5);
  const validOperators = [
    '90',
    '91',
    '93',
    '94',
    '95',
    '96',
    '97',
    '98',
    '99', // Ucell
    '88',
    '83',
    '84',
    '85',
    '86',
    '87', // Beeline
    '71',
    '74',
    '75',
    '76',
    '77',
    '78', // UzMobile
    '33',
    '50',
    '51',
    '52',
    '53',
    '54',
    '55',
    '56',
    '57',
    '58',
    '59', // Perfectum/UMS
  ];

  if (!validOperators.includes(operatorCode)) {
    return {
      valid: false,
      error: "Noto'g'ri operator kodi",
    };
  }

  return {
    valid: true,
    formatted: `+${normalizedPhone}`,
  };
}

// Format phone number for display
export function formatUzbekPhoneNumber(phone: string): string {
  const validation = validateUzbekPhoneNumber(phone);
  if (!validation.valid || !validation.formatted) {
    return phone;
  }

  const cleanPhone = validation.formatted.replace('+', '');
  // Format: +998 (90) 123-45-67
  return `+${cleanPhone.substring(0, 3)} (${cleanPhone.substring(3, 5)}) ${cleanPhone.substring(5, 8)}-${cleanPhone.substring(8, 10)}-${cleanPhone.substring(10, 12)}`;
}

// O'zbek passport seriya va raqami validatsiyasi
export function validateUzbekPassport(passport: string): {
  valid: boolean;
  error?: string;
} {
  // O'zbek passport formati: AB1234567 (2 ta harf + 7 ta raqam)
  const passportRegex = /^[A-Z]{2}\d{7}$/;

  if (!passportRegex.test(passport.toUpperCase())) {
    return {
      valid: false,
      error: "Passport seriya va raqami noto'g'ri (AB1234567 formatida bo'lishi kerak)",
    };
  }

  return { valid: true };
}

// O'zbek JSHIR (Individual Tax Number) validatsiyasi
export function validateUzbekJSHIR(jshir: string): {
  valid: boolean;
  error?: string;
} {
  // JSHIR 14 ta raqamdan iborat
  const cleanJSHIR = jshir.replace(/\D/g, '');

  if (cleanJSHIR.length !== 14) {
    return {
      valid: false,
      error: "JSHIR 14 ta raqamdan iborat bo'lishi kerak",
    };
  }

  // Basic checksum validation (simplified)
  const digits = cleanJSHIR.split('').map(Number);
  const checksum =
    digits.slice(0, 13).reduce((sum, digit, index) => {
      return sum + digit * (index + 1);
    }, 0) % 11;

  if (checksum !== digits[13]) {
    return {
      valid: false,
      error: "JSHIR noto'g'ri",
    };
  }

  return { valid: true };
}

// O'zbek bank kartasi raqami validatsiyasi (simplified)
export function validateUzbekBankCard(cardNumber: string): {
  valid: boolean;
  cardType?: 'uzcard' | 'humo' | 'visa' | 'mastercard';
  error?: string;
} {
  const cleanCard = cardNumber.replace(/\D/g, '');

  if (cleanCard.length !== 16) {
    return {
      valid: false,
      error: "Karta raqami 16 ta raqamdan iborat bo'lishi kerak",
    };
  }

  // Determine card type
  let cardType: 'uzcard' | 'humo' | 'visa' | 'mastercard';

  if (cleanCard.startsWith('8600')) {
    cardType = 'uzcard';
  } else if (cleanCard.startsWith('9860')) {
    cardType = 'humo';
  } else if (cleanCard.startsWith('4')) {
    cardType = 'visa';
  } else if (cleanCard.startsWith('5')) {
    cardType = 'mastercard';
  } else {
    return {
      valid: false,
      error: "Noma'lum karta turi",
    };
  }

  // Luhn algorithm for basic validation
  let sum = 0;
  let isEven = false;

  for (let i = cleanCard.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanCard[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  if (sum % 10 !== 0) {
    return {
      valid: false,
      error: "Karta raqami noto'g'ri",
    };
  }

  return {
    valid: true,
    cardType,
  };
}

// O'zbek pochta indeksi validatsiyasi
export function validateUzbekPostalCode(postalCode: string): {
  valid: boolean;
  region?: string;
  error?: string;
} {
  const cleanCode = postalCode.replace(/\D/g, '');

  if (cleanCode.length !== 6) {
    return {
      valid: false,
      error: "Pochta indeksi 6 ta raqamdan iborat bo'lishi kerak",
    };
  }

  // Basic regional validation
  const regionCode = cleanCode.substring(0, 3);
  const regions: Record<string, string> = {
    '100': 'Toshkent shahri',
    '140': 'Samarqand viloyati',
    '200': 'Buxoro viloyati',
    '170': 'Andijon viloyati',
    '150': "Farg'ona viloyati",
    '160': 'Namangan viloyati',
    // Add more regions...
  };

  const region = regions[regionCode];
  if (!region) {
    return {
      valid: false,
      error: "Noma'lum pochta indeksi",
    };
  }

  return {
    valid: true,
    region,
  };
}
