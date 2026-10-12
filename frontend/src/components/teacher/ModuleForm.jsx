import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import ImagePicker from '../ImagePicker.jsx'
import ErrorAlert from '../ErrorAlert.jsx'
import { inputClass, primaryButtonClass, secondaryButtonClass } from '../styles.js'
import { getErrorMessage, quizletService } from '../../services/api.js'

const emptyCard = () => ({ termOrQuestion: '', answerOrDate: '', imageUrl: null })

export default function ModuleForm({ onCreated, onCancel }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [cards, setCards] = useState([emptyCard(), emptyCard(), emptyCard()])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function updateCard(index, patch) {
    setCards((prev) => prev.map((card, i) => (i === index ? { ...card, ...patch } : card)))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!title.trim()) {
      setError('Вкажіть назву модуля.')
      return
    }
    const filled = cards.filter((c) => c.termOrQuestion.trim() || c.answerOrDate.trim())
    if (filled.some((c) => !c.termOrQuestion.trim() || !c.answerOrDate.trim())) {
      setError('У кожної картки мають бути заповнені обидві сторони.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const created = await quizletService.createModule({
        title: title.trim(),
        description: description.trim() || null,
        flashcards: filled.map((c) => ({ termOrQuestion: c.termOrQuestion.trim(), answerOrDate: c.answerOrDate.trim(), imageUrl: c.imageUrl })),
      })
      onCreated(created)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6" noValidate>
      <h2 className="text-base font-semibold text-slate-900">Новий модуль карток</h2>
      <ErrorAlert message={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="m-title" className="mb-1.5 block text-sm font-medium text-slate-700">
            Назва
          </label>
          <input id="m-title" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Наприклад, Ключові дати" />
        </div>
        <div>
          <label htmlFor="m-description" className="mb-1.5 block text-sm font-medium text-slate-700">
            Опис
          </label>
          <input id="m-description" className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Необов'язково" />
        </div>
      </div>

      <fieldset className="space-y-2.5">
        <legend className="mb-1 text-sm font-medium text-slate-700">Картки</legend>
        {cards.map((card, index) => (
          <div key={index} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
            <span className="w-6 shrink-0 text-center text-sm font-bold text-slate-400">{index + 1}</span>
            <input
              className={`${inputClass} min-w-0 flex-1`}
              value={card.termOrQuestion}
              onChange={(e) => updateCard(index, { termOrQuestion: e.target.value })}
              placeholder="Термін або питання"
              aria-label={`Термін ${index + 1}`}
            />
            <ImagePicker value={card.imageUrl} onChange={(imageUrl) => updateCard(index, { imageUrl })} label={`Фото до картки ${index + 1}`} />
            <input
              className={`${inputClass} min-w-0 flex-1`}
              value={card.answerOrDate}
              onChange={(e) => updateCard(index, { answerOrDate: e.target.value })}
              placeholder="Відповідь або дата"
              aria-label={`Відповідь ${index + 1}`}
            />
            <button
              type="button"
              onClick={() => setCards((prev) => prev.filter((_, i) => i !== index))}
              disabled={cards.length <= 1}
              className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
              aria-label={`Видалити картку ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setCards((prev) => [...prev, emptyCard()])} className={secondaryButtonClass}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Додати картку
        </button>
      </fieldset>

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? 'Зберігаємо…' : 'Створити модуль'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={secondaryButtonClass}>
            Скасувати
          </button>
        )}
      </div>
    </form>
  )
}
