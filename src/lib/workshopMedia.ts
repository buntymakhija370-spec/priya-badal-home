/** Client-side helpers to capture / compress workshop photos & design files. */

const IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'])
const DESIGN_EXT = /\.(jpe?g|png|webp|pdf|dwg|dxf|step|stp|iges|igs|cdr|ai)$/i

export function isImageMime(mime: string): boolean {
  return IMAGE_TYPES.has(mime.toLowerCase()) || mime.startsWith('image/')
}

export function isAllowedDesignFile(file: File): boolean {
  if (isImageMime(file.type) || file.type === 'application/pdf') return true
  return DESIGN_EXT.test(file.name)
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read image'))
    }
    img.src = url
  })
}

/** Compress an image to JPEG data URL (max edge / quality for KV size). */
export async function compressImageFile(
  file: File,
  opts: { maxEdge?: number; quality?: number } = {},
): Promise<{ name: string; mimeType: string; dataUrl: string }> {
  const maxEdge = opts.maxEdge ?? 1280
  const quality = opts.quality ?? 0.72
  const img = await loadImage(file)
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not available')
  ctx.drawImage(img, 0, 0, w, h)
  const dataUrl = canvas.toDataURL('image/jpeg', quality)
  const base = file.name.replace(/\.[^.]+$/, '') || 'photo'
  return { name: `${base}.jpg`, mimeType: 'image/jpeg', dataUrl }
}

/** Read a small non-image design file as data URL (CAD / PDF). */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

const MAX_DESIGN_BYTES = 2.5 * 1024 * 1024

export async function fileToAttachmentPayload(file: File): Promise<{
  name: string
  mimeType: string
  dataUrl: string
}> {
  if (isImageMime(file.type) || /\.jpe?g$/i.test(file.name) || /\.png$/i.test(file.name)) {
    return compressImageFile(file)
  }
  if (file.size > MAX_DESIGN_BYTES) {
    throw new Error(`${file.name} is too large (max 2.5 MB). Use JPG photo or smaller CAD/PDF.`)
  }
  if (!isAllowedDesignFile(file)) {
    throw new Error('Use JPG / PNG / PDF / DWG / DXF / STEP for designer files')
  }
  const dataUrl = await readFileAsDataUrl(file)
  return {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    dataUrl,
  }
}

/** Capture from camera input (capture=environment) then compress. */
export async function cameraFileToJpeg(file: File): Promise<{
  name: string
  mimeType: string
  dataUrl: string
}> {
  return compressImageFile(file, { maxEdge: 1280, quality: 0.7 })
}
