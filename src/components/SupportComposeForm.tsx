import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { GAME_CONFIG } from '../config/gameConfig'
import { SUPPORT_IMAGE_MIME_TYPES, validateSupportImageFile } from '../utils/compressImage'

interface SupportComposeFormProps {
  quickMessages: readonly string[]
  intro?: string
  messageLabel?: string
  messagePlaceholder?: string
  submitLabel: string
  submittingLabel?: string
  error?: string
  loading?: boolean
  onSubmit: (payload: { message: string; imageFile?: File }) => void | Promise<void>
}

export function SupportComposeForm({
  quickMessages,
  intro,
  messageLabel = 'DEIXE UMA MENSAGEM:',
  messagePlaceholder = 'Sua mensagem...',
  submitLabel,
  submittingLabel = 'ENVIANDO...',
  error,
  loading = false,
  onSubmit,
}: SupportComposeFormProps) {
  const fieldId = useId()
  const messageId = `${fieldId}-message`
  const imageId = `${fieldId}-image`
  const [message, setMessage] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')
  const [imageError, setImageError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canSubmit = Boolean(message.trim() || imageFile)

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    }
  }, [imagePreviewUrl])

  function clearImage() {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    setImageFile(null)
    setImagePreviewUrl('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleImagePick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      validateSupportImageFile(file)
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
      setImageFile(file)
      setImagePreviewUrl(URL.createObjectURL(file))
      setImageError('')
    } catch (err) {
      clearImage()
      setImageError(err instanceof Error ? err.message : 'Imagem inválida')
    }
  }

  return (
    <>
      {intro ? <p className="modal-text">{intro}</p> : null}

      <div className="quick-messages">
        {quickMessages.map((msg) => (
          <button
            key={msg}
            type="button"
            className="quick-message-btn"
            onClick={() => setMessage(msg)}
          >
            {msg}
          </button>
        ))}
      </div>

      <div className="form-group">
        <label htmlFor={messageId}>{messageLabel}</label>
        <textarea
          id={messageId}
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, GAME_CONFIG.SUPPORT_MESSAGE_MAX_LENGTH))}
          maxLength={GAME_CONFIG.SUPPORT_MESSAGE_MAX_LENGTH}
          rows={3}
          placeholder={messagePlaceholder}
        />
        <span className="char-count">{message.length}/{GAME_CONFIG.SUPPORT_MESSAGE_MAX_LENGTH}</span>
      </div>

      <div className="support-image-attach">
        <input
          ref={fileInputRef}
          id={imageId}
          type="file"
          accept={SUPPORT_IMAGE_MIME_TYPES.join(',')}
          onChange={handleImagePick}
          hidden
        />
        <label htmlFor={imageId} className="btn btn--secondary support-image-attach__btn">
          <ImagePlus size={16} aria-hidden />
          ANEXAR IMAGEM
        </label>
        {imagePreviewUrl && (
          <div className="support-image-attach__preview">
            <img src={imagePreviewUrl} alt="Prévia da imagem anexada" />
            <button type="button" className="support-image-attach__remove" onClick={clearImage} aria-label="Remover imagem">
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {(imageError || error) && <p className="form-error">{imageError || error}</p>}

      <button
        type="button"
        className="btn btn--support btn--full"
        onClick={() => void onSubmit({ message, imageFile: imageFile ?? undefined })}
        disabled={loading || !canSubmit}
      >
        {loading ? submittingLabel : submitLabel}
      </button>
    </>
  )
}
