import { inputClass } from '../styles.js'

export default function FillBlank({ question, value, onChange }) {
  const count = Math.max(1, question.blankCount ?? 1)
  const answers = value?.blankAnswers ?? []

  function updateBlank(index, text) {
    const next = Array.from({ length: count }, (_, i) => answers[i] ?? '')
    next[index] = text
    onChange({ blankAnswers: next })
  }

  return (
    <div className="space-y-3">
      <p className="text-[0.75rem] text-[var(--color-mute)]">
        Заповніть {count === 1 ? 'пропуск' : `пропуски (${count})`}.
      </p>
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>
          <label htmlFor={`blank-${question.id}-${index}`} className="mb-1.5 block text-sm font-medium text-[var(--color-ink-soft)]">
            Пропуск {index + 1}
          </label>
          <input
            id={`blank-${question.id}-${index}`}
            className={inputClass}
            value={answers[index] ?? ''}
            onChange={(e) => updateBlank(index, e.target.value)}
            autoComplete="off"
            placeholder="Ваша відповідь"
          />
        </div>
      ))}
    </div>
  )
}
