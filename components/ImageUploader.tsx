'use client'

import { useRef, useState, useEffect } from 'react'
import { checkImage } from '@/lib/imageProcessor'

interface ImageValidation {
  valid: boolean
  errors: string[]
  canAutoFix: boolean
  currentFormat: string | null
  currentSize: { width: number; height: number } | null
  expectedFormat: string
  expectedSize: { width: number; height: number }
}

interface ImageUploaderProps {
  onImageUpload: (file: File) => void
  currentImage: File | null
  onValidationResult?: (result: ImageValidation | null) => void
}

export default function ImageUploader({ onImageUpload, currentImage, onValidationResult }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [validationResult, setValidationResult] = useState<ImageValidation | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // 自动验证图片
  useEffect(() => {
    if (currentImage) {
      validateImage(currentImage)
    } else {
      setValidationResult(null)
      if (onValidationResult) {
        onValidationResult(null)
      }
    }
  }, [currentImage])

  const validateImage = async (file: File) => {
    setIsValidating(true)
    try {
      // 使用纯前端验证
      const result = await checkImage(
        file,
        'PNG',
        { width: 900, height: 1200 },
        true
      )

      // 转换格式以匹配接口
      const validationResult: ImageValidation = {
        valid: result.valid,
        errors: result.errors,
        canAutoFix: result.canAutoFix,
        currentFormat: result.currentFormat,
        currentSize: result.currentSize,
        expectedFormat: result.expectedFormat,
        expectedSize: result.expectedSize,
      }

      setValidationResult(validationResult)
      if (onValidationResult) {
        onValidationResult(validationResult)
      }
    } catch (error) {
      console.error('验证失败:', error)
    } finally {
      setIsValidating(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件')
      return
    }

    // 创建预览
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    onImageUpload(file)
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        生活照（半身照）
      </label>
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleChange}
        />

        {preview ? (
          <div className="space-y-2">
            <img
              src={preview}
              alt="预览"
              className="max-h-48 mx-auto rounded"
            />
            <p className="text-sm text-gray-600">
              {currentImage?.name}
            </p>
            <p className="text-xs text-gray-500">
              点击或拖拽更换图片
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-blue-600">点击上传</span>
              {' '}或拖拽图片到此处
            </div>
            <p className="text-xs text-gray-500">
              支持 PNG, JPG, JPEG 格式
            </p>
          </div>
        )}
      </div>

      {/* 验证结果显示 */}
      {isValidating && (
        <div className="mt-3 text-sm text-gray-500">
          验证中...
        </div>
      )}

      {!isValidating && validationResult && (
        <div className="mt-3">
          {validationResult.valid ? (
            <div className="flex items-center gap-2 text-green-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">校验通过</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">校验不通过</span>
              </div>
              <ul className="text-sm text-red-600 space-y-1 ml-7">
                {validationResult.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
              <div className="text-xs text-gray-500 ml-7 space-y-1">
                <p>
                  当前格式: {validationResult.currentFormat || '未知'} | 要求: {validationResult.expectedFormat}
                </p>
                <p>
                  当前尺寸: {validationResult.currentSize ? `${validationResult.currentSize.width}×${validationResult.currentSize.height}` : '未知'} | 要求: {validationResult.expectedSize.width}×{validationResult.expectedSize.height}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
