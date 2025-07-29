import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

interface Game {
  id: string;
  title: string;
  coverImage: string;
  price: number;
  salePrice?: number;
  platform: string;
  releaseDate: string;
  publisher: string;
  rating: number;
}

interface GameBundle {
  id: string;
  title: string;
  coverImage: string;
  games: string[];
  price: number;
  salePrice?: number;
}

const GamingZonePage: React.FC = () => {
  // Mock data for demonstration
  const [featuredGames] = useState<Game[]>([
    {
      id: '1',
      title: 'Cyberpunk 2077',
      coverImage: 'https://example.com/cyberpunk-2077.jpg',
      price: 59.99,
      salePrice: 39.99,
      platform: 'PC Digital Download',
      releaseDate: '2020-12-10',
      publisher: 'CD Projekt RED',
      rating: 4.2,
    },
    {
      id: '2',
      title: 'Elden Ring',
      coverImage: 'https://example.com/elden-ring.jpg',
      price: 59.99,
      platform: 'PC Digital Download',
      releaseDate: '2022-02-25',
      publisher: 'Bandai Namco',
      rating: 4.8,
    },
    {
      id: '3',
      title: 'Call of Duty: Modern Warfare III',
      coverImage: 'https://example.com/cod-mw3.jpg',
      price: 69.99,
      salePrice: 49.99,
      platform: 'PC Digital Download',
      releaseDate: '2023-11-10',
      publisher: 'Activision',
      rating: 4.1,
    },
    {
      id: '4',
      title: 'Grand Theft Auto V',
      coverImage: 'https://example.com/gta-v.jpg',
      price: 29.99,
      salePrice: 14.99,
      platform: 'PC Digital Download',
      releaseDate: '2015-04-14',
      publisher: 'Rockstar Games',
      rating: 4.7,
    },
  ]);

  const [gameBundles] = useState<GameBundle[]>([
    {
      id: 'b1',
      title: 'Ultimate RPG Bundle',
      coverImage: 'https://example.com/rpg-bundle.jpg',
      games: ['The Witcher 3: Wild Hunt', 'Skyrim Special Edition', 'Fallout 4'],
      price: 119.99,
      salePrice: 59.99,
    },
    {
      id: 'b2',
      title: 'Action-Adventure Pack',
      coverImage: 'https://example.com/action-bundle.jpg',
      games: ['Red Dead Redemption 2', 'GTA V', "Assassin's Creed Valhalla"],
      price: 149.99,
      salePrice: 79.99,
    },
  ]);

  const gameCategories = [
    { id: 'action', name: 'Action' },
    { id: 'adventure', name: 'Adventure' },
    { id: 'rpg', name: 'Role-Playing' },
    { id: 'strategy', name: 'Strategy' },
    { id: 'simulation', name: 'Simulation' },
    { id: 'sports', name: 'Sports & Racing' },
    { id: 'fps', name: 'FPS' },
    { id: 'mmo', name: 'MMO' },
  ];

  const gamePlatforms = [
    { id: 'pc', name: 'PC' },
    { id: 'playstation', name: 'PlayStation' },
    { id: 'xbox', name: 'Xbox' },
    { id: 'nintendo', name: 'Nintendo' },
  ];

  return (
    <>
      <Helmet>
        <title>O'yinlar Zonasi | UltraMarket</title>
        <meta name="description" content="UltraMarket o'yinlar va o'yin mahsulotlari" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Banner */}
        <div className="relative h-80 rounded-xl overflow-hidden mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-purple-900 flex items-center">
            <div className="container mx-auto px-6">
              <h1 className="text-4xl md:text-5xl text-white font-bold mb-4">O'yinlar Zonasi</h1>
              <p className="text-lg text-blue-100 mb-6 max-w-2xl">
                Eng so'nggi o'yinlar, chegirmalar va maxsus takliflar. Raqamli kodlarni darhol oling
                va o'yinni boshlang!
              </p>
              <Link
                to="/gaming/deals"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300"
              >
                O'yin chegirmalarini ko'rish
              </Link>
            </div>
          </div>
        </div>

        {/* Featured Games */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Mashhur O'yinlar</h2>
            <Link to="/gaming/all" className="text-blue-600 hover:text-blue-800">
              Barchasini ko'rish &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredGames.map((game) => (
              <Link key={game.id} to={`/gaming/${game.id}`}>
                <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative aspect-w-16 aspect-h-9 bg-gray-200">
                    <img
                      src={game.coverImage}
                      alt={game.title}
                      className="w-full h-48 object-cover"
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        e.currentTarget.src = 'https://via.placeholder.com/300x150?text=Game+Image';
                      }}
                    />
                    {game.salePrice && (
                      <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-2 py-1">
                        CHEGIRMA
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{game.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{game.platform}</p>

                    <div className="flex items-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(game.rating) ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      {game.salePrice ? (
                        <div>
                          <span className="text-lg font-bold text-red-600">
                            ${game.salePrice.toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-500 line-through ml-2">
                            ${game.price.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-gray-900">
                          ${game.price.toFixed(2)}
                        </span>
                      )}

                      <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded">
                        Sotib olish
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Game Bundles */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">O'yinlar To'plamlari</h2>
            <Link to="/gaming/bundles" className="text-blue-600 hover:text-blue-800">
              Barchasini ko'rish &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {gameBundles.map((bundle) => (
              <Link key={bundle.id} to={`/gaming/bundles/${bundle.id}`}>
                <div className="bg-gradient-to-r from-blue-900 to-purple-900 text-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-xl mb-2">{bundle.title}</h3>
                        <div className="text-blue-200 text-sm mb-4">
                          {bundle.games.map((game, index) => (
                            <span key={index}>
                              {game}
                              {index < bundle.games.length - 1 ? ' + ' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-white">
                          ${bundle.salePrice?.toFixed(2)}
                        </div>
                        <div className="text-sm text-blue-200 line-through">
                          ${bundle.price.toFixed(2)}
                        </div>
                        <div className="mt-1 text-xs bg-red-500 text-white px-2 py-1 rounded-full inline-block">
                          {Math.round(
                            ((bundle.price - (bundle.salePrice || bundle.price)) / bundle.price) *
                              100
                          )}
                          % chegirma
                        </div>
                      </div>
                    </div>
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors">
                      To'plamni sotib olish
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Browse Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Categories */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">O'yin Kategoriyalari</h2>
            <div className="grid grid-cols-2 gap-4">
              {gameCategories.map((category) => (
                <Link
                  key={category.id}
                  to={`/gaming/category/${category.id}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Platforms */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">O'yin Platformalari</h2>
            <div className="grid grid-cols-2 gap-4">
              {gamePlatforms.map((platform) => (
                <Link
                  key={platform.id}
                  to={`/gaming/platform/${platform.id}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {platform.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GamingZonePage;
