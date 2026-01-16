'use client'

import { useState } from 'react'
import TabSwitch from '@/components/TabSwitch'
import IDPhotoValidator from '@/components/IDPhotoValidator'
import LifePhotoValidator from '@/components/LifePhotoValidator'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'idphoto' | 'lifephoto'>('idphoto')

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            自主验证工具
          </h1>
        </div>

        {/* Tab 切换 */}
        <TabSwitch activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 根据 Tab 显示不同的验证器 */}
        {activeTab === 'idphoto' ? <IDPhotoValidator /> : <LifePhotoValidator />}
      </div>
    </main>
  )
}
