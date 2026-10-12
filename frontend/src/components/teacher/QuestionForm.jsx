import { CheckCircle2, ImagePlus, Plus, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import ImagePicker from '../ImagePicker.jsx'
import { fileToDataUrl } from '../../utils/imageFile.js'
import ErrorAlert from '../ErrorAlert.jsx'
import QuestionImage from '../QuestionImage.jsx'
import { inputClass, primaryButtonClass, secondaryButtonClass } from '../styles.js'
import { getErrorMessage, testService } from '../../services/api.js'
import { isUploadedImage } from '../../utils/imageUrl.js'

const TYPES = {
  SINGLE_CHOICE: { label: 'Одна правильна відповідь (1 з 4)', rows: 4 },
  MULTIPLE_CHOICE: { label: 'Кілька правильних відповідей (3 з 7)', rows: 7 },
  MATCHING: { label: 'Встановлення відповідності', rows: 4 },
  CHRONOLOGY: { label: 'Хронологічна послідовність', rows: 4 },
}

const URL_PATTERN = /^https?:\/\/\S+$/
const emptyRow = () => ({ text: '', correct: false, matchKey: '', image: null })
const emptyRows = (type) => Array.from({ length: TYPES[type].rows }, emptyRow)

function rowsFromQuestion(question) {
  const options =
    question.questionType === 'CHRONOLOGY'
      ? [...question.options].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
      : question.options
  return options.map((o) => ({ text: o.optionText, correct: o.isCorrect, matchKey: o.matchKey ?? '', image: o.imageUrl ?? null }))
}

function validate(type, text, imageUrl, rows) {
  if (!text.trim()) return 'Введіть текст питання.'
  if (imageUrl.trim() && !isUploadedImage(imageUrl.trim()) && !URL_PATTERN.test(imageUrl.trim())) return 'Посилання на зображення має починатися з http:// або https://.'
  if (rows.length < 2) return 'Потрібно щонайменше 2 варіанти.'
  if (rows.some((r) => !r.text.trim())) return 'Заповніть текст усіх варіантів або видаліть зайві.'
  const correct = rows.filter((r) => r.correct).length
  if (type === 'SINGLE_CHOICE' && correct !== 1) return 'Позначте рівно одну правильну відповідь.'
  if (type === 'MULTIPLE_CHOICE' && correct < 1) return 'Позначте щонайменше одну правильну відповідь.'
  if (type === 'MATCHING' && rows.some((r) => !r.matchKey.trim())) return 'Вкажіть відповідник для кожного елемента.'
  return ''
}

function buildOptions(type, rows) {
  return rows.map((row, index) => ({
    optionText: row.text.trim(),
    isCorrect: type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE' ? row.correct : false,
    matchKey: type === 'MATCHING' ? row.matchKey.trim() : null,
    orderIndex: type === 'CHRONOLOGY' ? index + 1 : null,
    imageUrl: row.image,
  }))
}

export default function QuestionForm({ testId, initial, onSaved, onCancel }) {
  const isEdit = Boolean(initial)
  const [type, setType] = useState(initial?.questionType ?? 'SINGLE_CHOICE')
  const [text, setText] = useState(initial?.questionText ?? '')
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '')
  const [explanation, setExplanation] = useState(initial?.explanation ?? '')
  const [topic, setTopic] = useState(initial?.topic ?? '')
  const fileInput = useRef(null)
  const [fileError, setFileError] = useState('')
  const uploaded = isUploadedImage(imageUrl)

  async function handleFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return setFileError('Оберіть файл-зображення.')
    if (file.size > 15 * 1024 * 1024) return setFileError('Файл завеликий (максимум 15 МБ).')
    setFileError('')
    try {
      setImageUrl(await fileToDataUrl(file))
    } catch (err) {
      setFileError(err.message)
    }
  }
  const [rows, setRows] = useState(() => (initial ? rowsFromQuestion(initial) : emptyRows('SINGLE_CHOICE')))
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const optionLabel = { SINGLE_CHOICE: 'Варіант', MULTIPLE_CHOICE: 'Варіант', MATCHING: 'Елемент', CHRONOLOGY: 'Подія' }[type]

  function changeType(nextType) {
    setType(nextType)
    setRows(emptyRows(nextType))
    setError('')
  }

  function updateRow(index, patch) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function setCorrect(index, checked) {
    setRows((prev) =>
      prev.map((row, i) => {
        if (type === 'SINGLE_CHOICE') return { ...row, correct: i === index }
        return i === index ? { ...row, correct: checked } : row
      }),
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSuccess('')
    const validationError = validate(type, text, imageUrl, rows)
    if (validationError) {
      setError(validationError)
      return
    }
    setError('')
    setLoading(true)
    const payload = {
      testId,
      questionText: text.trim(),
      imageUrl: imageUrl.trim(),
      questionType: type,
      explanation: explanation.trim(),
      topic: topic.trim(),
      options: buildOptions(type, rows),
    }
    try {
      if (isEdit) {
        await testService.updateQuestion(initial.id, payload)
      } else {
        await testService.createQuestion(payload)
        setText('')
        setImageUrl('')
        setExplanation('')
        setTopic('')
        setRows(emptyRows(type))
        setSuccess('Питання додано до тесту.')
      }
      onSaved()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-blue-200 bg-white p-5 shadow-card sm:p-6" noValidate>
      <h3 className="text-base font-semibold text-slate-900">{isEdit ? 'Редагування питання' : 'Нове питання'}</h3>
      <ErrorAlert message={error} />
      {success && (
        <div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {success}
        </div>
      )}

      <div>
        <label htmlFor="q-type" className="mb-1.5 block text-sm font-medium text-slate-700">
          Тип завдання
        </label>
        <select id="q-type" className={inputClass} value={type} onChange={(e) => changeType(e.target.value)}>
          {Object.entries(TYPES).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {isEdit && type !== initial.questionType && <p className="mt-1 text-xs text-amber-700">Після зміни типу варіанти потрібно ввести заново.</p>}
      </div>

      <div>
        <label htmlFor="q-text" className="mb-1.5 block text-sm font-medium text-slate-700">
          Текст питання
        </label>
        <textarea id="q-text" rows={3} className={inputClass} value={text} onChange={(e) => setText(e.target.value)} />
      </div>

      <div>
        <label htmlFor="q-image" className="mb-1.5 block text-sm font-medium text-slate-700">
          Зображення <span className="font-normal text-slate-400">(необов&apos;язково)</span>
        </label>
        <input ref={fileInput} type="file" accept="image/*" onChange={handleFile} className="hidden" aria-label="Файл зображення" />
        <div className="flex flex-wrap items-center gap-2">
          {uploaded ? (
            <span className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600">Завантажений файл</span>
          ) : (
            <input
              id="q-image"
              type="url"
              className={`${inputClass} min-w-0 flex-1`}
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Посилання https://example.com/karta.jpg"
            />
          )}
          <button type="button" onClick={() => fileInput.current?.click()} className={secondaryButtonClass}>
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            {uploaded ? 'Замінити файл' : 'Завантажити файл'}
          </button>
          {uploaded && (
            <button type="button" onClick={() => setImageUrl('')} className={secondaryButtonClass}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Прибрати
            </button>
          )}
        </div>
        {fileError && <p className="mt-1 text-xs text-red-700">{fileError}</p>}
        <p className="mt-1 text-xs text-slate-500">Карта, портрет чи пам&apos;ятка. Зображення буде показано перед текстом питання.</p>
        {(uploaded || URL_PATTERN.test(imageUrl.trim())) && (
          <div className="mt-3">
            <QuestionImage src={imageUrl.trim()} alt="Попередній перегляд" />
          </div>
        )}
      </div>

      <fieldset className="space-y-2.5">
        <legend className="mb-1 text-sm font-medium text-slate-700">
          {type === 'CHRONOLOGY' ? 'Події в правильному хронологічному порядку (від ранньої до пізньої)' : 'Варіанти'}
        </legend>
        {rows.map((row, index) => (
          <div key={index} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
            <span className="w-6 shrink-0 text-center text-sm font-bold text-slate-400">{index + 1}</span>
            <input
              className={`${inputClass} min-w-0 flex-1`}
              value={row.text}
              onChange={(e) => updateRow(index, { text: e.target.value })}
              placeholder={`${optionLabel} ${index + 1}`}
              aria-label={`${optionLabel} ${index + 1}`}
            />
            <ImagePicker value={row.image} onChange={(image) => updateRow(index, { image })} label={`Фото до варіанта ${index + 1}`} />
            {type === 'MATCHING' && (
              <input
                className={`${inputClass} min-w-0 flex-1`}
                value={row.matchKey}
                onChange={(e) => updateRow(index, { matchKey: e.target.value })}
                placeholder="Правильний відповідник"
                aria-label={`Відповідник ${index + 1}`}
              />
            )}
            {(type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE') && (
              <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-sm text-slate-700">
                <input
                  type={type === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'}
                  name="correct-option"
                  checked={row.correct}
                  onChange={(e) => setCorrect(index, e.target.checked)}
                  className="h-4 w-4 accent-blue-700"
                />
                Правильна
              </label>
            )}
            <button
              type="button"
              onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
              disabled={rows.length <= 2}
              className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
              aria-label={`Видалити ${optionLabel.toLowerCase()} ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setRows((prev) => [...prev, emptyRow()])} className={secondaryButtonClass}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Додати рядок
        </button>
      </fieldset>

      <div>
        <label htmlFor="q-topic" className="mb-1.5 block text-sm font-medium text-slate-700">
          Тема <span className="font-normal text-slate-400">(необов&apos;язково, для статистики по темах)</span>
        </label>
        <input
          id="q-topic"
          maxLength={100}
          className={inputClass}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Наприклад, Київська Русь"
        />
      </div>

      <div>
        <label htmlFor="q-explanation" className="mb-1.5 block text-sm font-medium text-slate-700">
          Пояснення <span className="font-normal text-slate-400">(необов&apos;язково)</span>
        </label>
        <textarea
          id="q-explanation"
          rows={2}
          className={inputClass}
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Показується учневі в розборі після тесту"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? 'Зберігаємо…' : isEdit ? 'Зберегти питання' : 'Додати питання'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={secondaryButtonClass}>
            {isEdit ? 'Скасувати' : 'Закрити'}
          </button>
        )}
      </div>
    </form>
  )
}
