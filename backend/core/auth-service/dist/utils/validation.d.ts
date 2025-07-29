import { Request } from 'express';
interface StringRules {
    type: 'string';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    email?: boolean;
    enum?: string[];
}
interface NumberRules {
    type: 'number';
    required?: boolean;
    min?: number;
    max?: number;
    integer?: boolean;
}
interface BooleanRules {
    type: 'boolean';
    required?: boolean;
}
interface DateRules {
    type: 'date';
    required?: boolean;
    min?: Date;
    max?: Date;
}
interface ArrayRules {
    type: 'array';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    items?: ValidationRules;
}
interface ObjectRules {
    type: 'object';
    required?: boolean;
    properties?: Record<string, ValidationRules>;
}
type ValidationRules = StringRules | NumberRules | BooleanRules | DateRules | ArrayRules | ObjectRules;
interface ValidationSchema {
    [key: string]: ValidationRules;
}
interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string[]>;
}
export declare function validateRequest(req: Request, schema: ValidationSchema): ValidationResult;
export {};
//# sourceMappingURL=validation.d.ts.map