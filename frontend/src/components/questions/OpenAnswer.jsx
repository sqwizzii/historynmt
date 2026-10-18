import { inputClass } from '../styles.js'

export default function OpenAnswer({ question, value, onChange }) {
  const maxPoints = question.maxPoints ?? 1

  return (
    <div>
      <p className="mb-2.5 text-[0.75rem] text-[var(--color-mute)]">
        Відкрита відповідь · максимум {maxPoints} {maxPoints === 1 ? 'бал' : maxPoints < 5 ? 'бали' : 'балів'}. Оцінює вчитель.
      </p>
      <label htmlFor={`open-${question.id}`} className="sr-only">
        Текст відповіді
      </label>
      <textarea
        id={`open-${question.id}`}
        rows={5}
        className={inputClass}
        value={value?.textAnswer ?? ''}
        onChange={(e) => onChange({ textAnswer: e.target.value })}
        placeholder="Введіть розгорнуту відповідь…"
      />
    </div>
  )
}
