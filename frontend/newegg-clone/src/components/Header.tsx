"use client"

import { Search, ShoppingCart, MapPin, Menu, ChevronDown, Bell, User, X } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { api, cartStorage, type Product, type CartItem } from '@/lib/api'

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [user, setUser] = useState<any>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })

  // Load cart from localStorage
  useEffect(() => {
    setCart(cartStorage.getCart())
  }, [])

  // Search functionality
  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      setIsSearching(true)
      try {
        const results = await api.searchProducts(query)
        setSearchResults(results)
        setShowSearchResults(true)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsSearching(false)
      }
    } else {
      setSearchResults([])
      setShowSearchResults(false)
    }
  }

  // Handle search form submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(searchQuery)
  }

  // Login functionality
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const userData = await api.login(loginForm.email, loginForm.password)
      if (userData) {
        setUser(userData)
        setShowLoginModal(false)
        setLoginForm({ email: '', password: '' })
      } else {
        alert('Invalid credentials. Try test@example.com / password')
      }
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  // Calculate cart total
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <header>
      {/* Top banner - Shell Shocker */}
      <div className="shell-shocker text-center py-2 text-sm font-medium">
        Shell Shocker! Limited Time Deals on Top Products ›
      </div>

      {/* Main header */}
      <div className="header2021 bg-white border-b border-gray-200">
        <div className="container max-w-[1400px] mx-auto">
          <div className="header2021-inner">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <img
                src="https://c1.neweggimages.com/WebResource/Themes/Nest/logos/logo_424x210.png"
                alt="Newegg"
                className="h-12 w-auto"
              />
            </Link>

            {/* Location */}
            <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 whitespace-nowrap">
              <MapPin size={18} />
              <div className="text-left">
                <div className="text-xs text-gray-500">Hello</div>
                <div className="underline font-medium">Select address</div>
              </div>
            </button>

            {/* Search */}
            <div className="search-container">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="search-input"
                />
                <button
                  type="submit"
                  className="absolute right-0 top-0 h-full px-4 bg-newegg-orange text-white rounded-r hover:bg-orange-600"
                >
                  <Search size={20} />
                </button>
              </form>

              {/* Search results dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-b shadow-lg z-50 max-h-96 overflow-y-auto">
                  {searchResults.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                      onClick={() => {
                        setShowSearchResults(false)
                        setSearchQuery('')
                        // Navigate to product page
                        window.location.href = `/product/${product.id}`
                      }}
                    >
                      <img src={product.image} alt={product.name} className="w-12 h-12 object-contain" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-800 line-clamp-1">{product.name}</div>
                        <div className="text-sm text-gray-600">${product.price}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right side items */}
            <div className="flex items-center gap-4">
              {/* Account */}
              <button 
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
              >
                <User size={18} />
                <span>{user ? user.name : 'Account'}</span>
                <ChevronDown size={14} />
              </button>

              {/* Notifications */}
              <button className="relative hover:bg-gray-100 p-2 rounded">
                <Bell size={24} className="text-gray-700" />
              </button>

              {/* Cart */}
              <button className="cart-icon hover:bg-gray-100 p-2 rounded">
                <ShoppingCart size={24} className="text-gray-700" />
                {cartItemCount > 0 && (
                  <span className="cart-badge">
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation bar */}
      <nav className="nav-dark text-white text-sm">
        <div className="container max-w-[1400px] mx-auto px-4">
          <div className="flex items-center">
            <button className="flex items-center gap-2 px-4 py-3 hover:bg-[#364152] border-r border-gray-600">
              <Menu size={18} />
              <span>Menu</span>
            </button>

            <div className="flex items-center">
              <a href="#" className="px-4 py-3 hover:bg-[#364152] flex items-center gap-1">
                <span className="text-[#FF6600]">⚡</span>
                Shell Shocker
              </a>
              <a href="#" className="px-4 py-3 hover:bg-[#364152]">PC Builder</a>
              <a href="#" className="px-4 py-3 hover:bg-[#364152]">Clearance</a>
              <a href="#" className="px-4 py-3 hover:bg-[#364152]">Best Sellers</a>
              <a href="#" className="px-4 py-3 hover:bg-[#364152]">AMD Gaming PC</a>
              <a href="#" className="px-4 py-3 hover:bg-[#364152]">Newegg+</a>
              <a href="#" className="px-4 py-3 hover:bg-[#364152] text-[#FF6600] font-bold">NEWEGG BUSINESS</a>

              <div className="ml-auto flex items-center">
                <a href="#" className="px-4 py-3 hover:bg-[#364152]">Feedback</a>
                <a href="#" className="px-4 py-3 hover:bg-[#364152]">Help Center</a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Login</h2>
              <button onClick={() => setShowLoginModal(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                Login
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  )
}
