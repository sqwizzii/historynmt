import { cardClass } from './styles.js'

export default function StatCard({ label, value, hint, Icon }) {
  return (
    <div className={`${cardClass} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-medium text-[#6B6E7B]">{label}</p>
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-[#14151C]">{value}</p>
      {hint && <p className="mt-1 text-[11px] leading-relaxed text-[#6B6E7B]">{hint}</p>}
    </div>
  )
}
