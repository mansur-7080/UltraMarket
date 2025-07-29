import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  specifications: { [key: string]: any };
  rating: number;
  reviews: number;
}

// This would come from your Redux store in a real implementation
interface CompareState {
  products: Product[];
}

const CompareProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  // Mock data for demonstration
  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'Intel Core i7-12700K',
      brand: 'Intel',
      price: 379.99,
      image: 'https://example.com/i7-12700k.jpg',
      specifications: {
        cores: 12,
        threads: 20,
        baseFrequency: '3.6 GHz',
        turboFrequency: '5.0 GHz',
        tdp: 125,
        socket: 'LGA 1700',
      },
      rating: 4.8,
      reviews: 245,
    },
    {
      id: '2',
      name: 'AMD Ryzen 9 5900X',
      brand: 'AMD',
      price: 349.99,
      image: 'https://example.com/ryzen-5900x.jpg',
      specifications: {
        cores: 12,
        threads: 24,
        baseFrequency: '3.7 GHz',
        turboFrequency: '4.8 GHz',
        tdp: 105,
        socket: 'AM4',
      },
      rating: 4.9,
      reviews: 389,
    },
  ];

  useEffect(() => {
    setLoading(true);
    // In a real implementation, you would fetch from your API or Redux store
    // For now, we'll just use the mock data with a delay to simulate network fetch
    setTimeout(() => {
      setProducts(mockProducts);
      setLoading(false);
    }, 500);
  }, []);

  // Function to remove a product from comparison
  const removeProduct = (productId: string) => {
    setProducts(products.filter((product) => product.id !== productId));
  };

  // Get all unique specification keys from all products
  const getAllSpecKeys = () => {
    const allKeys = new Set<string>();
    products.forEach((product) => {
      Object.keys(product.specifications).forEach((key) => {
        allKeys.add(key);
      });
    });
    return Array.from(allKeys);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Taqqoslash uchun mahsulotlar yo'q
        </h2>
        <p className="text-gray-600 mb-6">
          Mahsulotlarni taqqoslash uchun, avval taqqoslash ro'yxatiga qo'shing.
        </p>
        <button
          onClick={() => navigate('/products')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
        >
          Mahsulotlarni ko'rish
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Mahsulotlarni taqqoslash
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Xususiyatlar
              </th>
              {products.map((product) => (
                <th key={product.id} className="px-6 py-3 bg-gray-50 text-center">
                  <div className="relative">
                    <button
                      onClick={() => removeProduct(product.id)}
                      className="absolute top-0 right-0 text-red-500 hover:text-red-700"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Product name row */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Nomi</td>
              {products.map((product) => (
                <td key={product.id} className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                </td>
              ))}
            </tr>

            {/* Image row */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Rasm</td>
              {products.map((product) => (
                <td key={product.id} className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex justify-center">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-24 w-24 object-contain"
                    />
                  </div>
                </td>
              ))}
            </tr>

            {/* Brand row */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Brand</td>
              {products.map((product) => (
                <td key={product.id} className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="text-sm text-gray-900">{product.brand}</div>
                </td>
              ))}
            </tr>

            {/* Price row */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Narxi</td>
              {products.map((product) => (
                <td key={product.id} className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="text-sm font-bold text-blue-600">${product.price.toFixed(2)}</div>
                </td>
              ))}
            </tr>

            {/* Rating row */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Reyting</td>
              {products.map((product) => (
                <td key={product.id} className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center">
                    <div className="flex items-center">
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
                    <span className="ml-1 text-sm text-gray-600">({product.reviews})</span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Specifications rows */}
            {getAllSpecKeys().map((key) => (
              <tr key={key}>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                </td>
                {products.map((product) => (
                  <td key={product.id} className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">
                      {product.specifications[key] ? product.specifications[key].toString() : '-'}
                    </div>
                  </td>
                ))}
              </tr>
            ))}

            {/* Add to cart row */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Amallar</td>
              {products.map((product) => (
                <td key={product.id} className="px-6 py-4 whitespace-nowrap text-center">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200">
                    Savatga qo'shish
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompareProducts;
