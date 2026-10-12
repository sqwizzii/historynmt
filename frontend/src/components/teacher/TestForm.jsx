import { Save } from 'lucide-react'
import { useState } from 'react'
import ErrorAlert from '../ErrorAlert.jsx'
import { inputClass, primaryButtonClass, secondaryButtonClass } from '../styles.js'
import { getErrorMessage, testService } from '../../services/api.js'

export default function TestForm({ initial, onSaved, onCancel }) {
  const isEdit = Boolean(initial)
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    timeLimitMinutes: String(initial?.timeLimitMinutes ?? 60),
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))

  async function handleSubmit(event) {
    event.preventDefault()
    const minutes = Number(form.timeLimitMinutes)
    if (!form.title.trim()) return setError('Вкажіть назву тесту.')
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 300) return setError('Час на тест має бути від 1 до 300 хвилин.')
    setError('')
    setLoading(true)
    const payload = { title: form.title.trim(), description: form.description.trim() || null, timeLimitMinutes: minutes }
    try {
      const saved = isEdit ? await testService.update(initial.id, payload) : await testService.create(payload)
      if (!isEdit) setForm({ title: '', description: '', timeLimitMinutes: '60' })
      onSaved(saved)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <ErrorAlert message={error} />
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_9rem]">
        <div>
          <label htmlFor="test-title" className="mb-1.5 block text-sm font-medium text-slate-700">
            Назва
          </label>
          <input id="test-title" className={inputClass} value={form.title} onChange={update('title')} placeholder="Наприклад, Козацька доба" />
        </div>
        <div>
          <label htmlFor="test-time" className="mb-1.5 block text-sm font-medium text-slate-700">
            Час, хв
          </label>
          <input id="test-time" type="number" min="1" max="300" className={inputClass} value={form.timeLimitMinutes} onChange={update('timeLimitMinutes')} />
        </div>
      </div>
      <div>
        <label htmlFor="test-description" className="mb-1.5 block text-sm font-medium text-slate-700">
          Опис
        </label>
        <textarea id="test-description" rows={2} className={inputClass} value={form.description} onChange={update('description')} placeholder="Необов'язково" />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={loading} className={primaryButtonClass}>
          <Save className="h-4 w-4" aria-hidden="true" />
          {loading ? 'Зберігаємо…' : isEdit ? 'Зберегти' : 'Створити тест'}
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
