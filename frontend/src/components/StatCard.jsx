import { cardClass } from './styles.js'

export default function StatCard({ label, value, hint, Icon }) {
  return (
    <div className={`${cardClass} p-5 transition hover:border-indigo-100`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[#73758A]">{label}</p>
        {Icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="mt-2.5 text-3xl font-semibold tracking-tight text-[#20212B]">{value}</p>
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-[#73758A]">{hint}</p>}
    </div>
  )
}
