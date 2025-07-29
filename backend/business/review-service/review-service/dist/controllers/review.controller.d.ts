import { Request, Response } from 'express';
export declare class ReviewController {
    private reviewService;
    constructor();
    getAllReviews: (req: Request, res: Response) => Promise<void>;
    getReviewById: (req: Request, res: Response) => Promise<void>;
    createReview: (req: Request, res: Response) => Promise<void>;
    updateReview: (req: Request, res: Response) => Promise<void>;
    deleteReview: (req: Request, res: Response) => Promise<void>;
    getProductReviews: (req: Request, res: Response) => Promise<void>;
    getProductReviewStats: (req: Request, res: Response) => Promise<void>;
    getUserReviews: (req: Request, res: Response) => Promise<void>;
    getUserReviewStats: (req: Request, res: Response) => Promise<void>;
    voteHelpful: (req: Request, res: Response) => Promise<void>;
    removeHelpfulVote: (req: Request, res: Response) => Promise<void>;
    flagReview: (req: Request, res: Response) => Promise<void>;
    addReply: (req: Request, res: Response) => Promise<void>;
    searchReviews: (req: Request, res: Response) => Promise<void>;
    getFeaturedReviews: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=review.controller.d.ts.map