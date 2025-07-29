import React from 'react';
import { Link } from 'react-router-dom';
import { useAIRecommendations } from '../../hooks/useAIRecommendations';

interface AIRecommendedProduct {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  rating: number;
  reviewCount: number;
  category: string;
  brand: string;
}

interface AIRecommendationsProps {
  productId: string;
  viewedProducts?: AIRecommendedProduct[];
  limit?: number;
}

const AIRecommendations: React.FC<AIRecommendationsProps> = ({
  productId,
  viewedProducts,
  limit = 4,
}) => {
  const {
    loading,
    error,
    recommendations,
    recentlyViewed: aiRecentlyViewed,
  } = useAIRecommendations(productId, {
    limit,
    includeRecent: true,
  });

  // Use provided viewedProducts or fallback to AI-suggested recently viewed products
  const displayedRecent = viewedProducts || aiRecentlyViewed;

  const renderProductCard = (product: AIRecommendedProduct) => (
    <Link
      to={`/products/${product.id}`}
      key={product.id}
      className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="aspect-w-1 aspect-h-1 bg-gray-100">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-32 object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=NoImage';
          }}
        />
      </div>

      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{product.name}</h3>

        <div className="flex items-center mt-1">
          <div className="flex items-center">
            <span className="text-yellow-400 text-xs">★</span>
            <span className="ml-1 text-xs text-gray-600">
              {product.rating} ({product.reviewCount})
            </span>
          </div>
        </div>

        <div className="mt-1">
          <span className="text-sm font-bold text-blue-600">${product.price.toFixed(2)}</span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="mt-8">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">AI sizga tavsiya etadi</h2>
        <p className="text-sm text-gray-600 mb-4">
          Sunʼiy intellekt sizning qidiruv va xarid tarixingiz asosida quyidagi mahsulotlarni
          tavsiya qiladi
        </p>
        {loading && (
          <div className="p-4 text-center">
            <span className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded">
              AI tavsiyalar yuklanmoqda...
            </span>
          </div>
        )}
        {error && (
          <div className="p-4 text-center">
            <span className="inline-block px-4 py-2 bg-red-50 text-red-600 rounded">
              Tavsiyalarni yuklashda xatolik yuz berdi
            </span>
          </div>
        )}
        {!loading && !error && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recommendations.map((product: AIRecommendedProduct) => renderProductCard(product))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Yaqinda ko'rilgan mahsulotlar</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {displayedRecent.map((product: AIRecommendedProduct) => renderProductCard(product))}
        </div>
      </div>
    </div>
  );
};

export default AIRecommendations;
