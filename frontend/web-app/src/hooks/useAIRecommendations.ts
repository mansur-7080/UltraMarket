import { useState, useEffect } from 'react';
import mlService, { Product } from '../services/MLRecommendationService';

interface RecommendationOptions {
  limit?: number;
  includeRecent?: boolean;
  algorithm?: 'collaborative' | 'content-based' | 'hybrid';
  userToken?: string;
}

/**
 * Custom hook for AI-powered product recommendations similar to Newegg's recommendation engine
 *
 * @param productId - Current product ID to base recommendations on
 * @param options - Recommendation configuration options
 * @returns Object containing recommendation data and loading state
 */
export function useAIRecommendations(
  productId: string | null,
  options: RecommendationOptions = {}
) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  // Default options
  const { limit = 4, includeRecent = true, algorithm = 'hybrid', userToken } = options;

  useEffect(() => {
    const fetchRecommendations = async () => {
      // Reset state
      setLoading(true);
      setError(null);

      try {
        if (!productId) {
          throw new Error('Product ID is required for recommendations');
        }

        // Track the view for this product
        await mlService.trackProductInteraction(productId, 'view', userToken);

        // Get recommendations from the ML service
        const result = await mlService.getRecommendations({
          productId,
          limit,
          algorithm,
          userId: userToken,
        });

        setRecommendations(result.recommendations);

        if (includeRecent) {
          setRecentlyViewed(result.recentlyViewed);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch recommendations'));
        // Fallback to empty arrays on error
        setRecommendations([]);
        setRecentlyViewed([]);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch when we have a productId
    if (productId) {
      fetchRecommendations();
    } else {
      setLoading(false);
    }
  }, [productId, limit, includeRecent, algorithm, userToken]);

  return {
    loading,
    error,
    recommendations,
    recentlyViewed,
  };
}
