import React from 'react';
import { Helmet } from 'react-helmet-async';

const ProfilePage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Profil | UltraMarket</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Profil Sahifasi</h1>
          <p className="text-gray-600">Foydalanuvchi profili tez orada qo'shiladi.</p>
        </div>
      </div>
    </>
  );
};

export default ProfilePage; 