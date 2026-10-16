import { Download, FileUp, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { EmptyState, ErrorState, LoadingState } from '../PageState.jsx'
import Stagger from '../motion/Stagger.jsx'
import { inputClass, listRowActiveClass, listRowIdleClass, primaryButtonClass, secondaryButtonClass } from '../styles.js'
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
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,16.5rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)]">
      <aside className="space-y-2.5 self-start lg:sticky lg:top-20">
        <button type="button" onClick={() => setCreating(true)} className={`${primaryButtonClass} w-full`}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Новий тест
        </button>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
          <button type="button" onClick={() => setImportingTest(true)} className={`${secondaryButtonClass} w-full !px-3`}>
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Імпорт
          </button>
          <button type="button" onClick={() => setImporting(true)} className={`${secondaryButtonClass} w-full !px-3`}>
            <FileUp className="h-3.5 w-3.5" aria-hidden="true" />
            Forms
          </button>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-mute-soft)]" aria-hidden="true" />
          <input
            type="search"
            aria-label="Пошук тестів"
            placeholder="Пошук…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${inputClass} !py-2 pl-9`}
          />
        </div>
        <Stagger
          as="ul"
          immediate
          step={45}
          className="max-h-[min(55vh,26rem)] space-y-0.5 overflow-y-auto rounded-xl border border-[var(--color-line)] bg-white p-1.5 shadow-card lg:max-h-[calc(100vh-15rem)]"
        >
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
                  className={`w-full rounded-lg px-2.5 py-2.5 text-left transition duration-200 ${active ? listRowActiveClass : listRowIdleClass}`}
                >
                  <span className="block truncate text-[13px] font-semibold">{test.title}</span>
                  <span className="mt-0.5 block text-[11px] text-[var(--color-mute)]">
                    {test.questionCount} пит. · {test.timeLimitMinutes} хв
                  </span>
                </button>
              </li>
            )
          })}
          {shown.length === 0 && (
            <li className="px-2 py-6 text-center text-[13px] text-[var(--color-mute)]">
              {tests.length === 0 ? 'Тестів ще немає' : 'Нічого не знайдено'}
            </li>
          )}
        </Stagger>
      </aside>

      <div className="min-w-0 animate-fade-in">
        {creating ? (
          <section className="motion-alert rounded-xl border border-[var(--color-line)] bg-white p-5 shadow-card sm:p-6">
            <div className="mb-5 border-b border-[var(--color-line-soft)] pb-4">
              <h2 className="text-[15px] font-semibold text-[var(--color-ink)]">Новий тест</h2>
              <p className="mt-1 text-[13px] text-[var(--color-mute)]">Спочатку параметри, потім питання.</p>
            </div>
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
            text="Додайте параметри й питання — учні побачать тест після збереження."
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
