import { Request, Response } from 'express';
export declare class SearchController {
    private elasticsearchService;
    constructor();
    searchProducts(req: Request, res: Response): Promise<void>;
    getSearchSuggestions(req: Request, res: Response): Promise<void>;
    getPopularQueries(req: Request, res: Response): Promise<void>;
    getSearchFilters(req: Request, res: Response): Promise<void>;
    trackSearchClick(req: Request, res: Response): Promise<void>;
    getSearchAnalytics(req: Request, res: Response): Promise<void>;
    bulkIndexProducts(req: Request, res: Response): Promise<void>;
    clearSearchIndex(req: Request, res: Response): Promise<void>;
    getSearchHealth(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=search.controller.d.ts.map