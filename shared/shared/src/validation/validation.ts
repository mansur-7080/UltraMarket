/**
 * Validation utilities for UltraMarket
 * Comprehensive validation functions for user inputs
 */

/**
 * Email validation
 * @param email - Email address to validate
 * @returns boolean - True if email is valid
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Basic email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Check basic format
  if (!emailRegex.test(email)) {
    return false;
  }

  // Check length
  if (email.length > 254) {
    return false;
  }

  // Check for common invalid patterns
  const invalidPatterns = [
    /^\./, // Starts with dot
    /\.$/, // Ends with dot
    /\.\./, // Consecutive dots
    /^[^\s@]+@$/, // Ends with @
    /^@[^\s@]+$/, // Starts with @
  ];

  for (const pattern of invalidPatterns) {
    if (pattern.test(email)) {
      return false;
    }
  }

  return true;
}

/**
 * Password validation
 * @param password - Password to validate
 * @returns boolean - True if password meets security requirements
 */
export function validatePassword(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false;
  }

  // Minimum length
  if (password.length < 8) {
    return false;
  }

  // Maximum length
  if (password.length > 128) {
    return false;
  }

  // Check for required character types
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  // Must have at least 3 of the 4 character types
  const characterTypes = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar];
  const validTypes = characterTypes.filter(Boolean).length;

  if (validTypes < 3) {
    return false;
  }

  // Check for common weak patterns
  const weakPatterns = [
    /^123456/, // Common sequences
    /^password/i, // Common words
    /^qwerty/i,
    /^admin/i,
    /^123456789/,
    /^111111/,
    /^000000/,
  ];

  for (const pattern of weakPatterns) {
    if (pattern.test(password)) {
      return false;
    }
  }

  return true;
}

/**
 * Username validation
 * @param username - Username to validate
 * @returns boolean - True if username is valid
 */
export function validateUsername(username: string): boolean {
  if (!username || typeof username !== 'string') {
    return false;
  }

  // Length check
  if (username.length < 3 || username.length > 30) {
    return false;
  }

  // Allowed characters: letters, numbers, underscores, hyphens
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;

  if (!usernameRegex.test(username)) {
    return false;
  }

  // Cannot start or end with special characters
  if (
    username.startsWith('-') ||
    username.startsWith('_') ||
    username.endsWith('-') ||
    username.endsWith('_')
  ) {
    return false;
  }

  // Check for reserved usernames
  const reservedUsernames = [
    'admin',
    'administrator',
    'root',
    'system',
    'support',
    'help',
    'info',
    'contact',
    'mail',
    'email',
    'user',
    'guest',
    'test',
    'api',
    'www',
    'web',
    'site',
    'home',
    'login',
    'logout',
    'register',
    'signup',
    'signin',
    'auth',
    'security',
    'privacy',
    'terms',
    'conditions',
    'policy',
    'about',
    'contact',
    'help',
  ];

  if (reservedUsernames.includes(username.toLowerCase())) {
    return false;
  }

  return true;
}

/**
 * Phone number validation
 * @param phoneNumber - Phone number to validate
 * @returns boolean - True if phone number is valid
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return false;
  }

  // Remove all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');

  // Check if we have a reasonable number of digits (7-15)
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return false;
  }

  return true;
}

/**
 * URL validation
 * @param url - URL to validate
 * @returns boolean - True if URL is valid
 */
export function validateUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * UUID validation
 * @param uuid - UUID to validate
 * @returns boolean - True if UUID is valid
 */
export function validateUuid(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Integer validation
 * @param value - Value to validate
 * @param min - Minimum value (optional)
 * @param max - Maximum value (optional)
 * @returns boolean - True if value is a valid integer
 */
export function validateInteger(value: any, min?: number, max?: number): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  const num = Number(value);

  if (!Number.isInteger(num)) {
    return false;
  }

  if (min !== undefined && num < min) {
    return false;
  }

  if (max !== undefined && num > max) {
    return false;
  }

  return true;
}

/**
 * String length validation
 * @param value - String to validate
 * @param minLength - Minimum length (optional)
 * @param maxLength - Maximum length (optional)
 * @returns boolean - True if string length is valid
 */
export function validateStringLength(
  value: string,
  minLength?: number,
  maxLength?: number
): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  if (minLength !== undefined && value.length < minLength) {
    return false;
  }

  if (maxLength !== undefined && value.length > maxLength) {
    return false;
  }

  return true;
}

/**
 * Date validation
 * @param date - Date to validate
 * @returns boolean - True if date is valid
 */
export function validateDate(date: any): boolean {
  if (!date) {
    return false;
  }

  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime());
}

/**
 * Future date validation
 * @param date - Date to validate
 * @returns boolean - True if date is in the future
 */
export function validateFutureDate(date: any): boolean {
  if (!validateDate(date)) {
    return false;
  }

  const dateObj = new Date(date);
  const now = new Date();

  return dateObj > now;
}

/**
 * Past date validation
 * @param date - Date to validate
 * @returns boolean - True if date is in the past
 */
export function validatePastDate(date: any): boolean {
  if (!validateDate(date)) {
    return false;
  }

  const dateObj = new Date(date);
  const now = new Date();

  return dateObj < now;
}

/**
 * Array validation
 * @param value - Value to validate
 * @param minLength - Minimum array length (optional)
 * @param maxLength - Maximum array length (optional)
 * @returns boolean - True if value is a valid array
 */
export function validateArray(value: any, minLength?: number, maxLength?: number): boolean {
  if (!Array.isArray(value)) {
    return false;
  }

  if (minLength !== undefined && value.length < minLength) {
    return false;
  }

  if (maxLength !== undefined && value.length > maxLength) {
    return false;
  }

  return true;
}

/**
 * Object validation
 * @param value - Value to validate
 * @param requiredKeys - Array of required keys (optional)
 * @returns boolean - True if value is a valid object
 */
export function validateObject(value: any, requiredKeys?: string[]): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  if (requiredKeys) {
    for (const key of requiredKeys) {
      if (!(key in value)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Sanitize string input
 * @param input - String to sanitize
 * @returns string - Sanitized string
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Sanitize HTML content
 * @param html - HTML content to sanitize
 * @returns string - Sanitized HTML
 */
export function sanitizeHtml(html: string): string {
  if (typeof html !== 'string') {
    return '';
  }

  // Basic HTML sanitization - in production, use a library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
}

/**
 * Validate and sanitize input object
 * @param input - Input object to validate and sanitize
 * @param schema - Validation schema
 * @returns object - Validated and sanitized object
 */
export function validateAndSanitize(input: any, schema: Record<string, any>): any {
  const result: any = {};

  for (const [key, rules] of Object.entries(schema)) {
    const value = input[key];

    // Check if field is required
    if (rules.required && (value === undefined || value === null || value === '')) {
      throw new Error(`${key} is required`);
    }

    // Skip validation if value is not provided and not required
    if (value === undefined || value === null) {
      continue;
    }

    // Type validation
    if (rules.type && typeof value !== rules.type) {
      throw new Error(`${key} must be of type ${rules.type}`);
    }

    // String validation
    if (rules.type === 'string') {
      let sanitizedValue = String(value);

      if (rules.sanitize) {
        sanitizedValue = sanitizeString(sanitizedValue);
      }

      if (rules.minLength && sanitizedValue.length < rules.minLength) {
        throw new Error(`${key} must be at least ${rules.minLength} characters long`);
      }

      if (rules.maxLength && sanitizedValue.length > rules.maxLength) {
        throw new Error(`${key} must be no more than ${rules.maxLength} characters long`);
      }

      if (rules.pattern && !rules.pattern.test(sanitizedValue)) {
        throw new Error(`${key} format is invalid`);
      }

      result[key] = sanitizedValue;
    }

    // Number validation
    if (rules.type === 'number') {
      const numValue = Number(value);

      if (isNaN(numValue)) {
        throw new Error(`${key} must be a valid number`);
      }

      if (rules.min !== undefined && numValue < rules.min) {
        throw new Error(`${key} must be at least ${rules.min}`);
      }

      if (rules.max !== undefined && numValue > rules.max) {
        throw new Error(`${key} must be no more than ${rules.max}`);
      }

      result[key] = numValue;
    }

    // Array validation
    if (rules.type === 'array') {
      if (!Array.isArray(value)) {
        throw new Error(`${key} must be an array`);
      }

      if (rules.minLength && value.length < rules.minLength) {
        throw new Error(`${key} must have at least ${rules.minLength} items`);
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        throw new Error(`${key} must have no more than ${rules.maxLength} items`);
      }

      result[key] = value;
    }

    // Custom validation
    if (rules.validate) {
      const isValid = rules.validate(value);
      if (!isValid) {
        throw new Error(`${key} validation failed`);
      }
    }
  }

  return result;
}
