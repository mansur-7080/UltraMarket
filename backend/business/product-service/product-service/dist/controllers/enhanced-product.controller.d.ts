/**
 * Enhanced Product Controller
 * Exposes Enhanced Product Service functionality through REST API endpoints
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Controller for product-related endpoints
 */
export declare class ProductController {
    /**
     * Get products with filtering and pagination
     * GET /products
     */
    static getProducts: any[];
    /**
     * Get a product by ID
     * GET /products/:id
     */
    static getProductById: any[];
    /**
     * Get a product by slug
     * GET /products/slug/:slug
     */
    static getProductBySlug: any[];
    /**
     * Search products
     * GET /products/search
     */
    static searchProducts: any[];
    /**
     * Create a product
     * POST /products
     */
    static createProduct: any[];
    /**
     * Update a product
     * PUT /products/:id
     */
    static updateProduct: any[];
    /**
     * Delete a product
     * DELETE /products/:id
     */
    static deleteProduct: any[];
}
/**
 * Error handler middleware
 */
export declare const productErrorHandler: (err: Error, req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
//# sourceMappingURL=enhanced-product.controller.d.ts.map