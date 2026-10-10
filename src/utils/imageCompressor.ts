export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  mimeType?: 'image/jpeg' | 'image/webp';
}

export interface CompressionResult {
  compressedDataUrl: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  compressionRatioPercent: number; // e.g. 85 for 85% reduction
  originalDimensions: { width: number; height: number };
  compressedDimensions: { width: number; height: number };
  savedBytes: number;
  formattedOriginalSize: string;
  formattedCompressedSize: string;
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Calculates approximately how many bytes a base64 Data URL uses.
 */
export const getDataUrlSizeBytes = (dataUrl: string): number => {
  const base64Str = dataUrl.split(',')[1] || dataUrl;
  const padding = (base64Str.match(/=/g) || []).length;
  return Math.round((base64Str.length * 3) / 4 - padding);
};

/**
 * Compresses an image File or Data URL in the browser using HTML5 Canvas.
 * Resizes down to max dimensions (default: 1280px) and applies JPEG/WebP compression.
 * Significantly improves upload and triage speed in low-connectivity 2G/3G rural farm settings.
 */
export async function compressImage(
  source: File | string,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const maxWidth = options.maxWidth ?? 1280;
  const maxHeight = options.maxHeight ?? 1280;
  const quality = options.quality ?? 0.78;
  const mimeType = options.mimeType ?? 'image/jpeg';

  return new Promise((resolve, reject) => {
    // 1. Resolve source to a data URL and original size
    let originalSizeBytes = 0;
    const processDataUrl = (srcDataUrl: string, origBytes: number) => {
      originalSizeBytes = origBytes;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const origW = img.naturalWidth || img.width;
          const origH = img.naturalHeight || img.height;

          // Compute new dimensions keeping aspect ratio
          let targetW = origW;
          let targetH = origH;

          if (origW > maxWidth || origH > maxHeight) {
            const ratio = Math.min(maxWidth / origW, maxHeight / origH);
            targetW = Math.round(origW * ratio);
            targetH = Math.round(origH * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            // Fallback to original if canvas context unavailable
            resolve({
              compressedDataUrl: srcDataUrl,
              originalSizeBytes,
              compressedSizeBytes: originalSizeBytes,
              compressionRatioPercent: 0,
              originalDimensions: { width: origW, height: origH },
              compressedDimensions: { width: origW, height: origH },
              savedBytes: 0,
              formattedOriginalSize: formatFileSize(originalSizeBytes),
              formattedCompressedSize: formatFileSize(originalSizeBytes),
            });
            return;
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, targetW, targetH);

          const compressedDataUrl = canvas.toDataURL(mimeType, quality);
          const compressedSizeBytes = getDataUrlSizeBytes(compressedDataUrl);

          // If compression somehow resulted in a larger size (rare with very small thumbnails), use smaller
          const useDataUrl = compressedSizeBytes < originalSizeBytes ? compressedDataUrl : srcDataUrl;
          const finalSize = Math.min(compressedSizeBytes, originalSizeBytes);
          const savedBytes = Math.max(0, originalSizeBytes - finalSize);
          const ratioPct = originalSizeBytes > 0 ? Math.round((savedBytes / originalSizeBytes) * 100) : 0;

          resolve({
            compressedDataUrl: useDataUrl,
            originalSizeBytes,
            compressedSizeBytes: finalSize,
            compressionRatioPercent: ratioPct,
            originalDimensions: { width: origW, height: origH },
            compressedDimensions: { width: targetW, height: targetH },
            savedBytes,
            formattedOriginalSize: formatFileSize(originalSizeBytes),
            formattedCompressedSize: formatFileSize(finalSize),
          });
        } catch (canvasErr) {
          console.warn('[ImageCompressor] Canvas compression failed, using original:', canvasErr);
          resolve({
            compressedDataUrl: srcDataUrl,
            originalSizeBytes,
            compressedSizeBytes: originalSizeBytes,
            compressionRatioPercent: 0,
            originalDimensions: { width: img.naturalWidth || 800, height: img.naturalHeight || 600 },
            compressedDimensions: { width: img.naturalWidth || 800, height: img.naturalHeight || 600 },
            savedBytes: 0,
            formattedOriginalSize: formatFileSize(originalSizeBytes),
            formattedCompressedSize: formatFileSize(originalSizeBytes),
          });
        }
      };

      img.onerror = (err) => {
        reject(new Error('Failed to load image for compression'));
      };

      img.src = srcDataUrl;
    };

    if (typeof source === 'string') {
      const origBytes = getDataUrlSizeBytes(source);
      processDataUrl(source, origBytes);
    } else {
      const origBytes = source.size;
      const reader = new FileReader();
      reader.onload = (e) => {
        const resultUrl = e.target?.result as string;
        processDataUrl(resultUrl, origBytes);
      };
      reader.onerror = (e) => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(source);
    }
  });
}
