export default function Categories() {
  const categories = [
    { name: 'Components & Storage', icon: '💾' },
    { name: 'Computer Systems', icon: '💻' },
    { name: 'Computer Peripherals', icon: '⌨️' },
    { name: 'Server & Components', icon: '🖥️' },
    { name: 'Appliances', icon: '🏠' },
    { name: 'Electronics', icon: '📱' },
    { name: 'Gaming & VR', icon: '🎮' },
    { name: 'Networking', icon: '📡' },
    { name: 'Smart Home & Security', icon: '🏡' },
    { name: 'Office Solutions', icon: '📋' },
    { name: 'Software & Services', icon: '💿' },
    { name: 'Automotive & Tools', icon: '🔧' },
    { name: 'Home & Outdoors', icon: '🏠' },
    { name: 'Health & Sports', icon: '⚽' },
    { name: 'Toys, Drones & Maker', icon: '🚁' }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {categories.map((category, index) => (
        <div
          key={index}
          className="flex items-center justify-between px-4 py-3 hover:bg-blue-50 cursor-pointer group border-b border-gray-100 last:border-b-0 last:rounded-b-lg first:rounded-t-lg"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">{category.icon}</span>
            <span className="text-sm text-gray-700 group-hover:text-blue-600 group-hover:font-medium">
              {category.name}
            </span>
          </div>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-400 group-hover:text-blue-600"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      ))}
    </div>
  )
}
