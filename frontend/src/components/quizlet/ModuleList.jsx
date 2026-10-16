import { ArrowRight, Layers } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../PageHeader.jsx'
import { EmptyState, ErrorState, LoadingState } from '../PageState.jsx'
import Stagger from '../motion/Stagger.jsx'
import { useAsyncData } from '../../hooks/useAsyncData.js'
import { getErrorMessage, quizletService } from '../../services/api.js'
import { pluralize } from '../../utils/format.js'

export default function ModuleList() {
  const { data: modules, error, reload } = useAsyncData(quizletService.getModules)

  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />
  if (!modules) return <LoadingState label="Завантажуємо модулі…" />

  return (
    <div>
      <PageHeader title="Картки" description="Оберіть модуль: дати, терміни чи поняття." />

      {modules.length === 0 ? (
        <EmptyState title="Модулів поки немає" text="Вчитель ще не створив жодного модуля карток." />
      ) : (
        <Stagger as="ul" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" step={55}>
          {modules.map((module) => {
            const count = module.flashcards.length
            return (
              <li key={module.id}>
                <Link
                  to={`/quizlet/${module.id}`}
                  className="group flex h-full flex-col rounded-xl border border-[var(--color-line)] bg-white p-5 shadow-card transition duration-200 hover:-translate-y-1 hover:border-indigo-200/80 hover:shadow-lift"
                >
                  <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-ink)] text-white transition duration-200 group-hover:scale-105 group-hover:bg-indigo-600">
                    <Layers className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <h2 className="text-[15px] font-semibold text-[var(--color-ink)]">{module.title}</h2>
                  {module.description && (
                    <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[var(--color-mute)]">{module.description}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-4 text-[13px]">
                    <span className="text-[11px] font-medium text-[var(--color-mute)]">
                      {count} {pluralize(count, 'картка', 'картки', 'карток')}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-indigo-700">
                      Вчити
                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </Stagger>
      )}
    </div>
  )
}
