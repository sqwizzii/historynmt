import OptionImage from '../OptionImage.jsx'
import { Check } from 'lucide-react'

export default function MultipleChoice({ question, value, onChange }) {
  const selected = value?.selectedOptionIds ?? []

  function toggle(optionId) {
    const next = selected.includes(optionId) ? selected.filter((id) => id !== optionId) : [...selected, optionId]
    onChange({ selectedOptionIds: next })
  }

  return (
    <div>
      <p className="mb-3 text-xs text-slate-500">Оберіть усі правильні варіанти. Обрано: {selected.length}</p>
      <div className="space-y-2.5">
        {question.options.map((option, index) => {
          const checked = selected.includes(option.id)
          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-600/40 ${
                checked ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <input type="checkbox" checked={checked} onChange={() => toggle(option.id)} className="sr-only" />
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${
                  checked ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-300 text-slate-600'
                }`}
              >
                {checked ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
              </span>
              <span className="pt-0.5 text-sm text-slate-800">
                {option.optionText}
                <OptionImage src={option.imageUrl} />
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
