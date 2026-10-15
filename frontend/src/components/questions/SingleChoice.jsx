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
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-600/40 ${
              checked ? 'border-blue-600 bg-blue-50 ' : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
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
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border text-xs font-bold ${
                checked ? 'border-blue-700 bg-indigo-600 text-white' : 'border-slate-300 text-slate-600'
              }`}
            >
              {String.fromCharCode(1040 + index)}
            </span>
            <span className="pt-0.5 text-sm text-slate-800">
              {option.optionText}
              <OptionImage src={option.imageUrl} />
            </span>
          </label>
        )
      })}
    </div>
  )
}
