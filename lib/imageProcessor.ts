/**
 * 纯前端图片处理工具
 * 将 Python PIL 的图片处理逻辑转换为 Canvas API 实现
 */

export interface ImageValidationResult {
  valid: boolean;
  errors: string[];
  canAutoFix: boolean;
  currentFormat: string | null;
  currentSize: { width: number; height: number } | null;
  expectedFormat: string;
  expectedSize: { width: number; height: number };
}

/**
 * 检测图片边缘的背景色
 */
function detectBackgroundColor(
  imageData: ImageData,
  tolerance: number = 15
): { color: [number, number, number]; success: boolean } {
  const { width, height, data } = imageData;
  const edgeColors: [number, number, number][] = [];

  // 采样边缘像素
  // 上边
  for (let x = 0; x < width; x++) {
    const idx = (0 * width + x) * 4;
    edgeColors.push([data[idx], data[idx + 1], data[idx + 2]]);
  }
  // 下边
  for (let x = 0; x < width; x++) {
    const idx = ((height - 1) * width + x) * 4;
    edgeColors.push([data[idx], data[idx + 1], data[idx + 2]]);
  }
  // 左边（排除角落）
  for (let y = 1; y < height - 1; y++) {
    const idx = (y * width + 0) * 4;
    edgeColors.push([data[idx], data[idx + 1], data[idx + 2]]);
  }
  // 右边（排除角落）
  for (let y = 1; y < height - 1; y++) {
    const idx = (y * width + (width - 1)) * 4;
    edgeColors.push([data[idx], data[idx + 1], data[idx + 2]]);
  }

  // 统计颜色出现次数（考虑容差）
  const colorGroups = new Map<string, { color: [number, number, number]; count: number }>();

  for (const color of edgeColors) {
    let foundGroup = false;

    for (const [key, group] of colorGroups.entries()) {
      const baseColor = group.color;
      if (
        Math.abs(color[0] - baseColor[0]) <= tolerance &&
        Math.abs(color[1] - baseColor[1]) <= tolerance &&
        Math.abs(color[2] - baseColor[2]) <= tolerance
      ) {
        group.count++;
        foundGroup = true;
        break;
      }
    }

    if (!foundGroup) {
      const key = color.join(',');
      colorGroups.set(key, { color, count: 1 });
    }
  }

  if (colorGroups.size === 0) {
    return { color: [255, 255, 255], success: false };
  }

  // 找出现最多的颜色
  let maxCount = 0;
  let bgColor: [number, number, number] = [255, 255, 255];

  for (const group of colorGroups.values()) {
    if (group.count > maxCount) {
      maxCount = group.count;
      bgColor = group.color;
    }
  }

  // 检查是否有明显的主导颜色（至少占50%）
  const totalPixels = edgeColors.length;
  if (maxCount / totalPixels < 0.5) {
    return { color: bgColor, success: false };
  }

  return { color: bgColor, success: true };
}

/**
 * 移除图片的纯色背景，将其变为透明
 */
function removeBackground(
  imageData: ImageData,
  bgColor: [number, number, number],
  tolerance: number = 15
): ImageData {
  const { width, height, data } = imageData;
  const newData = new Uint8ClampedArray(data);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // 检查像素是否接近背景色
    if (
      Math.abs(r - bgColor[0]) <= tolerance &&
      Math.abs(g - bgColor[1]) <= tolerance &&
      Math.abs(b - bgColor[2]) <= tolerance
    ) {
      // 设置为完全透明
      newData[i + 3] = 0;
    }
  }

  return new ImageData(newData, width, height);
}

/**
 * 保持比例缩放图片，不足部分填充透明背景
 */
async function resizeImageWithPadding(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  align: 'top' | 'center' | 'bottom' = 'bottom'
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d')!;

  // 计算缩放比例（保持比例，取较小的缩放比）
  const scale = Math.min(targetWidth / img.width, targetHeight / img.height);

  // 计算新尺寸
  const newWidth = Math.floor(img.width * scale);
  const newHeight = Math.floor(img.height * scale);

  // 计算粘贴位置
  const x = Math.floor((targetWidth - newWidth) / 2); // 水平居中

  let y: number;
  if (align === 'top') {
    y = 0;
  } else if (align === 'center') {
    y = Math.floor((targetHeight - newHeight) / 2);
  } else {
    // bottom
    y = targetHeight - newHeight;
  }

  // 绘制图片
  ctx.drawImage(img, x, y, newWidth, newHeight);

  return canvas;
}

/**
 * 检查图片是否有足够的完全透明像素
 */
function checkImageTransparency(imageData: ImageData): {
  isTransparent: boolean;
  transparentCount: number;
} {
  const { width, height, data } = imageData;
  let fullyTransparentCount = 0;

  // 统计完全透明的像素（alpha = 0）
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] === 0) {
      fullyTransparentCount++;
    }
  }

  const totalPixels = width * height;
  const transparentRatio = fullyTransparentCount / totalPixels;

  // 要求透明像素比例 > 0.1% (0.001)
  return {
    isTransparent: transparentRatio > 0.001,
    transparentCount: fullyTransparentCount,
  };
}

/**
 * 从 File 对象加载图片
 */
function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片加载失败'));
    };

    img.src = url;
  });
}

/**
 * 获取图片的 ImageData
 */
function getImageData(img: HTMLImageElement): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, img.width, img.height);
}

/**
 * 检查图片是否符合要求
 */
export async function checkImage(
  file: File,
  expectedFormat: string,
  expectedSize: { width: number; height: number },
  needTransparent: boolean
): Promise<ImageValidationResult> {
  const errors: string[] = [];

  try {
    const img = await loadImageFromFile(file);

    // 检查格式
    const fileFormat = file.type.split('/')[1].toUpperCase();
    if (fileFormat !== expectedFormat) {
      errors.push(`格式为${fileFormat}`);
    }

    // 检查尺寸
    if (img.width !== expectedSize.width || img.height !== expectedSize.height) {
      errors.push(
        `尺寸为${img.width}*${img.height}应为${expectedSize.width}*${expectedSize.height}`
      );
    }

    // 检查透明度
    if (needTransparent) {
      const imageData = getImageData(img);
      const { isTransparent } = checkImageTransparency(imageData);
      if (!isTransparent) {
        errors.push('非透明底');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      canAutoFix: errors.length > 0,
      currentFormat: fileFormat,
      currentSize: { width: img.width, height: img.height },
      expectedFormat,
      expectedSize,
    };
  } catch (error) {
    return {
      valid: false,
      errors: ['图片损坏'],
      canAutoFix: false,
      currentFormat: null,
      currentSize: null,
      expectedFormat,
      expectedSize,
    };
  }
}

/**
 * 自动修复图片
 */
export async function fixImage(
  file: File,
  expectedFormat: string,
  expectedSize: { width: number; height: number },
  needTransparent: boolean
): Promise<{ blob: Blob | null; success: boolean; error: string | null }> {
  try {
    const img = await loadImageFromFile(file);
    let canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    let ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);

    // 1. 处理透明背景
    if (needTransparent) {
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { isTransparent } = checkImageTransparency(imageData);

      if (!isTransparent) {
        // 检测背景色
        const { color: bgColor, success } = detectBackgroundColor(imageData);

        if (!success) {
          return { blob: null, success: false, error: '背景复杂无法自动修复' };
        }

        // 移除背景
        imageData = removeBackground(imageData, bgColor);
        ctx.putImageData(imageData, 0, 0);
      }
    }

    // 2. 调整尺寸
    if (img.width !== expectedSize.width || img.height !== expectedSize.height) {
      // 如果已经处理过背景，需要先将 canvas 转换为图片再缩放
      if (needTransparent) {
        const tempImg = new Image();
        const dataUrl = canvas.toDataURL('image/png');
        await new Promise<void>((resolve) => {
          tempImg.onload = () => resolve();
          tempImg.src = dataUrl;
        });
        canvas = await resizeImageWithPadding(
          tempImg,
          expectedSize.width,
          expectedSize.height,
          'bottom'
        );
      } else {
        canvas = await resizeImageWithPadding(
          img,
          expectedSize.width,
          expectedSize.height,
          'bottom'
        );
      }
    }

    // 3. 转换为 PNG Blob
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ blob, success: true, error: null });
          } else {
            resolve({ blob: null, success: false, error: '转换失败' });
          }
        },
        'image/png',
        1.0
      );
    });
  } catch (error) {
    return {
      blob: null,
      success: false,
      error: `修复失败: ${error instanceof Error ? error.message : '未知错误'}`,
    };
  }
}
