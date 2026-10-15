import { Target } from 'lucide-react'
import { useAsyncData } from '../hooks/useAsyncData.js'

export default function TopicProgress({ fetcher, dependency, title = 'Успішність по темах' }) {
  const { data: topics, error } = useAsyncData(fetcher, dependency)

  if (error || !topics || topics.length === 0) return null

  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-ink">
        <Target className="h-4 w-4 text-blue-700" aria-hidden="true" />
        {title}
      </h2>
      <p className="mb-4 text-xs text-slate-500">Слабкі теми зверху. Враховуються всі відповіді на питання з вказаною темою.</p>
      <ul className="space-y-3">
        {topics.map((t) => (
          <li key={t.topic}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-slate-800">{t.topic}</span>
              <span className="text-xs text-slate-500">відповідей: {t.answered}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 flex-1 overflow-hidden rounded-xl bg-slate-100">
                <div
                  className={`h-full rounded-xl ${t.percent < 40 ? 'bg-red-500' : t.percent < 70 ? 'bg-slate-500' : 'bg-emerald-500'}`}
                  style={{ width: `${t.percent}%` }}
                />
              </div>
              <span className="w-10 text-right text-xs font-semibold tabular-nums text-slate-700">{t.percent}%</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
