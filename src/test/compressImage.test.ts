import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GAME_CONFIG } from '../config/gameConfig'
import {
  compressSupportImage,
  SUPPORT_IMAGE_MIME_TYPES,
  validateSupportImageFile,
} from '../utils/compressImage'

function makeFile(type: string, size = 1024, name = 'photo.bin'): File {
  const file = new File(['x'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('validateSupportImageFile', () => {
  it('accepts jpeg, png and webp', () => {
    for (const type of SUPPORT_IMAGE_MIME_TYPES) {
      expect(() => validateSupportImageFile(makeFile(type))).not.toThrow()
    }
  })

  it('rejects gif and heic', () => {
    expect(() => validateSupportImageFile(makeFile('image/gif', 1024, 'a.gif'))).toThrow(
      /JPEG, PNG ou WebP/,
    )
    expect(() => validateSupportImageFile(makeFile('image/heic', 1024, 'a.heic'))).toThrow(
      /JPEG, PNG ou WebP/,
    )
  })

  it('rejects files above the input byte cap', () => {
    const file = makeFile('image/jpeg', GAME_CONFIG.SUPPORT_IMAGE_MAX_INPUT_BYTES + 1, 'huge.jpg')
    expect(() => validateSupportImageFile(file)).toThrow(/10 MB/)
  })
})

describe('compressSupportImage', () => {
  const originalGetContext = HTMLCanvasElement.prototype.getContext
  const originalToBlob = HTMLCanvasElement.prototype.toBlob
  const OriginalImage = globalThis.Image

  beforeEach(() => {
    vi.stubGlobal(
      'Image',
      class {
        width = 2000
        height = 1200
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        set src(_value: string) {
          queueMicrotask(() => this.onload?.())
        }
      },
    )

    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      fillStyle: '',
      fillRect: vi.fn(),
      drawImage: vi.fn(),
    })) as unknown as typeof HTMLCanvasElement.prototype.getContext
  })

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext
    HTMLCanvasElement.prototype.toBlob = originalToBlob
    globalThis.Image = OriginalImage
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns a jpeg under the output byte cap', async () => {
    HTMLCanvasElement.prototype.toBlob = function (cb) {
      cb(new Blob([new Uint8Array(80 * 1024)], { type: 'image/jpeg' }))
    }

    const result = await compressSupportImage(makeFile('image/png', 400_000, 'big.png'))
    expect(result.type).toBe('image/jpeg')
    expect(result.size).toBeLessThanOrEqual(GAME_CONFIG.SUPPORT_IMAGE_MAX_OUTPUT_BYTES)
  })

  it('retries with lower quality when the first pass is too large', async () => {
    let calls = 0
    HTMLCanvasElement.prototype.toBlob = function (cb) {
      calls += 1
      const bytes = calls === 1 ? 300 * 1024 : 120 * 1024
      cb(new Blob([new Uint8Array(bytes)], { type: 'image/jpeg' }))
    }

    const result = await compressSupportImage(makeFile('image/jpeg', 900_000, 'photo.jpg'))
    expect(calls).toBeGreaterThan(1)
    expect(result.size).toBeLessThanOrEqual(GAME_CONFIG.SUPPORT_IMAGE_MAX_OUTPUT_BYTES)
  })
})
