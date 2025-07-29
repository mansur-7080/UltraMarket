import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import PriceAlert from '../components/product/PriceAlert';
import ProductReviews from '../components/product/ProductReviews';
import ProductQuestions from '../components/product/ProductQuestions';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  brand: string;
  category: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  specifications: Record<string, string>;
}

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  inStock: boolean;
}

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [frequentlyBoughtTogether, setFrequentlyBoughtTogether] = useState<RelatedProduct[]>([]);
  const [selectedBundleProducts, setSelectedBundleProducts] = useState<{ [key: string]: boolean }>(
    {}
  );

  // Mock data for demonstration
  useEffect(() => {
    // Simulate API call to fetch product details
    setTimeout(() => {
      setProduct({
        id: id || '1',
        name: 'Samsung Galaxy S21 Ultra 5G',
        description:
          "Samsung Galaxy S21 Ultra 5G | Designed with a unique contour-cut camera to create a revolution in photography — letting you capture cinematic 8K video and snap epic stills, all in one go. And with Galaxy's fastest chip, strongest glass, 5G and an all-day battery, Ultra easily lives up to its name.",
        price: 1199.99,
        images: [
          'https://example.com/galaxy-s21-ultra-1.jpg',
          'https://example.com/galaxy-s21-ultra-2.jpg',
          'https://example.com/galaxy-s21-ultra-3.jpg',
        ],
        brand: 'Samsung',
        category: 'Smartphones',
        rating: 4.8,
        reviewCount: 256,
        inStock: true,
        specifications: {
          Display: '6.8" Dynamic AMOLED 2X',
          Processor: 'Exynos 2100 / Snapdragon 888',
          RAM: '12GB',
          Storage: '256GB',
          Camera: '108MP + 10MP + 10MP + 12MP',
          Battery: '5000mAh',
          OS: 'Android 11',
        },
      });

      // Simulated related products data
      setRelatedProducts([
        {
          id: '2',
          name: 'Samsung Galaxy S21 5G',
          price: 799.99,
          imageUrl: 'https://via.placeholder.com/150?text=S21',
          inStock: true,
        },
        {
          id: '3',
          name: 'Samsung Galaxy Note 20 Ultra',
          price: 1099.99,
          imageUrl: 'https://via.placeholder.com/150?text=Note20',
          inStock: true,
        },
        {
          id: '4',
          name: 'iPhone 13 Pro Max',
          price: 1099.99,
          imageUrl: 'https://via.placeholder.com/150?text=iPhone13',
          inStock: false,
        },
      ]);

      // Simulated frequently bought together products
      setFrequentlyBoughtTogether([
        {
          id: '5',
          name: 'Samsung Galaxy Buds Pro',
          price: 199.99,
          imageUrl: 'https://via.placeholder.com/150?text=GalaxyBuds',
          inStock: true,
        },
        {
          id: '6',
          name: 'Samsung 45W Super Fast Charger',
          price: 49.99,
          imageUrl: 'https://via.placeholder.com/150?text=Charger',
          inStock: true,
        },
        {
          id: '7',
          name: 'Samsung Galaxy S21 Ultra Case',
          price: 29.99,
          imageUrl: 'https://via.placeholder.com/150?text=Case',
          inStock: true,
        },
      ]);

      // Initialize all bundle products as selected by default
      const initialBundleSelection: { [key: string]: boolean } = {};
      frequentlyBoughtTogether.forEach((item) => {
        initialBundleSelection[item.id] = true;
      });
      setSelectedBundleProducts(initialBundleSelection);

      setLoading(false);
    }, 1000);
  }, [id]);

  const handleAddToCart = () => {
    // In a real app, this would dispatch to your cart redux store
    toast.success(`${quantity} dona ${product?.name} savatga qo'shildi`);
  };

  const handleAddToWishlist = () => {
    toast.success(`${product?.name} sevimlilar ro'yxatiga qo'shildi`);
  };

  const handleBundleProductSelect = (productId: string, selected: boolean) => {
    setSelectedBundleProducts((prev) => ({
      ...prev,
      [productId]: selected,
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Mahsulot topilmadi</h1>
          <p className="text-gray-600">Kechirasiz, siz izlayotgan mahsulot topilmadi.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{product.name} | UltraMarket</title>
        <meta name="description" content={product.description.substring(0, 160)} />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            {/* Product Images */}
            <div className="md:w-1/2 p-6">
              <div className="mb-4 h-96 overflow-hidden rounded-lg">
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`cursor-pointer border-2 rounded-md h-20 w-20 flex-shrink-0 ${
                      index === selectedImage ? 'border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="md:w-1/2 p-6">
              <div className="mb-2">
                <span className="text-sm text-blue-600 font-medium">{product.brand}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>

              <div className="flex items-center mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`h-5 w-5 ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">{product.reviewCount} ta sharh</span>
              </div>

              <div className="mb-6">
                <span className="text-3xl font-bold text-gray-900">
                  ${product.price.toFixed(2)}
                </span>
                <div className="flex items-center mt-2 space-x-2">
                  <PriceAlert
                    productId={product.id}
                    productName={product.name}
                    currentPrice={product.price}
                  />
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>

              <div className="mb-6">
                {product.inStock ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <svg
                      className="h-4 w-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Mavjud
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    <svg
                      className="h-4 w-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Sotuvda mavjud emas
                  </span>
                )}
              </div>

              {product.inStock && (
                <div className="flex items-center mb-6">
                  <div className="flex items-center border border-gray-300 rounded-md mr-4">
                    <button
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      className="px-3 py-1 text-gray-600 hover:text-gray-800"
                    >
                      -
                    </button>
                    <input
                      type="text"
                      value={quantity}
                      readOnly
                      className="w-12 text-center border-none focus:outline-none"
                    />
                    <button
                      onClick={() => setQuantity((prev) => prev + 1)}
                      className="px-3 py-1 text-gray-600 hover:text-gray-800"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md transition duration-200"
                  >
                    Savatga qo'shish
                  </button>
                  <button
                    onClick={handleAddToWishlist}
                    className="ml-4 p-2 border border-gray-300 rounded-md hover:bg-gray-100 transition duration-200"
                    aria-label="Add to wishlist"
                  >
                    <svg
                      className="h-6 w-6 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </button>
                </div>
              )}

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Xususiyatlar</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-sm text-gray-500">{key}</span>
                      <span className="text-sm font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Frequently Bought Together - Newegg Style */}
          {frequentlyBoughtTogether.length > 0 && (
            <div className="mt-12 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Birga ko'pincha sotib olinadigan mahsulotlar
              </h2>

              <div className="flex flex-col md:flex-row gap-8">
                {/* Product Images with Plus Signs */}
                <div className="flex items-center flex-wrap gap-2 mb-6 md:mb-0 md:w-1/2">
                  <div className="w-20 h-20 md:w-24 md:h-24 border border-gray-200 rounded-md overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://via.placeholder.com/150?text=Product';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <span className="text-gray-400 text-xs">No image</span>
                      </div>
                    )}
                  </div>

                  {frequentlyBoughtTogether.map((item) => (
                    <React.Fragment key={item.id}>
                      <div className="flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                      </div>
                      <div className="w-20 h-20 md:w-24 md:h-24 border border-gray-200 rounded-md overflow-hidden">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://via.placeholder.com/150?text=Accessory';
                          }}
                        />
                      </div>
                    </React.Fragment>
                  ))}
                </div>

                {/* Product Selection List */}
                <div className="md:w-1/2">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="main-product"
                        checked
                        disabled
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="main-product" className="ml-3 block text-gray-900">
                        <span className="font-medium">{product.name}</span>
                        <span className="block text-gray-500">${product.price.toFixed(2)}</span>
                      </label>
                    </div>

                    {frequentlyBoughtTogether.map((item) => (
                      <div key={item.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`bundle-${item.id}`}
                          checked={selectedBundleProducts[item.id] || false}
                          onChange={(e) => handleBundleProductSelect(item.id, e.target.checked)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`bundle-${item.id}`} className="ml-3 block text-gray-900">
                          <span className="font-medium">{item.name}</span>
                          <span className="block text-gray-500">${item.price.toFixed(2)}</span>
                        </label>
                      </div>
                    ))}

                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium">Jami:</span>
                        <span className="text-2xl font-bold text-blue-600">
                          $
                          {(
                            product.price +
                            frequentlyBoughtTogether.reduce(
                              (sum, item) =>
                                selectedBundleProducts[item.id] ? sum + item.price : sum,
                              0
                            )
                          ).toFixed(2)}
                        </span>
                      </div>

                      <button
                        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg transition duration-300 flex items-center justify-center"
                        onClick={() => {
                          toast.success("Tanlanganlar savatga qo'shildi!");
                        }}
                      >
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        Hammasini savatga qo'shish
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">O'xshash mahsulotlar</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {relatedProducts.map((product) => (
                  <Link
                    to={`/products/${product.id}`}
                    key={product.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="aspect-w-1 aspect-h-1 bg-gray-200">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://via.placeholder.com/300x300?text=No+Image';
                        }}
                      />
                    </div>

                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-blue-600">
                          ${product.price.toFixed(2)}
                        </span>
                        <span className={product.inStock ? 'text-green-600' : 'text-red-600'}>
                          {product.inStock ? 'Mavjud' : 'Tugagan'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Customer Reviews Section */}
          {product && (
            <ProductReviews
              productId={product.id}
              averageRating={product.rating}
              reviewCount={product.reviewCount}
            />
          )}

          {/* Questions and Answers Section */}
          {product && <ProductQuestions productId={product.id} />}
        </div>
      </div>
    </>
  );
};

export default ProductDetailPage;
