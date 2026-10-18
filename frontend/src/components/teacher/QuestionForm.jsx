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
  FILL_BLANK: { label: 'Заповнення пропусків', rows: 0 },
  OPEN: { label: 'Відкрита відповідь', rows: 0 },
}

const CHOICE_TYPES = new Set(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'MATCHING', 'CHRONOLOGY'])
const URL_PATTERN = /^https?:\/\/\S+$/
const emptyRow = () => ({ text: '', correct: false, matchKey: '', image: null })
const emptyRows = (type) => Array.from({ length: TYPES[type]?.rows ?? 0 }, emptyRow)
const emptyBlank = () => ({ alternatives: [''] })

function blanksFromQuestion(question) {
  const byIndex = new Map()
  for (const option of question.options ?? []) {
    const idx = option.orderIndex ?? 0
    if (!byIndex.has(idx)) byIndex.set(idx, [])
    byIndex.get(idx).push(option.optionText ?? '')
  }
  const blanks = [...byIndex.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, alternatives]) => ({ alternatives: alternatives.length ? alternatives : [''] }))
  return blanks.length ? blanks : [emptyBlank()]
}

function rowsFromQuestion(question) {
  if (question.questionType === 'FILL_BLANK' || question.questionType === 'OPEN') return []
  const options =
    question.questionType === 'CHRONOLOGY'
      ? [...question.options].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
      : question.options
  return options.map((o) => ({ text: o.optionText, correct: o.isCorrect, matchKey: o.matchKey ?? '', image: o.imageUrl ?? null }))
}

function samplesFromQuestion(question) {
  if (question.questionType !== 'OPEN') return []
  return (question.options ?? []).map((o) => o.optionText ?? '').filter(Boolean)
}

function validate(type, text, imageUrl, rows, blanks, maxPoints) {
  if (!text.trim()) return 'Введіть текст питання.'
  if (imageUrl.trim() && !isUploadedImage(imageUrl.trim()) && !URL_PATTERN.test(imageUrl.trim())) {
    return 'Посилання на зображення має починатися з http:// або https://.'
  }
  if (type === 'FILL_BLANK') {
    if (blanks.length < 1) return 'Додайте щонайменше один пропуск.'
    if (blanks.some((b) => !b.alternatives.some((a) => a.trim()))) {
      return 'Кожен пропуск потребує щонайменше одну еталонну відповідь.'
    }
    return ''
  }
  if (type === 'OPEN') {
    const points = Number(maxPoints)
    if (!Number.isInteger(points) || points < 1 || points > 100) return 'Максимум балів має бути від 1 до 100.'
    return ''
  }
  if (rows.length < 2) return 'Потрібно щонайменше 2 варіанти.'
  if (rows.some((r) => !r.text.trim())) return 'Заповніть текст усіх варіантів або видаліть зайві.'
  const correct = rows.filter((r) => r.correct).length
  if (type === 'SINGLE_CHOICE' && correct !== 1) return 'Позначте рівно одну правильну відповідь.'
  if (type === 'MULTIPLE_CHOICE' && correct < 1) return 'Позначте щонайменше одну правильну відповідь.'
  if (type === 'MATCHING' && rows.some((r) => !r.matchKey.trim())) return 'Вкажіть відповідник для кожного елемента.'
  return ''
}

function buildOptions(type, rows, blanks, samples) {
  if (type === 'FILL_BLANK') {
    const options = []
    blanks.forEach((blank, blankIndex) => {
      blank.alternatives
        .map((a) => a.trim())
        .filter(Boolean)
        .forEach((text) => {
          options.push({ optionText: text, isCorrect: true, matchKey: null, orderIndex: blankIndex, imageUrl: null })
        })
    })
    return options
  }
  if (type === 'OPEN') {
    return samples
      .map((s) => s.trim())
      .filter(Boolean)
      .map((text) => ({ optionText: text, isCorrect: false, matchKey: null, orderIndex: null, imageUrl: null }))
  }
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
  const [extraImages, setExtraImages] = useState(initial?.extraImageUrls ?? [])
  const [newExtraImage, setNewExtraImage] = useState('')
  const [distractors, setDistractors] = useState(initial?.extraMatchChoices ?? [])
  const [explanation, setExplanation] = useState(initial?.explanation ?? '')
  const [topic, setTopic] = useState(initial?.topic ?? '')
  const [maxPoints, setMaxPoints] = useState(String(initial?.maxPoints ?? 1))
  const [caseSensitive, setCaseSensitive] = useState(Boolean(initial?.caseSensitive))
  const [blanks, setBlanks] = useState(() => (initial?.questionType === 'FILL_BLANK' ? blanksFromQuestion(initial) : [emptyBlank()]))
  const [samples, setSamples] = useState(() => (initial ? samplesFromQuestion(initial) : []))
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
    setBlanks([emptyBlank()])
    setSamples([])
    setMaxPoints('1')
    setCaseSensitive(false)
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
    const validationError = validate(type, text, imageUrl, rows, blanks, maxPoints)
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
      options: buildOptions(type, rows, blanks, samples),
      extraImageUrls: extraImages,
      extraMatchChoices: type === 'MATCHING' ? distractors.map((d) => d.trim()).filter(Boolean) : [],
      maxPoints: type === 'OPEN' ? Number(maxPoints) : null,
      caseSensitive: type === 'FILL_BLANK' ? caseSensitive : null,
    }
    try {
      if (isEdit) {
        await testService.updateQuestion(initial.id, payload)
      } else {
        await testService.createQuestion(payload)
        setText('')
        setImageUrl('')
        setExtraImages([])
        setDistractors([])
        setExplanation('')
        setTopic('')
        setRows(emptyRows(type))
        setBlanks([emptyBlank()])
        setSamples([])
        setMaxPoints('1')
        setCaseSensitive(false)
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
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-card sm:p-6" noValidate>
      <h3 className="text-base font-semibold text-[var(--color-ink)]">{isEdit ? 'Редагування питання' : 'Нове питання'}</h3>
      <ErrorAlert message={error} />
      {success && (
        <div role="status" className="flex items-center gap-2 rounded-lg border border-[var(--color-success-fg)]/25 bg-[var(--color-success-soft)] px-3 py-2.5 text-sm text-[var(--color-success-fg)]">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {success}
        </div>
      )}

      <div>
        <label htmlFor="q-type" className="mb-1.5 block text-sm font-medium text-[var(--color-ink-soft)]">
          Тип завдання
        </label>
        <select id="q-type" className={inputClass} value={type} onChange={(e) => changeType(e.target.value)}>
          {Object.entries(TYPES).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {isEdit && type !== initial.questionType && <p className="mt-1 text-xs text-[var(--color-mute)]">Після зміни типу варіанти потрібно ввести заново.</p>}
      </div>

      <div>
        <label htmlFor="q-text" className="mb-1.5 block text-sm font-medium text-[var(--color-ink-soft)]">
          Текст питання
        </label>
        <textarea id="q-text" rows={3} className={inputClass} value={text} onChange={(e) => setText(e.target.value)} />
        {type === 'FILL_BLANK' && (
          <p className="mt-1 text-xs text-[var(--color-mute)]">Позначайте пропуски у тексті як ___. Еталони вкажіть нижче за порядком пропусків.</p>
        )}
      </div>

      <div>
        <label htmlFor="q-image" className="mb-1.5 block text-sm font-medium text-[var(--color-ink-soft)]">
          Зображення <span className="font-normal text-[var(--color-mute)]">(необов&apos;язково)</span>
        </label>
        <input ref={fileInput} type="file" accept="image/*" onChange={handleFile} className="hidden" aria-label="Файл зображення" />
        <div className="flex flex-wrap items-center gap-2">
          {uploaded ? (
            <span className="flex-1 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-3.5 py-2.5 text-sm text-[var(--color-mute)]">Завантажений файл</span>
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
        {fileError && <p className="mt-1 text-xs text-[var(--color-danger-fg)]">{fileError}</p>}
        <p className="mt-1 text-xs text-[var(--color-mute)]">Карта, портрет чи пам&apos;ятка. Зображення буде показано перед текстом питання.</p>
        {(uploaded || URL_PATTERN.test(imageUrl.trim())) && (
          <div className="mt-3">
            <QuestionImage src={imageUrl.trim()} alt="Попередній перегляд" />
          </div>
        )}
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-[var(--color-ink-soft)]">
          Додаткові зображення <span className="font-normal text-[var(--color-mute)]">(необов&apos;язково, показуються після головного в зазначеному порядку)</span>
        </p>
        {extraImages.length > 0 && (
          <ol className="mb-2 space-y-1.5">
            {extraImages.map((url, i) => (
              <li key={`${url}-${i}`} className="flex items-center gap-2 text-sm">
                <span className="w-6 shrink-0 text-center font-semibold text-[var(--color-mute)]">{i + 2}</span>
                <span className="min-w-0 flex-1 truncate text-[var(--color-mute)]">{url}</span>
                <button type="button" onClick={() => setExtraImages((prev) => prev.filter((_, j) => j !== i))} className="rounded-lg p-1.5 text-[var(--color-mute)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger-fg)]" aria-label={`Прибрати додаткове зображення ${i + 1}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ol>
        )}
        <div className="flex gap-2">
          <input aria-label="Посилання на додаткове зображення" className={inputClass} placeholder="https://…" value={newExtraImage} onChange={(e) => setNewExtraImage(e.target.value)} />
          <button
            type="button"
            className={secondaryButtonClass}
            disabled={!/^https:\/\/\S+$/.test(newExtraImage.trim())}
            onClick={() => {
              setExtraImages((prev) => [...prev, newExtraImage.trim()])
              setNewExtraImage('')
            }}
          >
            Додати
          </button>
        </div>
      </div>

      {CHOICE_TYPES.has(type) && (
        <fieldset className="space-y-2.5">
          <legend className="mb-1 text-sm font-medium text-[var(--color-ink-soft)]">
            {type === 'CHRONOLOGY' ? 'Події в правильному хронологічному порядку (від ранньої до пізньої)' : 'Варіанти'}
          </legend>
          {rows.map((row, index) => (
            <div key={index} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
              <span className="w-6 shrink-0 text-center text-sm font-bold text-[var(--color-mute)]">{index + 1}</span>
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
                <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-sm text-[var(--color-ink-soft)]">
                  <input
                    type={type === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'}
                    name="correct-option"
                    checked={row.correct}
                    onChange={(e) => setCorrect(index, e.target.checked)}
                    className="h-4 w-4 accent-indigo-600"
                  />
                  Правильна
                </label>
              )}
              <button
                type="button"
                onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
                disabled={rows.length <= 2}
                className="shrink-0 rounded-lg p-2 text-[var(--color-mute)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger-fg)] disabled:opacity-30"
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
      )}

      {type === 'FILL_BLANK' && (
        <fieldset className="space-y-4">
          <legend className="mb-1 text-sm font-medium text-[var(--color-ink-soft)]">Пропуски та еталонні відповіді</legend>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-ink-soft)]">
            <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} className="h-4 w-4 accent-indigo-600" />
            Враховувати регістр літер
          </label>
          {blanks.map((blank, blankIndex) => (
            <div key={blankIndex} className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)]/40 p-3.5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-[var(--color-ink)]">Пропуск {blankIndex + 1}</span>
                <button
                  type="button"
                  onClick={() => setBlanks((prev) => prev.filter((_, i) => i !== blankIndex))}
                  disabled={blanks.length <= 1}
                  className="rounded-lg p-1.5 text-[var(--color-mute)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger-fg)] disabled:opacity-30"
                  aria-label={`Видалити пропуск ${blankIndex + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                {blank.alternatives.map((alt, altIndex) => (
                  <div key={altIndex} className="flex items-center gap-2">
                    <input
                      className={inputClass}
                      value={alt}
                      onChange={(e) =>
                        setBlanks((prev) =>
                          prev.map((b, i) =>
                            i === blankIndex
                              ? { alternatives: b.alternatives.map((a, j) => (j === altIndex ? e.target.value : a)) }
                              : b,
                          ),
                        )
                      }
                      placeholder={altIndex === 0 ? 'Основна відповідь' : 'Альтернатива'}
                      aria-label={`Пропуск ${blankIndex + 1}, відповідь ${altIndex + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setBlanks((prev) =>
                          prev.map((b, i) =>
                            i === blankIndex ? { alternatives: b.alternatives.filter((_, j) => j !== altIndex) } : b,
                          ),
                        )
                      }
                      disabled={blank.alternatives.length <= 1}
                      className="rounded-lg p-2 text-[var(--color-mute)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger-fg)] disabled:opacity-30"
                      aria-label={`Видалити альтернативу ${altIndex + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  setBlanks((prev) => prev.map((b, i) => (i === blankIndex ? { alternatives: [...b.alternatives, ''] } : b)))
                }
                className={`${secondaryButtonClass} mt-2 !px-3 !py-1.5 text-xs`}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Альтернативна відповідь
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setBlanks((prev) => [...prev, emptyBlank()])} className={secondaryButtonClass}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Додати пропуск
          </button>
        </fieldset>
      )}

      {type === 'OPEN' && (
        <fieldset className="space-y-3">
          <legend className="mb-1 text-sm font-medium text-[var(--color-ink-soft)]">Параметри відкритої відповіді</legend>
          <div>
            <label htmlFor="q-max-points" className="mb-1.5 block text-sm font-medium text-[var(--color-ink-soft)]">
              Максимум балів
            </label>
            <input
              id="q-max-points"
              type="number"
              min="1"
              max="100"
              className={`${inputClass} max-w-[8rem]`}
              value={maxPoints}
              onChange={(e) => setMaxPoints(e.target.value)}
            />
            <p className="mt-1 text-xs text-[var(--color-mute)]">Учень отримає 0 балів автоматично; оцінку виставляє вчитель.</p>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-[var(--color-ink-soft)]">
              Зразок відповіді <span className="font-normal text-[var(--color-mute)]">(необов&apos;язково, лише для вчителя)</span>
            </p>
            <div className="space-y-2">
              {samples.map((sample, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    className={inputClass}
                    value={sample}
                    onChange={(e) => setSamples((prev) => prev.map((s, i) => (i === index ? e.target.value : s)))}
                    placeholder={`Зразок ${index + 1}`}
                    aria-label={`Зразок відповіді ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => setSamples((prev) => prev.filter((_, i) => i !== index))}
                    className="rounded-lg p-2 text-[var(--color-mute)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger-fg)]"
                    aria-label={`Видалити зразок ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setSamples((prev) => [...prev, ''])} className={`${secondaryButtonClass} mt-2`}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Додати зразок
            </button>
          </div>
        </fieldset>
      )}

      {type === 'MATCHING' && (
        <fieldset className="space-y-2.5">
          <legend className="mb-1 text-sm font-medium text-[var(--color-ink-soft)]">
            Зайві варіанти правої колонки <span className="font-normal text-[var(--color-mute)]">(не є відповідником жодного елемента)</span>
          </legend>
          {distractors.map((choice, i) => (
            <div key={i} className="flex items-center gap-2">
              <input aria-label={`Зайвий варіант ${i + 1}`} className={inputClass} value={choice} onChange={(e) => setDistractors((prev) => prev.map((d, j) => (j === i ? e.target.value : d)))} />
              <button type="button" onClick={() => setDistractors((prev) => prev.filter((_, j) => j !== i))} className="rounded-lg p-2 text-[var(--color-mute)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger-fg)]" aria-label={`Видалити зайвий варіант ${i + 1}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setDistractors((prev) => [...prev, ''])} className={secondaryButtonClass}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Додати зайвий варіант
          </button>
        </fieldset>
      )}

      <div>
        <label htmlFor="q-topic" className="mb-1.5 block text-sm font-medium text-[var(--color-ink-soft)]">
          Тема <span className="font-normal text-[var(--color-mute)]">(необов&apos;язково, для статистики по темах)</span>
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
        <label htmlFor="q-explanation" className="mb-1.5 block text-sm font-medium text-[var(--color-ink-soft)]">
          Пояснення <span className="font-normal text-[var(--color-mute)]">(необов&apos;язково)</span>
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
