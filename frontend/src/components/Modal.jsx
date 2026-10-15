import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Modal({ title, onClose, children, labelledBy = 'modal-title' }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && onClose) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-4 sm:items-center" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onMouseDown={(event) => event.stopPropagation()}
        className="relative max-h-full w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-lift"
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Закрити"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {title && (
          <h2 id={labelledBy} className="pr-8 text-lg font-bold text-slate-900">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  )
}
