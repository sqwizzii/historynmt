import OptionImage from '../OptionImage.jsx'
import { ArrowDown, ArrowUp } from 'lucide-react'

export default function Chronology({ question, value, onChange }) {
  const byId = new Map(question.options.map((option) => [option.id, option]))
  const orderedIds = value?.orderedOptionIds ?? question.options.map((option) => option.id)
  const touched = Boolean(value?.orderedOptionIds)

  function move(index, delta) {
    const target = index + delta
    if (target < 0 || target >= orderedIds.length) return
    const next = [...orderedIds]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange({ orderedOptionIds: next })
  }

  return (
    <div>
      <p className="mb-3 text-xs text-[var(--color-mute)]">
        Розташуйте події в хронологічному порядку: від найраніших (зверху) до найпізніших (знизу).
        {!touched && ' Змініть порядок, щоб зарахувати відповідь.'}
      </p>
      <ol className="space-y-2.5">
        {orderedIds.map((id, index) => (
          <li
            key={id}
            className={`flex items-center gap-3 rounded-xl border p-3 ${touched ? 'border-indigo-200 bg-indigo-50/50' : 'border-[var(--color-line)]'}`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface-muted)] text-xs font-bold text-[var(--color-ink-soft)]">
              {index + 1}
            </span>
            <span className="flex-1 text-sm text-[var(--color-ink)]">
              {byId.get(id)?.optionText}
              <OptionImage src={byId.get(id)?.imageUrl} />
            </span>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="rounded-lg border border-[var(--color-line)] p-1.5 text-[var(--color-mute)] hover:bg-[var(--color-surface-muted)] disabled:opacity-30"
                aria-label="Перемістити вище"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === orderedIds.length - 1}
                className="rounded-lg border border-[var(--color-line)] p-1.5 text-[var(--color-mute)] hover:bg-[var(--color-surface-muted)] disabled:opacity-30"
                aria-label="Перемістити нижче"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
