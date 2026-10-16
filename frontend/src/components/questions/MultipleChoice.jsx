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
      <p className="mb-2.5 text-[12px] text-[var(--color-mute)]">Оберіть усі правильні варіанти. Обрано: {selected.length}</p>
      <div className="space-y-2">
        {question.options.map((option, index) => {
          const checked = selected.includes(option.id)
          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-all duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-500/40 ${
                checked
                  ? 'scale-[1.015] border-indigo-500 bg-indigo-50 shadow-[0_0_0_1px_rgb(81_70_229/0.2),0_8px_18px_-12px_rgb(81_70_229/0.45)]'
                  : 'border-[var(--color-line)] hover:border-indigo-200 hover:bg-indigo-50/30'
              }`}
            >
              <input type="checkbox" checked={checked} onChange={() => toggle(option.id)} className="sr-only" />
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold ${
                  checked ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-[#c5cad6] text-[var(--color-mute)]'
                }`}
              >
                {checked ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : index + 1}
              </span>
              <span className="pt-0.5 text-[14px] leading-relaxed text-[var(--color-ink)]">
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
