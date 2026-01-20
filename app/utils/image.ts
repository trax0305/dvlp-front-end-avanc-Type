export async function fileToResizedBase64(
  file: File,
  opts: { maxWidth?: number; quality?: number } = {}
): Promise<string> {
  const maxWidth = opts.maxWidth ?? 720
  const quality = opts.quality ?? 0.7

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('FileReader failed'))
    reader.readAsDataURL(file)
  })

  // Charge dans une image
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = () => reject(new Error('Image load failed'))
    i.src = dataUrl
  })

  // Resize via canvas
  const scale = img.width > maxWidth ? maxWidth / img.width : 1
  const w = Math.round(img.width * scale)
  const h = Math.round(img.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D not available')

  ctx.drawImage(img, 0, 0, w, h)

  // JPEG compressé (beaucoup plus léger que PNG)
  return canvas.toDataURL('image/jpeg', quality)
}
