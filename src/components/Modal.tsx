import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  variant?: 'default' | 'danger' | 'promotion' | 'monk'
  className?: string
}

export function Modal({ open, onClose, title, children, variant = 'default', className }: ModalProps) {
  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className={['modal', `modal--${variant}`, className].filter(Boolean).join(' ')}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {title && (
          <div className="modal__header">
            <h2 id="modal-title" className="modal__title">{title}</h2>
            <button type="button" className="modal__close" onClick={onClose} aria-label="Fechar">
              <X size={20} />
            </button>
          </div>
        )}
        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}
