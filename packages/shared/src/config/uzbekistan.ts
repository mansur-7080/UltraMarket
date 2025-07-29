// O'zbekiston uchun konfiguratsiya
export const UZBEKISTAN_CONFIG = {
  // Asosiy ma'lumotlar
  country: 'UZ',
  countryName: "O'zbekiston",
  currency: 'UZS',
  timezone: 'Asia/Tashkent',

  // Tillar
  defaultLanguage: 'uz',
  supportedLanguages: ['uz', 'ru', 'en'],

  // Valyuta va narxlar
  currencySymbol: "so'm",
  decimalPlaces: 0,
  thousandsSeparator: ' ',

  // Soliq va to'lovlar
  taxRate: 0.12, // 12% NDS
  freeShippingThreshold: 300000, // 300,000 so'm

  // To'lov usullari
  paymentMethods: [
    {
      id: 'click',
      name: 'Click',
      type: 'digital_wallet',
      icon: '/images/payments/click.png',
      description: "Tez va xavfsiz to'lov",
      isPopular: true,
    },
    {
      id: 'payme',
      name: 'Payme',
      type: 'digital_wallet',
      icon: '/images/payments/payme.png',
      description: "Milliy to'lov tizimi",
      isPopular: true,
    },
    {
      id: 'uzcard',
      name: 'Uzcard',
      type: 'card',
      icon: '/images/payments/uzcard.png',
      description: "O'zbekiston kartasi",
      isPopular: true,
    },
    {
      id: 'humo',
      name: 'Humo',
      type: 'card',
      icon: '/images/payments/humo.png',
      description: 'Humo karta',
      isPopular: true,
    },
    {
      id: 'cash_on_delivery',
      name: "Naqd to'lov",
      type: 'cash',
      icon: '/images/payments/cash.png',
      description: "Yetkazganda to'lash",
      isPopular: false,
    },
    {
      id: 'bank_transfer',
      name: "Bank o'tkazmasi",
      type: 'bank',
      icon: '/images/payments/bank.png',
      description: "Bank orqali o'tkazma",
      isPopular: false,
    },
  ],

  // Yetkazib berish provayderlari
  shippingProviders: [
    {
      id: 'express24',
      name: 'Express24',
      type: 'express',
      logo: '/images/delivery/express24.png',
      deliveryTime: '1-2 kun',
      coverage: ['Toshkent shahri', 'Toshkent viloyati'],
      isPopular: true,
    },
    {
      id: 'uzpost',
      name: 'Uzbekiston Post',
      type: 'standard',
      logo: '/images/delivery/uzpost.png',
      deliveryTime: '3-5 kun',
      coverage: ['Barcha viloyatlar'],
      isPopular: true,
    },
    {
      id: 'yandex',
      name: 'Yandex Delivery',
      type: 'express',
      logo: '/images/delivery/yandex.png',
      deliveryTime: '1-3 kun',
      coverage: ['Toshkent shahri', 'Samarqand'],
      isPopular: false,
    },
    {
      id: 'local',
      name: 'Mahalliy yetkazib berish',
      type: 'local',
      logo: '/images/delivery/local.png',
      deliveryTime: '2-4 kun',
      coverage: ['Barcha hududlar'],
      isPopular: false,
    },
  ],

  // Viloyatlar va shaharlar
  regions: [
    {
      code: 'TAS',
      name: 'Toshkent shahri',
      type: 'city',
      postalCodes: ['100000', '100001', '100002', '100003', '100004'],
    },
    {
      code: 'TOS',
      name: 'Toshkent viloyati',
      type: 'region',
      postalCodes: ['111000', '111001', '111002'],
    },
    {
      code: 'SAM',
      name: 'Samarqand',
      type: 'region',
      postalCodes: ['140100', '140101', '140102', '140103'],
    },
    {
      code: 'BUK',
      name: 'Buxoro',
      type: 'region',
      postalCodes: ['200100', '200101', '200102'],
    },
    {
      code: 'AND',
      name: 'Andijon',
      type: 'region',
      postalCodes: ['170100', '170101', '170102'],
    },
    {
      code: 'FAR',
      name: "Farg'ona",
      type: 'region',
      postalCodes: ['150100', '150101', '150102'],
    },
    {
      code: 'NAM',
      name: 'Namangan',
      type: 'region',
      postalCodes: ['160100', '160101', '160102'],
    },
    {
      code: 'QAS',
      name: 'Qashqadaryo',
      type: 'region',
      postalCodes: ['180100', '180101', '180102'],
    },
    {
      code: 'SUR',
      name: 'Surxondaryo',
      type: 'region',
      postalCodes: ['190100', '190101', '190102'],
    },
    {
      code: 'XOR',
      name: 'Xorazm',
      type: 'region',
      postalCodes: ['220100', '220101', '220102'],
    },
    {
      code: 'QOR',
      name: "Qoraqalpog'iston",
      type: 'republic',
      postalCodes: ['230100', '230101', '230102'],
    },
    {
      code: 'NAV',
      name: 'Navoiy',
      type: 'region',
      postalCodes: ['210100', '210101', '210102'],
    },
    {
      code: 'JIZ',
      name: 'Jizzax',
      type: 'region',
      postalCodes: ['130100', '130101', '130102'],
    },
    {
      code: 'SIR',
      name: 'Sirdaryo',
      type: 'region',
      postalCodes: ['120100', '120101', '120102'],
    },
  ],

  // Biznes vaqtlari (O'zbekiston vaqti bilan)
  businessHours: {
    weekdays: {
      open: '09:00',
      close: '18:00',
    },
    saturday: {
      open: '09:00',
      close: '15:00',
    },
    sunday: {
      closed: true,
    },
  },

  // Bayramlar (O'zbek milliy bayramlari)
  holidays: [
    '01-01', // Yangi yil
    '03-08', // Xalqaro ayollar kuni
    '03-21', // Navro'z bayrami
    '05-09', // Xotira va qadrlash kuni
    '09-01', // Mustaqillik kuni
    '10-01', // O'qituvchi va murabbiylar kuni
    '12-08', // Konstitutsiya kuni
  ],

  // Telefon operatorlari
  phoneOperators: [
    { code: '90', name: 'Ucell', type: 'mobile' },
    { code: '91', name: 'Ucell', type: 'mobile' },
    { code: '93', name: 'Ucell', type: 'mobile' },
    { code: '94', name: 'Ucell', type: 'mobile' },
    { code: '95', name: 'Ucell', type: 'mobile' },
    { code: '96', name: 'Ucell', type: 'mobile' },
    { code: '97', name: 'Ucell', type: 'mobile' },
    { code: '98', name: 'Ucell', type: 'mobile' },
    { code: '99', name: 'Ucell', type: 'mobile' },
    { code: '88', name: 'Beeline', type: 'mobile' },
    { code: '83', name: 'Beeline', type: 'mobile' },
    { code: '84', name: 'Beeline', type: 'mobile' },
    { code: '85', name: 'Beeline', type: 'mobile' },
    { code: '86', name: 'Beeline', type: 'mobile' },
    { code: '87', name: 'Beeline', type: 'mobile' },
    { code: '71', name: 'UzMobile', type: 'mobile' },
    { code: '74', name: 'UzMobile', type: 'mobile' },
    { code: '75', name: 'UzMobile', type: 'mobile' },
    { code: '76', name: 'UzMobile', type: 'mobile' },
    { code: '77', name: 'UzMobile', type: 'mobile' },
    { code: '78', name: 'UzMobile', type: 'mobile' },
  ],

  // Narx formatlash
  formatPrice: (amount: number) => {
    return (
      new Intl.NumberFormat('uz-UZ', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount) + " so'm"
    );
  },

  // Sana formatlash
  formatDate: (date: Date) => {
    return new Intl.DateTimeFormat('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Tashkent',
    }).format(date);
  },

  // Vaqt formatlash
  formatTime: (date: Date) => {
    return new Intl.DateTimeFormat('uz-UZ', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tashkent',
    }).format(date);
  },
};

export default UZBEKISTAN_CONFIG;
