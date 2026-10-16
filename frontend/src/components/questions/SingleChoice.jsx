import OptionImage from '../OptionImage.jsx'

export default function SingleChoice({ question, value, onChange }) {
  const selected = value?.selectedOptionIds?.[0]

  return (
    <div role="radiogroup" aria-label="Варіанти відповіді" className="space-y-2">
      {question.options.map((option, index) => {
        const checked = selected === option.id
        return (
          <label
            key={option.id}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-all duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-500/40 ${
              checked
                ? 'scale-[1.01] border-indigo-500 bg-indigo-50 shadow-[0_0_0_1px_rgb(81_70_229/0.15)]'
                : 'border-[var(--color-line)] bg-white hover:border-indigo-200 hover:bg-indigo-50/30'
            }`}
          >
            <input
              type="radio"
              name={`question-${question.id}`}
              checked={checked}
              onChange={() => onChange({ selectedOptionIds: [option.id] })}
              className="sr-only"
            />
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold ${
                checked ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-[#c5cad6] text-[var(--color-mute)]'
              }`}
            >
              {String.fromCharCode(1040 + index)}
            </span>
            <span className="pt-0.5 text-[14px] leading-relaxed text-[var(--color-ink)]">
              {option.optionText}
              <OptionImage src={option.imageUrl} />
            </span>
          </label>
        )
      })}
    </div>
  )
}
