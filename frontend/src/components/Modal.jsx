import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Modal({ title, onClose, children, labelledBy = 'modal-title', wide = false }) {
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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#20212B]/50 p-3 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onMouseDown={(event) => event.stopPropagation()}
        className={`relative max-h-[min(92vh,900px)] w-full ${wide ? 'max-w-3xl' : 'max-w-md'} overflow-y-auto rounded-2xl border border-[#E6E8F0] bg-white p-5 shadow-lift sm:p-6`}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-xl p-2 text-[#73758A] transition hover:bg-slate-100 hover:text-[#20212B]"
            aria-label="Закрити"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {title && (
          <h2 id={labelledBy} className="pr-10 text-lg font-semibold tracking-tight text-[#20212B]">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  )
}
