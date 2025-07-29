"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = validateRequest;
const logger_1 = require("../utils/logger");
const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
function validateRequest(req, schema) {
    const result = {
        isValid: true,
        errors: {},
    };
    const data = req.body;
    const startTime = performance.now();
    for (const field of Object.keys(schema)) {
        const rules = schema[field];
        if (!rules)
            continue;
        const value = data[field];
        const fieldErrors = [];
        if (rules.required && (value === undefined || value === null || value === '')) {
            fieldErrors.push(`${field} is required`);
            result.isValid = false;
            result.errors[field] = fieldErrors;
            continue;
        }
        if (value === undefined || value === null) {
            continue;
        }
        switch (rules.type) {
            case 'string':
                if (typeof value !== 'string') {
                    fieldErrors.push(`${field} must be a string`);
                }
                else if (rules.type === 'string') {
                    if (rules.minLength !== undefined && value.length < rules.minLength) {
                        fieldErrors.push(`${field} must be at least ${rules.minLength} characters long`);
                    }
                    if (rules.maxLength !== undefined && value.length > rules.maxLength) {
                        fieldErrors.push(`${field} must not exceed ${rules.maxLength} characters`);
                    }
                    if (rules.email && !EMAIL_REGEX.test(value)) {
                        fieldErrors.push(`${field} must be a valid email address`);
                    }
                    if (rules.pattern && !rules.pattern.test(value)) {
                        fieldErrors.push(`${field} format is invalid`);
                    }
                    if (rules.enum && !rules.enum.includes(value)) {
                        fieldErrors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
                    }
                }
                break;
            case 'number':
                if (typeof value !== 'number' || isNaN(value)) {
                    fieldErrors.push(`${field} must be a number`);
                }
                else if (rules.type === 'number') {
                    if (rules.min !== undefined && value < rules.min) {
                        fieldErrors.push(`${field} must be at least ${rules.min}`);
                    }
                    if (rules.max !== undefined && value > rules.max) {
                        fieldErrors.push(`${field} must not exceed ${rules.max}`);
                    }
                    if (rules.integer && !Number.isInteger(value)) {
                        fieldErrors.push(`${field} must be an integer`);
                    }
                }
                break;
            case 'boolean':
                if (typeof value !== 'boolean') {
                    fieldErrors.push(`${field} must be a boolean`);
                }
                break;
            case 'date':
                const dateValue = new Date(value);
                if (isNaN(dateValue.getTime())) {
                    fieldErrors.push(`${field} must be a valid date`);
                }
                else if (rules.type === 'date') {
                    if (rules.min && dateValue < rules.min) {
                        fieldErrors.push(`${field} must be after ${rules.min.toISOString()}`);
                    }
                    if (rules.max && dateValue > rules.max) {
                        fieldErrors.push(`${field} must be before ${rules.max.toISOString()}`);
                    }
                }
                break;
            case 'array':
                if (!Array.isArray(value)) {
                    fieldErrors.push(`${field} must be an array`);
                }
                else if (rules.type === 'array') {
                    if (rules.minLength !== undefined && value.length < rules.minLength) {
                        fieldErrors.push(`${field} must contain at least ${rules.minLength} items`);
                    }
                    if (rules.maxLength !== undefined && value.length > rules.maxLength) {
                        fieldErrors.push(`${field} must not contain more than ${rules.maxLength} items`);
                    }
                    if (rules.items && value.length > 0) {
                        value.forEach((item, index) => {
                            const itemErrors = validateValue(`${field}[${index}]`, item, rules.items);
                            if (itemErrors.length > 0) {
                                fieldErrors.push(...itemErrors);
                            }
                        });
                    }
                }
                break;
            case 'object':
                if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                    fieldErrors.push(`${field} must be an object`);
                }
                else if (rules.type === 'object' && rules.properties) {
                    Object.keys(rules.properties).forEach((propName) => {
                        const propRules = rules.properties[propName];
                        const propValue = value[propName];
                        const propErrors = validateValue(`${field}.${propName}`, propValue, propRules);
                        if (propErrors.length > 0) {
                            fieldErrors.push(...propErrors);
                        }
                    });
                }
                break;
        }
        if (fieldErrors.length > 0) {
            result.isValid = false;
            result.errors[field] = fieldErrors;
        }
    }
    const endTime = performance.now();
    const validationTime = Math.round(endTime - startTime);
    if (validationTime > 50 || !result.isValid) {
        logger_1.logger.debug('Request validation', {
            path: req.path,
            validationTime: `${validationTime}ms`,
            isValid: result.isValid,
            errorCount: Object.keys(result.errors).length,
        });
    }
    return result;
}
function validateValue(name, value, rules) {
    if (!rules)
        return [];
    const tempSchema = { [name]: rules };
    const tempData = { [name]: value };
    const mockReq = {
        body: tempData,
    };
    const result = validateRequest(mockReq, tempSchema);
    return result.errors[name] || [];
}
//# sourceMappingURL=validation.js.map