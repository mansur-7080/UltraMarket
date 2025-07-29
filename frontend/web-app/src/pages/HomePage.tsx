import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import DailyDeals from '../components/deals/DailyDeals';

const HomePage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>UltraMarket - O'zbekiston E-commerce Platformasi</title>
        <meta name="description" content="O'zbekiston uchun zamonaviy e-commerce platformasi" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-900 mb-6">
              <span className="text-blue-600">Ultra</span>Market{' '}
              <span className="text-green-600">O'zbekiston</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              O'zbekiston uchun mahalliy zamonaviy e-commerce platformasi. Eng yaxshi mahsulotlarni
              qulay narxlarda sotib oling!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                to="/products"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105"
              >
                Mahsulotlarni Ko'rish
              </Link>
              <Link
                to="/register"
                className="bg-white hover:bg-gray-50 text-blue-600 font-semibold py-3 px-8 rounded-lg border-2 border-blue-600 transition duration-300"
              >
                Ro'yxatdan O'tish
              </Link>
            </div>
          </div>

          {/* Daily Deals Section */}
          <div className="mb-16">
            <DailyDeals />
          </div>

          {/* Gaming Zone Banner */}
          <div className="mb-16">
            <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl overflow-hidden shadow-lg">
              <div className="md:flex items-center">
                <div className="md:w-2/3 p-8">
                  <h2 className="text-3xl font-bold text-white mb-4">O'yinlar Zonasi</h2>
                  <p className="text-blue-100 mb-6">
                    Eng so'nggi o'yinlar, gaming kompyuterlar, aksessuarlar va chegirmalar.
                    Zamonaviy geyming tajribasi uchun UltraMarket gaming zonasiga tashrif buyuring.
                  </p>
                  <Link
                    to="/gaming-zone"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300"
                  >
                    O'yinlar Zonasiga O'tish
                  </Link>
                </div>
                <div className="md:w-1/3 p-6 flex justify-center">
                  <svg
                    className="w-40 h-40 text-blue-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Tez Yetkazish</h3>
              <p className="text-gray-600">
                O'zPost va Yandex orqali tez va ishonchli yetkazib berish xizmati
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition duration-300">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Xavfsiz To'lov</h3>
              <p className="text-gray-600">Click, Payme, Uzcard orqali xavfsiz va qulay to'lov</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition duration-300">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">24/7 Qo'llab-quvvatlash</h3>
              <p className="text-gray-600">
                Har doim sizning xizmatingizdamiz, savollaringizga javob beramiz
              </p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-white rounded-2xl p-8 mt-16 shadow-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">10K+</div>
                <div className="text-gray-600">Mahsulotlar</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">50K+</div>
                <div className="text-gray-600">Buyurtmalar</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">100K+</div>
                <div className="text-gray-600">Mijozlar</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">99.9%</div>
                <div className="text-gray-600">Uptime</div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="text-center mt-16">
            <h2 className="text-2xl font-semibold text-gray-900 mb-8">To'lov Usullari</h2>
            <div className="flex justify-center items-center space-x-8 flex-wrap gap-4">
              <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded"></div>
                  <span className="text-lg font-semibold text-blue-600">Click</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Tez va xavfsiz</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-600 rounded"></div>
                  <span className="text-lg font-semibold text-green-600">Payme</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Milliy to'lov tizimi</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-purple-600 rounded"></div>
                  <span className="text-lg font-semibold text-purple-600">Uzcard</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">O'zbekiston kartasi</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-orange-600 rounded"></div>
                  <span className="text-lg font-semibold text-orange-600">Humo</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Humo karta</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-600 rounded"></div>
                  <span className="text-lg font-semibold text-gray-600">Naqd to'lov</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Yetkazganda to'lash</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;
