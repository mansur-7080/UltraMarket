import React from 'react';
import NASBuilder from '../components/tech/NASBuilder';
import { Helmet } from 'react-helmet-async';
import './tech-pages.css';

const NASBuilderPage: React.FC = () => {
  return (
    <div className="nas-builder-page">
      <Helmet>
        <title>NAS Builder - UltraMarket</title>
        <meta
          name="description"
          content="Build your perfect Network Attached Storage system with our NAS Builder tool. Choose compatible components and create your ideal storage solution."
        />
      </Helmet>

      <div className="page-header">
        <div className="container">
          <h1>NAS Builder</h1>
          <p>Create your perfect Network Attached Storage system</p>
        </div>
      </div>

      <div className="container">
        <NASBuilder />
      </div>
    </div>
  );
};

export default NASBuilderPage;
