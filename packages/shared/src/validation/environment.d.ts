/**
 * UltraMarket Environment Validation
 * Comprehensive validation for all microservices environment variables
 */
import Joi from 'joi';
declare const baseSchema: Joi.ObjectSchema<any>;
declare const databaseSchema: Joi.ObjectSchema<any>;
declare const securitySchema: Joi.ObjectSchema<any>;
declare const paymentSchema: Joi.ObjectSchema<any>;
declare const communicationSchema: Joi.ObjectSchema<any>;
export declare const serviceSchemas: {
    'auth-service': Joi.ObjectSchema<any>;
    'user-service': Joi.ObjectSchema<any>;
    'product-service': Joi.ObjectSchema<any>;
    'cart-service': Joi.ObjectSchema<any>;
    'order-service': Joi.ObjectSchema<any>;
    'payment-service': Joi.ObjectSchema<any>;
    'notification-service': Joi.ObjectSchema<any>;
    'search-service': Joi.ObjectSchema<any>;
    'file-service': Joi.ObjectSchema<any>;
    'api-gateway': Joi.ObjectSchema<any>;
};
export declare function validateEnvironment(serviceName: string, customSchema?: Joi.ObjectSchema): void;
export declare function checkProductionSecurity(): void;
export declare function generateSecureSecret(length?: number): string;
export { baseSchema, databaseSchema, securitySchema, paymentSchema, communicationSchema };
//# sourceMappingURL=environment.d.ts.map