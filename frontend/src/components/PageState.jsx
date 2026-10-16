import { AlertCircle, Inbox, Loader2 } from 'lucide-react'
import { primaryButtonClass, secondaryButtonClass } from './styles.js'

export function LoadingState({ label = 'Завантаження…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-[#73758A]" role="status">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center" role="alert">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="text-sm leading-relaxed text-slate-700">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={secondaryButtonClass}>
          Спробувати знову
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, text, action, actionLabel, icon: Icon = Inbox }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-[0.875rem] border border-dashed border-[#E6E8F0] bg-white/80 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <h2 className="text-base font-semibold text-[#20212B]">{title}</h2>
      {text && <p className="text-sm leading-relaxed text-[#73758A]">{text}</p>}
      {action && actionLabel && (
        <button type="button" onClick={action} className={`${primaryButtonClass} mt-2`}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
