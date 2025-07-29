import Joi from 'joi';
export declare const registrationSchema: Joi.ObjectSchema<any>;
export declare const loginSchema: Joi.ObjectSchema<any>;
export declare const passwordResetSchema: Joi.ObjectSchema<any>;
export declare const passwordChangeSchema: Joi.ObjectSchema<any>;
export declare const profileUpdateSchema: Joi.ObjectSchema<any>;
export declare const refreshTokenSchema: Joi.ObjectSchema<any>;
export declare const resetPasswordSchema: Joi.ObjectSchema<any>;
export declare function validateRegistrationInput(data: any): Joi.ValidationResult<any>;
export declare function validateLoginInput(data: any): Joi.ValidationResult<any>;
export declare function validatePasswordResetInput(data: any): Joi.ValidationResult<any>;
export declare function validatePasswordChangeInput(data: any): Joi.ValidationResult<any>;
export declare function validateProfileUpdateInput(data: any): Joi.ValidationResult<any>;
export declare function validateRefreshTokenInput(data: any): Joi.ValidationResult<any>;
export declare function validateResetPasswordInput(data: any): Joi.ValidationResult<any>;
export declare function sanitizeInput(data: any): any;
export declare function isValidEmail(email: string): boolean;
export declare function isStrongPassword(password: string): boolean;
//# sourceMappingURL=auth.validator.d.ts.map