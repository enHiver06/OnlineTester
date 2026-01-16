'use client'

import { useEffect, useRef, useState } from 'react'

interface IDPhotoPreviewCardProps {
  image: File | null
  teacherName: string
  fixedImage: File | null
}

export default function IDPhotoPreviewCard({ image, teacherName, fixedImage }: IDPhotoPreviewCardProps) {
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
    bgImg.src = '/IDphoto_background.png'
    bgImg.onload = () => {
      backgroundImageRef.current = bgImg
      checkAllLoaded()
    }
    bgImg.onerror = () => {
      console.error('背景图加载失败')
      checkAllLoaded()
    }

    // 加载顶层装饰图
    const topImg = new Image()
    topImg.src = '/IDphoto_toplayer.png'
    topImg.onload = () => {
      toplayerImageRef.current = topImg
      checkAllLoaded()
    }
    topImg.onerror = () => {
      console.error('顶层图加载失败')
      checkAllLoaded()
    }
  }, [])

  // 通用绘制卡片函数
  const drawCard = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')
    if (!ctx || !backgroundImageRef.current || !toplayerImageRef.current) return

    const bgImg = backgroundImageRef.current
    const topImg = toplayerImageRef.current

    // 固定画布尺寸 328×322
    canvas.width = 328
    canvas.height = 322

    // 第一层：绘制底层背景图
    ctx.drawImage(bgImg, 0, 0, 328, 322)

    // 第二层：绘制用户上传的证件照（中间层）
    if (image) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const userImg = new Image()
        userImg.onload = () => {
          // 证件照位置：X=99, Y=12，尺寸：254×254
          const targetWidth = 254
          const targetHeight = 254
          const imgX = 99
          const imgY = 12

          // 处理非正方形图片：顶部对齐裁剪成正方形
          const sourceSize = Math.min(userImg.width, userImg.height)
          const sx = (userImg.width - sourceSize) / 2  // 水平居中裁剪
          const sy = 0  // 顶部对齐

          // 绘制证件照（裁剪并缩放到 254×254）
          ctx.drawImage(
            userImg,
            sx, sy, sourceSize, sourceSize,  // 源图裁剪区域
            imgX, imgY, targetWidth, targetHeight  // 目标位置和尺寸
          )

          // 第三层：绘制顶层装饰图
          ctx.drawImage(topImg, 0, 0, 328, 322)
        }
        userImg.src = e.target?.result as string
      }
      reader.readAsDataURL(image)
    } else {
      // 没有用户图片时，也绘制顶层装饰图
      ctx.drawImage(topImg, 0, 0, 328, 322)
    }
  }

  // 生成卡片
  useEffect(() => {
    if (!imagesLoaded || !canvasRef.current) return
    drawCard(canvasRef.current)
  }, [imagesLoaded, image, teacherName])

  // 全屏时绘制
  useEffect(() => {
    if (showFullscreen && fullscreenCanvasRef.current && imagesLoaded) {
      drawCard(fullscreenCanvasRef.current)
    }
  }, [showFullscreen, imagesLoaded, image, teacherName])

  const handleDownload = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    canvas.toBlob((blob) => {
      if (!blob) return

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${teacherName || '老师'}_证件照卡片.png`
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  const handleDownloadFixed = () => {
    if (!fixedImage) return

    const url = URL.createObjectURL(fixedImage)
    const a = document.createElement('a')
    a.href = url
    a.download = `${teacherName || '老师'}_修复证件照.png`
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
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            className="rounded shadow-lg"
            style={{ width: '328px', height: '322px' }}
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
              style={{ width: '656px', height: '644px', maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }}
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
        <p className="text-sm text-gray-500 text-center">请上传证件照查看预览效果</p>
      )}
    </div>
  )
}
