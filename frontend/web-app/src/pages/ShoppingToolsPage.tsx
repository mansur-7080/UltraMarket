import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const ShoppingToolsPage: React.FC = () => {
  // Tools configuration
  const tools = [
    {
      id: 'pc-builder',
      name: 'PC Builder',
      description:
        "Kompyuteringizni o'zingiz yasang. Bizning vositamiz barcha qismlarning mosligini tekshiradi.",
      icon: (
        <svg
          className="w-12 h-12 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
          />
        </svg>
      ),
      link: '/pc-builder',
    },
    {
      id: 'pc-upgrader',
      name: 'PC Upgrader',
      description: 'Mavjud kompyuteringiz uchun qulay yangilanishlarni toping.',
      icon: (
        <svg
          className="w-12 h-12 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      ),
      link: '/pc-upgrader',
    },
    {
      id: 'nas-builder',
      name: 'NAS Builder',
      description: "O'zingizning ma'lumotlar saqlash tizimingizni (NAS) yarating.",
      icon: (
        <svg
          className="w-12 h-12 text-purple-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
          />
        </svg>
      ),
      link: '/nas-builder',
    },
    {
      id: 'power-supply-calculator',
      name: 'Power Supply Calculator',
      description: "Kompyuteringiz uchun kerakli quvvat ta'minoti quvvatini hisoblang.",
      icon: (
        <svg
          className="w-12 h-12 text-yellow-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      link: '/power-supply-calculator',
    },
    {
      id: 'memory-finder',
      name: 'Memory Finder',
      description: 'Kompyuteringiz uchun mos xotira (RAM) modullarini toping.',
      icon: (
        <svg
          className="w-12 h-12 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
          />
        </svg>
      ),
      link: '/memory-finder',
    },
    {
      id: 'laptop-finder',
      name: 'Laptop Finder',
      description: 'Ehtiyojlaringizga mos keladigan noutbukni toping.',
      icon: (
        <svg
          className="w-12 h-12 text-indigo-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      link: '/laptop-finder',
    },
  ];

  return (
    <>
      <Helmet>
        <title>Xarid Vositalari | UltraMarket</title>
        <meta
          name="description"
          content="UltraMarket - Xarid jarayonini osonlashtiradigan maxsus vositalar"
        />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Xarid Vositalari</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <p className="text-lg text-gray-700 mb-4">
            UltraMarket xarid vositalari kompyuter qismlarini tanlash, noutbuk topish va boshqa
            xaridlaringizni osonlashtirish uchun mo'ljallangan. Kerakli vositani tanlang va
            xaridingizni boshlang!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              to={tool.link}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow transform hover:scale-105"
            >
              <div className="p-6">
                <div className="flex justify-center mb-4">{tool.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
                  {tool.name}
                </h3>
                <p className="text-gray-600 text-center">{tool.description}</p>
                <div className="mt-6 text-center">
                  <span className="inline-flex items-center justify-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 hover:bg-blue-600 hover:text-white transition-colors">
                    Boshlash
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default ShoppingToolsPage;
