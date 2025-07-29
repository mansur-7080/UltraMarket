import { Request, Response, NextFunction } from 'express';
export declare class ProductController {
    static createProduct(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getProduct(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getProducts(req: Request, res: Response, next: NextFunction): Promise<void>;
    static updateProduct(req: Request, res: Response, next: NextFunction): Promise<void>;
    static deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void>;
    static searchProducts(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getCategories(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getBrands(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getStatistics(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getVendorProducts(req: Request, res: Response, next: NextFunction): Promise<void>;
    static bulkUpdateProducts(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getProductRecommendations(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=product.controller.d.ts.map