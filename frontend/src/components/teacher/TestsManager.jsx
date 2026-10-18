import { Copy, Download, FileSpreadsheet, FileUp, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState, ErrorState, LoadingState } from '../PageState.jsx'
import Stagger from '../motion/Stagger.jsx'
import { inputClass, listRowActiveClass, listRowIdleClass, primaryButtonClass, secondaryButtonClass } from '../styles.js'
import { useAsyncData } from '../../hooks/useAsyncData.js'
import { getErrorMessage, subjectService, testService } from '../../services/api.js'
import ImportFormModal from './ImportFormModal.jsx'
import ImportSpreadsheetModal from './ImportSpreadsheetModal.jsx'
import ImportTestModal from './ImportTestModal.jsx'
import TestEditor from './TestEditor.jsx'
import TestForm from './TestForm.jsx'

const TYPE_FILTERS = [
  { value: '', label: 'Усі типи' },
  { value: 'SINGLE_CHOICE', label: 'Одна відповідь' },
  { value: 'MULTIPLE_CHOICE', label: 'Кілька відповідей' },
  { value: 'MATCHING', label: 'Відповідність' },
  { value: 'CHRONOLOGY', label: 'Хронологія' },
  { value: 'FILL_BLANK', label: 'Пропуски' },
  { value: 'OPEN', label: 'Відкрита відповідь' },
]

export default function TestsManager() {
  const [filters, setFilters] = useState({ q: '', subjectId: '', grade: '', topic: '', type: '' })
  const [queryDraft, setQueryDraft] = useState('')
  const [topicDraft, setTopicDraft] = useState('')
  const filterKey = useMemo(
    () => `${filters.q}|${filters.subjectId}|${filters.grade}|${filters.topic}|${filters.type}`,
    [filters],
  )
  const params = useMemo(() => {
    const next = {}
    if (filters.q.trim()) next.q = filters.q.trim()
    if (filters.subjectId) next.subjectId = Number(filters.subjectId)
    if (filters.grade) next.grade = Number(filters.grade)
    if (filters.topic.trim()) next.topic = filters.topic.trim()
    if (filters.type) next.type = filters.type
    return next
  }, [filters])

  const { data: allTests, error, reload } = useAsyncData(() => testService.getAll(params), filterKey, { keepPrevious: true })
  const subjects = useAsyncData(subjectService.getAll).data ?? []
  const [selectedId, setSelectedId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importingTest, setImportingTest] = useState(false)
  const [spreadsheetOpen, setSpreadsheetOpen] = useState(false)
  const [editorTick, setEditorTick] = useState(0)
  const [copying, setCopying] = useState(false)
  const [actionError, setActionError] = useState('')

  const tests = allTests ? allTests.filter((test) => test.editable) : null

  if (error && !tests) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />
  if (!tests) return <LoadingState />

  const activeId = creating ? null : (selectedId ?? tests[0]?.id ?? null)
  const activeTest = tests.find((t) => t.id === activeId)

  function applyTextFilters(event) {
    event?.preventDefault()
    setFilters((prev) => ({ ...prev, q: queryDraft, topic: topicDraft }))
  }

  async function copyActive() {
    if (!activeId || copying) return
    setCopying(true)
    setActionError('')
    try {
      const copied = await testService.copy(activeId)
      setCreating(false)
      setSelectedId(copied.id)
      reload()
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setCopying(false)
    }
  }

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

        <form onSubmit={applyTextFilters} className="space-y-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-2.5 shadow-card">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-mute-soft)]" aria-hidden="true" />
            <input
              type="search"
              aria-label="Пошук тестів"
              placeholder="Пошук…"
              value={queryDraft}
              onChange={(e) => setQueryDraft(e.target.value)}
              className={`${inputClass} !py-2 pl-9`}
            />
          </div>
          <select
            aria-label="Предмет"
            className={`${inputClass} !py-2`}
            value={filters.subjectId}
            onChange={(e) => setFilters((prev) => ({ ...prev, subjectId: e.target.value }))}
          >
            <option value="">Усі предмети</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Клас"
            className={`${inputClass} !py-2`}
            value={filters.grade}
            onChange={(e) => setFilters((prev) => ({ ...prev, grade: e.target.value }))}
          >
            <option value="">Усі класи</option>
            {Array.from({ length: 11 }, (_, i) => i + 1).map((g) => (
              <option key={g} value={g}>
                {g} клас
              </option>
            ))}
          </select>
          <input
            type="search"
            aria-label="Тема"
            placeholder="Тема…"
            value={topicDraft}
            onChange={(e) => setTopicDraft(e.target.value)}
            className={`${inputClass} !py-2`}
          />
          <select
            aria-label="Тип питання"
            className={`${inputClass} !py-2`}
            value={filters.type}
            onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
          >
            {TYPE_FILTERS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button type="submit" className={`${secondaryButtonClass} w-full !py-2 text-xs`}>
            Застосувати
          </button>
        </form>

        {activeId && !creating && (
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            <button type="button" onClick={copyActive} disabled={copying} className={`${secondaryButtonClass} w-full !px-3`}>
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              {copying ? 'Копіюємо…' : 'Копіювати тест'}
            </button>
            <button type="button" onClick={() => setSpreadsheetOpen(true)} className={`${secondaryButtonClass} w-full !px-3`}>
              <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
              Таблиця
            </button>
          </div>
        )}
        {actionError && <p className="text-xs text-[var(--color-danger-fg)]">{actionError}</p>}

        <Stagger
          as="ul"
          immediate
          step={45}
          className="max-h-[min(55vh,26rem)] space-y-0.5 overflow-y-auto rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-1.5 shadow-card lg:max-h-[calc(100vh-15rem)]"
        >
          {tests.map((test) => {
            const active = test.id === activeId
            return (
              <li key={test.id}>
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false)
                    setSelectedId(test.id)
                    setActionError('')
                  }}
                  aria-current={active ? 'true' : undefined}
                  className={`w-full rounded-lg px-2.5 py-2.5 text-left transition duration-200 ${active ? listRowActiveClass : listRowIdleClass}`}
                >
                  <span className="block truncate text-[0.8125rem] font-semibold">{test.title}</span>
                  <span className="mt-0.5 block text-[0.6875rem] text-[var(--color-mute)]">
                    {test.questionCount} пит. · {test.timeLimitMinutes} хв
                  </span>
                </button>
              </li>
            )
          })}
          {tests.length === 0 && (
            <li className="px-2 py-6 text-center text-[0.8125rem] text-[var(--color-mute)]">
              {allTests?.length === 0 ? 'Тестів ще немає' : 'Нічого не знайдено'}
            </li>
          )}
        </Stagger>
      </aside>

      <div className="min-w-0 animate-fade-in">
        {creating ? (
          <section className="motion-alert rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-card sm:p-6">
            <div className="mb-5 border-b border-[var(--color-line-soft)] pb-4">
              <h2 className="text-[0.9375rem] font-semibold text-[var(--color-ink)]">Новий тест</h2>
              <p className="mt-1 text-[0.8125rem] text-[var(--color-mute)]">Спочатку параметри, потім питання.</p>
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
            key={`${activeId}-${editorTick}`}
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
      {spreadsheetOpen && activeTest && (
        <ImportSpreadsheetModal
          testId={activeTest.id}
          testTitle={activeTest.title}
          onClose={() => setSpreadsheetOpen(false)}
          onImported={() => {
            setSpreadsheetOpen(false)
            setEditorTick((n) => n + 1)
            reload()
          }}
        />
      )}
    </div>
  )
}
