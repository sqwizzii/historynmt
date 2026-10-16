import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { EmptyState, ErrorState, LoadingState } from '../PageState.jsx'
import Stagger from '../motion/Stagger.jsx'
import { inputClass, listRowActiveClass, listRowIdleClass, primaryButtonClass } from '../styles.js'
import { useAsyncData } from '../../hooks/useAsyncData.js'
import { getErrorMessage, quizletService } from '../../services/api.js'
import ModuleEditor from './ModuleEditor.jsx'
import ModuleForm from './ModuleForm.jsx'

export default function ModulesManager() {
  const { data: allModules, error, reload } = useAsyncData(quizletService.getModules, null, { keepPrevious: true })
  const [selectedId, setSelectedId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [query, setQuery] = useState('')

  const modules = allModules ? allModules.filter((module) => module.editable) : null

  if (error && !modules) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />
  if (!modules) return <LoadingState />

  const shown = modules.filter((m) => m.title.toLowerCase().includes(query.trim().toLowerCase()))
  const activeId = creating ? null : (selectedId ?? modules[0]?.id ?? null)

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <aside className="space-y-3 self-start">
        <button type="button" onClick={() => setCreating(true)} className={`${primaryButtonClass} w-full`}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Новий модуль
        </button>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input type="search" aria-label="Пошук модулів" placeholder="Пошук за назвою" value={query} onChange={(e) => setQuery(e.target.value)} className={`${inputClass} pl-9`} />
        </div>
        <Stagger as="ul" immediate step={45} className="space-y-0.5 rounded-xl border border-[var(--color-line)] bg-white p-1.5 shadow-card">
          {shown.map((module) => {
            const active = module.id === activeId
            return (
              <li key={module.id}>
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false)
                    setSelectedId(module.id)
                  }}
                  aria-current={active ? 'true' : undefined}
                  className={`w-full rounded-lg px-2.5 py-2.5 text-left transition duration-200 ${
                    active ? listRowActiveClass : listRowIdleClass
                  }`}
                >
                  <span className="block truncate text-[0.8125rem] font-semibold text-[var(--color-ink)]">{module.title}</span>
                  <span className="block text-[0.6875rem] text-[var(--color-mute)]">Карток: {module.flashcards.length}</span>
                </button>
              </li>
            )
          })}
          {shown.length === 0 && (
            <li className="px-2 py-6 text-center text-[0.8125rem] text-[var(--color-mute)]">
              {modules.length === 0 ? 'Модулів ще немає' : 'Нічого не знайдено'}
            </li>
          )}
        </Stagger>
      </aside>

      <div className="animate-fade-in">
        {creating ? (
          <ModuleForm
            onCreated={(created) => {
              setCreating(false)
              setSelectedId(created.id)
              reload()
            }}
            onCancel={modules.length > 0 ? () => setCreating(false) : undefined}
          />
        ) : activeId ? (
          <ModuleEditor
            key={activeId}
            moduleId={activeId}
            onChanged={reload}
            onDeleted={() => {
              setSelectedId(null)
              reload()
            }}
          />
        ) : (
          <EmptyState title="Створіть перший модуль" text="Натисніть «Новий модуль» і додайте картки." />
        )}
      </div>
    </div>
  )
}
