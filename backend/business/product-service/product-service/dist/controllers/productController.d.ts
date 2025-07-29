import { Request, Response } from 'express';
export declare class ProductController {
    private productService;
    constructor();
    createProduct: (req: Request, res: Response) => Promise<void>;
    getProduct: (req: Request, res: Response) => Promise<void>;
    getProductBySku: (req: Request, res: Response) => Promise<void>;
    updateProduct: (req: Request, res: Response) => Promise<void>;
    deleteProduct: (req: Request, res: Response) => Promise<void>;
    searchProducts: (req: Request, res: Response) => Promise<void>;
    getFeaturedProducts: (req: Request, res: Response) => Promise<void>;
    getRelatedProducts: (req: Request, res: Response) => Promise<void>;
    updateInventory: (req: Request, res: Response) => Promise<void>;
    checkAvailability: (req: Request, res: Response) => Promise<void>;
    createCategory: (req: Request, res: Response) => Promise<void>;
    getCategories: (req: Request, res: Response) => Promise<void>;
    getCategoryBySlug: (req: Request, res: Response) => Promise<void>;
    createReview: (req: Request, res: Response) => Promise<void>;
    getProductReviews: (req: Request, res: Response) => Promise<void>;
    getProductStats: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=productController.d.ts.map