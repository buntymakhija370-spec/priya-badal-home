/** Compress an image file to a JPEG data URL suitable for workshop photo proofs. */

export async function compressImageToDataUrl(
  file: File,
  opts?: { maxEdge?: number; quality?: number },
): Promise<{ dataUrl: string; fileName: string }> {
  const maxEdge = opts?.maxEdge ?? 1280
  const quality = opts?.quality ?? 0.72

  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a photo (image file)')
  }

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not process photo')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  const dataUrl = canvas.toDataURL('image/jpeg', quality)
  if (dataUrl.length > 1_800_000) {
    const tighter = canvas.toDataURL('image/jpeg', 0.55)
    if (tighter.length > 1_800_000) {
      throw new Error('Photo still too large — try a closer / smaller shot')
    }
    return { dataUrl: tighter, fileName: file.name }
  }
  return { dataUrl, fileName: file.name }
}
