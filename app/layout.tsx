import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '生活照/证件照验证工具',
  description: '纯前端图片和文本验证工具',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
