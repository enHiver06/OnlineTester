'use client'

interface TabSwitchProps {
  activeTab: 'idphoto' | 'lifephoto'
  onTabChange: (tab: 'idphoto' | 'lifephoto') => void
}

export default function TabSwitch({ activeTab, onTabChange }: TabSwitchProps) {
  return (
    <div className="flex justify-center mb-8">
      <div className="inline-flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => onTabChange('idphoto')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'idphoto'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          证件照验证
        </button>
        <button
          onClick={() => onTabChange('lifephoto')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'lifephoto'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          引导页验证
        </button>
      </div>
    </div>
  )
}
