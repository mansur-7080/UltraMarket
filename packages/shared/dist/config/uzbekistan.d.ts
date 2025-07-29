export declare const UZBEKISTAN_CONFIG: {
    country: string;
    countryName: string;
    currency: string;
    timezone: string;
    defaultLanguage: string;
    supportedLanguages: string[];
    currencySymbol: string;
    decimalPlaces: number;
    thousandsSeparator: string;
    taxRate: number;
    freeShippingThreshold: number;
    paymentMethods: {
        id: string;
        name: string;
        type: string;
        icon: string;
        description: string;
        isPopular: boolean;
    }[];
    shippingProviders: {
        id: string;
        name: string;
        type: string;
        logo: string;
        deliveryTime: string;
        coverage: string[];
        isPopular: boolean;
    }[];
    regions: {
        code: string;
        name: string;
        type: string;
        postalCodes: string[];
    }[];
    businessHours: {
        weekdays: {
            open: string;
            close: string;
        };
        saturday: {
            open: string;
            close: string;
        };
        sunday: {
            closed: boolean;
        };
    };
    holidays: string[];
    phoneOperators: {
        code: string;
        name: string;
        type: string;
    }[];
    formatPrice: (amount: number) => string;
    formatDate: (date: Date) => string;
    formatTime: (date: Date) => string;
};
export default UZBEKISTAN_CONFIG;
//# sourceMappingURL=uzbekistan.d.ts.map