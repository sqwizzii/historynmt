import OptionImage from '../OptionImage.jsx'

export default function SingleChoice({ question, value, onChange }) {
  const selected = value?.selectedOptionIds?.[0]

  return (
    <div role="radiogroup" aria-label="Варіанти відповіді" className="space-y-2.5">
      {question.options.map((option, index) => {
        const checked = selected === option.id
        return (
          <label
            key={option.id}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-500/40 ${
              checked
                ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                : 'border-[#E6E8F0] bg-white hover:border-indigo-200 hover:bg-indigo-50/40'
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
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold ${
                checked ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 text-slate-600'
              }`}
            >
              {String.fromCharCode(1040 + index)}
            </span>
            <span className="pt-0.5 text-sm leading-relaxed text-[#20212B]">
              {option.optionText}
              <OptionImage src={option.imageUrl} />
            </span>
          </label>
        )
      })}
    </div>
  )
}
