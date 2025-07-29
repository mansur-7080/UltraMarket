import Joi from 'joi';
export declare const UzbekistanPatterns: {
    phone: RegExp;
    passportSeries: RegExp;
    innNumber: RegExp;
    bankCard: RegExp;
    postalCode: RegExp;
};
export declare const SecurityPatterns: {
    sqlInjection: RegExp[];
    xssPatterns: RegExp[];
    pathTraversal: RegExp[];
    commandInjection: RegExp[];
};
export declare const CustomValidators: {
    /**
     * Secure string validation with XSS prevention
     */
    secureString: (value: string, helpers: Joi.CustomHelpers) => string | Joi.ErrorReport;
    /**
     * Uzbekistan phone number validation
     */
    uzbekPhoneNumber: (value: string, helpers: Joi.CustomHelpers) => string | Joi.ErrorReport;
    /**
     * Strong password validation
     */
    strongPassword: (value: string, helpers: Joi.CustomHelpers) => string | Joi.ErrorReport;
    /**
     * Email validation with domain restrictions
     */
    businessEmail: (value: string, helpers: Joi.CustomHelpers) => string | Joi.ErrorReport;
    /**
     * Uzbekistan postal code validation
     */
    uzbekPostalCode: (value: string, helpers: Joi.CustomHelpers) => string | Joi.ErrorReport;
    /**
     * URL validation with security checks
     */
    secureUrl: (value: string, helpers: Joi.CustomHelpers) => string | Joi.ErrorReport;
    /**
     * JSON validation with size limits
     */
    secureJson: (value: string, helpers: Joi.CustomHelpers) => string | Joi.ErrorReport;
    /**
     * File name validation
     */
    secureFileName: (value: string, helpers: Joi.CustomHelpers) => string | Joi.ErrorReport;
};
export declare const ValidationSchemas: {
    userRegistration: Joi.ObjectSchema<any>;
    userLogin: Joi.ObjectSchema<any>;
    productCreate: Joi.ObjectSchema<any>;
    orderCreate: Joi.ObjectSchema<any>;
    fileUpload: Joi.ObjectSchema<any>;
    searchQuery: Joi.ObjectSchema<any>;
};
export declare function createValidationMiddleware(schema: Joi.ObjectSchema): (req: any, res: any, next: any) => any;
export declare const ValidationMiddleware: {
    userRegistration: (req: any, res: any, next: any) => any;
    userLogin: (req: any, res: any, next: any) => any;
    productCreate: (req: any, res: any, next: any) => any;
    orderCreate: (req: any, res: any, next: any) => any;
    fileUpload: (req: any, res: any, next: any) => any;
    searchQuery: (req: any, res: any, next: any) => any;
};
export default ValidationSchemas;
//# sourceMappingURL=professional-validation.d.ts.map