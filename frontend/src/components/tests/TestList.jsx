import { ArrowRight, CalendarDays, ClipboardList, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../PageState.jsx'
import { useAsyncData } from '../../hooks/useAsyncData.js'
import { getErrorMessage, testService } from '../../services/api.js'
import { formatDate, pluralize } from '../../utils/format.js'

export default function TestList() {
  const { data: tests, error, reload } = useAsyncData(testService.getAll)

  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />
  if (!tests) return <LoadingState label="Завантажуємо тести…" />

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Тести НМТ з історії</h1>
        <p className="mt-1 text-sm text-slate-600">Оберіть тест. Результат буде переведено у шкалу НМТ 100-200.</p>
      </header>

      {tests.length === 0 ? (
        <EmptyState title="Тестів поки немає" text="Вчитель ще не додав жодного тесту. Зазирніть пізніше." />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tests.map((test) => (
            <li key={test.id}>
              <Link
                to={`/tests/${test.id}`}
                className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <ClipboardList className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 className="text-lg font-semibold text-slate-900">{test.title}</h2>
                <p className="mt-1 flex items-center gap-3 text-xs font-medium text-slate-500">
                  <span>
                    {test.questionCount} {pluralize(test.questionCount, 'питання', 'питання', 'питань')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {test.timeLimitMinutes} хв
                  </span>
                </p>
                {test.description && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{test.description}</p>}
                <div className="mt-auto flex items-center justify-between pt-5 text-sm">
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                    {formatDate(test.createdAt)}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-blue-700">
                    Розпочати
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
