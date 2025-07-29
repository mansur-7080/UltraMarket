import React from 'react';
import { Helmet } from 'react-helmet-async';

const OrderHistoryPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Buyurtmalar tarixi | UltraMarket</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Buyurtmalar Tarixi</h1>
          <p className="text-gray-600">Buyurtmalar tarixi tez orada qo'shiladi.</p>
        </div>
      </div>
    </>
  );
};

export default OrderHistoryPage; 