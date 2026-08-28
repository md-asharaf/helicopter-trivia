import type { ReactNode } from 'react'

interface ModalAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
}

interface ModalProps {
  title: string
  description?: string
  children?: ReactNode
  primaryAction?: ModalAction
  secondaryAction?: ModalAction
  tertiaryAction?: ModalAction
  quaternaryAction?: ModalAction
  onClose?: () => void
}

/**
 * Reusable glassmorphic modal base.
 * All other overlays compose from this — consistent design language.
 */
export function Modal({
  title,
  description,
  children,
  primaryAction,
  secondaryAction,
  tertiaryAction,
  quaternaryAction,
}: ModalProps) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-container">
        <div className="modal-glow" />
        <h2 id="modal-title" className="modal-title">{title}</h2>
        {description && <p className="modal-description">{description}</p>}
        {children && <div className="modal-content">{children}</div>}
        <div className="modal-actions">
          {primaryAction && (
            <button
              className={`modal-btn modal-btn--${primaryAction.variant ?? 'primary'}`}
              onClick={primaryAction.onClick}
              autoFocus
            >
              {primaryAction.label}
            </button>
          )}
          {secondaryAction && (
            <button
              className="modal-btn modal-btn--secondary"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </button>
          )}
          {tertiaryAction && (
            <button
              className="modal-btn modal-btn--secondary"
              onClick={tertiaryAction.onClick}
            >
              {tertiaryAction.label}
            </button>
          )}
          {quaternaryAction && (
            <button
              className="modal-btn modal-btn--secondary"
              onClick={quaternaryAction.onClick}
            >
              {quaternaryAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
