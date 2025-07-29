import React from 'react';
import AIRecommendations from '../components/product/AIRecommendations';
import useCartRecommendations from '../hooks/useCartRecommendations';
import mlService from '../services/MLRecommendationService';

// Example Product Detail Page that integrates AI recommendations
const ProductDetailPage: React.FC = () => {
  // This is just a mock product for this example
  const product = {
    id: 'prod123',
    name: 'Samsung Galaxy S23 Ultra',
    description: 'High-end Samsung smartphone with S Pen and 200MP camera',
    price: 1199.99,
    imageUrl: 'https://via.placeholder.com/500x500?text=Samsung+Galaxy+S23+Ultra',
    brand: 'Samsung',
    category: 'smartphones',
    rating: 4.8,
    reviewCount: 2345,
    specs: {
      processor: 'Snapdragon 8 Gen 2',
      ram: '12GB',
      storage: '512GB',
      display: '6.8" Dynamic AMOLED 2X',
      camera: '200MP + 12MP + 10MP + 10MP',
      battery: '5000mAh',
    },
  };

  // Mock cart items for this example
  const cartItems = [{ id: 'prod123', quantity: 1 }];

  // Get cart-based recommendations
  const { loading: cartLoading, recommendations: cartRecommendations } =
    useCartRecommendations(cartItems);

  // Handle add to cart with tracking
  const handleAddToCart = () => {
    // Track the add-to-cart action for the recommendation system
    mlService.trackProductInteraction(product.id, 'add-to-cart');

    // Actual add to cart logic would go here
    // Track cart addition through analytics service
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Product details section */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Product image */}
        <div className="md:w-1/2">
          <img src={product.imageUrl} alt={product.name} className="w-full rounded-lg shadow-md" />
        </div>

        {/* Product info */}
        <div className="md:w-1/2">
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

          <div className="flex items-center mt-2">
            <div className="flex items-center">
              <span className="text-yellow-400">★★★★★</span>
              <span className="ml-1 text-sm text-gray-600">
                {product.rating} ({product.reviewCount} reviews)
              </span>
            </div>
          </div>

          <div className="mt-4">
            <span className="text-2xl font-bold text-blue-600">${product.price.toFixed(2)}</span>
          </div>

          <div className="mt-4">
            <p className="text-gray-700">{product.description}</p>
          </div>

          {/* Specifications */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900">Specifications</h3>
            <ul className="mt-2 space-y-2">
              {Object.entries(product.specs).map(([key, value]) => (
                <li key={key} className="flex justify-between">
                  <span className="text-gray-600 capitalize">{key}</span>
                  <span className="text-gray-900">{value}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Add to cart button */}
          <div className="mt-6">
            <button
              onClick={handleAddToCart}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>

      {/* Frequently bought together section */}
      {!cartLoading && cartRecommendations.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Bought Together</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cartRecommendations.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="aspect-w-1 aspect-h-1 bg-gray-100 mb-4">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://via.placeholder.com/150?text=NoImage';
                    }}
                  />
                </div>
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</h3>
                <p className="mt-2 text-sm font-bold text-blue-600">${item.price.toFixed(2)}</p>
                <button
                  className="mt-2 w-full bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm py-1 px-2 rounded"
                  onClick={() => mlService.trackProductInteraction(item.id, 'add-to-cart')}
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Recommendations section */}
      <AIRecommendations productId={product.id} limit={4} />
    </div>
  );
};

export default ProductDetailPage;
