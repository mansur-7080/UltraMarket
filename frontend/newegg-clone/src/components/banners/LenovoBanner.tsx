export default function LenovoBanner() {
  return (
    <div className="col-span-2 relative overflow-hidden rounded-lg bg-gradient-to-r from-[#7e3af2] to-[#5b21b6] h-[320px]">
      <div className="absolute inset-0 p-8 text-white flex flex-col justify-center z-10">
        <div className="bg-[#CC0000] text-white text-xs px-3 py-1 rounded w-fit mb-4 font-bold">
          LENOVO
        </div>
        <h1 className="text-5xl font-bold mb-2">Smarter Technology</h1>
        <h2 className="text-5xl font-bold mb-6">for All</h2>
        <p className="text-lg mb-6 opacity-90">Shop Great Deals and Selections</p>
        <button className="bg-[#FF6600] hover:bg-[#E55A00] text-white px-8 py-3 rounded-md w-fit transition-colors font-medium">
          Shop now ▸
        </button>
      </div>
      <div className="absolute right-0 top-0 h-full w-1/2 flex items-center justify-end">
        <img
          src="https://promotions.newegg.com/lenovo/25-0674/300x320_v9.png"
          alt="Lenovo products"
          className="h-[90%] object-contain mr-8"
        />
      </div>
      <div className="absolute top-4 right-4">
        <a href="#" className="text-white text-xs hover:underline">Lenovo products</a>
      </div>
    </div>
  )
}
