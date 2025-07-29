/**
 * Validation utilities for UltraMarket
 * Comprehensive validation functions for user inputs
 */
/**
 * Email validation
 * @param email - Email address to validate
 * @returns boolean - True if email is valid
 */
export declare function validateEmail(email: string): boolean;
/**
 * Password validation
 * @param password - Password to validate
 * @returns boolean - True if password meets security requirements
 */
export declare function validatePassword(password: string): boolean;
/**
 * Username validation
 * @param username - Username to validate
 * @returns boolean - True if username is valid
 */
export declare function validateUsername(username: string): boolean;
/**
 * Phone number validation
 * @param phoneNumber - Phone number to validate
 * @returns boolean - True if phone number is valid
 */
export declare function validatePhoneNumber(phoneNumber: string): boolean;
/**
 * URL validation
 * @param url - URL to validate
 * @returns boolean - True if URL is valid
 */
export declare function validateUrl(url: string): boolean;
/**
 * UUID validation
 * @param uuid - UUID to validate
 * @returns boolean - True if UUID is valid
 */
export declare function validateUuid(uuid: string): boolean;
/**
 * Integer validation
 * @param value - Value to validate
 * @param min - Minimum value (optional)
 * @param max - Maximum value (optional)
 * @returns boolean - True if value is a valid integer
 */
export declare function validateInteger(value: any, min?: number, max?: number): boolean;
/**
 * String length validation
 * @param value - String to validate
 * @param minLength - Minimum length (optional)
 * @param maxLength - Maximum length (optional)
 * @returns boolean - True if string length is valid
 */
export declare function validateStringLength(value: string, minLength?: number, maxLength?: number): boolean;
/**
 * Date validation
 * @param date - Date to validate
 * @returns boolean - True if date is valid
 */
export declare function validateDate(date: any): boolean;
/**
 * Future date validation
 * @param date - Date to validate
 * @returns boolean - True if date is in the future
 */
export declare function validateFutureDate(date: any): boolean;
/**
 * Past date validation
 * @param date - Date to validate
 * @returns boolean - True if date is in the past
 */
export declare function validatePastDate(date: any): boolean;
/**
 * Array validation
 * @param value - Value to validate
 * @param minLength - Minimum array length (optional)
 * @param maxLength - Maximum array length (optional)
 * @returns boolean - True if value is a valid array
 */
export declare function validateArray(value: any, minLength?: number, maxLength?: number): boolean;
/**
 * Object validation
 * @param value - Value to validate
 * @param requiredKeys - Array of required keys (optional)
 * @returns boolean - True if value is a valid object
 */
export declare function validateObject(value: any, requiredKeys?: string[]): boolean;
/**
 * Sanitize string input
 * @param input - String to sanitize
 * @returns string - Sanitized string
 */
export declare function sanitizeString(input: string): string;
/**
 * Sanitize HTML content
 * @param html - HTML content to sanitize
 * @returns string - Sanitized HTML
 */
export declare function sanitizeHtml(html: string): string;
/**
 * Validate and sanitize input object
 * @param input - Input object to validate and sanitize
 * @param schema - Validation schema
 * @returns object - Validated and sanitized object
 */
export declare function validateAndSanitize(input: any, schema: Record<string, any>): any;
//# sourceMappingURL=validation.d.ts.map