export default function PCBuildsBanner() {
  return (
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-[#1e40af] to-[#1e3a8a] p-5 h-[154px]">
      <div className="text-white">
        <h3 className="text-xl font-bold mb-2">Today's Ultimate PC Builds</h3>
        <button className="text-sm hover:underline mb-4 text-gray-200">Shop now ›</button>

        <div className="absolute bottom-4 right-4">
          <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center text-[#1e40af]">
            <div className="text-center">
              <div className="text-xs">from</div>
              <div className="text-xl font-bold">$1,515</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
