import { Zap } from 'lucide-react'

export default function ShellShockerBanner() {
  return (
    <div className="relative bg-gradient-to-br from-[#FF6600] to-[#E55A00] rounded-lg h-[200px] p-6 text-white">
      {/* 7% OFF badge */}
      <div className="absolute top-4 right-4 bg-[#00CC00] text-white text-xs font-bold px-2 py-1 rounded">
        See all 7% OFF
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Zap size={24} className="text-yellow-300" />
        <h3 className="text-2xl font-bold">Shell Shocker</h3>
      </div>

      <div className="space-y-1">
        <p className="text-lg font-semibold">ABS Cyclone Ruby Gaming</p>
        <p className="text-lg font-semibold">PC</p>
        <p className="text-xs opacity-90">Windows 11 - AMD Ryzen 5 9600X...</p>
      </div>

      <div className="absolute bottom-6 left-6">
        <div className="text-3xl font-bold">$1,199.99</div>
      </div>
    </div>
  )
}
