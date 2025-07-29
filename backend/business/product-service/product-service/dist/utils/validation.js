"use strict";
/**
 * Product validation utility
 * Provides comprehensive validation for product data
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateProduct = validateProduct;
exports.validateProductUpdate = validateProductUpdate;
/**
 * Validates a complete product object for creation
 * @param product The product data to validate
 * @returns Array of validation error messages (empty if valid)
 */
function validateProduct(product) {
    const errors = [];
    // Required fields validation
    if (!product.name || product.name.trim() === '') {
        errors.push('Product name is required');
    }
    else if (product.name.length > 255) {
        errors.push('Product name cannot exceed 255 characters');
    }
    if (!product.sku || product.sku.trim() === '') {
        errors.push('Product SKU is required');
    }
    else if (!/^[A-Za-z0-9-_.]+$/.test(product.sku)) {
        errors.push('SKU can only contain alphanumeric characters, hyphens, underscores, and periods');
    }
    if (!product.category || product.category.trim() === '') {
        errors.push('Product category is required');
    }
    // Price validation
    if (product.price === undefined || product.price === null) {
        errors.push('Product price is required');
    }
    else if (typeof product.price !== 'number' || isNaN(product.price)) {
        errors.push('Product price must be a valid number');
    }
    else if (product.price < 0) {
        errors.push('Product price cannot be negative');
    }
    // Original price validation (if provided)
    if (product.originalPrice !== undefined && product.originalPrice !== null) {
        if (typeof product.originalPrice !== 'number' || isNaN(product.originalPrice)) {
            errors.push('Original price must be a valid number');
        }
        else if (product.originalPrice < 0) {
            errors.push('Original price cannot be negative');
        }
    }
    // Discount validation (if provided)
    if (product.discount !== undefined && product.discount !== null) {
        if (typeof product.discount !== 'number' || isNaN(product.discount)) {
            errors.push('Discount must be a valid number');
        }
        else if (product.discount < 0 || product.discount > 100) {
            errors.push('Discount must be between 0 and 100');
        }
    }
    // Stock validation
    if (product.stock === undefined || product.stock === null) {
        errors.push('Product stock is required');
    }
    else if (typeof product.stock !== 'number' || isNaN(product.stock)) {
        errors.push('Product stock must be a valid number');
    }
    else if (product.stock < 0) {
        errors.push('Product stock cannot be negative');
    }
    // Images validation (if provided)
    if (product.images) {
        if (!Array.isArray(product.images)) {
            errors.push('Product images must be an array');
        }
        else {
            const mainImageCount = product.images.filter((img) => img.isMain).length;
            if (mainImageCount > 1) {
                errors.push('Only one image can be marked as main');
            }
            for (let i = 0; i < product.images.length; i++) {
                const img = product.images[i];
                if (!img.url || typeof img.url !== 'string') {
                    errors.push(`Image at index ${i} is missing a valid URL`);
                }
            }
        }
    }
    // Specifications validation (if provided)
    if (product.specifications && typeof product.specifications !== 'object') {
        errors.push('Product specifications must be an object');
    }
    // Tags validation (if provided)
    if (product.tags) {
        if (!Array.isArray(product.tags)) {
            errors.push('Product tags must be an array');
        }
        else {
            for (let i = 0; i < product.tags.length; i++) {
                if (typeof product.tags[i] !== 'string') {
                    errors.push(`Tag at index ${i} must be a string`);
                }
            }
        }
    }
    // SEO fields validation (if provided)
    if (product.seoTitle && product.seoTitle.length > 60) {
        errors.push('SEO title should not exceed 60 characters for optimal display in search results');
    }
    if (product.seoDescription && product.seoDescription.length > 160) {
        errors.push('SEO description should not exceed 160 characters for optimal display in search results');
    }
    // Slug validation (if provided)
    if (product.slug && !/^[a-z0-9-]+$/.test(product.slug)) {
        errors.push('Slug must contain only lowercase letters, numbers, and hyphens');
    }
    return errors;
}
/**
 * Validates a partial product object for updates
 * Less strict than complete validation
 * @param product The partial product data to validate
 * @returns Array of validation error messages (empty if valid)
 */
function validateProductUpdate(product) {
    const errors = [];
    // Name validation (if provided)
    if (product.name !== undefined) {
        if (product.name.trim() === '') {
            errors.push('Product name cannot be empty');
        }
        else if (product.name.length > 255) {
            errors.push('Product name cannot exceed 255 characters');
        }
    }
    // SKU validation (if provided)
    if (product.sku !== undefined) {
        if (product.sku.trim() === '') {
            errors.push('Product SKU cannot be empty');
        }
        else if (!/^[A-Za-z0-9-_.]+$/.test(product.sku)) {
            errors.push('SKU can only contain alphanumeric characters, hyphens, underscores, and periods');
        }
    }
    // Price validation (if provided)
    if (product.price !== undefined) {
        if (typeof product.price !== 'number' || isNaN(product.price)) {
            errors.push('Product price must be a valid number');
        }
        else if (product.price < 0) {
            errors.push('Product price cannot be negative');
        }
    }
    // Original price validation (if provided)
    if (product.originalPrice !== undefined) {
        if (typeof product.originalPrice !== 'number' || isNaN(product.originalPrice)) {
            errors.push('Original price must be a valid number');
        }
        else if (product.originalPrice < 0) {
            errors.push('Original price cannot be negative');
        }
    }
    // Discount validation (if provided)
    if (product.discount !== undefined) {
        if (typeof product.discount !== 'number' || isNaN(product.discount)) {
            errors.push('Discount must be a valid number');
        }
        else if (product.discount < 0 || product.discount > 100) {
            errors.push('Discount must be between 0 and 100');
        }
    }
    // Stock validation (if provided)
    if (product.stock !== undefined) {
        if (typeof product.stock !== 'number' || isNaN(product.stock)) {
            errors.push('Product stock must be a valid number');
        }
        else if (product.stock < 0) {
            errors.push('Product stock cannot be negative');
        }
    }
    // Images validation (if provided)
    if (product.images !== undefined) {
        if (!Array.isArray(product.images)) {
            errors.push('Product images must be an array');
        }
        else {
            const mainImageCount = product.images.filter((img) => img.isMain).length;
            if (mainImageCount > 1) {
                errors.push('Only one image can be marked as main');
            }
            for (let i = 0; i < product.images.length; i++) {
                const img = product.images[i];
                if (!img.url || typeof img.url !== 'string') {
                    errors.push(`Image at index ${i} is missing a valid URL`);
                }
            }
        }
    }
    // Slug validation (if provided)
    if (product.slug !== undefined && !/^[a-z0-9-]+$/.test(product.slug)) {
        errors.push('Slug must contain only lowercase letters, numbers, and hyphens');
    }
    return errors;
}
exports.default = {
    validateProduct,
    validateProductUpdate,
};
//# sourceMappingURL=validation.js.map