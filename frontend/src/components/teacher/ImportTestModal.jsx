import { AlertTriangle, Link2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import ErrorAlert from '../ErrorAlert.jsx'
import Modal from '../Modal.jsx'
import { badgeClass, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from '../styles.js'
import { getErrorMessage, testService } from '../../services/api.js'

const TYPE_LABELS = { SINGLE_CHOICE: 'Одна відповідь', MULTIPLE_CHOICE: 'Кілька відповідей', MATCHING: 'Відповідність', CHRONOLOGY: 'Послідовність' }
const EXAMPLE = '# Назва тесту\n1. Текст питання?\nА) Варіант +\nБ) Варіант\nПояснення: необов’язково\n2. Питання з кількома відповідями\nА) Перша правильна +\nБ) Друга правильна +\nВ) Хибна'

function questionProblem(q) {
  if (q.status === 'UNSUPPORTED' || !q.questionType) return 'Непідтримуваний тип: видаліть питання або додайте його вручну'
  if (!q.questionText.trim()) return 'Порожній текст питання'
  const correct = q.options.filter((o) => o.isCorrect).length
  if (q.questionType === 'SINGLE_CHOICE' && correct !== 1) return 'Позначте одну правильну відповідь'
  if (q.questionType === 'MULTIPLE_CHOICE' && correct < 1) return 'Позначте правильні відповіді'
  if (q.status === 'NEEDS_REVIEW' && (q.questionType === 'MATCHING' || q.questionType === 'CHRONOLOGY')) return 'Пари чи порядок не визначено надійно: видаліть питання або додайте його вручну'
  if (q.options.some((o) => !o.optionText.trim())) return 'Є порожній варіант'
  return ''
}

function QuestionEditor({ q, index, onChange, onRemove }) {
  const problem = questionProblem(q)
  const setOption = (i, patch) => onChange({ ...q, options: q.options.map((o, j) => (j === i ? { ...o, ...patch } : o)) })
  const choose = (i) => onChange({ ...q, options: q.options.map((o, j) => ({ ...o, isCorrect: q.questionType === 'SINGLE_CHOICE' ? j === i : j === i ? !o.isCorrect : o.isCorrect })) })
  return (
    <li className={`rounded-xl border p-4 ${problem ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200 bg-white'}`}>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-slate-500">№ {index + 1}</span>
        {q.questionType && <span className={badgeClass('indigo')}>{TYPE_LABELS[q.questionType]}</span>}
        {problem ? <span className={badgeClass('amber')}><AlertTriangle className="h-3 w-3" aria-hidden="true" />Потребує перевірки</span> : <span className={badgeClass('green')}>Готово</span>}
        <button type="button" onClick={onRemove} className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Видалити питання ${index + 1}`}><Trash2 className="h-4 w-4" /></button>
      </div>
      {problem && <p className="mb-2 text-xs text-amber-800">{q.note || problem}</p>}
      <textarea aria-label={`Текст питання ${index + 1}`} rows={2} className={inputClass} value={q.questionText} onChange={(e) => onChange({ ...q, questionText: e.target.value })} />
      {q.imageUrl && <p className="mt-1 truncate text-xs text-slate-500">Зображення: {q.imageUrl}</p>}
      <ul className="mt-3 space-y-2">
        {q.options.map((o, i) => (
          <li key={i} className="flex items-center gap-2">
            {(q.questionType === 'SINGLE_CHOICE' || q.questionType === 'MULTIPLE_CHOICE') && (
              <input type={q.questionType === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'} name={`correct-${index}`} checked={Boolean(o.isCorrect)} onChange={() => choose(i)} aria-label={`Варіант ${i + 1} правильний`} className="h-4 w-4 shrink-0 accent-indigo-600" />
            )}
            {q.questionType === 'CHRONOLOGY' && <span className="w-6 shrink-0 text-center text-xs font-semibold text-slate-500">{o.orderIndex ?? '?'}</span>}
            <input aria-label={`Варіант ${i + 1}`} className={`${inputClass} py-1.5`} value={o.optionText} onChange={(e) => setOption(i, { optionText: e.target.value })} />
            {q.questionType === 'MATCHING' && <input aria-label={`Пара до варіанта ${i + 1}`} className={`${inputClass} py-1.5`} value={o.matchKey ?? ''} onChange={(e) => setOption(i, { matchKey: e.target.value })} />}
          </li>
        ))}
      </ul>
    </li>
  )
}

export default function ImportTestModal({ onClose, onImported }) {
  const [tab, setTab] = useState('TEXT')
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [preview, setPreview] = useState(null)
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function analyze() {
    setError('')
    setLoading(true)
    try {
      const data = await testService.previewImport({ source: tab === 'URL' ? 'URL' : 'TEXT', url: url.trim(), text })
      setPreview(data)
      setTitle(data.title)
      setQuestions(data.questions)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const problems = questions.filter((q) => questionProblem(q)).length
  const canCreate = questions.length > 0 && problems === 0 && title.trim() && !loading

  async function create() {
    setError('')
    setLoading(true)
    try {
      const created = await testService.createImport({ title: title.trim(), description: preview.description, questions })
      onImported(created.testId)
    } catch (err) {
      setError(getErrorMessage(err))
      setLoading(false)
    }
  }

  return (
    <Modal title="Імпортувати тест" onClose={loading ? undefined : onClose} wide>
      <div className="mt-4 space-y-4">
        <ErrorAlert message={error} />
        {!preview ? (
          <>
            <div role="tablist" className="flex gap-1 rounded-lg bg-slate-100 p-1 text-sm font-medium">
              {[['TEXT', 'Вставити текст'], ['URL', 'За посиланням']].map(([id, label]) => (
                <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`flex-1 rounded-md px-3 py-1.5 ${tab === id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}>{label}</button>
              ))}
            </div>
            {tab === 'URL' ? (
              <div>
                <label htmlFor="import-url" className={labelClass}>Посилання на тест</label>
                <div className="relative">
                  <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input id="import-url" className={`${inputClass} pl-9`} placeholder="https://zno.osvita.ua/ukraine-history/848/" value={url} onChange={(e) => setUrl(e.target.value)} />
                </div>
                <p className="mt-2 text-xs text-slate-500">Підтримується лише zno.osvita.ua, і лише якщо адміністратор платформи ввімкнув це джерело. Матеріали сайту захищені авторським правом: імпортуйте тільки ті, на які маєте право.</p>
              </div>
            ) : (
              <div>
                <label htmlFor="import-text" className={labelClass}>Текст тесту</label>
                <textarea id="import-text" rows={10} className={`${inputClass} font-mono text-xs`} placeholder={EXAMPLE} value={text} onChange={(e) => setText(e.target.value)} />
                <p className="mt-2 text-xs text-slate-500">Правильні відповіді позначайте знаком «+» в кінці варіанта. Підходить для ваших власних матеріалів.</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className={secondaryButtonClass}>Скасувати</button>
              <button type="button" onClick={analyze} disabled={loading || (tab === 'URL' ? !url.trim() : !text.trim())} className={primaryButtonClass}>{loading ? 'Аналізуємо…' : 'Проаналізувати'}</button>
            </div>
          </>
        ) : (
          <>
            <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{preview.notice} Тест буде створено лише після натискання «Створити тест».</p>
            {preview.warnings.length > 0 && (
              <ul className="space-y-1 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">{preview.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
            )}
            <div>
              <label htmlFor="import-title" className={labelClass}>Назва тесту</label>
              <input id="import-title" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} />
            </div>
            <p className="text-sm text-slate-600">Знайдено питань: {questions.length}{problems > 0 ? `, потребують уваги: ${problems}` : ''}. Пояснення ШІ формує автоматично для неправильних відповідей учнів.</p>
            {questions.length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">Питань немає.</p> : (
              <ul className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
                {questions.map((q, i) => (
                  <QuestionEditor key={i} q={q} index={i} onChange={(next) => setQuestions((prev) => prev.map((x, j) => (j === i ? next : x)))} onRemove={() => setQuestions((prev) => prev.filter((_, j) => j !== i))} />
                ))}
              </ul>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <button type="button" onClick={() => setPreview(null)} disabled={loading} className={secondaryButtonClass}>Назад</button>
              <button type="button" onClick={create} disabled={!canCreate} className={primaryButtonClass}>{loading ? 'Створюємо…' : 'Створити тест'}</button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
