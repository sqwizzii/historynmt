import CountUp from './motion/CountUp.jsx'
import { cardClass } from './styles.js'

export default function StatCard({ label, value, hint, Icon }) {
  return (
    <div className={`${cardClass} group p-5 hover:-translate-y-0.5 hover:shadow-lift`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.75rem] font-medium text-[var(--color-mute)]">{label}</p>
        {Icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-surface-muted)] text-[var(--color-ink)] transition duration-200 group-hover:scale-105 group-hover:bg-indigo-50 group-hover:text-[var(--color-accent-fg)]">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="mt-3 text-[1.75rem] font-semibold tracking-tight tabular-nums text-[var(--color-ink)]">
        <CountUp value={value} />
      </p>
      {hint && <p className="mt-1.5 text-[0.6875rem] leading-relaxed text-[var(--color-mute)]">{hint}</p>}
    </div>
  )
}
