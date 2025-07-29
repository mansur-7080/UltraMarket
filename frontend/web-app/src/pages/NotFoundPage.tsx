import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const NotFoundPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>404 - Sahifa topilmadi | UltraMarket</title>
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-blue-600">404</h1>
            <h2 className="text-2xl font-semibold text-gray-900 mt-4">
              Sahifa topilmadi
            </h2>
            <p className="text-gray-600 mt-2">
              Kechirasiz, siz qidirayotgan sahifa mavjud emas.
            </p>
          </div>
          
          <div className="space-y-4">
            <Link
              to="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300"
            >
              Bosh sahifaga qaytish
            </Link>
            
            <div className="text-sm text-gray-500">
              yoki{' '}
              <Link to="/products" className="text-blue-600 hover:text-blue-700">
                mahsulotlarni ko'ring
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage; 