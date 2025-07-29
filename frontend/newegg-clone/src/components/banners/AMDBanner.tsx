export default function AMDBanner() {
  return (
    <div className="relative overflow-hidden rounded-lg bg-[#1a1a1a] p-5 h-[154px]">
      <div className="text-white">
        <div className="flex items-center justify-between mb-3">
          <img src="https://c1.neweggimages.com/WebResource/Themes/Nest/logos/amd_logo.png" alt="AMD" className="h-6" />
          <span className="text-xs hover:underline cursor-pointer text-gray-300">More options ›</span>
        </div>

        <p className="text-xs mb-2 text-gray-300">Combo up savings $68.00</p>

        <div className="flex items-center gap-3 mb-3">
          <img
            src="https://c1.neweggimages.com/ProductImageCompressAll100/19-113-843_1.jpg"
            alt="AMD Ryzen"
            className="w-12 h-12 object-contain bg-white rounded p-1"
          />
          <span className="text-2xl font-bold text-gray-300">+</span>
          <img
            src="https://c1.neweggimages.com/ProductImageCompressAll100/35-181-328_1.jpg"
            alt="Cooler"
            className="w-12 h-12 object-contain bg-white rounded p-1"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm line-through text-gray-500">$871.48</span>
          <span className="text-xl font-bold">$806.98</span>
          <button className="ml-auto bg-white text-black px-4 py-1.5 rounded text-xs font-medium hover:bg-gray-100">
            Build with it
          </button>
        </div>
      </div>
    </div>
  )
}
