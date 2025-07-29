import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
export declare const createProductSchema: Joi.ObjectSchema<any>;
export declare const updateProductSchema: Joi.ObjectSchema<any>;
export declare const createCategorySchema: Joi.ObjectSchema<any>;
export declare const updateCategorySchema: Joi.ObjectSchema<any>;
export declare const createReviewSchema: Joi.ObjectSchema<any>;
export declare const productQuerySchema: Joi.ObjectSchema<any>;
export declare const reviewQuerySchema: Joi.ObjectSchema<any>;
export declare const validateProduct: (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateQuery: (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=productValidator.d.ts.map