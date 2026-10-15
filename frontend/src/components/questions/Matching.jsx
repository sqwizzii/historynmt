import OptionImage from '../OptionImage.jsx'
const LETTERS = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Є', 'Ж', 'З', 'И']

export default function Matching({ question, value, onChange }) {
  const matches = value?.matches ?? {}
  const choices = question.matchChoices ?? []

  function select(optionId, matchKey) {
    const next = { ...matches }
    if (matchKey) {
      next[optionId] = matchKey
    } else {
      delete next[optionId]
    }
    onChange({ matches: next })
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <h3 className="mb-2 text-xs font-semibold text-slate-500">Варіанти для підбору</h3>
        <ul className="space-y-2">
          {choices.map((choice, index) => (
            <li key={choice} className="flex items-start gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-800">
              <span className="font-bold text-blue-700">{LETTERS[index]}</span>
              <span>{choice}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold text-slate-500">Встановіть відповідність</h3>
        <ul className="space-y-3">
          {question.options.map((option, index) => (
            <li key={option.id} className="rounded-xl border border-slate-200 p-3">
              <label className="block">
                <span className="mb-2 flex items-start gap-2 text-sm text-slate-800">
                  <span className="font-bold text-slate-500">{index + 1}.</span>
                  <span>
                    {option.optionText}
                    <OptionImage src={option.imageUrl} />
                  </span>
                </span>
                <select
                  value={matches[option.id] ?? ''}
                  onChange={(event) => select(option.id, event.target.value)}
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                >
                  <option value="">Оберіть відповідь…</option>
                  {choices.map((choice, choiceIndex) => (
                    <option key={choice} value={choice}>
                      {LETTERS[choiceIndex]}. {choice}
                    </option>
                  ))}
                </select>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
