import { cardClass } from './styles.js'

export default function StatCard({ label, value, hint, Icon }) {
  return (
    <div className={`${cardClass} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-medium text-[var(--color-mute)]">{label}</p>
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-surface-muted)] text-[var(--color-ink)]">
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="mt-2.5 text-[1.65rem] font-semibold tracking-tight tabular-nums text-[var(--color-ink)]">{value}</p>
      {hint && <p className="mt-1 text-[11px] leading-relaxed text-[var(--color-mute)]">{hint}</p>}
    </div>
  )
}
