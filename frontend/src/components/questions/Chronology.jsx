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
      <p className="mb-3 text-xs text-slate-500">
        Розташуйте події в хронологічному порядку: від найраніших (зверху) до найпізніших (знизу).
        {!touched && ' Змініть порядок, щоб зарахувати відповідь.'}
      </p>
      <ol className="space-y-2.5">
        {orderedIds.map((id, index) => (
          <li
            key={id}
            className={`flex items-center gap-3 rounded-xl border p-3 ${touched ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200'}`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700">
              {index + 1}
            </span>
            <span className="flex-1 text-sm text-slate-800">
              {byId.get(id)?.optionText}
              <OptionImage src={byId.get(id)?.imageUrl} />
            </span>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                aria-label="Перемістити вище"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === orderedIds.length - 1}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
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
