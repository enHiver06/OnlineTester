'use client'

import { useState } from 'react'
import IDPhotoUploader from '@/components/IDPhotoUploader'
import IDPhotoPreviewCard from '@/components/IDPhotoPreviewCard'
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

export default function IDPhotoValidator() {
  const [tutorId, setTutorId] = useState('')
  const [subject, setSubject] = useState('')
  const [teacherName, setTeacherName] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [fixedImage, setFixedImage] = useState<File | null>(null)
  const [imageValidation, setImageValidation] = useState<ImageValidation | null>(null)
  const [isFixing, setIsFixing] = useState(false)
  const [fixError, setFixError] = useState<string | null>(null)

  // 整体校验结果
  const isOverallValid = imageValidation?.valid && image !== null

  // 是否显示整体校验结果
  const showOverallResult = image !== null

  // 判断是否是缺失内容
  const isMissingContent = !image

  // 自动修复图片
  const handleFix = async () => {
    if (!image) return

    setIsFixing(true)
    setFixError(null)
    try {
      const result = await fixImage(
        image,
        'PNG',
        { width: 400, height: 400 },
        true
      )

      if (result.success && result.blob) {
        const fixedFile = new File([result.blob], 'fixed_' + image.name, {
          type: 'image/png',
        })
        setFixedImage(fixedFile)
        setImage(fixedFile)
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

            {/* 证件照上传 */}
            <IDPhotoUploader
              onImageUpload={(file) => {
                setImage(file)
                setFixedImage(null)  // 清空修复图片
                setFixError(null)     // 清空错误信息
              }}
              currentImage={image}
              onValidationResult={setImageValidation}
            />

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
          <IDPhotoPreviewCard
            image={image}
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
                      <span>请上传证件照</span>
                    </div>
                  )}
                  {image && imageValidation && !imageValidation.valid && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <span>•</span>
                      <span>证件照不符合要求</span>
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
              <p><strong>证件照尺寸：</strong>400×400px</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <p><strong>证件照格式：</strong>PNG（全透明背景）</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
