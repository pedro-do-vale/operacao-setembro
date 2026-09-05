import { GAME_CONFIG } from '../config/gameConfig'

export const SUPPORT_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export type SupportImageMimeType = (typeof SUPPORT_IMAGE_MIME_TYPES)[number]

const QUALITY_STEP = 0.12
const DIMENSION_STEP = 0.75
const MIN_QUALITY = 0.4
const MAX_ATTEMPTS = 6

export function isSupportImageMimeType(value: string): value is SupportImageMimeType {
  return (SUPPORT_IMAGE_MIME_TYPES as readonly string[]).includes(value)
}

export function validateSupportImageFile(file: File): void {
  if (!isSupportImageMimeType(file.type)) {
    throw new Error('Use JPEG, PNG ou WebP. GIF e HEIC não são suportados.')
  }
  if (file.size > GAME_CONFIG.SUPPORT_IMAGE_MAX_INPUT_BYTES) {
    throw new Error('Imagem muito grande. Máximo 10 MB.')
  }
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
      reject(new Error('Não foi possível ler a imagem.'))
    }
    img.src = url
  })
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Falha ao compactar a imagem.'))
        else resolve(blob)
      },
      'image/jpeg',
      quality,
    )
  })
}

export async function compressSupportImage(file: File): Promise<File> {
  validateSupportImageFile(file)

  const img = await loadImage(file)
  let maxSide: number = GAME_CONFIG.SUPPORT_IMAGE_MAX_DIMENSION
  let quality: number = GAME_CONFIG.SUPPORT_IMAGE_JPEG_QUALITY

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height, 1))
    const width = Math.max(1, Math.round(img.width * scale))
    const height = Math.max(1, Math.round(img.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Falha ao compactar a imagem.')
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)

    const blob = await canvasToJpegBlob(canvas, quality)
    if (blob.size <= GAME_CONFIG.SUPPORT_IMAGE_MAX_OUTPUT_BYTES) {
      return new File([blob], 'support.jpg', { type: 'image/jpeg', lastModified: Date.now() })
    }

    quality = Math.max(MIN_QUALITY, quality - QUALITY_STEP)
    maxSide = Math.max(320, Math.round(maxSide * DIMENSION_STEP))
  }

  throw new Error('Não foi possível compactar a imagem o suficiente.')
}
