import { Request, Response, NextFunction } from 'express';
export declare class ProductController {
    private productService;
    constructor();
    /**
     * Get all products with pagination and filtering
     */
    getProducts: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get a single product by ID
     */
    getProductById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get a single product by slug
     */
    getProductBySlug: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Create a new product
     */
    createProduct: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Update an existing product
     */
    updateProduct: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Delete a product
     */
    deleteProduct: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Input validation rules
     */
    static validateCreateProduct: any[];
    static validateUpdateProduct: any[];
    static validateGetProducts: any[];
}
//# sourceMappingURL=product.controller.d.ts.map