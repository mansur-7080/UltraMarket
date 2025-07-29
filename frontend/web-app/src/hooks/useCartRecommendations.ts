import { useState, useEffect } from 'react';
import mlService, { Product } from '../services/MLRecommendationService';

interface CartItem {
  id: string;
  quantity: number;
  // Plus any other cart item properties
}

/**
 * Custom hook for AI-powered cart recommendations similar to Newegg's
 * "Frequently Bought Together" feature
 *
 * @param cartItems - Current items in the cart
 * @param limit - Maximum number of recommendations to return
 * @returns Object containing recommendation data and loading state
 */
export function useCartRecommendations(cartItems: CartItem[], limit = 4) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [recommendations, setRecommendations] = useState<Product[]>([]);

  useEffect(() => {
    const fetchCartRecommendations = async () => {
      // Reset state
      setLoading(true);
      setError(null);

      try {
        if (!cartItems.length) {
          // No recommendations if cart is empty
          setRecommendations([]);
          return;
        }

        // Extract product IDs from cart items
        const productIds = cartItems.map((item) => item.id);

        // Get recommendations from the ML service
        const result = await mlService.getCartRecommendations(productIds, limit);
        setRecommendations(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch cart recommendations'));
        // Fallback to empty array on error
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCartRecommendations();
  }, [cartItems, limit]);

  return {
    loading,
    error,
    recommendations,
  };
}

export default useCartRecommendations;
