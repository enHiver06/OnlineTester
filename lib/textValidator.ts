/**
 * 纯前端文本验证工具
 * 从 Python 文本验证逻辑转换而来
 */

export interface TextValidationResult {
  valid: boolean;
  errors: string[];
  charCount: number;
  maxChars: number;
}

/**
 * 计算文本字符数
 * 规则：
 * - 中文字符和中文标点：1 个字符
 * - 英文字母、数字、英文标点：0.5 个字符
 * - 空格：0.5 个字符
 * - 中文破折号（——）：1 个字符
 * - 英文破折号（-）：0.5 个字符
 */
export function countTextChars(text: string): number {
  if (!text) {
    return 0;
  }

  let charCount = 0;

  for (const char of text) {
    const code = char.charCodeAt(0);

    // 判断是否为中文字符（包括中文标点）
    if (
      (code >= 0x4e00 && code <= 0x9fff) || // 中文汉字
      (code >= 0x3000 && code <= 0x303f) || // CJK 符号和标点
      (code >= 0xff00 && code <= 0xffef)    // 全角字符
    ) {
      charCount += 1;
    } else {
      // 英文、数字、英文标点、空格
      charCount += 0.5;
    }
  }

  return charCount;
}

/**
 * 检查文本是否符合要求
 */
export function checkText(text: string, maxChars: number): TextValidationResult {
  const errors: string[] = [];

  if (!text || text.trim() === '') {
    return {
      valid: false,
      errors: ['内容为空'],
      charCount: 0,
      maxChars,
    };
  }

  const charCount = countTextChars(text);

  if (charCount > maxChars) {
    errors.push(`有${charCount}个字符超过${maxChars}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    charCount,
    maxChars,
  };
}
