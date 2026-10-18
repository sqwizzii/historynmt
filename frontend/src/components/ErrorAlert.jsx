import { AlertCircle } from 'lucide-react'

export default function ErrorAlert({ message }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className="motion-alert flex items-start gap-2.5 rounded-xl border border-[var(--color-danger-fg)]/25 bg-[var(--color-danger-soft)] px-3.5 py-2.5 text-sm text-[var(--color-danger-fg)]"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="leading-relaxed">{message}</span>
    </div>
  )
}
