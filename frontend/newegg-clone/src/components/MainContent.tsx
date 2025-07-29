import { Star, Zap, ChevronLeft, ChevronRight } from 'lucide-react'

export default function MainContent() {
  // Sample product data
  const todaysDeals = [
    {
      id: 1,
      image: "https://c1.neweggimages.com/productimage/nb300/14-932-624_R01.jpg",
      title: "SAPPHIRE NITRO+ Radeon RX 9070 XT Graphics Card 11348-01-20G",
      price: "$799.99",
      rating: 5,
      reviews: 226,
      badge: "Newegg Select"
    },
    {
      id: 2,
      image: "https://c1.neweggimages.com/productimage/nb300/20-236-819_R01.jpg",
      title: "CORSAIR Vengeance RGB 32GB (2 x 16GB) 288-Pin PC RAM DDR5 6000MHz",
      price: "$99.99",
      originalPrice: "$125.99",
      discount: "20%",
      rating: 4,
      reviews: 89,
      badge: "Newegg Select"
    },
    {
      id: 3,
      image: "https://c1.neweggimages.com/productimage/nb300/19-113-847_R01.jpg",
      title: "AMD Ryzen 9 9950X3D - Ryzen 9 9000 Series Granite Ridge (Zen 5) 16-Core",
      price: "$699.00",
      rating: 5,
      reviews: 57,
      badge: "Newegg Select"
    },
    {
      id: 4,
      image: "https://c1.neweggimages.com/productimage/nb300/22-236-984_R01.jpg",
      title: "SAMSUNG 990 EVO PLUS SSD 2TB, PCIe Gen 4x4 | Gen 5x2 M.2 2280",
      price: "$129.99",
      originalPrice: "$176.99",
      rating: 4,
      reviews: 112
    },
  ]

  return (
    <div className="flex-1">
      {/* Hero banners */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Large Lenovo banner - takes 2 columns */}
        <div className="col-span-2 relative overflow-hidden rounded-lg bg-gradient-to-r from-purple-700 to-indigo-800 h-[320px]">
          <div className="absolute inset-0 p-8 text-white flex flex-col justify-center">
            <div className="bg-red-600 text-white text-xs px-2 py-1 rounded w-fit mb-4">
              LENOVO
            </div>
            <h1 className="text-4xl font-bold mb-3">Smarter Technology</h1>
            <h2 className="text-4xl font-bold mb-4">for All</h2>
            <p className="text-lg mb-6 opacity-90">Shop Great Deals and Selections</p>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md w-fit transition-colors">
              Shop now ▸
            </button>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/2">
            <img
              src="https://promotions.newegg.com/lenovo/25-0674/300x320_v9.png"
              alt="Lenovo devices"
              className="h-full object-contain float-right"
            />
          </div>
        </div>

        {/* Right side stacked banners */}
        <div className="space-y-4">
          {/* AMD Banner */}
          <div className="relative overflow-hidden rounded-lg bg-[#1a1a1a] p-4 h-[154px]">
            <div className="text-white">
              <div className="flex items-center gap-2 mb-2">
                <img src="https://c1.neweggimages.com/WebResource/Themes/Nest/logos/amd_logo.png" alt="AMD" className="h-5" />
                <span className="text-xs">More options ›</span>
              </div>
              <p className="text-xs mb-1">Combo up savings $68.00</p>
              <div className="flex gap-2 items-center">
                <img src="https://c1.neweggimages.com/ProductImageCompressAll100/19-113-843_1.jpg" alt="CPU" className="w-12 h-12 object-contain" />
                <span className="text-xl font-bold">+</span>
                <img src="https://c1.neweggimages.com/ProductImageCompressAll100/35-181-328_1.jpg" alt="Cooler" className="w-12 h-12 object-contain" />
              </div>
              <div className="flex gap-2 mt-2">
                <span className="text-sm line-through text-gray-400">$871.48</span>
                <span className="text-lg font-bold">$806.98</span>
              </div>
              <button className="bg-white text-black px-3 py-1 rounded text-xs mt-2 hover:bg-gray-100">
                Build with it
              </button>
            </div>
          </div>

          {/* PC Builds Banner */}
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 p-4 h-[154px]">
            <div className="text-white">
              <h3 className="text-lg font-bold mb-2">Today's Ultimate PC Builds</h3>
              <p className="text-sm mb-3">Shop now ›</p>
              <div className="bg-white rounded-full inline-flex items-center justify-center w-16 h-16 text-blue-600 font-bold text-xl">
                from<br/>$167
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary banners */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {/* Networking Deals */}
        <div className="bg-gradient-to-br from-blue-900 to-blue-700 text-white rounded-lg p-6 relative overflow-hidden h-[200px]">
          <h3 className="text-xl font-bold mb-2">Networking Deals</h3>
          <p className="text-sm mb-4">Shop now ›</p>
          <img
            src="https://c1.neweggimages.com/WebResource/Themes/Nest/store/networking-router.png"
            alt="Router"
            className="absolute bottom-0 right-0 w-32 h-32 object-contain"
          />
        </div>

        {/* Shell Shocker */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6 relative overflow-hidden h-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={24} />
            <h3 className="text-xl font-bold">Shell Shocker</h3>
          </div>
          <p className="text-sm mb-1">See all ›</p>
          <p className="text-2xl font-bold">AMD Ryzen 7 7800X3D</p>
          <p className="text-sm opacity-90 mb-2">Ryzen 7 7000 Series</p>
          <div className="text-2xl font-bold">$369.99</div>
          <p className="text-xs line-through">$479.99</p>
          <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
            22% OFF
          </div>
        </div>

        {/* Group Buy */}
        <div className="bg-white border rounded-lg p-6 relative overflow-hidden h-[200px]">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs text-gray-600">Ends in: 18 : 33 : 28</p>
              <h3 className="text-lg font-bold">Group Buy</h3>
            </div>
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">✓</span>
          </div>
          <img
            src="https://c1.neweggimages.com/ProductImageCompressAll100/A1H9_131639306951994088.jpg"
            alt="Car Jump Starter"
            className="w-24 h-24 mx-auto mb-2 object-contain"
          />
          <div className="text-center">
            <p className="text-sm text-gray-600">Vantrue J31 Car Jump Starter 3000A Peak...</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-gray-400 line-through text-sm">$99.99</span>
              <span className="text-xl font-bold">$24.99</span>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Best Deals */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Today's Best Deals</h2>
          <div className="flex gap-2">
            <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
              <ChevronLeft size={20} />
            </button>
            <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {todaysDeals.map((product) => (
            <div key={product.id} className="bg-white rounded-lg p-4 hover:shadow-lg transition-shadow border">
              {product.badge && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded mb-2 inline-block">
                  {product.badge}
                </span>
              )}

              <div className="h-48 flex items-center justify-center mb-3">
                <img src={product.image} alt={product.title} className="max-h-full max-w-full object-contain" />
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} className={i < product.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                ))}
                <span className="text-xs text-gray-600">({product.reviews})</span>
              </div>

              <h3 className="text-sm mb-2 line-clamp-2">{product.title}</h3>

              <div className="mt-auto">
                {product.discount && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">Save {product.discount}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{product.price}</span>
                  {product.originalPrice && (
                    <span className="text-sm text-gray-400 line-through">{product.originalPrice}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-6">
          <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            See all deals ›
          </button>
        </div>
      </section>

      {/* Stay Cool, Game On section */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Stay Cool, Game On</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-cyan-100 to-blue-100 rounded-lg p-6 relative overflow-hidden h-[200px]">
            <h3 className="text-xl font-semibold mb-2">Chill your room.</h3>
            <p className="text-lg mb-2">Cool your rig.</p>
            <button className="text-blue-600 hover:underline">Keep It Cool</button>
            <img
              src="https://c1.neweggimages.com/WebResource/Themes/Nest/store/cooling-fan.png"
              alt="Cooling"
              className="absolute right-0 bottom-0 w-40 h-40 object-contain"
            />
          </div>

          <div className="bg-gradient-to-r from-purple-900 to-purple-700 text-white rounded-lg p-6 relative overflow-hidden h-[200px]">
            <h3 className="text-3xl font-bold mb-2">GAME</h3>
            <p className="text-3xl font-bold mb-2">ON</p>
            <button className="text-white hover:underline">Gear Up to Victory</button>
            <img
              src="https://c1.neweggimages.com/WebResource/Themes/Nest/store/gaming-keyboard.png"
              alt="Gaming"
              className="absolute right-0 bottom-0 w-40 h-40 object-contain"
            />
          </div>
        </div>
      </section>

      {/* Daily Savings section */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">🎯Daily Savings</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-orange-100 rounded-lg p-6 text-center">
            <img
              src="https://c1.neweggimages.com/WebResource/Themes/Nest/store/keyboard-icon.png"
              alt="Under $30"
              className="w-20 h-20 mx-auto mb-2 object-contain"
            />
            <h3 className="font-semibold">Under $30</h3>
          </div>
          <div className="bg-orange-100 rounded-lg p-6 text-center">
            <img
              src="https://c1.neweggimages.com/WebResource/Themes/Nest/store/monitor-icon.png"
              alt="Under $75"
              className="w-20 h-20 mx-auto mb-2 object-contain"
            />
            <h3 className="font-semibold">Under $75</h3>
          </div>
          <div className="bg-orange-100 rounded-lg p-6 text-center col-span-2">
            <img
              src="https://c1.neweggimages.com/WebResource/Themes/Nest/store/earbuds-icon.png"
              alt="Shop All"
              className="w-20 h-20 mx-auto mb-2 object-contain"
            />
            <h3 className="font-semibold">Shop All</h3>
          </div>
        </div>
      </section>
    </div>
  )
}
