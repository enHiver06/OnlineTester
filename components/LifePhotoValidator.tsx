'use client'

import { useState } from 'react'
import ImageUploader from '@/components/ImageUploader'
import TextInput from '@/components/TextInput'
import PreviewCard from '@/components/PreviewCard'
import { fixImage } from '@/lib/imageProcessor'

interface ImageValidation {
  valid: boolean
  errors: string[]
  canAutoFix: boolean
  currentFormat?: string | null
  currentSize?: { width: number; height: number } | null
  expectedFormat: string
  expectedSize: { width: number; height: number }
}

export default function LifePhotoValidator() {
  const [tutorId, setTutorId] = useState('')
  const [subject, setSubject] = useState('')
  const [teacherName, setTeacherName] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [fixedImage, setFixedImage] = useState<File | null>(null)
  const [text, setText] = useState('')
  const [imageValidation, setImageValidation] = useState<ImageValidation | null>(null)
  const [textCharCount, setTextCharCount] = useState(0)
  const [isFixing, setIsFixing] = useState(false)
  const [fixError, setFixError] = useState<string | null>(null)

  // 计算文本字符数
  const countTextChars = (text: string): number => {
    if (!text) return 0
    let charCount = 0
    for (const char of text) {
      if (char >= '\u4e00' && char <= '\u9fff') {
        charCount += 1
      } else if (char >= '\u3000' && char <= '\u303f') {
        charCount += 1
      } else if (char >= '\uff00' && char <= '\uffef') {
        charCount += 1
      } else {
        charCount += 0.5
      }
    }
    return charCount
  }

  // 监听文本变化，计算字符数
  const handleTextChange = (value: string) => {
    setText(value)
    setTextCharCount(countTextChars(value))
  }

  // 整体校验结果
  const isOverallValid = imageValidation?.valid && textCharCount <= 59 && image !== null && text.trim() !== ''

  // 是否显示整体校验结果（只要有任何输入就显示）
  const showOverallResult = image !== null || text.trim() !== ''

  // 判断是否是缺失内容
  const isMissingContent = !image || !text.trim()

  // 判断是否是内容不符合要求
  const isContentInvalid = (image && imageValidation && !imageValidation.valid) || (text.trim() && textCharCount > 59)

  // 自动修复图片
  const handleFix = async () => {
    if (!image) return

    setIsFixing(true)
    setFixError(null) // 清除之前的错误
    try {
      const result = await fixImage(
        image,
        'PNG',
        { width: 900, height: 1200 },
        true
      )

      if (result.success && result.blob) {
        const fixedFile = new File([result.blob], 'fixed_' + image.name, {
          type: 'image/png',
        })
        setFixedImage(fixedFile)
        setImage(fixedFile)
        // 不显示 alert，修复成功后会自动重新验证
      } else {
        setFixError(result.error || '修复失败，请检查图片或稍后重试')
      }
    } catch (error: any) {
      console.error('修复失败:', error)
      setFixError(error.message || '修复失败，请检查图片或稍后重试')
    } finally {
      setIsFixing(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 左侧：上传和输入区域 */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            上传区域
          </h2>

          <div className="space-y-4">
            {/* 学科 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                学科
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                style={{ color: subject === '' ? '#9ca3af' : '#111827' }}
              >
                <option value="" className="text-gray-400">请选择学科</option>
                <option value="数学" className="text-gray-900">数学</option>
                <option value="英语" className="text-gray-900">英语</option>
                <option value="人文" className="text-gray-900">人文</option>
                <option value="物理" className="text-gray-900">物理</option>
                <option value="化学" className="text-gray-900">化学</option>
              </select>
            </div>

            {/* 辅导ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                辅导ID
              </label>
              <input
                type="text"
                value={tutorId}
                onChange={(e) => setTutorId(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  tutorId && !/^\d+$/.test(tutorId)
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                placeholder="请输入辅导ID"
              />
              {tutorId && !/^\d+$/.test(tutorId) && (
                <p className="mt-1 text-sm text-red-600">辅导ID只能包含数字</p>
              )}
            </div>

            {/* 老师姓名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                老师姓名
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入老师姓名"
              />
            </div>

            {/* 图片上传 */}
            <ImageUploader
              onImageUpload={(file) => {
                setImage(file)
                setFixedImage(null)  // 清空修复图片
                setFixError(null)     // 清空错误信息
              }}
              currentImage={image}
              onValidationResult={setImageValidation}
            />

            {/* 文案输入 */}
            <TextInput value={text} onChange={handleTextChange} maxChars={59} />

            {/* 自动修复按钮 */}
            {imageValidation && !isOverallValid && imageValidation.canAutoFix && (
              <div className="space-y-2">
                <button
                  onClick={handleFix}
                  disabled={isFixing}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isFixing ? '修复中...' : '自动修复'}
                </button>
                <p className="text-xs text-gray-500 text-center">
                  注意：自动修复可能存在异常，请修复后确认
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 右侧：预览区域 */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <PreviewCard
            image={image}
            text={text}
            teacherName={teacherName}
            fixedImage={fixedImage}
          />
        </div>

        {/* 整体校验结果 */}
        {showOverallResult && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <span className="text-lg font-semibold text-gray-900">整体校验结果</span>
                <span className={`text-lg font-bold ${isOverallValid ? 'text-green-600' : 'text-red-600'}`}>
                  {isOverallValid ? '✓ 通过' : isMissingContent ? '✗ 缺失内容' : '✗ 不通过'}
                </span>
              </div>

              {/* 显示缺失项或不符合项 */}
              {!isOverallValid && (
                <div className="space-y-2">
                  {!image && (
                    <div className="flex items-center gap-2 text-sm text-orange-600">
                      <span>•</span>
                      <span>请上传生活照</span>
                    </div>
                  )}
                  {!text.trim() && (
                    <div className="flex items-center gap-2 text-sm text-orange-600">
                      <span>•</span>
                      <span>请输入自我介绍文案</span>
                    </div>
                  )}
                  {image && imageValidation && !imageValidation.valid && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <span>•</span>
                      <span>生活照不符合要求</span>
                    </div>
                  )}
                  {text.trim() && textCharCount > 59 && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <span>•</span>
                      <span>文案字符数超出限制</span>
                    </div>
                  )}
                </div>
              )}

              {/* 修复错误提示 */}
              {fixError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{fixError}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 验证规则说明 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">验证规则</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <p><strong>生活照尺寸：</strong>900×1200px</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <p><strong>生活照格式：</strong>PNG（全透明背景）</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <p><strong>自我介绍文案：</strong>不超过59个字符（中文1字符，英文0.5字符）</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
