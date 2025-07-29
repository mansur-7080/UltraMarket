import { Redis } from 'ioredis';
interface RecommendationRequest {
    userId: string;
    context: {
        page: string;
        sessionId: string;
        currentProduct?: string;
        cartItems?: string[];
        searchQuery?: string;
    };
    type: 'personalized' | 'similar' | 'trending' | 'collaborative' | 'content-based';
    limit: number;
    filters?: {
        category?: string;
        priceRange?: {
            min: number;
            max: number;
        };
        brand?: string;
        features?: string[];
    };
}
interface RecommendationResult {
    productId: string;
    score: number;
    reason: string;
    confidence: number;
    type: string;
    metadata: {
        algorithm: string;
        factors: string[];
        explanation: string;
    };
}
export declare class RecommendationEngineService {
    private readonly logger;
    private models;
    private isTraining;
    private redis;
    private userRepository;
    private productRepository;
    private orderRepository;
    private analyticsRepository;
    constructor(redis?: Redis, userRepository?: any, productRepository?: any, orderRepository?: any, analyticsRepository?: any);
    /**
     * Get personalized recommendations for a user
     */
    getRecommendations(request: RecommendationRequest): Promise<RecommendationResult[]>;
    /**
     * Get personalized recommendations using ML model
     */
    private getPersonalizedRecommendations;
    /**
     * Get similar product recommendations
     */
    private getSimilarProductRecommendations;
    /**
     * Get trending recommendations
     */
    private getTrendingRecommendations;
    /**
     * Get collaborative filtering recommendations
     */
    private getCollaborativeRecommendations;
    /**
     * Get content-based recommendations
     */
    private getContentBasedRecommendations;
    /**
     * Train ML models
     */
    trainModels(): Promise<void>;
    /**
     * Initialize ML models
     */
    private initializeModels;
    /**
     * Load or create ML model
     */
    private loadOrCreateModel;
    /**
     * Create new ML model
     */
    private createNewModel;
    /**
     * Train personalized model
     */
    private trainPersonalizedModel;
    /**
     * Train similarity model
     */
    private trainSimilarityModel;
    /**
     * Train trending model
     */
    private trainTrendingModel;
    private getUserProfile;
    private buildUserProfile;
    private getProductFeatures;
    private createUserFeatureVector;
    private createProductFeatureVector;
    private calculateProductSimilarity;
    private cosineSimilarity;
    private calculateUserRelevance;
    private getTrendingProducts;
    private findSimilarUsers;
    private getUserPurchasedProducts;
    private calculateCategoryScore;
    private calculateBrandScore;
    private calculatePriceScore;
    private calculateFeatureScore;
    private applyBusinessRules;
    private trackRecommendationEvent;
    private extractPreferredCategories;
    private extractPreferredBrands;
    private extractPriceRange;
    private extractPreferredFeatures;
    private extractViewHistory;
    private extractSearchHistory;
    private extractClickHistory;
    private extractCartHistory;
    private getPersonalizedTrainingData;
    private prepareTrainingData;
}
export {};
//# sourceMappingURL=recommendation-engine.service.d.ts.map