import { Plus } from 'lucide-react'
import { useState } from 'react'
import { EmptyState, ErrorState, LoadingState } from '../PageState.jsx'
import { primaryButtonClass } from '../styles.js'
import { useAsyncData } from '../../hooks/useAsyncData.js'
import { getErrorMessage, testService } from '../../services/api.js'
import TestEditor from './TestEditor.jsx'
import TestForm from './TestForm.jsx'

export default function TestsManager() {
  const { data: tests, error, reload } = useAsyncData(testService.getAll, null, { keepPrevious: true })
  const [selectedId, setSelectedId] = useState(null)
  const [creating, setCreating] = useState(false)

  if (error && !tests) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />
  if (!tests) return <LoadingState />

  const activeId = creating ? null : (selectedId ?? tests[0]?.id ?? null)

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <aside className="space-y-3 self-start">
        <button
          type="button"
          onClick={() => setCreating(true)}
          className={`${primaryButtonClass} w-full`}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Новий тест
        </button>
        <ul className="space-y-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-card">
          {tests.map((test) => {
            const active = test.id === activeId
            return (
              <li key={test.id}>
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false)
                    setSelectedId(test.id)
                  }}
                  aria-current={active ? 'true' : undefined}
                  className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    active ? 'border-blue-600 bg-blue-50' : 'border-transparent hover:bg-slate-50'
                  }`}
                >
                  <span className="block truncate text-sm font-medium text-slate-900">{test.title}</span>
                  <span className="block text-xs text-slate-500">
                    Питань: {test.questionCount} · {test.timeLimitMinutes} хв
                  </span>
                </button>
              </li>
            )
          })}
          {tests.length === 0 && <li className="px-3 py-4 text-center text-sm text-slate-500">Тестів ще немає</li>}
        </ul>
      </aside>

      <div>
        {creating ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
            <h2 className="mb-4 text-base font-semibold text-slate-900">Новий тест</h2>
            <TestForm
              onSaved={(created) => {
                setCreating(false)
                setSelectedId(created.id)
                reload()
              }}
              onCancel={tests.length > 0 ? () => setCreating(false) : undefined}
            />
          </section>
        ) : activeId ? (
          <TestEditor
            key={activeId}
            testId={activeId}
            onChanged={reload}
            onDeleted={() => {
              setSelectedId(null)
              reload()
            }}
          />
        ) : (
          <EmptyState title="Створіть перший тест" text="Натисніть «Новий тест», потім додайте питання." />
        )}
      </div>
    </div>
  )
}
