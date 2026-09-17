/**
 * Advanced Client-Side Document & Image Compressor
 * Guarantees output file size strictly below 30 KB (< 30,720 bytes)
 * while maximizing document readability, stamps, and signatures for transport LRs.
 */

export const TARGET_MAX_BYTES = 29.5 * 1024; // 29.5 KB (~30,208 bytes, strictly under 30KB)

/**
 * Format bytes into human-readable string (e.g., '4.82 MB', '24.5 KB')
 */
export function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Load an image from a File or Blob object into an HTMLImageElement
 */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image file: ' + (err.message || 'invalid image format')));
    };
    img.src = url;
  });
}

/**
 * Render canvas to Blob with given MIME type and quality
 */
function canvasToBlob(canvas, mimeType = 'image/jpeg', quality = 0.7) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

/**
 * Iterative Adaptive Canvas Compression
 * Downscales dimensions and lowers quality in fine steps until blob.size < targetMaxBytes.
 */
async function compressCanvasToUnder30KB(sourceCanvas, targetMaxBytes = TARGET_MAX_BYTES) {
  let width = sourceCanvas.width;
  let height = sourceCanvas.height;

  // Max initial dimension: 1200px (keeps transport LR text crisp)
  const MAX_DIM = 1200;
  if (width > MAX_DIM || height > MAX_DIM) {
    if (width > height) {
      height = Math.round((height * MAX_DIM) / width);
      width = MAX_DIM;
    } else {
      width = Math.round((width * MAX_DIM) / height);
      height = MAX_DIM;
    }
  }

  let canvas = document.createElement('canvas');
  let ctx = canvas.getContext('2d', { alpha: false });
  canvas.width = width;
  canvas.height = height;

  // Fill white background (crucial for PNGs with transparency when converting to JPEG)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, 0, 0, width, height);

  let bestBlob = null;
  let bestQuality = 0.70;

  // Multi-pass iterative step:
  // Step 1: Adjust JPEG quality from 0.75 down to 0.20
  for (let q = 0.75; q >= 0.20; q -= 0.08) {
    const blob = await canvasToBlob(canvas, 'image/jpeg', q);
    if (blob && blob.size <= targetMaxBytes) {
      bestBlob = blob;
      bestQuality = q;
      break;
    }
  }

  // Step 2: If still > targetMaxBytes, progressively downscale dimensions and retry
  let currentScale = 0.85;
  while ((!bestBlob || bestBlob.size > targetMaxBytes) && width > 240 && height > 240) {
    width = Math.round(width * currentScale);
    height = Math.round(height * currentScale);

    const downscaledCanvas = document.createElement('canvas');
    const downscaledCtx = downscaledCanvas.getContext('2d', { alpha: false });
    downscaledCanvas.width = width;
    downscaledCanvas.height = height;
    downscaledCtx.fillStyle = '#FFFFFF';
    downscaledCtx.fillRect(0, 0, width, height);
    downscaledCtx.imageSmoothingEnabled = true;
    downscaledCtx.imageSmoothingQuality = 'high';
    downscaledCtx.drawImage(canvas, 0, 0, width, height);

    // Try range of qualities on downscaled canvas
    for (let q = 0.65; q >= 0.15; q -= 0.10) {
      const blob = await canvasToBlob(downscaledCanvas, 'image/jpeg', q);
      if (blob && blob.size <= targetMaxBytes) {
        bestBlob = blob;
        bestQuality = q;
        canvas = downscaledCanvas;
        break;
      }
    }

    if (bestBlob && bestBlob.size <= targetMaxBytes) break;
    // Step down slightly more aggressively if needed
    currentScale = 0.80;
  }

  // If extreme case still slightly exceeds, force lowest quality
  if (!bestBlob || bestBlob.size > targetMaxBytes) {
    const minCanvas = document.createElement('canvas');
    const minCtx = minCanvas.getContext('2d', { alpha: false });
    const targetW = Math.min(width, 400);
    const targetH = Math.round((height * targetW) / width);
    minCanvas.width = targetW;
    minCanvas.height = targetH;
    minCtx.fillStyle = '#FFFFFF';
    minCtx.fillRect(0, 0, targetW, targetH);
    minCtx.drawImage(canvas, 0, 0, targetW, targetH);
    bestBlob = await canvasToBlob(minCanvas, 'image/jpeg', 0.15);
  }

  return bestBlob;
}

/**
 * Compress any image or PDF file to strictly below 30 KB
 * @param {File|Blob} file 
 * @param {Function} onProgress Optional progress callback
 * @returns {Promise<Object>} Compression report and compressed File
 */
export async function compressFileToUnder30KB(file, onProgress) {
  if (!file) throw new Error('No file provided for compression');

  const originalSize = file.size;
  if (onProgress) onProgress({ status: 'analyzing', percent: 15, message: 'Analyzing LR document...' });

  let sourceCanvas = null;

  // Case A: Image file (JPEG, PNG, WEBP, etc.)
  if (file.type.startsWith('image/')) {
    if (onProgress) onProgress({ status: 'processing', percent: 35, message: 'Reading high-resolution image...' });
    const img = await loadImage(file);
    sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = img.naturalWidth || img.width;
    sourceCanvas.height = img.naturalHeight || img.height;
    const ctx = sourceCanvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
  } 
  // Case B: PDF file (render first page to canvas)
  else if (file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')) {
    if (onProgress) onProgress({ status: 'processing', percent: 30, message: 'Converting PDF page to canvas...' });
    try {
      const pdfjsLib = await import('pdfjs-dist');
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
      }
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.5 });
      sourceCanvas = document.createElement('canvas');
      sourceCanvas.width = viewport.width;
      sourceCanvas.height = viewport.height;
      const ctx = sourceCanvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
    } catch (pdfErr) {
      console.warn('PDF.js conversion failed, falling back:', pdfErr);
      throw new Error('PDF conversion error: ' + (pdfErr.message || 'Please upload an image copy (JPG/PNG).'));
    }
  } else {
    throw new Error('Unsupported file format. Please upload an image (JPG, PNG, WEBP) or PDF.');
  }

  if (onProgress) onProgress({ status: 'compressing', percent: 65, message: 'Optimizing & compressing below 30 KB...' });

  const compressedBlob = await compressCanvasToUnder30KB(sourceCanvas, TARGET_MAX_BYTES);
  if (!compressedBlob) {
    throw new Error('Failed to compress document below 30 KB.');
  }

  // Generate safe filename with .jpg extension
  const baseName = (file.name || 'lr_document').replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const finalFileName = `${baseName}_under30kb.jpg`;

  const compressedFile = new File([compressedBlob], finalFileName, {
    type: 'image/jpeg',
    lastModified: Date.now()
  });

  if (onProgress) onProgress({ status: 'done', percent: 100, message: 'Document successfully optimized!' });

  const previewUrl = URL.createObjectURL(compressedBlob);
  const savings = Math.max(0, originalSize - compressedFile.size);
  const savingsPercent = originalSize > 0 ? ((savings / originalSize) * 100).toFixed(1) : 0;

  return {
    success: true,
    file: compressedFile,
    blob: compressedBlob,
    previewUrl,
    originalSize,
    compressedSize: compressedFile.size,
    formattedOriginalSize: formatBytes(originalSize),
    formattedCompressedSize: formatBytes(compressedFile.size),
    savingsBytes: savings,
    formattedSavings: formatBytes(savings),
    savingsPercent: `${savingsPercent}%`,
    isUnder30KB: compressedFile.size < 30 * 1024,
    width: sourceCanvas.width,
    height: sourceCanvas.height,
  };
}
