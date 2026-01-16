'use client'

import { useEffect, useState } from 'react'

interface TextInputProps {
  value: string
  onChange: (value: string) => void
  maxChars: number
}

// 复用后端的字符计数逻辑
function countTextChars(text: string): number {
  if (!text) return 0

  let charCount = 0

  for (const char of text) {
    // 判断是否为中文字符（包括中文标点）
    if (char >= '\u4e00' && char <= '\u9fff') {
      // 中文汉字
      charCount += 1
    } else if (char >= '\u3000' && char <= '\u303f') {
      // CJK 符号和标点
      charCount += 1
    } else if (char >= '\uff00' && char <= '\uffef') {
      // 全角字符
      charCount += 1
    } else {
      // 英文、数字、英文标点、空格
      charCount += 0.5
    }
  }

  return charCount
}

export default function TextInput({ value, onChange, maxChars }: TextInputProps) {
  const [charCount, setCharCount] = useState(0)

  useEffect(() => {
    setCharCount(countTextChars(value))
  }, [value])

  const isOverLimit = charCount > maxChars

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        自我介绍文案
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
          isOverLimit
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
        }`}
        rows={4}
        placeholder="请输入自我介绍文案..."
      />
      <div className="mt-1 flex justify-between items-center text-sm">
        <span className="text-gray-500">
          中文1字符，英文0.5字符，空格0.5字符
        </span>
        <span
          className={`font-medium ${
            isOverLimit ? 'text-red-600' : 'text-gray-600'
          }`}
        >
          当前 {charCount} / {maxChars} 字符
        </span>
      </div>
      {isOverLimit && (
        <p className="mt-1 text-sm text-red-600">
          超出 {(charCount - maxChars).toFixed(1)} 个字符
        </p>
      )}
    </div>
  )
}
