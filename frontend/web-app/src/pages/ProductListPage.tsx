import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { apiService, Product } from '../services/api';
import AdvancedFilters from '../components/product/AdvancedFilters';

// Simplified product interface for recommended and popular products
interface SimpleProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  inStock: boolean;
  category: string;
  brand: string;
}

interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

const ProductListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: searchParams.get('sortBy') || 'name',
    sortOrder: searchParams.get('sortOrder') || 'asc',
    availability: searchParams.get('availability') === 'true',
    ratings: searchParams.get('ratings') || '',
  });

  // For demo purposes only - simulated recommended products
  const [recommendedProducts, setRecommendedProducts] = useState<SimpleProduct[]>([
    {
      id: 'rec1',
      name: 'Samsung Galaxy S22 Ultra',
      description: 'Flagship smartphone with S Pen',
      price: 1199.99,
      rating: 4.8,
      reviewCount: 1245,
      imageUrl: 'https://via.placeholder.com/300x300?text=Samsung+S22+Ultra',
      inStock: true,
      category: 'smartphones',
      brand: 'Samsung',
    },
    {
      id: 'rec2',
      name: 'Apple MacBook Pro 16',
      description: 'Powerful laptop for professionals',
      price: 2499.99,
      rating: 4.9,
      reviewCount: 892,
      imageUrl: 'https://via.placeholder.com/300x300?text=MacBook+Pro',
      inStock: true,
      category: 'laptops',
      brand: 'Apple',
    },
    {
      id: 'rec3',
      name: 'Sony WH-1000XM4',
      description: 'Premium noise-cancelling headphones',
      price: 349.99,
      rating: 4.7,
      reviewCount: 3456,
      imageUrl: 'https://via.placeholder.com/300x300?text=Sony+WH-1000XM4',
      inStock: true,
      category: 'audio',
      brand: 'Sony',
    },
  ]);

  // Popular in current category - simulated data
  const [popularInCategory, setPopularInCategory] = useState<SimpleProduct[]>([
    {
      id: 'pop1',
      name: 'ASUS ROG Strix G15',
      description: 'Gaming laptop with RTX 3070',
      price: 1599.99,
      rating: 4.6,
      reviewCount: 782,
      imageUrl: 'https://via.placeholder.com/300x300?text=ROG+Strix+G15',
      inStock: true,
      category: 'laptops',
      brand: 'ASUS',
    },
    {
      id: 'pop2',
      name: 'Logitech G Pro X',
      description: 'Gaming keyboard with mechanical switches',
      price: 129.99,
      rating: 4.5,
      reviewCount: 1230,
      imageUrl: 'https://via.placeholder.com/300x300?text=G+Pro+X',
      inStock: true,
      category: 'peripherals',
      brand: 'Logitech',
    },
    {
      id: 'pop3',
      name: 'Razer DeathAdder V2',
      description: 'Ergonomic gaming mouse',
      price: 69.99,
      rating: 4.7,
      reviewCount: 2134,
      imageUrl: 'https://via.placeholder.com/300x300?text=DeathAdder+V2',
      inStock: true,
      category: 'peripherals',
      brand: 'Razer',
    },
  ]);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', page, limit, filters],
    queryFn: async () => {
      // Convert string values to numbers for the API
      const apiFilters = {
        ...filters,
        minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
      };

      const response = await apiService.getProducts(page, limit, apiFilters);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch products');
      }
      return response.data;
    },
  });

  const handleFilterChange = (key: string, value: string | boolean) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    const newParams = new URLSearchParams();
    newParams.set('page', '1'); // Reset to first page when filtering

    Object.entries(newFilters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') {
        newParams.set(k, String(v));
      }
    });

    setSearchParams(newParams);
  };

  const handleAdvancedFilterChange = (advancedFilters: any) => {
    const newFilters = {
      ...filters,
      brand: advancedFilters.checkboxes.brand?.join(',') || '',
      ratings: advancedFilters.checkboxes.ratings?.join(',') || '',
      minPrice: advancedFilters.price.min,
      maxPrice: advancedFilters.price.max,
      availability: advancedFilters.availability,
    };

    setFilters(newFilters);

    const newParams = new URLSearchParams();
    newParams.set('page', '1');

    Object.entries(newFilters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') {
        newParams.set(k, String(v));
      }
    });

    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
  };

  useEffect(() => {
    // Simulate API calls for recommended and popular products
    const fetchRecommendedProducts = async () => {
      const response = await apiService.getRecommendedProducts();
      if (response.success) {
        setRecommendedProducts(response.data);
      }
    };

    const fetchPopularInCategory = async () => {
      const response = await apiService.getPopularInCategory(filters.category);
      if (response.success) {
        setPopularInCategory(response.data);
      }
    };

    fetchRecommendedProducts();
    fetchPopularInCategory();
  }, [filters.category]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Mahsulotlarni yuklashda xato</h2>
        <p className="text-gray-600">
          Iltimos, sahifani yangilab ko'ring yoki keyinroq urinib ko'ring.
        </p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Mahsulotlar - UltraMarket</title>
        <meta name="description" content="UltraMarket do'konidagi barcha mahsulotlar" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Mahsulotlar</h1>
          <p className="text-gray-600">{data?.total || 0} ta mahsulot topildi</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            {/* Advanced Filters */}
            <AdvancedFilters
              onFilterChange={handleAdvancedFilterChange}
              category={filters.category}
            />
          </div>

          {/* Product Grid */}
          <div className="lg:w-3/4">
            {/* Sorting Controls */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 p-4 bg-white rounded-lg shadow-sm">
              <div className="mb-4 md:mb-0">
                <label className="mr-2 text-sm text-gray-600">Saralash:</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Nom bo'yicha</option>
                  <option value="price">Narx bo'yicha</option>
                  <option value="rating">Reyting bo'yicha</option>
                  <option value="newest">Eng yangi</option>
                </select>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  className="ml-2 border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="asc">O'sish tartibida</option>
                  <option value="desc">Kamayish tartibida</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="mr-2 text-sm text-gray-600">Sahifadagi mahsulotlar:</label>
                <select
                  value={limit.toString()}
                  onChange={(e) => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.set('limit', e.target.value);
                    newParams.set('page', '1');
                    setSearchParams(newParams);
                  }}
                  className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="12">12</option>
                  <option value="24">24</option>
                  <option value="48">48</option>
                </select>
              </div>
            </div>

            {data?.products && data.products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {data.products.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="aspect-w-1 aspect-h-1 bg-gray-200">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-48 object-cover"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400">Rasm yo'q</span>
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {product.name}
                        </h3>

                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                          {product.description}
                        </p>

                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-bold text-blue-600">
                            ${product.price.toFixed(2)}
                          </span>
                          <div className="flex items-center">
                            <span className="text-yellow-400">★</span>
                            <span className="text-sm text-gray-600 ml-1">
                              {product.rating.toFixed(1)} ({product.reviewCount})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span
                            className={`text-sm ${product.inStock ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {product.inStock ? 'Mavjud' : 'Tugagan'}
                          </span>

                          <button
                            disabled={!product.inStock}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${
                              product.inStock
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            Savatga qo'shish
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {data.totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1}
                      className="px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Oldingi
                    </button>

                    {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                          pageNum === page
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= data.totalPages}
                      className="px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Keyingi
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Mahsulot topilmadi</h2>
                <p className="text-gray-600">Qidiruv shartlaringizni o'zgartirib ko'ring.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recommended Products - Newegg Style */}
        {recommendedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Sizga tavsiya etilgan mahsulotlar
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recommendedProducts.map((product) => (
                <Link
                  to={`/products/${product.id}`}
                  key={product.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-w-1 aspect-h-1 bg-gray-200">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">Rasm yo'q</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>

                    <div className="flex items-center mb-2">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-300'
                            }`}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="ml-1 text-sm text-gray-600">{product.rating}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-blue-600">
                        ${product.price.toFixed(2)}
                      </span>
                      <span
                        className={`text-sm ${product.inStock ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {product.inStock ? 'Mavjud' : 'Tugagan'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Popular in Category - Newegg Style */}
        {filters.category && popularInCategory.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              "{filters.category}" kategoriyasidagi mashhur mahsulotlar
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {popularInCategory.map((product) => (
                <Link
                  to={`/products/${product.id}`}
                  key={product.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-w-1 aspect-h-1 bg-gray-200">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">Rasm yo'q</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>

                    <div className="flex items-center mb-2">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-300'
                            }`}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="ml-1 text-sm text-gray-600">{product.rating}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-blue-600">
                        ${product.price.toFixed(2)}
                      </span>
                      <span
                        className={`text-sm ${product.inStock ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {product.inStock ? 'Mavjud' : 'Tugagan'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProductListPage;
