export default function NetworkingDealsBanner() {
  return (
    <div className="bg-gradient-to-br from-[#1e40af] to-[#1e3a8a] rounded-lg h-[200px] p-6 text-white relative overflow-hidden">
      <h3 className="text-2xl font-bold mb-3">Networking Deals</h3>
      <button className="bg-transparent border border-white hover:bg-white hover:text-[#1e40af] px-5 py-2 rounded transition-colors text-sm">
        Shop now ▸
      </button>

      {/* Router/networking device image placeholder */}
      <div className="absolute bottom-0 right-0 w-40 h-40 opacity-20">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
          <rect x="20" y="40" width="60" height="30" rx="5" />
          <rect x="35" y="30" width="2" height="15" />
          <rect x="50" y="30" width="2" height="15" />
          <rect x="65" y="30" width="2" height="15" />
        </svg>
      </div>
    </div>
  )
}
