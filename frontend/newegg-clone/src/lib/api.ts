// API service for Newegg clone functionality
export interface Product {
  id: string
  badge?: string
  discount?: number
  image: string
  name: string
  rating: number
  reviews: number
  price: number
  originalPrice?: number
  stock: 'in-stock' | 'low-stock' | 'out-of-stock'
  seller: string
  shipping: string
  description: string
  category: string
}

export interface CartItem extends Product {
  quantity: number
}

export interface User {
  id: string
  email: string
  name: string
  address: string
}

// Mock data - real appda bu backend API'dan keladi
const mockProducts: Product[] = [
  {
    id: '1',
    badge: 'Newegg Select',
    discount: 12,
    image: 'https://c1.neweggimages.com/ProductImageCompressAll300/20-236-589-04.jpg',
    name: 'CORSAIR Vengeance RGB 32GB (2 x 16GB) 288-Pin PC RAM DDR5 6000 (PC5 48000)',
    rating: 4,
    reviews: 112,
    price: 104.99,
    originalPrice: 119.99,
    stock: 'in-stock',
    seller: 'Newegg',
    shipping: 'Free Shipping',
    description: 'High-performance DDR5 RAM with RGB lighting',
    category: 'Memory'
  },
  {
    id: '2',
    badge: 'Newegg Select',
    discount: 23,
    image: 'https://c1.neweggimages.com/ProductImageCompressAll300/26-506-047-01.jpg',
    name: 'Soundcore by Anker, AeroFit Open-Ear Headphones, Ultra-Lightweight',
    rating: 4.5,
    reviews: 87,
    price: 99.99,
    originalPrice: 129.99,
    stock: 'low-stock',
    seller: 'Anker',
    shipping: 'Free Shipping',
    description: 'Open-ear design for comfortable listening',
    category: 'Audio'
  },
  {
    id: '3',
    badge: 'AI Ready',
    discount: 29,
    image: 'https://c1.neweggimages.com/ProductImageCompressAll300/83-360-280-01.jpg',
    name: 'Acer Nitro 60 Gaming Desktop PC, Intel Core i5-14400F, GeForce RTX 4060',
    rating: 4.5,
    reviews: 73,
    price: 849.99,
    originalPrice: 1199.99,
    stock: 'in-stock',
    seller: 'Acer',
    shipping: 'Free Shipping',
    description: 'Gaming desktop with RTX 4060 graphics',
    category: 'Gaming'
  },
  {
    id: '4',
    badge: 'Newegg Select',
    discount: 15,
    image: 'https://c1.neweggimages.com/ProductImageCompressAll300/14-126-680-01.jpg',
    name: 'MSI INSPIRE GeForce RTX 5070Ti Graphics Card RTX 5070 Ti 16G INSPIRE 3X OC',
    rating: 5,
    reviews: 8,
    price: 789.99,
    originalPrice: 929.99,
    stock: 'out-of-stock',
    seller: 'MSI',
    shipping: 'Free Shipping',
    description: 'High-end graphics card for gaming and content creation',
    category: 'Graphics Cards'
  }
]

// API functions
export const api = {
  // Search products
  searchProducts: async (query: string): Promise<Product[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    if (!query.trim()) return mockProducts
    
    return mockProducts.filter(product =>
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.category.toLowerCase().includes(query.toLowerCase())
    )
  },

  // Get all products
  getProducts: async (): Promise<Product[]> => {
    await new Promise(resolve => setTimeout(resolve, 200))
    return mockProducts
  },

  // Get product by ID
  getProduct: async (id: string): Promise<Product | null> => {
    await new Promise(resolve => setTimeout(resolve, 100))
    return mockProducts.find(p => p.id === id) || null
  },

  // Get products by category
  getProductsByCategory: async (category: string): Promise<Product[]> => {
    await new Promise(resolve => setTimeout(resolve, 200))
    return mockProducts.filter(p => p.category === category)
  },

  // User authentication
  login: async (email: string, password: string): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Mock login - real appda bu backend'da bo'ladi
    if (email === 'test@example.com' && password === 'password') {
      return {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        address: '123 Main St, City, State 12345'
      }
    }
    return null
  },

  // Register user
  register: async (email: string, password: string, name: string): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      id: Date.now().toString(),
      email,
      name,
      address: ''
    }
  }
}

// Local storage helpers for cart
export const cartStorage = {
  getCart: (): CartItem[] => {
    if (typeof window === 'undefined') return []
    const cart = localStorage.getItem('newegg-cart')
    return cart ? JSON.parse(cart) : []
  },

  setCart: (cart: CartItem[]): void => {
    if (typeof window === 'undefined') return
    localStorage.setItem('newegg-cart', JSON.stringify(cart))
  },

  addToCart: (product: Product, quantity: number = 1): void => {
    const cart = cartStorage.getCart()
    const existingItem = cart.find(item => item.id === product.id)
    
    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      cart.push({ ...product, quantity })
    }
    
    cartStorage.setCart(cart)
  },

  removeFromCart: (productId: string): void => {
    const cart = cartStorage.getCart()
    const filteredCart = cart.filter(item => item.id !== productId)
    cartStorage.setCart(filteredCart)
  },

  updateQuantity: (productId: string, quantity: number): void => {
    const cart = cartStorage.getCart()
    const item = cart.find(item => item.id === productId)
    if (item) {
      item.quantity = quantity
      cartStorage.setCart(cart)
    }
  },

  clearCart: (): void => {
    cartStorage.setCart([])
  }
} 