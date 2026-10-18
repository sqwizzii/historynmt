import { AlertCircle, Inbox, Loader2 } from 'lucide-react'
import { primaryButtonClass, secondaryButtonClass } from './styles.js'

export function LoadingState({ label = 'Завантаження…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-[var(--color-mute)]" role="status">
      <Loader2 className="h-7 w-7 animate-spin text-indigo-600" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center" role="alert">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-danger-soft)] text-[var(--color-danger-fg)]">
        <AlertCircle className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">{message}</p>
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
    <div className="motion-reveal is-visible mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-surface)_70%,transparent)] px-6 py-14 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-inverse)] text-[var(--color-on-inverse)]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 className="text-base font-semibold text-[var(--color-ink)]">{title}</h2>
      {text && <p className="text-sm leading-relaxed text-[var(--color-mute)]">{text}</p>}
      {action && actionLabel && (
        <button type="button" onClick={action} className={`${primaryButtonClass} mt-1`}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
