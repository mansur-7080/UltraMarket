import React from 'react';
import MemoryFinder from '../components/tech/MemoryFinder';
import { Helmet } from 'react-helmet-async';
import './tech-pages.css';

const MemoryFinderPage: React.FC = () => {
  return (
    <div className="memory-finder-page">
      <Helmet>
        <title>Memory Finder - UltraMarket</title>
        <meta
          name="description"
          content="Find the perfect RAM memory for your device. Compatible memory modules for laptops, desktops, servers, and more."
        />
      </Helmet>

      <div className="page-header">
        <div className="container">
          <h1>Memory Finder</h1>
          <p>Find the perfect RAM memory for your device</p>
        </div>
      </div>

      <div className="container">
        <MemoryFinder />
      </div>
    </div>
  );
};

export default MemoryFinderPage;
