import { Request, Response, NextFunction } from 'express';
export declare class CategoryController {
    private categoryService;
    constructor();
    /**
     * Get all categories with pagination and filtering
     */
    getCategories: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get category tree
     */
    getCategoryTree: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get a single category by ID
     */
    getCategoryById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get a single category by slug
     */
    getCategoryBySlug: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Create a new category
     */
    createCategory: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Update an existing category
     */
    updateCategory: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Delete a category
     */
    deleteCategory: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Input validation rules
     */
    static validateCreateCategory: any[];
    static validateUpdateCategory: any[];
    static validateGetCategories: any[];
}
//# sourceMappingURL=category.controller.d.ts.map