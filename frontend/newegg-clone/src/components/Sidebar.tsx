import { ChevronRight, Cpu, Monitor, HardDrive, Laptop, Gamepad2, Home, Network, Smartphone, Wrench, Car, ShieldCheck, Briefcase } from 'lucide-react'

export default function Sidebar() {
  const categories = [
    { icon: Cpu, label: "Components & Storage", hasSubmenu: true },
    { icon: Monitor, label: "Computer Systems", hasSubmenu: true },
    { icon: HardDrive, label: "Computer Peripherals", hasSubmenu: true },
    { icon: Network, label: "Server & Components", hasSubmenu: true },
    { icon: Wrench, label: "Appliances", hasSubmenu: true },
    { icon: Monitor, label: "Electronics", hasSubmenu: true },
    { icon: Gamepad2, label: "Gaming & VR", hasSubmenu: true },
    { icon: Network, label: "Networking", hasSubmenu: true },
    { icon: Home, label: "Smart Home & Security", hasSubmenu: true },
    { icon: Briefcase, label: "Office Solutions", hasSubmenu: true },
    { icon: Network, label: "Software & Services", hasSubmenu: true },
    { icon: Car, label: "Automotive & Tools", hasSubmenu: true },
    { icon: Home, label: "Home & Outdoors", hasSubmenu: true },
    { icon: ShieldCheck, label: "Health & Sports", hasSubmenu: true },
    { icon: Gamepad2, label: "Toys, Drones & Maker", hasSubmenu: true },
  ]

  return (
    <aside className="w-[240px] flex-shrink-0">
      <div className="bg-[#2b3440] text-white rounded-t">
        <div className="px-4 py-3 border-b border-gray-700">
          <h3 className="font-bold text-sm text-white">Components & Storage</h3>
        </div>
        {categories.map((category, index) => (
          <button
            key={index}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#364152] text-sm text-left border-b border-gray-700 last:border-b-0 transition-colors"
          >
            <div className="flex items-center gap-3">
              <category.icon size={16} className="text-gray-300" />
              <span className="text-gray-100">{category.label}</span>
            </div>
            {category.hasSubmenu && <ChevronRight size={14} className="text-gray-400" />}
          </button>
        ))}
      </div>
    </aside>
  )
}
