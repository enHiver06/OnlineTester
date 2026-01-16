'use client'

import { useEffect, useRef, useState } from 'react'

interface PreviewCardProps {
  image: File | null
  text: string
  teacherName: string
  fixedImage: File | null
}

export default function PreviewCard({ image, text, teacherName, fixedImage }: PreviewCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fullscreenCanvasRef = useRef<HTMLCanvasElement>(null)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const backgroundImageRef = useRef<HTMLImageElement | null>(null)
  const toplayerImageRef = useRef<HTMLImageElement | null>(null)
  const [showFullscreen, setShowFullscreen] = useState(false)

  // 加载背景图和顶层图
  useEffect(() => {
    let loadedCount = 0
    const totalImages = 2

    const checkAllLoaded = () => {
      loadedCount++
      if (loadedCount === totalImages) {
        setImagesLoaded(true)
      }
    }

    // 加载底层背景图
    const bgImg = new Image()
    bgImg.src = '/background-1280_800.png'
    bgImg.onload = () => {
      backgroundImageRef.current = bgImg
      checkAllLoaded()
    }

    // 加载顶层装饰图
    const topImg = new Image()
    topImg.src = '/toplayer-1280_800.png'
    topImg.onload = () => {
      toplayerImageRef.current = topImg
      checkAllLoaded()
    }
  }, [])

  // 通用绘制卡片函数
  const drawCard = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')
    if (!ctx || !backgroundImageRef.current || !toplayerImageRef.current) return

    const bgImg = backgroundImageRef.current
    const topImg = toplayerImageRef.current

    // 固定画布尺寸
    canvas.width = 1280
    canvas.height = 800

    // 第一层：绘制底层背景图
    ctx.drawImage(bgImg, 0, 0, 1280, 800)

    // 第二层：绘制用户上传的图片（中间层）
    if (image) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const userImg = new Image()
        userImg.onload = () => {
          // 强制缩放至 300×400px
          const targetWidth = 300
          const targetHeight = 400
          const imgX = 161
          const imgY = 250

          // 绘制用户图片
          ctx.drawImage(userImg, imgX, imgY, targetWidth, targetHeight)

          // 第三层：绘制顶层装饰图（固定位置）
          const topX = 93
          const topY = 150
          const topWidth = 434
          const topHeight = 543
          ctx.drawImage(topImg, topX, topY, topWidth, topHeight)

          // 第四层：绘制文本（在顶层图之上）
          if (text) {
            drawText(ctx, text)
          }
        }
        userImg.src = e.target?.result as string
      }
      reader.readAsDataURL(image)
    } else {
      // 没有用户图片时，也绘制顶层装饰图
      const topX = 93
      const topY = 150
      const topWidth = 434
      const topHeight = 543
      ctx.drawImage(topImg, topX, topY, topWidth, topHeight)

      // 绘制文本
      if (text) {
        drawText(ctx, text)
      }
    }
  }

  // 生成卡片
  useEffect(() => {
    if (!imagesLoaded || !canvasRef.current) return
    drawCard(canvasRef.current)
  }, [imagesLoaded, image, text, teacherName])

  // 全屏时绘制
  useEffect(() => {
    if (showFullscreen && fullscreenCanvasRef.current && imagesLoaded) {
      drawCard(fullscreenCanvasRef.current)
    }
  }, [showFullscreen, imagesLoaded, image, text, teacherName])

  // 绘制文本函数
  const drawText = (ctx: CanvasRenderingContext2D, text: string) => {
    // 文本框配置
    const textX = 541.08
    const textY = 341
    const textWidth = 549.42
    const textHeight = 117
    const fontSize = 26
    const lineHeight = 39
    const maxLines = 3 // 117 / 39 = 3 行

    // 设置字体样式
    ctx.font = '900 26px "Noto Sans SC", "Source Han Sans CN", sans-serif'
    ctx.fillStyle = '#000000'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'

    // 在文本前添加两个字符的缩进
    const indentedText = '　　' + text // 使用全角空格作为缩进

    // 自动换行逻辑
    const lines: string[] = []
    let currentLine = ''

    for (let i = 0; i < indentedText.length; i++) {
      const testLine = currentLine + indentedText[i]
      const metrics = ctx.measureText(testLine)

      if (metrics.width > textWidth && currentLine !== '') {
        lines.push(currentLine)
        currentLine = indentedText[i]

        // 如果已经达到最大行数，停止处理
        if (lines.length >= maxLines) {
          break
        }
      } else {
        currentLine = testLine
      }
    }

    // 添加最后一行（如果未超过最大行数）
    if (currentLine && lines.length < maxLines) {
      lines.push(currentLine)
    }

    // 绘制文本（最多3行）
    for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
      const y = textY + i * lineHeight
      ctx.fillText(lines[i], textX, y)
    }
  }

  const handleDownload = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    canvas.toBlob((blob) => {
      if (!blob) return

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${teacherName || '老师'}_卡片.png`
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  const handleDownloadFixed = () => {
    if (!fixedImage) return

    const url = URL.createObjectURL(fixedImage)
    const a = document.createElement('a')
    a.href = url
    a.download = `${teacherName || '老师'}_修复图片.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">卡片预览</h2>
        <div className="flex gap-2">
          {fixedImage && (
            <button
              onClick={handleDownloadFixed}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              下载修复图片
            </button>
          )}
          <button
            onClick={handleDownload}
            disabled={!image}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            下载卡片
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 relative">
        <div className="overflow-auto max-h-[800px]">
          <canvas
            ref={canvasRef}
            className="w-full h-auto rounded shadow-lg"
            style={{ maxWidth: '100%' }}
          />
        </div>

        {/* 全屏预览按钮 */}
        {image && (
          <button
            onClick={() => setShowFullscreen(true)}
            className="absolute bottom-6 right-6 p-2 bg-gray-800 bg-opacity-70 hover:bg-opacity-90 text-white rounded-lg transition-all"
            title="全屏预览"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        )}
      </div>

      {/* 全屏预览弹窗 */}
      {showFullscreen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowFullscreen(false)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <canvas
              ref={fullscreenCanvasRef}
              className="rounded shadow-2xl"
              style={{ width: '1280px', height: '800px', maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }}
            />
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute top-4 right-4 p-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-all"
              title="关闭"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {!imagesLoaded && (
        <p className="text-sm text-gray-500 text-center">加载背景模板中...</p>
      )}

      {imagesLoaded && !image && (
        <p className="text-sm text-gray-500 text-center">请上传生活照查看预览效果</p>
      )}
    </div>
  )
}
