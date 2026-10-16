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
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <aside className="space-y-3 self-start">
        <button
          type="button"
          onClick={() => setCreating(true)}
          className={`${primaryButtonClass} w-full`}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Новий тест
        </button>
        <button type="button" onClick={() => setImportingTest(true)} className={`${secondaryButtonClass} w-full`}>
          <Download className="h-4 w-4" aria-hidden="true" />
          Імпортувати тест
        </button>
        <button type="button" onClick={() => setImporting(true)} className={`${secondaryButtonClass} w-full`}>
          <FileUp className="h-4 w-4" aria-hidden="true" />
          Імпорт з Google Forms
        </button>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input type="search" aria-label="Пошук тестів" placeholder="Пошук за назвою" value={query} onChange={(e) => setQuery(e.target.value)} className={`${inputClass} pl-9`} />
        </div>
        <ul className="space-y-1 rounded-xl border border-slate-200 bg-white p-2 shadow-card">
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
          {shown.length === 0 && <li className="px-3 py-4 text-center text-sm text-slate-500">{tests.length === 0 ? 'Тестів ще немає' : 'Нічого не знайдено'}</li>}
        </ul>
      </aside>

      <div>
        {creating ? (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
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
