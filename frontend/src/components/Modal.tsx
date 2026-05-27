import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { Button } from './ui/Button'
import { cn } from '../utils/cn'

interface Props {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeCls = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export function Modal({ open, title, onClose, children, footer, size = 'md' }: Props) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={cn(
          'bg-canvas rounded-lg shadow-md w-full max-h-[90vh] overflow-hidden flex flex-col',
          sizeCls[size],
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className="px-5 py-4 border-b border-hairline flex items-center justify-between gap-3">
          <h2 id="modal-title" className="text-lg font-semibold text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline text-muted hover:text-ink hover:bg-surface-soft transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </header>
        <div className="p-5 overflow-y-auto">{children}</div>
        {footer && (
          <footer className="px-5 py-3 border-t border-hairline bg-surface-soft flex justify-end gap-2">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}

export function ModalFooterActions({
  onCancel,
  submitLabel,
  submitting,
  submitDisabled,
  submitForm,
  danger,
}: {
  onCancel: () => void
  submitLabel: string
  submitting?: boolean
  submitDisabled?: boolean
  submitForm?: string
  danger?: boolean
}) {
  return (
    <>
      <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
        Cancel
      </Button>
      <Button
        type="submit"
        form={submitForm}
        variant={danger ? 'danger' : 'primary'}
        size="sm"
        disabled={submitting || submitDisabled}
      >
        {submitting ? 'Saving…' : submitLabel}
      </Button>
    </>
  )
}
