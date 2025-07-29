"use client"

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import LenovoBanner from '@/components/banners/LenovoBanner'
import AMDBanner from '@/components/banners/AMDBanner'
import PCBuildsBanner from '@/components/banners/PCBuildsBanner'
import ShellShockerBanner from '@/components/banners/ShellShockerBanner'
import NetworkingDealsBanner from '@/components/banners/NetworkingDealsBanner'
import GroupBuyBanner from '@/components/banners/GroupBuyBanner'
import ProductCard from '@/components/ProductCard'
import Footer from '@/components/Footer'
import { api, type Product } from '@/lib/api'
import { Filter, SortAsc, SortDesc, Grid, List } from 'lucide-react'

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'rating' | 'name'>('price-asc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 2000 })

  // Load products on component mount
  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const data = await api.getProducts()
      setProducts(data)
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort products
  const filteredAndSortedProducts = products
    .filter(product => {
      // Category filter
      if (selectedCategory && product.category !== selectedCategory) return false
      
      // Price range filter
      if (product.price < priceRange.min || product.price > priceRange.max) return false
      
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        case 'rating':
          return b.rating - a.rating
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

  // Get unique categories
  const categories = [...new Set(products.map(p => p.category))]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Main content area - Newegg pixel-perfect */}
      <main className="container max-w-[1400px] mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left sidebar */}
          <Sidebar />

          {/* Main content */}
          <div className="flex-1">
            {/* Hero banners - Newegg pixel-perfect layout */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              {/* Large banner - takes 2 columns */}
              <div className="col-span-2">
                <LenovoBanner />
              </div>

              {/* Right side stacked banners */}
              <div className="space-y-6">
                <AMDBanner />
                <PCBuildsBanner />
              </div>
            </div>

            {/* Secondary banners row - Newegg pixel-perfect layout */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <NetworkingDealsBanner />
              <ShellShockerBanner />
              <GroupBuyBanner />
            </div>

            {/* Today's Best Deals section - Newegg pixel-perfect */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Today's Best Deals</h2>
                
                {/* Filters and controls */}
                <div className="flex items-center gap-4">
                  {/* Category filter */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>

                  {/* Sort by */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                    <option value="name">Name A-Z</option>
                  </select>

                  {/* Price range */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Price:</span>
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-sm text-gray-600">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>

                  {/* View mode toggle */}
                  <div className="flex border border-gray-300 rounded">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-[#FF6600] text-white' : 'bg-white text-gray-600'}`}
                    >
                      <Grid size={16} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-2 ${viewMode === 'list' ? 'bg-[#FF6600] text-white' : 'bg-white text-gray-600'}`}
                    >
                      <List size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Loading state */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6600]"></div>
                  <span className="ml-3 text-gray-600">Loading products...</span>
                </div>
              ) : (
                <>
                  {/* Products grid/list */}
                  <div className={viewMode === 'grid' 
                    ? "grid grid-cols-4 gap-6" 
                    : "space-y-4"
                  }>
                    {filteredAndSortedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        id={product.id}
                        badge={product.badge}
                        discount={product.discount}
                        image={product.image}
                        name={product.name}
                        rating={product.rating}
                        reviews={product.reviews}
                        price={product.price}
                        originalPrice={product.originalPrice}
                        stock={product.stock}
                        seller={product.seller}
                        shipping={product.shipping}
                        description={product.description}
                        category={product.category}
                      />
                    ))}
                  </div>

                  {/* No results */}
                  {filteredAndSortedProducts.length === 0 && !loading && (
                    <div className="text-center py-12">
                      <div className="text-gray-500 text-lg mb-2">No products found</div>
                      <div className="text-gray-400 text-sm">Try adjusting your filters</div>
                    </div>
                  )}

                  {/* See all deals button - Newegg pixel-perfect */}
                  <div className="text-center mt-8">
                    <button className="text-[#0066CC] hover:text-[#0052A3] font-medium border border-[#0066CC] hover:bg-[#0066CC] hover:bg-opacity-10 px-8 py-3 rounded transition-colors">
                      See all deals ▸
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
