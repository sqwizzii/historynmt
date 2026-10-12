import { ArrowRight, Layers } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../PageState.jsx'
import { useAsyncData } from '../../hooks/useAsyncData.js'
import { getErrorMessage, quizletService } from '../../services/api.js'
import { pluralize } from '../../utils/format.js'

export default function ModuleList() {
  const { data: modules, error, reload } = useAsyncData(quizletService.getModules)

  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />
  if (!modules) return <LoadingState label="Завантажуємо модулі…" />

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Картки для запам&apos;ятовування</h1>
        <p className="mt-1 text-sm text-slate-600">Оберіть модуль: дати, терміни чи персоналії.</p>
      </header>

      {modules.length === 0 ? (
        <EmptyState title="Модулів поки немає" text="Вчитель ще не створив жодного модуля карток." />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => {
            const count = module.flashcards.length
            return (
              <li key={module.id}>
                <Link
                  to={`/quizlet/${module.id}`}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
                >
                  <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <Layers className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h2 className="text-lg font-semibold text-slate-900">{module.title}</h2>
                  {module.description && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{module.description}</p>}
                  <div className="mt-auto flex items-center justify-between pt-5 text-sm">
                    <span className="text-xs font-medium text-slate-500">
                      {count} {pluralize(count, 'картка', 'картки', 'карток')}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-blue-700">
                      Вчити
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
