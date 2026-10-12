import { Plus } from 'lucide-react'
import { useState } from 'react'
import { EmptyState, ErrorState, LoadingState } from '../PageState.jsx'
import { primaryButtonClass } from '../styles.js'
import { useAsyncData } from '../../hooks/useAsyncData.js'
import { getErrorMessage, quizletService } from '../../services/api.js'
import ModuleEditor from './ModuleEditor.jsx'
import ModuleForm from './ModuleForm.jsx'

export default function ModulesManager() {
  const { data: modules, error, reload } = useAsyncData(quizletService.getModules, null, { keepPrevious: true })
  const [selectedId, setSelectedId] = useState(null)
  const [creating, setCreating] = useState(false)

  if (error && !modules) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />
  if (!modules) return <LoadingState />

  const activeId = creating ? null : (selectedId ?? modules[0]?.id ?? null)

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <aside className="space-y-3 self-start">
        <button type="button" onClick={() => setCreating(true)} className={`${primaryButtonClass} w-full`}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Новий модуль
        </button>
        <ul className="space-y-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-card">
          {modules.map((module) => {
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
                  className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    active ? 'border-blue-600 bg-blue-50' : 'border-transparent hover:bg-slate-50'
                  }`}
                >
                  <span className="block truncate text-sm font-medium text-slate-900">{module.title}</span>
                  <span className="block text-xs text-slate-500">Карток: {module.flashcards.length}</span>
                </button>
              </li>
            )
          })}
          {modules.length === 0 && <li className="px-3 py-4 text-center text-sm text-slate-500">Модулів ще немає</li>}
        </ul>
      </aside>

      <div>
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
