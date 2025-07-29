export default function GroupBuyBanner() {
  return (
    <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg h-[200px] p-6 text-white relative">
      <div className="absolute top-4 right-4 bg-[#00CC00] text-white text-xs font-bold px-2 py-1 rounded">
        Group Buy Price
      </div>

      <h3 className="text-lg font-bold mb-1">Group Buy</h3>

      <div className="mb-2">
        <p className="text-base font-semibold">Vantrue J51 Car Jump Starter</p>
        <p className="text-sm opacity-90">3000A Peak</p>
      </div>

      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-sm line-through opacity-70">$59.99</span>
        <span className="text-3xl font-bold">$24.99</span>
      </div>

      <button className="w-full bg-white text-purple-700 hover:bg-gray-100 py-2 rounded font-medium transition-colors">
        Join Offer
      </button>
    </div>
  )
}
