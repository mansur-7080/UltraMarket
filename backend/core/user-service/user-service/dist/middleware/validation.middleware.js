"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = exports.validateQuery = exports.validateBody = exports.validate = void 0;
const error_middleware_1 = require("./error.middleware");
const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            allowUnknown: false,
            stripUnknown: true,
        });
        if (error) {
            const errorMessage = error.details.map((detail) => detail.message).join(', ');
            return next(new error_middleware_1.ValidationError(errorMessage));
        }
        req[property] = value;
        next();
    };
};
exports.validate = validate;
const validateBody = (schema) => {
    return (0, exports.validate)(schema, 'body');
};
exports.validateBody = validateBody;
const validateQuery = (schema) => {
    return (0, exports.validate)(schema, 'query');
};
exports.validateQuery = validateQuery;
const validateParams = (schema) => {
    return (0, exports.validate)(schema, 'params');
};
exports.validateParams = validateParams;
//# sourceMappingURL=validation.middleware.js.map