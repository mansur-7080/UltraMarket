import React, { useState } from 'react';

interface CompetitorPrice {
  storeName: string;
  price: number;
  inStock: boolean;
  logoUrl: string;
  rating: number;
  shippingFee?: number;
  deliveryTime?: string;
  url: string;
}

interface PriceComparisonProps {
  productName: string;
  ourPrice: number;
}

const PriceComparison: React.FC<PriceComparisonProps> = ({ productName, ourPrice }) => {
  // In a real application, this data would come from an API
  const [competitorPrices] = useState<CompetitorPrice[]>([
    {
      storeName: 'GoodMarket',
      price: 1219.99,
      inStock: true,
      logoUrl: 'https://via.placeholder.com/50x20?text=GoodMarket',
      rating: 4.5,
      shippingFee: 0,
      deliveryTime: '2-3 kun',
      url: '#',
    },
    {
      storeName: 'TechShop',
      price: 1189.99,
      inStock: true,
      logoUrl: 'https://via.placeholder.com/50x20?text=TechShop',
      rating: 4.3,
      shippingFee: 10.99,
      deliveryTime: '1-2 kun',
      url: '#',
    },
    {
      storeName: 'OlchaUz',
      price: 1249.99,
      inStock: true,
      logoUrl: 'https://via.placeholder.com/50x20?text=OlchaUz',
      rating: 4.7,
      shippingFee: 0,
      deliveryTime: '3-5 kun',
      url: '#',
    },
    {
      storeName: 'AsaxiyUz',
      price: 1229.99,
      inStock: false,
      logoUrl: 'https://via.placeholder.com/50x20?text=AsaxiyUz',
      rating: 4.4,
      shippingFee: 5.99,
      deliveryTime: '2-4 kun',
      url: '#',
    },
  ]);

  const lowestPrice = Math.min(...competitorPrices.map((item) => item.price), ourPrice);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Narxlar taqqoslash</h3>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Do'kon
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Narx
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Mavjudligi
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Yetkazib berish
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Reyting
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Harakatlar
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Our store first */}
            <tr className="bg-blue-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center">
                    <span className="font-bold text-blue-700">Ultra</span>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">UltraMarket</div>
                    <div className="text-xs text-gray-500">Bizning narx</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div
                  className={`text-sm font-bold ${ourPrice === lowestPrice ? 'text-green-600' : 'text-gray-900'}`}
                >
                  ${ourPrice.toFixed(2)}
                  {ourPrice === lowestPrice && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Eng arzon
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Mavjud
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div>Bepul</div>
                <div className="text-xs">1-2 kun</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex items-center">
                  <span className="text-yellow-400">★</span>
                  <span className="ml-1">4.8</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-md text-sm transition duration-300">
                  Savatga qo'shish
                </button>
              </td>
            </tr>

            {/* Competitor stores */}
            {competitorPrices.map((competitor) => (
              <tr key={competitor.storeName} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <img
                        className="h-10 w-10 object-contain"
                        src={competitor.logoUrl}
                        alt={competitor.storeName}
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {competitor.storeName}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className={`text-sm font-medium ${competitor.price === lowestPrice ? 'text-green-600' : 'text-gray-900'}`}
                  >
                    ${competitor.price.toFixed(2)}
                    {competitor.price === lowestPrice && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Eng arzon
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {competitor.inStock ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Mavjud
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Tugagan
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>
                    {competitor.shippingFee ? `$${competitor.shippingFee.toFixed(2)}` : 'Bepul'}
                  </div>
                  <div className="text-xs">{competitor.deliveryTime}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <span className="text-yellow-400">★</span>
                    <span className="ml-1">{competitor.rating.toFixed(1)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a
                    href={competitor.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-900 hover:underline"
                  >
                    Do'konga o'tish
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <p>* Narxlar {new Date().toLocaleDateString('uz-UZ')} sanasiga yangilangan</p>
        <p>* Yetkazib berish narxi va vaqti taxminiy ma'lumot</p>
      </div>
    </div>
  );
};

export default PriceComparison;
