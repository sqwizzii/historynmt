import { AlertCircle, Inbox, Loader2 } from 'lucide-react'
import { secondaryButtonClass } from './styles.js'

export function LoadingState({ label = 'Завантаження…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-500" role="status">
      <Loader2 className="h-8 w-8 animate-spin text-blue-700" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center" role="alert">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="text-sm text-slate-700">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={secondaryButtonClass}>
          Спробувати знову
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, text }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-2 py-20 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <Inbox className="h-6 w-6" aria-hidden="true" />
      </span>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {text && <p className="text-sm text-slate-600">{text}</p>}
    </div>
  )
}
