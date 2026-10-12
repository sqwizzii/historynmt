import { Plus, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'
import ConfirmDialog from '../ConfirmDialog.jsx'
import ErrorAlert from '../ErrorAlert.jsx'
import { ErrorState, LoadingState } from '../PageState.jsx'
import { inputClass, primaryButtonClass, secondaryButtonClass } from '../styles.js'
import { useAsyncData } from '../../hooks/useAsyncData.js'
import { getErrorMessage, quizletService } from '../../services/api.js'

function ModuleHeaderForm({ module, onSaved }) {
  const [title, setTitle] = useState(module.title)
  const [description, setDescription] = useState(module.description ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!title.trim()) return setError('Вкажіть назву модуля.')
    setError('')
    setLoading(true)
    try {
      await quizletService.updateModule(module.id, { title: title.trim(), description: description.trim() || null })
      onSaved()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <ErrorAlert message={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="edit-m-title" className="mb-1.5 block text-sm font-medium text-slate-700">
            Назва
          </label>
          <input id="edit-m-title" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label htmlFor="edit-m-description" className="mb-1.5 block text-sm font-medium text-slate-700">
            Опис
          </label>
          <input id="edit-m-description" className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>
      <button type="submit" disabled={loading} className={primaryButtonClass}>
        <Save className="h-4 w-4" aria-hidden="true" />
        {loading ? 'Зберігаємо…' : 'Зберегти'}
      </button>
    </form>
  )
}

function CardRow({ card, moduleId, onChanged, onDelete }) {
  const isNew = !card
  const [term, setTerm] = useState(card?.termOrQuestion ?? '')
  const [answer, setAnswer] = useState(card?.answerOrDate ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const dirty = isNew || term !== card.termOrQuestion || answer !== card.answerOrDate

  async function save() {
    if (!term.trim() || !answer.trim()) return setError('Заповніть обидві сторони картки.')
    setError('')
    setLoading(true)
    const payload = { termOrQuestion: term.trim(), answerOrDate: answer.trim() }
    try {
      if (isNew) {
        await quizletService.addFlashcard(moduleId, payload)
        setTerm('')
        setAnswer('')
      } else {
        await quizletService.updateFlashcard(card.id, payload)
      }
      onChanged()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <li className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
        <input className={`${inputClass} min-w-0 flex-1`} value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Термін або питання" aria-label="Термін" />
        <input className={`${inputClass} min-w-0 flex-1`} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Відповідь або дата" aria-label="Відповідь" />
        <button type="button" onClick={save} disabled={loading || !dirty} className={`${isNew ? primaryButtonClass : secondaryButtonClass} shrink-0 !px-3`} aria-label={isNew ? 'Додати картку' : 'Зберегти картку'}>
          {isNew ? <Plus className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        </button>
        {!isNew && (
          <button type="button" onClick={() => onDelete(card)} className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Видалити картку">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </li>
  )
}

export default function ModuleEditor({ moduleId, onChanged, onDeleted }) {
  const { data: module, error, reload } = useAsyncData(() => quizletService.getModule(moduleId), moduleId, { keepPrevious: true })
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  if (error && !module) return <ErrorState message={getErrorMessage(error)} onRetry={reload} />
  if (!module) return <LoadingState />

  function refresh() {
    reload()
    onChanged()
  }

  async function confirmDelete() {
    setDeleting(true)
    setDeleteError('')
    try {
      if (toDelete.kind === 'module') {
        await quizletService.removeModule(moduleId)
        onDeleted()
      } else {
        await quizletService.removeFlashcard(toDelete.id)
        setToDelete(null)
        refresh()
      }
    } catch (err) {
      setDeleteError(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">Модуль</h2>
          <button type="button" onClick={() => setToDelete({ kind: 'module' })} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Видалити модуль
          </button>
        </div>
        <ModuleHeaderForm key={`${module.id}-${module.title}-${module.description}`} module={module} onSaved={refresh} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Картки ({module.flashcards.length})</h2>
        <ul className="space-y-3">
          {module.flashcards.map((card) => (
            <CardRow key={`${card.id}-${card.termOrQuestion}-${card.answerOrDate}`} card={card} moduleId={module.id} onChanged={refresh} onDelete={(c) => setToDelete({ kind: 'card', id: c.id })} />
          ))}
          <CardRow key="new" moduleId={module.id} onChanged={refresh} />
        </ul>
        <p className="mt-3 text-xs text-slate-500">Останній рядок додає нову картку.</p>
      </section>

      {toDelete && (
        <ConfirmDialog
          title={toDelete.kind === 'module' ? 'Видалити модуль?' : 'Видалити картку?'}
          message={toDelete.kind === 'module' ? 'Модуль разом з усіма картками буде видалено безповоротно.' : 'Картку буде видалено з модуля.'}
          loading={deleting}
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={() => {
            setToDelete(null)
            setDeleteError('')
          }}
        />
      )}
    </div>
  )
}
