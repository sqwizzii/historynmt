import { ArrowRight, CalendarDays, ClipboardList, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../PageHeader.jsx'
import { EmptyState, ErrorState, LoadingState } from '../PageState.jsx'
import Stagger from '../motion/Stagger.jsx'
import { useAsyncData } from '../../hooks/useAsyncData.js'
import { getErrorMessage, testService } from '../../services/api.js'
import { formatDate, pluralize } from '../../utils/format.js'

export default function TestList() {
  const { data: tests, error, reload } = useAsyncData(testService.getAll)

  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />
  if (!tests) return <LoadingState label="Завантажуємо тести…" />

  return (
    <div>
      <PageHeader title="Тести" description="Оберіть тест. Після завершення — результат і розбір відповідей." />

      {tests.length === 0 ? (
        <EmptyState title="Тестів поки немає" text="Вчитель ще не додав жодного тесту." />
      ) : (
        <Stagger
          as="ul"
          immediate
          className="divide-y divide-[var(--color-line)] overflow-hidden rounded-xl border border-[var(--color-line)] bg-white shadow-card"
          step={70}
        >
          {tests.map((test) => (
            <li key={test.id}>
              <Link
                to={`/tests/${test.id}`}
                className="group flex flex-col gap-3 px-4 py-4 transition duration-200 hover:bg-[var(--color-surface-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                <div className="flex min-w-0 items-start gap-3.5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-ink)] text-white transition duration-200 group-hover:scale-105 group-hover:bg-indigo-600">
                    <ClipboardList className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-[0.9375rem] font-semibold leading-snug text-[var(--color-ink)]">{test.title}</h2>
                    {test.description && (
                      <p className="mt-1 line-clamp-1 text-[0.8125rem] text-[var(--color-mute)]">{test.description}</p>
                    )}
                    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] font-medium text-[var(--color-mute)]">
                      <span>
                        {test.questionCount} {pluralize(test.questionCount, 'питання', 'питання', 'питань')}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {test.timeLimitMinutes} хв
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" aria-hidden="true" />
                        {formatDate(test.createdAt)}
                      </span>
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 self-start text-[0.8125rem] font-semibold text-indigo-700 sm:self-center">
                  Розпочати
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </Stagger>
      )}
    </div>
  )
}
