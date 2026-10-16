import { ArrowRight, CalendarDays, ClipboardList, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../PageHeader.jsx'
import { EmptyState, ErrorState, LoadingState } from '../PageState.jsx'
import { cardInteractiveClass } from '../styles.js'
import { useAsyncData } from '../../hooks/useAsyncData.js'
import { getErrorMessage, testService } from '../../services/api.js'
import { formatDate, pluralize } from '../../utils/format.js'

export default function TestList() {
  const { data: tests, error, reload } = useAsyncData(testService.getAll)

  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />
  if (!tests) return <LoadingState label="Завантажуємо тести…" />

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Тести"
        description="Оберіть тест. Після завершення ви побачите результат і розбір відповідей."
      />

      {tests.length === 0 ? (
        <EmptyState title="Тестів поки немає" text="Вчитель ще не додав жодного тесту. Зазирніть пізніше." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tests.map((test) => (
            <li key={test.id}>
              <Link to={`/tests/${test.id}`} className={`${cardInteractiveClass} group flex h-full flex-col p-5 sm:p-6`}>
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <ClipboardList className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 className="text-base font-semibold text-[#20212B] sm:text-lg">{test.title}</h2>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-[#73758A]">
                  <span>
                    {test.questionCount} {pluralize(test.questionCount, 'питання', 'питання', 'питань')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {test.timeLimitMinutes} хв
                  </span>
                </p>
                {test.description && (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#73758A]">{test.description}</p>
                )}
                <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-sm">
                  <span className="flex items-center gap-1.5 text-xs text-[#73758A]">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                    {formatDate(test.createdAt)}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-indigo-700">
                    Розпочати
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
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
