"use client"

import { Star, ShoppingCart, Eye } from 'lucide-react'
import { useState } from 'react'
import { cartStorage, type Product } from '@/lib/api'

interface ProductCardProps {
  id: string
  badge?: string
  discount?: number
  image: string
  name: string
  rating: number
  reviews: number
  price: number
  originalPrice?: number
  stock?: 'in-stock' | 'low-stock' | 'out-of-stock'
  seller?: string
  shipping?: string
  description?: string
  category?: string
}

export default function ProductCard({
  id,
  badge = 'Newegg Select',
  discount,
  image,
  name,
  rating,
  reviews,
  price,
  originalPrice,
  stock = 'in-stock',
  seller = 'Newegg',
  shipping = 'Free Shipping',
  description,
  category
}: ProductCardProps) {
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [showQuickView, setShowQuickView] = useState(false)

  const handleAddToCart = () => {
    if (stock === 'out-of-stock') return
    
    setIsAddingToCart(true)
    
    // Simulate API delay
    setTimeout(() => {
      const product: Product = {
        id,
        badge,
        discount,
        image,
        name,
        rating,
        reviews,
        price,
        originalPrice,
        stock,
        seller,
        shipping,
        description: description || '',
        category: category || ''
      }
      
      cartStorage.addToCart(product, 1)
      setIsAddingToCart(false)
      
      // Show success message
      const event = new CustomEvent('cart-updated', { detail: { action: 'added' } })
      window.dispatchEvent(event)
    }, 500)
  }

  const getStockStatus = () => {
    switch (stock) {
      case 'in-stock':
        return { text: 'In Stock', color: 'text-green-600', bg: 'bg-green-100' }
      case 'low-stock':
        return { text: 'Low Stock', color: 'text-orange-600', bg: 'bg-orange-100' }
      case 'out-of-stock':
        return { text: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-100' }
      default:
        return { text: 'In Stock', color: 'text-green-600', bg: 'bg-green-100' }
    }
  }

  const stockStatus = getStockStatus()

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow p-4 relative cursor-pointer group">
      {/* Badge */}
      {badge && (
        <span className="bg-[#0066CC] text-white text-xs px-2 py-1 rounded mb-2 inline-block font-medium">
          {badge}
        </span>
      )}

      {/* Discount badge */}
      {discount && (
        <div className="absolute top-2 right-2 bg-[#CC0000] text-white text-xs px-2 py-1 rounded font-bold">
          Save {discount}%
        </div>
      )}

      {/* Product image */}
      <div className="h-48 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform relative">
        <img
          src={image}
          alt={name}
          className="max-h-full max-w-full object-contain"
        />
        
        {/* Quick view overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowQuickView(true)
            }}
            className="bg-white text-gray-800 px-3 py-2 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            <Eye size={16} className="inline mr-1" />
            Quick View
          </button>
        </div>
      </div>

      {/* Stock status */}
      <div className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${stockStatus.bg} ${stockStatus.color}`}>
        {stockStatus.text}
      </div>

      {/* Rating */}
      <div className="flex items-center gap-1 mb-2">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={12}
            className={i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
          />
        ))}
        <span className="text-xs text-gray-600">({reviews})</span>
      </div>

      {/* Product name */}
      <h3 className="text-sm mb-2 line-clamp-2 hover:text-[#0066CC] text-gray-800">
        {name}
      </h3>

      {/* Seller and shipping info */}
      <div className="text-xs text-gray-600 mb-2">
        <div>Sold by: {seller}</div>
        <div>{shipping}</div>
      </div>

      {/* Price */}
      <div className="mt-auto mb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-[#CC0000]">${price.toFixed(2)}</span>
          {originalPrice && (
            <span className="text-sm text-gray-400 line-through">${originalPrice.toFixed(2)}</span>
          )}
        </div>
      </div>

      {/* Add to Cart button */}
      <button
        onClick={handleAddToCart}
        disabled={stock === 'out-of-stock' || isAddingToCart}
        className={`w-full py-2 px-4 rounded font-medium transition-colors flex items-center justify-center gap-2 ${
          stock === 'out-of-stock'
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : isAddingToCart
            ? 'bg-[#FF6600] text-white'
            : 'bg-[#FF6600] hover:bg-[#E55A00] text-white'
        }`}
      >
        {isAddingToCart ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Adding...
          </>
        ) : stock === 'out-of-stock' ? (
          'Out of Stock'
        ) : (
          <>
            <ShoppingCart size={16} />
            Add to Cart
          </>
        )}
      </button>

      {/* Quick View Modal */}
      {showQuickView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">{name}</h2>
              <button 
                onClick={() => setShowQuickView(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <img src={image} alt={name} className="w-full h-64 object-contain" />
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                    />
                  ))}
                  <span className="text-sm text-gray-600">({reviews} reviews)</span>
                </div>
                
                <div className="mb-4">
                  <div className="text-2xl font-bold text-[#CC0000] mb-2">
                    ${price.toFixed(2)}
                    {originalPrice && (
                      <span className="text-lg text-gray-400 line-through ml-2">
                        ${originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  
                  {discount && (
                    <div className="text-sm text-green-600 font-medium">
                      Save ${((originalPrice || 0) - price).toFixed(2)} ({discount}% off)
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 mb-4 text-sm">
                  <div><strong>Seller:</strong> {seller}</div>
                  <div><strong>Shipping:</strong> {shipping}</div>
                  <div><strong>Stock:</strong> <span className={stockStatus.color}>{stockStatus.text}</span></div>
                  {category && <div><strong>Category:</strong> {category}</div>}
                </div>
                
                {description && (
                  <div className="mb-4">
                    <strong>Description:</strong>
                    <p className="text-sm text-gray-600 mt-1">{description}</p>
                  </div>
                )}
                
                <button
                  onClick={() => {
                    handleAddToCart()
                    setShowQuickView(false)
                  }}
                  disabled={stock === 'out-of-stock'}
                  className={`w-full py-3 px-4 rounded font-medium transition-colors ${
                    stock === 'out-of-stock'
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-[#FF6600] hover:bg-[#E55A00] text-white'
                  }`}
                >
                  {stock === 'out-of-stock' ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
