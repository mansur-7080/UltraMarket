import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface DealItem {
  id: string;
  name: string;
  regularPrice: number;
  salePrice: number;
  discountPercentage: number;
  imageUrl: string;
  endTime: string; // ISO date string
}

const DailyDeals: React.FC = () => {
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    // In a real implementation, fetch from API
    const mockDeals: DealItem[] = [
      {
        id: '1',
        name: 'Samsung 990 EVO Plus SSD 2TB PCIe Gen 4',
        regularPrice: 176.99,
        salePrice: 116.99,
        discountPercentage: 33,
        imageUrl: 'https://example.com/samsung-ssd.jpg',
        endTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      },
      {
        id: '2',
        name: 'AMD Ryzen 9 9950X3D - 16-Core 4.3 GHz',
        regularPrice: 699.0,
        salePrice: 664.99,
        discountPercentage: 5,
        imageUrl: 'https://example.com/amd-ryzen.jpg',
        endTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        name: 'ASUS ROG Strix B650E-I Gaming WiFi',
        regularPrice: 299.99,
        salePrice: 199.99,
        discountPercentage: 33,
        imageUrl: 'https://example.com/asus-motherboard.jpg',
        endTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '4',
        name: 'G.SKILL Trident Z5 RGB Series 64GB DDR5 6400',
        regularPrice: 299.99,
        salePrice: 234.99,
        discountPercentage: 22,
        imageUrl: 'https://example.com/gskill-ram.jpg',
        endTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    setTimeout(() => {
      setDeals(mockDeals);
      setLoading(false);
    }, 500);
  }, []);

  // Timer logic
  useEffect(() => {
    if (deals.length === 0) return;

    const timer = setInterval(() => {
      const now = new Date();
      const endTime = new Date(deals[0].endTime);
      const difference = endTime.getTime() - now.getTime();

      if (difference <= 0) {
        clearInterval(timer);
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [deals]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <svg
            className="w-6 h-6 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
              clipRule="evenodd"
            />
          </svg>
          <h2 className="text-xl font-bold">Kunlik Chegirmalar</h2>
        </div>

        <div className="flex items-center space-x-2 text-sm bg-white bg-opacity-20 rounded-lg px-3 py-1">
          <span>Tugash vaqti:</span>
          <div className="flex items-center">
            <div className="bg-white text-blue-600 rounded px-2 py-1 font-mono">
              {String(timeLeft.hours).padStart(2, '0')}
            </div>
            <span className="px-1">:</span>
            <div className="bg-white text-blue-600 rounded px-2 py-1 font-mono">
              {String(timeLeft.minutes).padStart(2, '0')}
            </div>
            <span className="px-1">:</span>
            <div className="bg-white text-blue-600 rounded px-2 py-1 font-mono">
              {String(timeLeft.seconds).padStart(2, '0')}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
        {deals.map((deal) => (
          <Link to={`/products/${deal.id}`} key={deal.id} className="group">
            <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <div className="h-48 bg-gray-100 flex items-center justify-center">
                  {deal.imageUrl ? (
                    <img src={deal.imageUrl} alt={deal.name} className="h-full object-contain" />
                  ) : (
                    <div className="text-gray-400">Rasm yo'q</div>
                  )}
                </div>
                <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-bl">
                  -{deal.discountPercentage}%
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600">
                  {deal.name}
                </h3>

                <div className="mt-2 flex items-center">
                  <span className="text-lg font-bold text-red-600">
                    ${deal.salePrice.toFixed(2)}
                  </span>
                  <span className="ml-2 text-sm text-gray-500 line-through">
                    ${deal.regularPrice.toFixed(2)}
                  </span>
                </div>

                <button className="mt-3 w-full bg-blue-600 text-white rounded-md py-1 text-sm hover:bg-blue-700 transition-colors">
                  Savatga qo'shish
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-gray-50 px-6 py-3 text-center">
        <Link to="/deals" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
          Barcha chegirmalarni ko'rish &rarr;
        </Link>
      </div>
    </div>
  );
};

export default DailyDeals;
