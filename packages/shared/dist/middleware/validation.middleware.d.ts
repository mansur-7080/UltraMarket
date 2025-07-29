import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
                role: string;
            };
        }
    }
}
interface ValidationOptions {
    abortEarly?: boolean;
    allowUnknown?: boolean;
    stripUnknown?: boolean;
}
export declare const validate: (schema: {
    body?: Joi.ObjectSchema;
    params?: Joi.ObjectSchema;
    query?: Joi.ObjectSchema;
    headers?: Joi.ObjectSchema;
}, options?: ValidationOptions) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const commonSchemas: {
    mongoId: Joi.StringSchema<string>;
    uuid: Joi.StringSchema<string>;
    email: Joi.StringSchema<string>;
    password: Joi.StringSchema<string>;
    phoneUz: Joi.StringSchema<string>;
    pagination: {
        page: Joi.NumberSchema<number>;
        limit: Joi.NumberSchema<number>;
        sortBy: Joi.StringSchema<string>;
        sortOrder: Joi.StringSchema<string>;
    };
    dateRange: {
        startDate: Joi.DateSchema<Date>;
        endDate: Joi.DateSchema<Date>;
    };
    price: Joi.NumberSchema<number>;
    region: Joi.StringSchema<string>;
};
export declare const userSchemas: {
    register: {
        body: Joi.ObjectSchema<any>;
    };
    login: {
        body: Joi.ObjectSchema<any>;
    };
    updateProfile: {
        body: Joi.ObjectSchema<any>;
    };
    changePassword: {
        body: Joi.ObjectSchema<any>;
    };
};
export declare const productSchemas: {
    create: {
        body: Joi.ObjectSchema<any>;
    };
    update: {
        params: Joi.ObjectSchema<any>;
        body: Joi.ObjectSchema<any>;
    };
    search: {
        query: Joi.ObjectSchema<any>;
    };
};
export declare const orderSchemas: {
    create: {
        body: Joi.ObjectSchema<any>;
    };
    updateStatus: {
        params: Joi.ObjectSchema<any>;
        body: Joi.ObjectSchema<any>;
    };
};
export declare const cartSchemas: {
    addItem: {
        body: Joi.ObjectSchema<any>;
    };
    updateItem: {
        params: Joi.ObjectSchema<any>;
        body: Joi.ObjectSchema<any>;
    };
    removeItem: {
        params: Joi.ObjectSchema<any>;
    };
};
export declare const paymentSchemas: {
    initiate: {
        body: Joi.ObjectSchema<any>;
    };
    webhook: {
        body: Joi.ObjectSchema<any>;
    };
};
export declare const fileSchemas: {
    upload: {
        body: Joi.ObjectSchema<any>;
    };
};
export declare const adminSchemas: {
    createUser: {
        body: Joi.ObjectSchema<any>;
    };
    updateUser: {
        params: Joi.ObjectSchema<any>;
        body: Joi.ObjectSchema<any>;
    };
};
export default validate;
//# sourceMappingURL=validation.middleware.d.ts.map