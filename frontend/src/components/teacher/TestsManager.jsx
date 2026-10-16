import { Download, FileUp, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { EmptyState, ErrorState, LoadingState } from '../PageState.jsx'
import { inputClass, primaryButtonClass, secondaryButtonClass } from '../styles.js'
import { useAsyncData } from '../../hooks/useAsyncData.js'
import { getErrorMessage, testService } from '../../services/api.js'
import ImportFormModal from './ImportFormModal.jsx'
import ImportTestModal from './ImportTestModal.jsx'
import TestEditor from './TestEditor.jsx'
import TestForm from './TestForm.jsx'

export default function TestsManager() {
  const { data: allTests, error, reload } = useAsyncData(testService.getAll, null, { keepPrevious: true })
  const [selectedId, setSelectedId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importingTest, setImportingTest] = useState(false)
  const [query, setQuery] = useState('')

  const tests = allTests ? allTests.filter((test) => test.editable) : null

  if (error && !tests) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />
  if (!tests) return <LoadingState />

  const shown = tests.filter((t) => t.title.toLowerCase().includes(query.trim().toLowerCase()))
  const activeId = creating ? null : (selectedId ?? tests[0]?.id ?? null)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
      <aside className="space-y-3 self-start lg:sticky lg:top-24">
        <button type="button" onClick={() => setCreating(true)} className={`${primaryButtonClass} w-full`}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Новий тест
        </button>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
          <button type="button" onClick={() => setImportingTest(true)} className={`${secondaryButtonClass} w-full`}>
            <Download className="h-4 w-4" aria-hidden="true" />
            Імпортувати тест
          </button>
          <button type="button" onClick={() => setImporting(true)} className={`${secondaryButtonClass} w-full`}>
            <FileUp className="h-4 w-4" aria-hidden="true" />
            Google Forms
          </button>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#73758A]" aria-hidden="true" />
          <input
            type="search"
            aria-label="Пошук тестів"
            placeholder="Пошук за назвою"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${inputClass} pl-10`}
          />
        </div>
        <ul className="max-h-[min(60vh,28rem)] space-y-1 overflow-y-auto rounded-[0.875rem] border border-[#E6E8F0] bg-white p-2 shadow-card lg:max-h-[calc(100vh-16rem)]">
          {shown.map((test) => {
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
                    active
                      ? 'border-indigo-200 bg-indigo-50 shadow-sm'
                      : 'border-transparent hover:bg-slate-50'
                  }`}
                >
                  <span className={`block truncate text-sm font-medium ${active ? 'text-indigo-900' : 'text-[#20212B]'}`}>
                    {test.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-[#73758A]">
                    Питань: {test.questionCount} · {test.timeLimitMinutes} хв
                  </span>
                </button>
              </li>
            )
          })}
          {shown.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-[#73758A]">
              {tests.length === 0 ? 'Тестів ще немає' : 'Нічого не знайдено'}
            </li>
          )}
        </ul>
      </aside>

      <div className="min-w-0">
        {creating ? (
          <section className="rounded-[0.875rem] border border-[#E6E8F0] bg-white p-5 shadow-card sm:p-6">
            <h2 className="mb-1 text-base font-semibold text-[#20212B]">Новий тест</h2>
            <p className="mb-5 text-sm text-[#73758A]">Спочатку налаштуйте параметри, потім додайте питання.</p>
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
          <EmptyState
            title="Створіть перший тест"
            text="Натисніть «Новий тест», потім додайте питання."
            action={() => setCreating(true)}
            actionLabel="Новий тест"
          />
        )}
      </div>

      {importingTest && (
        <ImportTestModal
          onClose={() => setImportingTest(false)}
          onImported={(testId) => {
            setImportingTest(false)
            setCreating(false)
            setSelectedId(testId)
            reload()
          }}
        />
      )}
      {importing && (
        <ImportFormModal
          onClose={() => setImporting(false)}
          onImported={(testId) => {
            setImporting(false)
            setCreating(false)
            setSelectedId(testId)
            reload()
          }}
        />
      )}
    </div>
  )
}
