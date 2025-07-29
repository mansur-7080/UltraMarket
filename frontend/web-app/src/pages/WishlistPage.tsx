import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  brand: string;
  inStock: boolean;
}

interface WishlistItem {
  product: Product;
  dateAdded: string;
}

const WishlistPage: React.FC = () => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Mock data for demonstration
  const mockWishlistItems: WishlistItem[] = [
    {
      product: {
        id: '1',
        name: 'Samsung Galaxy S21',
        price: 799.99,
        image: 'https://example.com/galaxy-s21.jpg',
        brand: 'Samsung',
        inStock: true,
      },
      dateAdded: '2023-05-15T10:30:00Z',
    },
    {
      product: {
        id: '2',
        name: 'Apple MacBook Pro 16"',
        price: 2399.99,
        image: 'https://example.com/macbook-pro.jpg',
        brand: 'Apple',
        inStock: false,
      },
      dateAdded: '2023-05-10T14:45:00Z',
    },
    {
      product: {
        id: '3',
        name: 'Sony WH-1000XM4 Wireless Headphones',
        price: 349.99,
        image: 'https://example.com/sony-headphones.jpg',
        brand: 'Sony',
        inStock: true,
      },
      dateAdded: '2023-05-20T09:15:00Z',
    },
  ];

  useEffect(() => {
    // Simulate API call to fetch wishlist items
    setTimeout(() => {
      setWishlistItems(mockWishlistItems);
      setLoading(false);
    }, 800);
  }, []);

  const removeFromWishlist = (productId: string) => {
    setWishlistItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
    toast.success("Mahsulot sevimlilar ro'yxatidan o'chirildi");
  };

  const addToCart = (product: Product) => {
    // In a real implementation, this would dispatch to your cart redux store
    toast.success(`${product.name} savatga qo'shildi`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Sevimlilar ro'yxati | UltraMarket</title>
        <meta name="description" content="UltraMarket sevimli mahsulotlaringiz ro'yxati" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Sevimlilar ro'yxati</h1>

        {wishlistItems.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Sevimlilar ro'yxatingiz bo'sh
            </h2>
            <p className="text-gray-600 mb-6">
              Sizga yoqqan mahsulotlarni sevimlilar ro'yxatiga qo'shing
            </p>
            <button
              onClick={() => navigate('/products')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
            >
              Mahsulotlarni ko'rish
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mahsulot
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Narx
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qo'shilgan sana
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mavjudligi
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {wishlistItems.map((item) => (
                  <tr key={item.product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-16 w-16">
                          <img
                            className="h-16 w-16 object-cover rounded"
                            src={item.product.image}
                            alt={item.product.name}
                          />
                        </div>
                        <div className="ml-4">
                          <div
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                            onClick={() => navigate(`/products/${item.product.id}`)}
                          >
                            {item.product.name}
                          </div>
                          <div className="text-sm text-gray-500">{item.product.brand}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        ${item.product.price.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(item.dateAdded)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.product.inStock ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Mavjud
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Mavjud emas
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => addToCart(item.product)}
                        disabled={!item.product.inStock}
                        className={`mr-3 ${
                          item.product.inStock
                            ? 'text-blue-600 hover:text-blue-900'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Savatga qo'shish
                      </button>
                      <button
                        onClick={() => removeFromWishlist(item.product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        O'chirish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default WishlistPage;
