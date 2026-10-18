import { Save } from 'lucide-react'
import { useState } from 'react'
import ErrorAlert from '../ErrorAlert.jsx'
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from '../styles.js'
import { useAsyncData } from '../../hooks/useAsyncData.js'
import { getErrorMessage, subjectService, testService } from '../../services/api.js'

const VISIBILITY_MODES = {
  AFTER_EACH_QUESTION: { label: 'Після кожного питання', hint: 'Учень натискає «Перевірити» й одразу бачить результат, правильну відповідь і пояснення. Перевірену відповідь змінити не можна.' },
  AFTER_TEST_COMPLETION: { label: 'Після завершення тесту', hint: 'Правильні відповіді та пояснення з’являються лише в розборі після здачі тесту.' },
  NEVER: { label: 'Не показувати', hint: 'Учень бачить лише бали. Правильні відповіді й пояснення бачить тільки вчитель.' },
}

function toLocalInput(value) {
  if (!value) return ''
  const text = String(value)
  return text.length >= 16 ? text.slice(0, 16) : text
}

function fromLocalInput(value) {
  if (!value) return null
  return value.length === 16 ? `${value}:00` : value
}

export default function TestForm({ initial, onSaved, onCancel }) {
  const isEdit = Boolean(initial)
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    timeLimitMinutes: String(initial?.timeLimitMinutes ?? 60),
    subjectId: String(initial?.subjectId ?? ''),
    grade: String(initial?.grade ?? ''),
    scoringScale: initial?.scoringScale ?? 'NMT',
    answerVisibilityMode: initial?.answerVisibilityMode ?? 'AFTER_TEST_COMPLETION',
    shuffleQuestions: Boolean(initial?.shuffleQuestions),
    shuffleOptions: Boolean(initial?.shuffleOptions),
    maxAttempts: initial?.maxAttempts != null ? String(initial.maxAttempts) : '',
    availableFrom: toLocalInput(initial?.availableFrom),
    availableUntil: toLocalInput(initial?.availableUntil),
  })
  const subjects = useAsyncData(subjectService.getAll).data ?? []
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const minutes = Number(form.timeLimitMinutes)
    if (!form.title.trim()) return setError('Вкажіть назву тесту.')
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 300) return setError('Час на тест має бути від 1 до 300 хвилин.')
    let maxAttempts = null
    if (form.maxAttempts.trim()) {
      maxAttempts = Number(form.maxAttempts)
      if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 100) {
        return setError('Кількість спроб має бути від 1 до 100 або порожньою.')
      }
    }
    const availableFrom = fromLocalInput(form.availableFrom)
    const availableUntil = fromLocalInput(form.availableUntil)
    if (availableFrom && availableUntil && availableFrom > availableUntil) {
      return setError('Дата початку доступу не може бути пізніше дати завершення.')
    }
    setError('')
    setLoading(true)
    const hadMaxAttempts = initial?.maxAttempts != null
    const hadAvailability = Boolean(initial?.availableFrom || initial?.availableUntil)
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      timeLimitMinutes: minutes,
      subjectId: form.subjectId ? Number(form.subjectId) : null,
      grade: form.grade ? Number(form.grade) : null,
      scoringScale: form.scoringScale,
      answerVisibilityMode: form.answerVisibilityMode,
      shuffleQuestions: form.shuffleQuestions,
      shuffleOptions: form.shuffleOptions,
      maxAttempts,
      availableFrom,
      availableUntil,
      clearMaxAttempts: isEdit && hadMaxAttempts && maxAttempts == null ? true : null,
      clearAvailability: isEdit && hadAvailability && !availableFrom && !availableUntil ? true : null,
    }
    try {
      const saved = isEdit ? await testService.update(initial.id, payload) : await testService.create(payload)
      if (!isEdit) {
        setForm({
          title: '',
          description: '',
          timeLimitMinutes: '60',
          subjectId: '',
          grade: '',
          scoringScale: 'NMT',
          answerVisibilityMode: 'AFTER_TEST_COMPLETION',
          shuffleQuestions: false,
          shuffleOptions: false,
          maxAttempts: '',
          availableFrom: '',
          availableUntil: '',
        })
      }
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
          <label htmlFor="test-title" className="mb-1.5 block text-sm font-medium text-[var(--color-ink-soft)]">
            Назва
          </label>
          <input id="test-title" className={inputClass} value={form.title} onChange={update('title')} placeholder="Наприклад, Козацька доба" />
        </div>
        <div>
          <label htmlFor="test-time" className="mb-1.5 block text-sm font-medium text-[var(--color-ink-soft)]">
            Час, хв
          </label>
          <input id="test-time" type="number" min="1" max="300" className={inputClass} value={form.timeLimitMinutes} onChange={update('timeLimitMinutes')} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="test-subject" className={labelClass}>Предмет</label>
          <select id="test-subject" className={inputClass} value={form.subjectId} onChange={update('subjectId')}>
            <option value="">Без предмета</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="test-grade" className={labelClass}>Клас</label>
          <select id="test-grade" className={inputClass} value={form.grade} onChange={update('grade')}>
            <option value="">Не вказано</option>
            {Array.from({ length: 11 }, (_, i) => i + 1).map((g) => <option key={g} value={g}>{g} клас</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="test-scale" className={labelClass}>Шкала оцінювання</label>
          <select id="test-scale" className={inputClass} value={form.scoringScale} onChange={update('scoringScale')}>
            <option value="NMT">НМТ (100–200)</option>
            <option value="PERCENT">Відсотки</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="test-visibility" className={labelClass}>Показ правильних відповідей</label>
        <select id="test-visibility" className={inputClass} value={form.answerVisibilityMode} onChange={update('answerVisibilityMode')} aria-describedby="test-visibility-hint">
          {Object.entries(VISIBILITY_MODES).map(([value, mode]) => <option key={value} value={value}>{mode.label}</option>)}
        </select>
        <p id="test-visibility-hint" className="mt-1 text-xs text-[var(--color-mute)]">{VISIBILITY_MODES[form.answerVisibilityMode].hint}</p>
      </div>

      <fieldset className="space-y-3 rounded-lg border border-[var(--color-line)] p-3.5 sm:p-4">
        <legend className="px-1 text-sm font-medium text-[var(--color-ink-soft)]">Параметри проходження</legend>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-ink-soft)]">
            <input type="checkbox" checked={form.shuffleQuestions} onChange={update('shuffleQuestions')} className="h-4 w-4 accent-indigo-600" />
            Перемішувати питання
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-ink-soft)]">
            <input type="checkbox" checked={form.shuffleOptions} onChange={update('shuffleOptions')} className="h-4 w-4 accent-indigo-600" />
            Перемішувати варіанти
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="test-attempts" className={labelClass}>Макс. спроб</label>
            <input
              id="test-attempts"
              type="number"
              min="1"
              max="100"
              className={inputClass}
              value={form.maxAttempts}
              onChange={update('maxAttempts')}
              placeholder="Без обмежень"
            />
          </div>
          <div>
            <label htmlFor="test-from" className={labelClass}>Доступ з</label>
            <input id="test-from" type="datetime-local" className={inputClass} value={form.availableFrom} onChange={update('availableFrom')} />
          </div>
          <div>
            <label htmlFor="test-until" className={labelClass}>Доступ до</label>
            <input id="test-until" type="datetime-local" className={inputClass} value={form.availableUntil} onChange={update('availableUntil')} />
          </div>
        </div>
        <p className="text-xs text-[var(--color-mute)]">Порожні спроби й дати означають необмежений доступ. Очищення збережених обмежень застосовується при збереженні.</p>
      </fieldset>

      <div>
        <label htmlFor="test-description" className="mb-1.5 block text-sm font-medium text-[var(--color-ink-soft)]">
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
