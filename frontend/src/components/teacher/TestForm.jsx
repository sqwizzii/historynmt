import { Plus } from 'lucide-react'
import { useState } from 'react'
import ErrorAlert from '../ErrorAlert.jsx'
import { inputClass, primaryButtonClass } from '../styles.js'
import { getErrorMessage, testService } from '../../services/api.js'

export default function TestForm({ onCreated }) {
  const [form, setForm] = useState({ title: '', description: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.title.trim()) {
      setError('Вкажіть назву тесту.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const created = await testService.create({ title: form.title.trim(), description: form.description.trim() || null })
      setForm({ title: '', description: '' })
      onCreated(created)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" noValidate>
      <h2 className="text-base font-semibold text-slate-900">Новий тест</h2>
      <ErrorAlert message={error} />
      <div>
        <label htmlFor="test-title" className="mb-1.5 block text-sm font-medium text-slate-700">
          Назва
        </label>
        <input
          id="test-title"
          className={inputClass}
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Наприклад, Козацька доба"
        />
      </div>
      <div>
        <label htmlFor="test-description" className="mb-1.5 block text-sm font-medium text-slate-700">
          Опис
        </label>
        <textarea
          id="test-description"
          rows={2}
          className={inputClass}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Необов'язково"
        />
      </div>
      <button type="submit" disabled={loading} className={primaryButtonClass}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        {loading ? 'Створюємо…' : 'Створити тест'}
      </button>
    </form>
  )
}
