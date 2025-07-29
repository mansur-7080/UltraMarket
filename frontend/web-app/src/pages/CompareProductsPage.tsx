import React from 'react';
import { Helmet } from 'react-helmet-async';
import CompareProducts from '../components/product/CompareProducts';

const CompareProductsPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Mahsulotlarni Taqqoslash | UltraMarket</title>
        <meta
          name="description"
          content="O'zbekiston uchun zamonaviy e-commerce platformasi - mahsulotlarni taqqoslash"
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Mahsulotlarni Taqqoslash</h1>
        <CompareProducts />
      </div>
    </>
  );
};

export default CompareProductsPage;
